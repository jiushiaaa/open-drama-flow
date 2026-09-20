import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { z } from "zod";
import { dataRoot, safeId, assertInside } from "./config.mjs";
import { readState, mutateState } from "./store.mjs";
import { launchBackground, shutdownSignal } from "./background-jobs.mjs";

export const upscaleRuntimeSchema = z.object({
  executable: z.string().min(1), modelsDirectory: z.string().min(1),
  model: z.enum(["realesrgan-x4plus", "realesrgan-x4plus-anime", "realesr-animevideov3"]).default("realesrgan-x4plus"),
  gpu: z.number().int().min(-1).max(16).default(0), tile: z.number().int().min(32).max(1024).default(256)
}).strict();
export const upscaleRequestSchema = z.object({ sourcePath: z.string().min(1), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  projectId: z.string().optional(), creationId: z.string().optional(), shotId: z.string().optional(),
  longEdge: z.number().int().min(128).max(3840).default(3840), chunkFrames: z.number().int().min(1).max(240).default(120)
}).strict();
const root = path.join(dataRoot, "upscale-jobs");
const controllers = new Map();
export async function fileHash(file) { const hash = createHash("sha256"); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest("hex"); }
export function upscaleGeometry(width, height, longEdge) {
  const ratio = longEdge / Math.max(width, height);
  if (ratio <= 1 || ratio > 4) throw new Error("UPSCALE_SCALE_MUST_BE_GREATER_THAN_ONE_AND_AT_MOST_FOUR");
  return { width: Math.max(2, Math.round(width * ratio / 2) * 2), height: Math.max(2, Math.round(height * ratio / 2) * 2) };
}
async function runtimeEvidence(input) {
  const runtime = upscaleRuntimeSchema.parse(input);
  for (const value of [runtime.executable, runtime.modelsDirectory]) if (!path.isAbsolute(value)) throw new Error("UPSCALE_ABSOLUTE_PATH_REQUIRED");
  const scale = 4;
  const prefix = runtime.model === "realesr-animevideov3" ? `${runtime.model}-x4` : runtime.model;
  const files = [runtime.executable, ...["param", "bin"].map(ext => path.join(runtime.modelsDirectory, `${prefix}.${ext}`))];
  return { ...runtime, scale, files: await Promise.all(files.map(async file => ({ path: file, sha256: await fileHash(file) }))) };
}
export async function configureUpscale(input) {
  const runtime = await runtimeEvidence(input);
  await mutateState(state => { state.settings.upscaleRuntime = upscaleRuntimeSchema.parse(input); });
  return { runtime, verified: "files-hashed-not-gpu-inference" };
}
function command(executable, args, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], signal, timeout: 1800000 });
    let stdout = "", stderr = "";
    child.stdout.on("data", value => { stdout = (stdout + value).slice(-4000000); });
    child.stderr.on("data", value => { stderr = (stderr + value).slice(-4000000); });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`UPSCALE_COMMAND_FAILED:${path.basename(executable)}:${code}`)));
  });
}
async function probe(file, signal) { return JSON.parse((await command("ffprobe", ["-v", "error", "-show_streams", "-of", "json", file], signal)).stdout); }
const ff = (args, signal) => command("ffmpeg", ["-hide_banner", "-v", "error", "-nostdin", ...args], signal);
async function patch(id, values) { return mutateState(state => { const job = state.upscaleJobs?.find(item => item.id === id); if (!job) throw new Error("UPSCALE_JOB_NOT_FOUND"); Object.assign(job, values, { updatedAt: new Date().toISOString() }); return job; }); }
export async function getUpscale(id) {
  const jobs = (await readState()).upscaleJobs || [];
  if (!id) return { jobs };
  const job = jobs.find(item => item.id === id); if (!job) throw new Error("UPSCALE_JOB_NOT_FOUND");
  return job;
}
export async function createUpscale(input) {
  const request = upscaleRequestSchema.parse(input);
  if (!path.isAbsolute(request.sourcePath)) throw new Error("UPSCALE_ABSOLUTE_PATH_REQUIRED");
  const state = await readState();
  const project = request.projectId ? state.projects.find(p => p.id === request.projectId) : null;
  if (request.projectId && !project) throw new Error("PROJECT_NOT_FOUND");
  if ((request.creationId || request.shotId) && !project) throw new Error("UPSCALE_PROJECT_SCOPE_REQUIRED");
  const creation = request.creationId ? project.creations?.find(c => c.id === request.creationId) : null;
  if (request.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  const production = creation && creation.planSource !== "project-legacy" ? creation.plan : project;
  if (request.shotId && !production?.shots?.some(s => s.id === request.shotId)) throw new Error("SHOT_NOT_FOUND");
  const runtime = await runtimeEvidence(state.settings.upscaleRuntime);
  if (await fileHash(request.sourcePath) !== request.sourceSha256) throw new Error("UPSCALE_SOURCE_HASH_MISMATCH");
  const info = await probe(request.sourcePath, shutdownSignal), video = info.streams.find(s => s.codec_type === "video");
  const [n, d] = String(video?.r_frame_rate).split("/").map(Number), fps = n / d;
  const frames = Number(video?.nb_frames);
  if (!video || !Number.isInteger(frames) || frames < 1 || fps < 1 || fps > 120 || frames / fps > 7200 || video.avg_frame_rate !== video.r_frame_rate || video.side_data_list?.some(s => s.rotation)) throw new Error("UPSCALE_REQUIRES_UNROTATED_CFR_VIDEO_WITH_FRAME_COUNT");
  const geometry = upscaleGeometry(video.width, video.height, request.longEdge);
  const job = { id: safeId("upscale"), ...request, runtime, geometry, sourceGeometry: { width: video.width, height: video.height }, fps: video.r_frame_rate, frames, audioStreams: info.streams.filter(s => s.codec_type === "audio").length,
    status: "prepared", completedFrames: 0, chunks: [], createdAt: new Date().toISOString(), review: "visual-and-listening-review-pending", cost: { providerFee: 0, localComputeCost: null } };
  job.directory = path.join(root, job.id);
  await fs.mkdir(job.directory, { recursive: true });
  await mutateState(s => { s.upscaleJobs ||= []; s.upscaleJobs.push(job); });
  return job;
}
export async function startUpscale(id) {
  shutdownSignal.throwIfAborted();
  const job = await mutateState(state => {
    const job = state.upscaleJobs?.find(item => item.id === id); if (!job) throw new Error("UPSCALE_JOB_NOT_FOUND");
    if (job.status === "succeeded") throw new Error("UPSCALE_ALREADY_FINISHED");
    if (job.ownerPid) { try { process.kill(job.ownerPid, 0); throw new Error("UPSCALE_ALREADY_RUNNING"); } catch (error) { if (error.code !== "ESRCH") throw error; } }
    Object.assign(job, { ownerPid: process.pid, status: "running", cancelRequested: false, error: null }); return structuredClone(job);
  });
  const controller = new AbortController(); controllers.set(id, controller);
  const signal = AbortSignal.any([controller.signal, shutdownSignal]);
  launchBackground(async () => {
    try { await runUpscale(job, signal); }
    catch (error) { await patch(id, { status: signal.aborted || error.message === "UPSCALE_PAUSED" ? "paused" : "failed", error: String(error.message).slice(0, 200) }); }
    finally { controllers.delete(id); await patch(id, { ownerPid: null }); }
  });
  return { jobId: id, status: "running", next: "drama_get_upscale_job; resume reuses verified chunks" };
}
export async function pauseUpscale(id) {
  await patch(id, { cancelRequested: true }); controllers.get(id)?.abort();
  return { jobId: id, status: "pause-requested", boundary: "A different process observes this at the next chunk boundary; completed chunks remain." };
}
async function runUpscale(job, signal) {
  const dir = assertInside(root, job.directory);
  if (path.dirname(dir) !== root || path.basename(dir) !== job.id) throw new Error("UPSCALE_DIRECTORY_INVALID");
  for (const file of [...job.runtime.files, { path: job.sourcePath, sha256: job.sourceSha256 }]) if (await fileHash(file.path) !== file.sha256) throw new Error("UPSCALE_INPUT_OR_RUNTIME_CHANGED");
  const vfr = await command("ffmpeg", ["-hide_banner", "-nostdin", "-i", job.sourcePath, "-vf", "vfrdet", "-an", "-f", "null", "-"], signal);
  if (!/VFR:0\.0+\s*\(0\//.test(vfr.stderr)) throw new Error("UPSCALE_VFR_UNSUPPORTED");
  const chunks = [];
  const verify = async (file, count) => {
    const stream = (await probe(file, signal)).streams.find(s => s.codec_type === "video");
    if (Number(stream?.nb_frames) !== count || stream.width !== job.geometry.width || stream.height !== job.geometry.height || stream.r_frame_rate !== job.fps) throw new Error("UPSCALE_OUTPUT_GEOMETRY_OR_FRAMES_MISMATCH");
    await ff(["-i", file, "-map", "0:v:0", "-f", "null", "-"], signal);
  };
  for (let start = 0, index = 0; start < job.frames; start += job.chunkFrames, index++) {
    if ((await getUpscale(job.id)).cancelRequested) throw new Error("UPSCALE_PAUSED");
    signal.throwIfAborted();
    const count = Math.min(job.chunkFrames, job.frames - start), name = `chunk-${index}.mp4`, output = path.join(dir, name);
    const previous = job.chunks.find(c => c.start === start && c.count === count);
    if (previous && await fileHash(output).catch(() => "") === previous.sha256) { await verify(output, count); chunks.push(previous); continue; }
    const cache = path.join(dir, `frames-${index}`), input = path.join(cache, "input"), enhanced = path.join(cache, "enhanced");
    // Only discard this job's disposable, incomplete frame cache, never source/output masters.
    assertInside(dir, cache); await fs.rm(cache, { recursive: true, force: true });
    await fs.mkdir(input, { recursive: true }); await fs.mkdir(enhanced);
    const disk = await fs.statfs(dir), required = count * job.sourceGeometry.width * job.sourceGeometry.height * 17 * 6 + 512 * 1024 ** 2;
    if (disk.bavail * disk.bsize < required) throw new Error("UPSCALE_INSUFFICIENT_DISK_SPACE");
    await patch(job.id, { phase: `extracting-chunk-${index}`, completedFrames: start });
    await ff(["-i", job.sourcePath, "-vf", `trim=start_frame=${start}:end_frame=${start + count},setpts=PTS-STARTPTS`, "-frames:v", String(count), "-fps_mode", "passthrough", "-start_number", "1", path.join(input, "%06d.png")], signal);
    await patch(job.id, { phase: `upscaling-chunk-${index}` });
    await command(job.runtime.executable, ["-i", input, "-o", enhanced, "-m", job.runtime.modelsDirectory, "-n", job.runtime.model, "-s", "4", "-g", String(job.runtime.gpu), "-t", String(job.runtime.tile), "-j", "1:1:1", "-f", "png"], signal);
    if ((await fs.readdir(enhanced)).filter(f => f.endsWith(".png")).length !== count) throw new Error("UPSCALE_FRAME_COUNT_MISMATCH");
    const partial = path.join(dir, `chunk-${index}.partial.mp4`);
    await ff(["-framerate", job.fps, "-i", path.join(enhanced, "%06d.png"), "-vf", `scale=${job.geometry.width}:${job.geometry.height}:flags=lanczos`, "-frames:v", String(count), "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-threads", "4", "-y", partial], signal);
    await verify(partial, count); await fs.rename(partial, output);
    chunks.push({ start, count, name, sha256: await fileHash(output) });
    await patch(job.id, { chunks, completedFrames: start + count, phase: "chunk-verified" });
    await fs.rm(cache, { recursive: true, force: true });
  }
  await fs.writeFile(path.join(dir, "concat.txt"), chunks.map(c => `file '${c.name}'`).join("\n"));
  const output = path.join(dir, "upscaled.mp4"), partial = path.join(dir, "assembled.partial.mp4");
  await patch(job.id, { phase: "assembling" });
  await ff(["-f", "concat", "-safe", "1", "-i", path.join(dir, "concat.txt"), "-i", job.sourcePath, "-map", "0:v:0", "-map", "1:a?", "-c", "copy", "-movflags", "+faststart", "-y", partial], signal);
  await verify(partial, job.frames);
  for (let i = 0; i < job.audioStreams; i++) {
    const pcm = async file => (await ff(["-i", file, "-map", `0:a:${i}`, "-f", "hash", "-hash", "sha256", "-"], signal)).stdout.trim();
    if (await pcm(job.sourcePath) !== await pcm(partial)) throw new Error("UPSCALE_AUDIO_CHANGED");
  }
  if (await fileHash(job.sourcePath) !== job.sourceSha256) throw new Error("UPSCALE_SOURCE_CHANGED");
  await fs.rename(partial, output);
  await patch(job.id, { status: "succeeded", phase: "technical-checks-passed", completedFrames: job.frames, outputPath: output, outputSha256: await fileHash(output), audioPreserved: true, finishedAt: new Date().toISOString() });
}
