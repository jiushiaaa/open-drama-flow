import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { scanMediaSignals, extractReviewAudio } from "./media-inspection.mjs";
import { reviewRequirements } from "./quality-contract.mjs";

const PACK_SCHEMA = "ai-drama-review-evidence/v1";
const MANIFEST_NAME = "review-evidence.json";
const MAX_REVIEW_FRAMES = 25;
const NOMINAL_FRAME_SECONDS = 1 / 24;

function roundedTimestamp(value) {
  return Number(Math.max(0, value).toFixed(6));
}

function normalizeDuration(value) {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("MEDIA_DURATION_INVALID");
  return duration;
}

function shotSpans(duration, shots) {
  let cursor = 0;
  const spans = [];
  for (const shot of Array.isArray(shots) ? shots : []) {
    const shotDuration = Number(shot?.duration || 0);
    if (!Number.isFinite(shotDuration) || shotDuration <= 0) continue;
    const start = cursor;
    const end = Math.min(duration, cursor + shotDuration);
    cursor += shotDuration;
    if (start >= duration || end <= start) continue;
    spans.push({ shotId: String(shot?.id || "").trim() || null, start, end });
  }
  return spans;
}

function shotAt(spans, timestamp) {
  const found = spans.find((span, index) => timestamp >= span.start && (timestamp < span.end || index === spans.length - 1));
  return found?.shotId || spans.at(-1)?.shotId || null;
}

function selectEvenly(items, count) {
  if (items.length <= count) return items;
  if (count <= 0) return [];
  if (count === 1) return [items[Math.floor((items.length - 1) / 2)]];
  const indexes = new Set();
  for (let index = 0; index < count; index += 1) {
    indexes.add(Math.round(index * (items.length - 1) / (count - 1)));
  }
  return [...indexes].sort((left, right) => left - right).map(index => items[index]);
}

/**
 * Build a deterministic, bounded inspection plan. It samples global context and
 * both sides of evenly distributed internal shot boundaries; it does not judge
 * the visual content of those frames.
 */
export function buildReviewFramePlan(duration, shots = []) {
  const safeDuration = normalizeDuration(duration);
  const spans = shotSpans(safeDuration, shots);
  const edgeOffset = Math.min(NOMINAL_FRAME_SECONDS, safeDuration / 20);
  const endOffset = Math.min(Math.max(NOMINAL_FRAME_SECONDS * 2, safeDuration / 100), safeDuration / 2);
  const byTimestamp = new Map();

  const add = (label, shotId, timestamp) => {
    const normalized = roundedTimestamp(Math.min(safeDuration, timestamp));
    const key = normalized.toFixed(6);
    if (!byTimestamp.has(key)) byTimestamp.set(key, { label, shotId: shotId || null, timestamp: normalized });
  };

  add("start", shotAt(spans, 0), 0);
  add("mid", shotAt(spans, safeDuration / 2), safeDuration / 2);
  add("end", shotAt(spans, safeDuration), Math.max(0, safeDuration - endOffset));

  const boundaries = [];
  for (let index = 0; index < spans.length - 1; index += 1) {
    const previous = spans[index];
    const next = spans[index + 1];
    const timestamp = previous.end;
    if (timestamp <= 0 || timestamp >= safeDuration) continue;
    boundaries.push({ previous, next, timestamp });
  }

  const pairCapacity = Math.floor((MAX_REVIEW_FRAMES - byTimestamp.size) / 2);
  for (const boundary of selectEvenly(boundaries, pairCapacity)) {
    const beforeOffset = Math.min(edgeOffset, (boundary.timestamp - boundary.previous.start) / 2);
    const afterOffset = Math.min(edgeOffset, (boundary.next.end - boundary.timestamp) / 2);
    add("boundary-before", boundary.previous.shotId, boundary.timestamp - beforeOffset);
    add("boundary-after", boundary.next.shotId, boundary.timestamp + afterOffset);
  }

  return [...byTimestamp.values()]
    .sort((left, right) => left.timestamp - right.timestamp || left.label.localeCompare(right.label))
    .slice(0, MAX_REVIEW_FRAMES);
}

function runProcess(command, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-12000); });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`REVIEW_COMMAND_FAILED:${command}:${code}:${stderr.split("\n").slice(-8).join(" ")}`));
    });
  });
}

