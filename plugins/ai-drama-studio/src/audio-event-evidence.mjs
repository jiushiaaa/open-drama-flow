import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fileHash } from "./local-edit.mjs";
import { run } from "./ffmpeg.mjs";
import { mediaCommand } from "./media-inspection.mjs";

const schema = z.object({
  source: z.object({ path: z.string(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/) }).strict(),
  fps: z.number().int().min(1).max(60),
  events: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/), contactFrame: z.number().int().min(0),
    soundFrame: z.number().int().min(0), evidenceReference: z.string().min(1),
    toleranceFrames: z.number().int().min(0).max(12).default(1)
  }).strict()).min(1).max(100)
}).strict();

export async function prepareAudioEventEvidence({ planPath, outputDirectory }) {
  if (!path.isAbsolute(planPath) || !path.isAbsolute(outputDirectory)) throw new Error("EVENT_ABSOLUTE_PATHS_REQUIRED");
  const plan = schema.parse(JSON.parse(await fs.readFile(planPath, "utf8")));
  if (!path.isAbsolute(plan.source.path) || await fileHash(plan.source.path) !== plan.source.sha256.toLowerCase()) throw new Error("EVENT_SOURCE_HASH_CHANGED");
  const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", plan.source.path]);
  const streams = JSON.parse(stdout).streams, v = streams.find(s => s.codec_type === "video"), a = streams.find(s => s.codec_type === "audio");
  const [n, d] = String(v?.avg_frame_rate || "0/1").split("/").map(Number);
  if (!v || !a || Math.abs(n / d - plan.fps) > 0.0001 || Number(v.start_time || 0) !== 0 || Number(a.start_time || 0) !== 0) throw new Error("EVENT_ZERO_BASED_AV_REQUIRED");
  const frameCount = Number(v.nb_frames);
  if (!Number.isInteger(frameCount) || new Set(plan.events.map(e => e.id)).size !== plan.events.length) throw new Error("EVENT_FRAME_COUNT_OR_ID_INVALID");
  for (const event of plan.events) if (Math.max(event.contactFrame, event.soundFrame) >= frameCount) throw new Error("EVENT_OUT_OF_RANGE");
  await fs.mkdir(outputDirectory);
  await fs.writeFile(path.join(outputDirectory, "event-plan.json"), JSON.stringify(plan, null, 2));
  const events = [];
  for (const event of plan.events) {
    const startFrame = Math.max(0, Math.min(event.contactFrame, event.soundFrame) - plan.fps);
    const endFrame = Math.min(frameCount, Math.max(event.contactFrame, event.soundFrame) + plan.fps);
    if ((endFrame - startFrame) / plan.fps > 30) throw new Error("EVENT_WINDOW_TOO_WIDE");
    const start = startFrame / plan.fps, end = endFrame / plan.fps;
    const timestamps = JSON.parse((await mediaCommand("ffprobe", ["-v", "error", "-select_streams", "v:0", "-read_intervals", `${Math.max(0, start - 1)}%${end + 1}`, "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", plan.source.path])).stdout).frames.map(f => Number(f.best_effort_timestamp_time)).filter(t => t >= start - 0.0001 && t < end - 0.0001);
    if (timestamps.length !== endFrame - startFrame || timestamps.some((t, i) => Math.abs(t - start - i / plan.fps) > 0.0011)) throw new Error("EVENT_CFR_TIMESTAMPS_REQUIRED");
    const preview = `${event.id}.mp4`, waveform = `${event.id}-waveform.png`, frames = `${event.id}-frames.jpg`;
    await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-filter_complex", `[0:v]trim=start_frame=${startFrame}:end_frame=${endFrame},setpts=PTS-STARTPTS[v];[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a]`, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-c:a", "aac", preview], outputDirectory);
    await run("ffmpeg", ["-nostdin", "-n", "-i", preview, "-filter_complex", "[0:a]showwavespic=s=1200x240:colors=white[a]", "-map", "[a]", "-frames:v", "1", waveform], outputDirectory);
    const first = Math.max(0, event.contactFrame - 6), last = Math.min(frameCount, event.contactFrame + 6);
    await run("ffmpeg", ["-nostdin", "-n", "-i", plan.source.path, "-vf", `trim=start_frame=${first}:end_frame=${last},scale=320:-2,tile=6x2`, "-frames:v", "1", frames], outputDirectory);
    const offset = event.soundFrame - event.contactFrame;
    events.push({ ...event, offsetFrames: offset, offsetMilliseconds: offset / plan.fps * 1000, withinDeclaredTolerance: Math.abs(offset) <= event.toleranceFrames, suggestedSoundShiftSeconds: -offset / plan.fps, preview, waveform, frames, waveformStartSeconds: start, waveformEndSeconds: end, contactX: (event.contactFrame / plan.fps - start) / (end - start) * 1200, soundX: (event.soundFrame / plan.fps - start) / (end - start) * 1200, sheetFirstFrame: first, sheetEndFrameExclusive: last });
  }
  const result = { source: plan.source, events, listeningReview: "pending", visualReview: "pending", boundary: "Markers are supplied from actual viewing/listening, not inferred from waveform peaks. Tolerance only compares supplied timestamps. No sound is shifted and no semantic acceptance is inferred." };
  await fs.writeFile(path.join(outputDirectory, "result.json"), JSON.stringify(result, null, 2));
  return result;
}
