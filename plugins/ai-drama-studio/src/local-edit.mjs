import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { run, srtTimestamp } from "./ffmpeg.mjs";
import { mediaCommand } from "./media-inspection.mjs";

const frame = z.number().int().min(0);
const text = z.string().trim().min(1).max(500).refine(value => !/[{}\\<>\r\n]/.test(value), "Caption markup/newlines are not accepted");
export const editPlanSchema = z.object({
  version: z.literal(1), revision: z.string().min(1).max(120),
  fps: z.number().int().min(1).max(60),
  width: z.number().int().min(16).max(3840).multipleOf(2),
  height: z.number().int().min(16).max(2160).multipleOf(2),
  burnSubtitles: z.boolean().default(false),
  clips: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    path: z.string().min(1), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
    acceptanceReference: z.string().min(1).max(500),
    subtitleState: z.enum(["clean", "burned", "unknown"]),
    inFrame: frame, outFrame: frame,
    audio: z.enum(["native", "silence"]).default("native"),
    cues: z.array(z.object({ startFrame: frame, endFrame: frame, zh: text, en: text }).strict()).default([])
  }).strict()).min(1).max(100)
}).strict();

export async function fileHash(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

// Caption coordinates are source-frame coordinates; partial dialogue is rejected,
// never silently truncated to fit an editorial cut.
export function resolveEditPlan(input) {
  const plan = editPlanSchema.parse(input);
  const ids = new Set();
  let totalFrames = 0;
  const cues = [], seams = [];
  const clips = plan.clips.map(clip => {
    if (!path.isAbsolute(clip.path)) throw new Error("EDIT_ABSOLUTE_SOURCE_REQUIRED");
    if (ids.has(clip.id)) throw new Error("EDIT_DUPLICATE_CLIP_ID");
    ids.add(clip.id);
    if (clip.outFrame <= clip.inFrame) throw new Error("EDIT_EMPTY_RANGE");
    if (clip.cues.length && clip.subtitleState !== "clean") throw new Error("EDIT_CAPTION_SOURCE_NOT_CLEAN");
    if (plan.burnSubtitles && clip.subtitleState !== "clean") throw new Error("EDIT_DOUBLE_SUBTITLE_RISK");
    const ordered = [...clip.cues].sort((a, b) => a.startFrame - b.startFrame);
    let previousEnd = -1;
    for (const cue of ordered) {
      if (cue.endFrame <= cue.startFrame || cue.startFrame < previousEnd) throw new Error("EDIT_CAPTION_OVERLAP_OR_EMPTY");
      previousEnd = cue.endFrame;
      if (cue.endFrame <= clip.inFrame || cue.startFrame >= clip.outFrame) continue;
      if (cue.startFrame < clip.inFrame || cue.endFrame > clip.outFrame) throw new Error("EDIT_CUT_CROSSES_CAPTION");
      cues.push({ ...cue, clipId: clip.id, startFrame: totalFrames + cue.startFrame - clip.inFrame, endFrame: totalFrames + cue.endFrame - clip.inFrame });
    }
    if (totalFrames) seams.push(totalFrames);
    const item = { ...clip, timelineStartFrame: totalFrames };
    totalFrames += clip.outFrame - clip.inFrame;
    return item;
  });
  return { ...plan, clips, cues, seams, totalFrames, durationSeconds: totalFrames / plan.fps };
}

export function bilingualSrt(plan) {
  return plan.cues.map((cue, i) => `${i + 1}\n${srtTimestamp(cue.startFrame / plan.fps)} --> ${srtTimestamp(cue.endFrame / plan.fps)}\n${cue.zh}\n${cue.en}\n`).join("\n");
}

export function bilingualAss(plan) {
  const stamp = f => srtTimestamp(Math.round(f / plan.fps * 100) / 100).replace(",", ".").slice(0, -1);
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: ${plan.width}\nPlayResY: ${plan.height}\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Microsoft YaHei,${Math.round(plan.height * 0.038)},&H00FFFFFF,&H00FFFFFF,&H00101010,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,30,30,${Math.round(plan.height * 0.05)},1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` + plan.cues.map(cue => `Dialogue: 0,${stamp(cue.startFrame)},${stamp(cue.endFrame)},Default,,0,0,0,,${cue.zh}\\N${cue.en}\n`).join("");
}

async function probe(file) {
  const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", file]);
  return JSON.parse(stdout).streams;
}

// Probe only the selected interval. This avoids truncating JSON for long masters.
async function frameTimes(file, start, end) {
  const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-select_streams", "v:0", "-read_intervals", `${Math.max(0, start - 1)}%${end + 1}`, "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", file]);
  return JSON.parse(stdout).frames.map(f => Number(f.best_effort_timestamp_time));
}

export async function validateLocalEdit(input) {
  const plan = resolveEditPlan(input);
  const sources = [];
  for (const clip of plan.clips) {
    const hash = await fileHash(clip.path);
    if (hash !== clip.sha256.toLowerCase()) throw new Error(`EDIT_SOURCE_HASH_CHANGED:${clip.id}`);
    const streams = await probe(clip.path);
    const video = streams.find(s => s.codec_type === "video");
    const audio = streams.find(s => s.codec_type === "audio");
    const [n, d] = String(video?.avg_frame_rate || "0/1").split("/").map(Number);
    if (!video || Math.abs(n / d - plan.fps) > 0.0001) throw new Error(`EDIT_CFR_RATE_REQUIRED:${clip.id}`);
    if (clip.audio === "native" && !audio) throw new Error(`EDIT_NATIVE_AUDIO_MISSING:${clip.id}`);
    const startTime = Number(video.start_time || 0);
    const first = startTime + clip.inFrame / plan.fps;
    const last = startTime + (clip.outFrame - 1) / plan.fps;
    // Bound each probe to at most 30 seconds of frames.
    for (let start = first; start <= last + 0.0001; start += 30) {
      const end = Math.min(last, start + 30 - 1 / plan.fps);
      const times = (await frameTimes(clip.path, start, end)).filter(t => t >= start - 0.0001 && t <= end + 0.0001);
      const count = Math.round((end - start) * plan.fps) + 1;
      if (times.length !== count || times.some((t, i) => Math.abs(t - (start + i / plan.fps)) > 0.0011)) throw new Error(`EDIT_NONUNIFORM_OR_MISSING_FRAMES:${clip.id}`);
    }
    sources.push({ id: clip.id, sha256: hash, videoStartTime: startTime, audioStartTime: audio ? Number(audio.start_time || 0) : null });
  }
  return { plan, sources, boundary: "Technical preflight only; acceptanceReference records the caller's evidence, not automatic user approval." };
}

export async function renderLocalEdit({ planPath, outputDirectory, validateOnly = false }) {
  if (!path.isAbsolute(planPath) || !path.isAbsolute(outputDirectory)) throw new Error("EDIT_ABSOLUTE_PATHS_REQUIRED");
  const input = JSON.parse(await fs.readFile(planPath, "utf8"));
  const validated = await validateLocalEdit(input);
  if (validateOnly) return validated;
  // Exclusive directory creation protects every existing master and prior run.
  await fs.mkdir(outputDirectory);
  const { plan, sources } = validated;
  const writeJson = (name, value) => fs.writeFile(path.join(outputDirectory, name), JSON.stringify(value, null, 2) + "\n");
  await writeJson("edit-plan.json", input);
  await writeJson("preflight.json", validated);
  try {
    for (let i = 0; i < plan.clips.length; i++) {
      const clip = plan.clips[i], source = sources[i];
      const duration = (clip.outFrame - clip.inFrame) / plan.fps;
      const start = source.videoStartTime + clip.inFrame / plan.fps;
      const end = source.videoStartTime + clip.outFrame / plan.fps;
      const video = `[0:v:0]trim=start_frame=${clip.inFrame}:end_frame=${clip.outFrame},setpts=N/(${plan.fps}*TB),scale=${plan.width}:${plan.height}:force_original_aspect_ratio=decrease,pad=${plan.width}:${plan.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v]`;
      const audio = clip.audio === "native"
        ? `[0:a:0]atrim=start=${start}:end=${end},asetpts=PTS-${start}/TB,aresample=48000:async=1:first_pts=0,apad,atrim=duration=${duration},aformat=channel_layouts=stereo[a]`
        : `anullsrc=r=48000:cl=stereo,atrim=duration=${duration}[a]`;
      await run("ffmpeg", ["-nostdin", "-n", "-copyts", "-i", clip.path, "-filter_complex", `${video};${audio}`, "-map", "[v]", "-map", "[a]", "-c:v", "ffv1", "-c:a", "pcm_s16le", `segment-${i}.mkv`], outputDirectory);
    }
    // Explicit video durations prevent muxer/audio padding from shifting later cuts.
    await fs.writeFile(path.join(outputDirectory, "concat.txt"), plan.clips.map((c, i) => `file 'segment-${i}.mkv'\nduration ${(c.outFrame - c.inFrame) / plan.fps}\n`).join(""));
    await fs.writeFile(path.join(outputDirectory, "captions.srt"), bilingualSrt(plan));
    await fs.writeFile(path.join(outputDirectory, "captions.ass"), bilingualAss(plan));
    await run("ffmpeg", ["-nostdin", "-n", "-f", "concat", "-safe", "1", "-i", "concat.txt", "-map", "0:v:0", "-map", "0:a:0", "-vf", `setpts=N/(${plan.fps}*TB)${plan.burnSubtitles ? ",ass=captions.ass" : ""}`, "-af", `aresample=48000:async=1:first_pts=0,apad,atrim=duration=${plan.durationSeconds}`, "-r", String(plan.fps), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "review.mp4"], outputDirectory);
    const output = path.join(outputDirectory, "review.mp4");
    const outputStreams = await probe(output);
    const video = outputStreams.find(s => s.codec_type === "video");
    const audio = outputStreams.find(s => s.codec_type === "audio");
    if (Number(video?.nb_frames) !== plan.totalFrames || Math.abs(Number(video.duration) - plan.durationSeconds) > 1 / plan.fps || !audio || Math.abs(Number(audio.duration) - plan.durationSeconds) > 0.03) throw new Error("EDIT_OUTPUT_DURATION_OR_FRAMES_MISMATCH");
    const evidence = [];
    for (const [index, cut] of plan.seams.entries()) {
      const first = Math.max(0, cut - 6), end = Math.min(plan.totalFrames, cut + 6);
      const sheet = `seam-${index + 1}.jpg`, movie = `seam-${index + 1}.mp4`;
      await run("ffmpeg", ["-nostdin", "-n", "-i", output, "-vf", `trim=start_frame=${first}:end_frame=${end},scale=320:-2,tile=6x2`, "-frames:v", "1", sheet], outputDirectory);
      await run("ffmpeg", ["-nostdin", "-n", "-ss", String(Math.max(0, cut / plan.fps - 1)), "-i", output, "-t", String(Math.min(2, plan.durationSeconds - Math.max(0, cut / plan.fps - 1))), "-c:v", "libx264", "-c:a", "aac", movie], outputDirectory);
      evidence.push({ cutFrame: cut, sheet, movie, firstFrame: first, endFrameExclusive: end });
    }
    // Subtitle boundaries get actual composited frames, not just a timestamp report.
    const captionEvidence = [];
    for (const [index, cue] of plan.cues.entries()) {
      const frames = [...new Set([Math.max(0, cue.startFrame - 1), cue.startFrame, cue.endFrame - 1, Math.min(plan.totalFrames - 1, cue.endFrame)])];
      const sheet = `caption-${index + 1}.jpg`;
      await run("ffmpeg", ["-nostdin", "-n", "-i", output, "-vf", `select='${frames.map(f => `eq(n,${f})`).join("+")}',scale=480:-2,tile=4x1`, "-frames:v", "1", sheet], outputDirectory);
      captionEvidence.push({ sheet, frames, burned: plan.burnSubtitles });
    }
    const result = { output, sha256: await fileHash(output), totalFrames: plan.totalFrames, durationSeconds: plan.durationSeconds, sources, evidence, captionEvidence, technicalPassed: true, visualReview: "pending", listeningReview: "pending", userAcceptance: "pending", registeredInProject: false };
    await writeJson("result.json", result);
    // Delete only this run's known lossless intermediates after verified output.
    for (let i = 0; i < plan.clips.length; i++) await fs.unlink(path.join(outputDirectory, `segment-${i}.mkv`));
    return result;
  } catch (error) {
    await writeJson("failure.json", { error: String(error.message), retainedForDiagnosis: true });
    throw error;
  }
}