function runnerStdout(result) {
  if (Buffer.isBuffer(result)) return result.toString("utf8");
  if (typeof result === "string") return result;
  if (Buffer.isBuffer(result?.stdout)) return result.stdout.toString("utf8");
  if (typeof result?.stdout === "string") return result.stdout;
  if (typeof result?.output === "string") return result.output;
  return "";
}

function parseRate(value) {
  const [numerator, denominator] = String(value || "0/1").split("/").map(Number);
  const rate = denominator ? numerator / denominator : 0;
  return Number.isFinite(rate) ? rate : 0;
}

async function probeMedia(inputPath, runner) {
  const result = await runner("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", inputPath], { cwd: path.dirname(inputPath), capture: true });
  let payload;
  try { payload = JSON.parse(runnerStdout(result)); }
  catch { throw new Error("MEDIA_PROBE_JSON_INVALID"); }
  const video = (payload.streams || []).find(stream => stream.codec_type === "video");
  if (!video) throw new Error("MEDIA_VIDEO_STREAM_MISSING");
  const audio = (payload.streams || []).find(stream => stream.codec_type === "audio") || null;
  const duration = normalizeDuration(payload.format?.duration || video.duration);
  return {
    duration,
    video: {
      codec: video.codec_name || "",
      width: Number(video.width || 0),
      height: Number(video.height || 0),
      fps: parseRate(video.avg_frame_rate || video.r_frame_rate),
      pixelFormat: video.pix_fmt || ""
    },
    audio: audio ? {
      codec: audio.codec_name || "",
      sampleRate: Number(audio.sample_rate || 0),
      channels: Number(audio.channels || 0)
    } : null,
    format: payload.format?.format_name || ""
  };
}

function digestJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function digestFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function isPathInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function outputDirectoryState(outputDir) {
  let stat;
  try { stat = await fs.stat(outputDir); }
  catch (error) {
    if (error?.code === "ENOENT") return { exists: false, owned: true, manifest: null };
    throw error;
  }
  if (!stat.isDirectory()) throw new Error("REVIEW_OUTPUT_NOT_DIRECTORY");
  const entries = await fs.readdir(outputDir);
  if (entries.length === 0) return { exists: true, owned: true, manifest: null };
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(outputDir, MANIFEST_NAME), "utf8"));
    return { exists: true, owned: manifest?.schema === PACK_SCHEMA, manifest };
  } catch {
    return { exists: true, owned: false, manifest: null };
  }
}

async function validExistingPack({ state, outputDir, source, shots }) {
  const manifest = state.manifest;
  if (!state.owned || manifest?.schema !== PACK_SCHEMA) return null;
  if (manifest.source?.path !== source.path || manifest.source?.bytes !== source.bytes || manifest.source?.sha256 !== source.sha256) return null;
  let plan;
  try { plan = buildReviewFramePlan(manifest.media?.duration, shots); }
  catch { return null; }
  if (manifest.framePlanDigest !== digestJson(plan) || !Array.isArray(manifest.frames) || manifest.frames.length !== plan.length) return null;
  for (let index = 0; index < plan.length; index += 1) {
    const frame = manifest.frames[index];
    const expected = plan[index];
    if (frame.label !== expected.label || frame.shotId !== expected.shotId || frame.timestamp !== expected.timestamp) return null;
    const framePath = path.resolve(outputDir, String(frame.file || ""));
    if (!frame.file || !isPathInside(outputDir, framePath)) return null;
    try {
      const stat = await fs.stat(framePath);
      if (!stat.isFile() || stat.size <= 0 || stat.size !== frame.bytes || await digestFile(framePath) !== frame.sha256) return null;
    } catch { return null; }
  }
  return manifest;
}

async function replaceDirectory(stagingDir, outputDir, hadExistingOutput) {
  if (!hadExistingOutput) {
    await fs.rename(stagingDir, outputDir);
    return;
  }
  const backupDir = `${outputDir}.backup-${process.pid}-${randomUUID()}`;
  await fs.rename(outputDir, backupDir);
  try {
    await fs.rename(stagingDir, outputDir);
  } catch (error) {
    try { await fs.rename(backupDir, outputDir); } catch {}
    throw error;
  }
  try { await fs.rm(backupDir, { recursive: true, force: true }); } catch {}
}

/**
 * Create an evidence-only JPEG pack for human/Codex inspection. The function
 * deliberately records no automated visual pass/fail decision.
 */
