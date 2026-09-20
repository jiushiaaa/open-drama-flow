import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fileHash } from "./local-edit.mjs";
import { run } from "./ffmpeg.mjs";
import { mediaCommand } from "./media-inspection.mjs";

const source = z.object({ path: z.string(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/) }).strict();
export const audioPlanSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("measure"), source, startSeconds: z.number().min(0).default(0), durationSeconds: z.number().positive().max(7200), signalLabel: z.enum(["full-mix", "isolated-dialogue"]) }).strict(),
  z.object({ operation: z.literal("extract"), source, character: z.string().min(1), acceptanceReference: z.string().min(1), sampleRate: z.number().int().min(8000).max(192000), startSample: z.number().int().min(0), endSample: z.number().int().positive() }).strict(),
  z.object({ operation: z.literal("mix"), source, nativeGainDb: z.number().min(-12).max(6).default(0),
    tracks: z.array(z.object({ source, atSeconds: z.number().min(0), inSeconds: z.number().min(0).default(0), durationSeconds: z.number().positive(), gainDb: z.number().min(-60).max(6), fadeSeconds: z.number().min(0).max(5).default(0), purpose: z.enum(["music", "ambience", "foley"]) }).strict()).min(1).max(16)
  }).strict()
]);

async function verifySource(source) {
  if (!path.isAbsolute(source.path)) throw new Error("AUDIO_ABSOLUTE_SOURCE_REQUIRED");
  if (await fileHash(source.path) !== source.sha256.toLowerCase()) throw new Error("AUDIO_SOURCE_HASH_CHANGED");
  const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", source.path]);
  const media = JSON.parse(stdout);
  if (!media.streams.some(s => s.codec_type === "audio")) throw new Error("AUDIO_STREAM_MISSING");
  return media;
}

export async function measureAudio(source, startSeconds, durationSeconds, signalLabel = "full-mix") {
  const media = await verifySource(source);
  if (startSeconds + durationSeconds > Number(media.format.duration) + 0.03) throw new Error("AUDIO_MEASUREMENT_RANGE_INVALID");
  const { stderr } = await mediaCommand("ffmpeg", ["-nostdin", "-i", source.path, "-map", "0:a:0", "-af", `atrim=start=${startSeconds}:duration=${durationSeconds},asetpts=PTS-STARTPTS,loudnorm=I=-18:TP=-1:LRA=11:print_format=json`, "-vn", "-f", "null", "-"]);
  const json = stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];
  if (!json) throw new Error("AUDIO_MEASUREMENT_MISSING");
  const data = JSON.parse(json);
  return { integratedLufs: data.input_i, truePeakDbtp: data.input_tp, loudnessRange: data.input_lra, signalLabel, startSeconds, durationSeconds, boundary: "No normalization applied. Whole-mix loudness does not measure isolated dialogue or prove sound-event alignment." };
}

export async function processLocalAudio({ planPath, outputDirectory }) {
  if (!path.isAbsolute(planPath) || !path.isAbsolute(outputDirectory)) throw new Error("AUDIO_ABSOLUTE_PATHS_REQUIRED");
  const plan = audioPlanSchema.parse(JSON.parse(await fs.readFile(planPath, "utf8")));
  const media = await verifySource(plan.source);
  const audio = media.streams.find(s => s.codec_type === "audio");
  if (plan.operation === "measure") return measureAudio(plan.source, plan.startSeconds, plan.durationSeconds, plan.signalLabel);
  if (plan.operation === "extract" && (plan.endSample <= plan.startSample || Number(audio.sample_rate) !== plan.sampleRate)) throw new Error("AUDIO_SAMPLE_RANGE_OR_RATE_INVALID");
  const video = media.streams.find(s => s.codec_type === "video");
  const duration = Number(video?.duration || media.format.duration);
  if (plan.operation === "mix") {
    if (!video || Number(video.start_time || 0) !== 0 || Number(audio.start_time || 0) !== 0) throw new Error("AUDIO_MIX_ZERO_BASED_VIDEO_REQUIRED");
    for (const track of plan.tracks) {
      const item = await verifySource(track.source);
      if (track.inSeconds + track.durationSeconds > Number(item.format.duration) + 0.001 || track.atSeconds + track.durationSeconds > duration + 0.001 || track.fadeSeconds * 2 > track.durationSeconds) throw new Error("AUDIO_TRACK_RANGE_INVALID");
    }
  }
  await fs.mkdir(outputDirectory);
  await fs.writeFile(path.join(outputDirectory, "audio-plan.json"), JSON.stringify(plan, null, 2));
  let output;
  if (plan.operation === "extract") {
    output = path.join(outputDirectory, "voice-master.wav");
    await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-map", "0:a:0", "-af", `atrim=start_sample=${plan.startSample}:end_sample=${plan.endSample},asetpts=PTS-STARTPTS`, "-c:a", "pcm_s24le", output], outputDirectory);
    const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output]);
    if (Number(JSON.parse(stdout).streams[0].duration_ts) !== plan.endSample - plan.startSample) throw new Error("AUDIO_EXTRACT_SAMPLE_COUNT_MISMATCH");
  } else {
    output = path.join(outputDirectory, "mix-review.mp4");
    const args = ["-nostdin", "-n", "-i", plan.source.path];
    for (const track of plan.tracks) args.push("-i", track.source.path);
    const filters = [`[0:a:0]aresample=48000,aformat=channel_layouts=stereo,volume=${plan.nativeGainDb}dB,apad,atrim=duration=${duration}[native]`];
    plan.tracks.forEach((track, i) => filters.push(`[${i + 1}:a:0]atrim=start=${track.inSeconds}:duration=${track.durationSeconds},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${track.gainDb}dB${track.fadeSeconds ? `,afade=t=in:d=${track.fadeSeconds},afade=t=out:st=${track.durationSeconds - track.fadeSeconds}:d=${track.fadeSeconds}` : ""},adelay=${Math.round(track.atSeconds * 48000)}S:all=1[t${i}]`));
    filters.push(`[native]${plan.tracks.map((_, i) => `[t${i}]`).join("")}amix=inputs=${plan.tracks.length + 1}:duration=first:normalize=0,alimiter=limit=0.891251:level=false:latency=true[a]`);
    await run("ffmpeg", [...args, "-filter_complex", filters.join(";"), "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output], outputDirectory);
  }
  const sha256 = await fileHash(output);
  const result = { output, sha256, source: plan.source, operation: plan.operation, listeningReview: "pending", userAcceptance: "pending", registeredInProject: false };
  if (plan.operation === "mix") result.measurement = await measureAudio({ path: output, sha256 }, 0, duration);
  await fs.writeFile(path.join(outputDirectory, "result.json"), JSON.stringify(result, null, 2));
  return result;
}
