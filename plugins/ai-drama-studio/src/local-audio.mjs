import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fileHash } from "./local-edit.mjs";
import { run } from "./ffmpeg.mjs";
import { mediaCommand } from "./media-inspection.mjs";

const source = z.object({ path: z.string(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/) }).strict();
export const audioPlanSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("normalize"), source, targetLufs: z.number().min(-36).max(-10).default(-16), truePeakDbtp: z.number().min(-9).max(-1).default(-1.5), loudnessRange: z.number().min(1).max(20).default(11) }).strict(),
  z.object({ operation: z.literal("denoise"), source, reductionDb: z.number().min(0.01).max(20).default(6), noiseFloorDb: z.number().min(-80).max(-20).default(-50) }).strict(),
  z.object({ operation: z.literal("derive"), source, character: z.string().min(1), acceptanceReference: z.string().min(1), capabilityReference: z.string().min(1), sampleRate: z.enum(["24000", "44100", "48000"]), channels: z.number().int().min(1).max(2), minDurationSeconds: z.number().min(0), maxDurationSeconds: z.number().positive(), maxBytes: z.number().int().positive() }).strict(),
  z.object({ operation: z.literal("measure"), source, startSeconds: z.number().min(0).default(0), durationSeconds: z.number().positive().max(7200), signalLabel: z.enum(["full-mix", "isolated-dialogue"]) }).strict(),
  z.object({ operation: z.literal("extract"), source, character: z.string().min(1), acceptanceReference: z.string().min(1), sampleRate: z.number().int().min(8000).max(192000), startSample: z.number().int().min(0), endSample: z.number().int().positive() }).strict(),
  z.object({ operation: z.literal("mix"), source, nativeGainDb: z.number().min(-12).max(6).default(0),
    dialogue: z.array(z.object({ startSeconds: z.number().min(0), endSeconds: z.number().positive() }).strict()).default([]),
    dialogueEvidence: z.string().min(1).optional(),
    duckDb: z.number().min(-30).max(0).default(-12), duckRampSeconds: z.number().min(0.01).max(2).default(0.15),
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

// A timeline envelope driven by reviewed speech intervals, not full-mix energy.
export function duckExpression(intervals, db, ramp) {
  if (!intervals.length) return "1";
  const envelopes = intervals.map(i => `max(0,min(1,min((t-${i.startSeconds - ramp})/${ramp},(${i.endSeconds + ramp}-t)/${ramp})))`);
  const envelope = envelopes.reduce((a, b) => a ? `max(${a},${b})` : b, "");
  return `pow(10,(${db})*(${envelope})/20)`;
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
  const startedAt = Date.now();
  if (!path.isAbsolute(planPath) || !path.isAbsolute(outputDirectory)) throw new Error("AUDIO_ABSOLUTE_PATHS_REQUIRED");
  const plan = audioPlanSchema.parse(JSON.parse(await fs.readFile(planPath, "utf8")));
  const media = await verifySource(plan.source);
  const audio = media.streams.find(s => s.codec_type === "audio");
  if (["normalize", "denoise"].includes(plan.operation)) return finishAudio(plan, media, outputDirectory, startedAt);
  if (plan.operation === "measure") return measureAudio(plan.source, plan.startSeconds, plan.durationSeconds, plan.signalLabel);
  if (plan.operation === "extract" && (plan.endSample <= plan.startSample || Number(audio.sample_rate) !== plan.sampleRate)) throw new Error("AUDIO_SAMPLE_RANGE_OR_RATE_INVALID");
  const video = media.streams.find(s => s.codec_type === "video");
  const duration = Number(video?.duration || media.format.duration);
  const audioDuration = Number(audio.duration || media.format.duration);
  if (plan.operation === "derive" && (plan.minDurationSeconds > plan.maxDurationSeconds || audioDuration < plan.minDurationSeconds || audioDuration > plan.maxDurationSeconds)) throw new Error("AUDIO_PROVIDER_DURATION_UNSUPPORTED_NO_PADDING");
  if (plan.operation === "mix") {
    if (!video || Number(video.start_time || 0) !== 0 || Number(audio.start_time || 0) !== 0) throw new Error("AUDIO_MIX_ZERO_BASED_VIDEO_REQUIRED");
    if (plan.dialogue.length && !plan.dialogueEvidence) throw new Error("AUDIO_DIALOGUE_EVIDENCE_REQUIRED");
    for (const cue of plan.dialogue) if (cue.endSeconds <= cue.startSeconds || cue.endSeconds > duration) throw new Error("AUDIO_DIALOGUE_RANGE_INVALID");
    for (const track of plan.tracks) {
      const item = await verifySource(track.source);
      if (track.inSeconds + track.durationSeconds > Number(item.format.duration) + 0.001 || track.atSeconds + track.durationSeconds > duration + 0.001 || track.fadeSeconds * 2 > track.durationSeconds) throw new Error("AUDIO_TRACK_RANGE_INVALID");
    }
  }
  await fs.mkdir(outputDirectory);
  await fs.writeFile(path.join(outputDirectory, "audio-plan.json"), JSON.stringify(plan, null, 2));
  let output;
  if (plan.operation === "derive") {
    output = path.join(outputDirectory, "voice-reference.wav");
    await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-map", "0:a:0", "-ar", plan.sampleRate, "-ac", String(plan.channels), "-c:a", "pcm_s16le", output], outputDirectory);
    if ((await fs.stat(output)).size > plan.maxBytes) throw new Error("AUDIO_PROVIDER_SIZE_EXCEEDED");
    const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output]);
    const derived = JSON.parse(stdout).streams[0];
    if (Number(derived.duration) < plan.minDurationSeconds || Number(derived.duration) > plan.maxDurationSeconds || derived.sample_rate !== plan.sampleRate || derived.channels !== plan.channels) throw new Error("AUDIO_PROVIDER_OUTPUT_OUTSIDE_LIMITS");
  } else if (plan.operation === "extract") {
    output = path.join(outputDirectory, "voice-master.wav");
    await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-map", "0:a:0", "-af", `atrim=start_sample=${plan.startSample}:end_sample=${plan.endSample},asetpts=PTS-STARTPTS`, "-c:a", "pcm_s24le", output], outputDirectory);
    const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", output]);
    if (Number(JSON.parse(stdout).streams[0].duration_ts) !== plan.endSample - plan.startSample) throw new Error("AUDIO_EXTRACT_SAMPLE_COUNT_MISMATCH");
  } else {
    output = path.join(outputDirectory, "mix-review.mp4");
    const args = ["-nostdin", "-n", "-i", plan.source.path];
    for (const track of plan.tracks) args.push("-i", track.source.path);
    const filters = [`[0:a:0]aresample=48000,aformat=channel_layouts=stereo,volume=${plan.nativeGainDb}dB,apad,atrim=duration=${duration}[native]`];
    plan.tracks.forEach((track, i) => filters.push(`[${i + 1}:a:0]atrim=start=${track.inSeconds}:duration=${track.durationSeconds},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${track.gainDb}dB${track.fadeSeconds ? `,afade=t=in:d=${track.fadeSeconds},afade=t=out:st=${track.durationSeconds - track.fadeSeconds}:d=${track.fadeSeconds}` : ""},adelay=${Math.round(track.atSeconds * 48000)}S:all=1${track.purpose === "music" && plan.dialogue.length ? `,volume='${duckExpression(plan.dialogue, plan.duckDb, plan.duckRampSeconds)}':eval=frame` : ""}[t${i}]`));
    filters.push(`[native]${plan.tracks.map((_, i) => `[t${i}]`).join("")}amix=inputs=${plan.tracks.length + 1}:duration=first:normalize=0,alimiter=limit=0.891251:level=false:latency=true[a]`);
    await run("ffmpeg", [...args, "-filter_complex", filters.join(";"), "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output], outputDirectory);
  }
  const sha256 = await fileHash(output);
  const result = { output, sha256, source: plan.source, operation: plan.operation, listeningReview: "pending", userAcceptance: "pending", registeredInProject: false };
  if (plan.operation === "mix") result.measurement = await measureAudio({ path: output, sha256 }, 0, duration);
  await fs.writeFile(path.join(outputDirectory, "result.json"), JSON.stringify(result, null, 2));
  return result;
}

// Audio-only derivatives preserve the source/video; no silence trimming, stem
// separation, dialogue replacement or automatic admission to the project library.
async function finishAudio(plan, media, outputDirectory, startedAt) {
  const audio = media.streams.find(s => s.codec_type === "audio");
  const duration = Number(audio.duration || media.format.duration);
  const sampleRate = Number(audio.sample_rate);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 7200 || ![1, 2].includes(audio.channels) || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000) throw new Error("AUDIO_FINISH_FORMAT_UNSUPPORTED");
  let filter, firstPass = null;
  if (plan.operation === "normalize") {
    const target = `loudnorm=I=${plan.targetLufs}:TP=${plan.truePeakDbtp}:LRA=${plan.loudnessRange}`;
    const { stderr } = await mediaCommand("ffmpeg", ["-nostdin", "-i", plan.source.path, "-map", "0:a:0", "-af", `${target}:print_format=json`, "-vn", "-f", "null", "-"]);
    firstPass = JSON.parse(stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0] || "null");
    if (!firstPass || ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"].some(key => !Number.isFinite(Number(firstPass[key])))) throw new Error("AUDIO_NORMALIZATION_UNMEASURABLE");
    filter = `${target}:measured_I=${Number(firstPass.input_i)}:measured_TP=${Number(firstPass.input_tp)}:measured_LRA=${Number(firstPass.input_lra)}:measured_thresh=${Number(firstPass.input_thresh)}:offset=${Number(firstPass.target_offset)}:linear=true`;
  } else filter = `afftdn=nr=${plan.reductionDb}:nf=${plan.noiseFloorDb}`;
  await fs.mkdir(outputDirectory);
  await fs.writeFile(path.join(outputDirectory, "audio-plan.json"), JSON.stringify(plan, null, 2));
  const output = path.join(outputDirectory, `${plan.operation}-review.wav`);
  await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-map", "0:a:0", "-af", filter, "-ar", String(sampleRate), "-ac", String(audio.channels), "-c:a", "pcm_s24le", output], outputDirectory);
  if (await fileHash(plan.source.path) !== plan.source.sha256.toLowerCase()) throw new Error("AUDIO_SOURCE_HASH_CHANGED");
  const sha256 = await fileHash(output);
  const derived = await verifySource({ path: output, sha256 });
  const stream = derived.streams.find(s => s.codec_type === "audio");
  if (Math.abs(Number(stream.duration) - duration) > 0.03 || Number(stream.sample_rate) !== sampleRate || stream.channels !== audio.channels) throw new Error("AUDIO_FINISH_TIMING_OR_FORMAT_CHANGED");
  const measurement = await measureAudio({ path: output, sha256 }, 0, Number(stream.duration));
  const result = { output, sha256, source: plan.source, operation: plan.operation, firstPass, measurement,
    technicalTargetMet: plan.operation === "normalize" ? Math.abs(Number(measurement.integratedLufs) - plan.targetLufs) <= 1 && Number(measurement.truePeakDbtp) <= plan.truePeakDbtp + 0.2 : null,
    durationSeconds: Number(stream.duration), sourceStartSeconds: Number(audio.start_time || 0), sampleRate, channels: stream.channels,
    cost: { providerFee: 0, computeCost: null, elapsedMs: Date.now() - startedAt },
    listeningReview: "pending", userAcceptance: "pending", registeredInProject: false,
    boundary: "WAV derivative of first audio stream only. Source/video untouched; timing relative to video must be retained when mixing back. Denoise may affect speech/music; LUFS is not a semantic quality or listening pass." };
  await fs.writeFile(path.join(outputDirectory, "result.json"), JSON.stringify(result, null, 2));
  return result;
}