export async function createReviewEvidencePack({ inputPath, outputDir, shots = [], runner = runProcess, includeTemporal = false } = {}) {
  if (typeof runner !== "function") throw new Error("REVIEW_RUNNER_REQUIRED");
  if (!inputPath) throw new Error("REVIEW_INPUT_PATH_REQUIRED");
  if (!outputDir) throw new Error("REVIEW_OUTPUT_DIR_REQUIRED");

  const resolvedInput = await fs.realpath(path.resolve(inputPath));
  const resolvedOutput = path.resolve(outputDir);
  if (isPathInside(resolvedOutput, resolvedInput)) throw new Error("REVIEW_INPUT_INSIDE_OUTPUT");
  const inputStat = await fs.stat(resolvedInput);
  if (!inputStat.isFile()) throw new Error("REVIEW_INPUT_NOT_FILE");
  const source = { path: resolvedInput, bytes: inputStat.size, sha256: await digestFile(resolvedInput) };

  const outputState = await outputDirectoryState(resolvedOutput);
  if (!outputState.owned) throw new Error("REVIEW_OUTPUT_DIR_NOT_OWNED");
  const existing = await validExistingPack({ state: outputState, outputDir: resolvedOutput, source, shots });
  if (existing && !includeTemporal) return existing;

  const media = await probeMedia(resolvedInput, runner);
  const framePlan = buildReviewFramePlan(media.duration, shots);
  const parentDir = path.dirname(resolvedOutput);
  await fs.mkdir(parentDir, { recursive: true });
  const stagingDir = await fs.mkdtemp(path.join(parentDir, `.${path.basename(resolvedOutput)}.tmp-`));
  const frameDir = path.join(stagingDir, "frames");

  try {
    await fs.mkdir(frameDir, { recursive: true });
    const frames = [];
    for (let index = 0; index < framePlan.length; index += 1) {
      const planned = framePlan[index];
      const file = path.join("frames", `frame-${String(index + 1).padStart(2, "0")}.jpg`);
      const stagingPath = path.join(stagingDir, file);
      await runner("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", planned.timestamp.toFixed(6), "-i", resolvedInput,
        "-map", "0:v:0", "-frames:v", "1", "-c:v", "mjpeg", "-threads", "1", "-q:v", "2", stagingPath
      ], { cwd: stagingDir, capture: false });
      const stat = await fs.stat(stagingPath);
      if (!stat.isFile() || stat.size <= 0) throw new Error(`REVIEW_FRAME_EMPTY:${index + 1}`);
      frames.push({
        ...planned,
        file: file.replaceAll("\\", "/"),
        path: path.join(resolvedOutput, file),
        bytes: stat.size,
        sha256: await digestFile(stagingPath)
      });
    }

    let temporal = null;
    if (includeTemporal) {
      temporal = { signals: await scanMediaSignals(resolvedInput, media), playbackPath: resolvedInput, requirements: reviewRequirements(shots), audioPlayback: null, semanticReview: "pending-actual-playback" };
      if (media.audio) {
        temporal.audioPlayback = await extractReviewAudio(resolvedInput, path.join(stagingDir, "listen.wav"));
        temporal.audioPlayback.path = path.join(resolvedOutput, "listen.wav");
      }
    }
    const afterStat = await fs.stat(resolvedInput);
    if (afterStat.size !== source.bytes || afterStat.mtimeMs !== inputStat.mtimeMs || await digestFile(resolvedInput) !== source.sha256) {
      throw new Error("REVIEW_SOURCE_CHANGED_DURING_EXTRACTION");
    }

    const manifest = {
      schema: PACK_SCHEMA,
      purpose: "inspection-evidence-only",
      reviewStatus: "unreviewed",
      automatedVisualAcceptance: false,
      source,
      media,
      framePlanDigest: digestJson(framePlan),
      frames
    };
    if (temporal) manifest.temporal = temporal;
    const manifestTemp = path.join(stagingDir, `${MANIFEST_NAME}.tmp`);
    await fs.writeFile(manifestTemp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await fs.rename(manifestTemp, path.join(stagingDir, MANIFEST_NAME));
    await replaceDirectory(stagingDir, resolvedOutput, outputState.exists);
    return manifest;
  } catch (error) {
    try { await fs.rm(stagingDir, { recursive: true, force: true }); } catch {}
    throw error;
  }
}
