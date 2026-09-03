import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { providerContent, validateSeedanceRequest } from "./seedance-contract.mjs";
import { shutdownSignal } from "./background-jobs.mjs";
import { extractLastFrame } from "./media-inspection.mjs";

function arkHeaders(apiKey) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
}

function safeArkError(status, body) {
  const code = body?.error?.code || body?.code || "ARK_REQUEST_FAILED";
  const requestId = body?.request_id || body?.error?.request_id || "";
  const error = new Error(`${code} (HTTP ${status})${requestId ? ` [${requestId}]` : ""}`);
  error.code = code;
  error.httpStatus = status;
  error.requestId = requestId;
  return error;
}

async function arkFetch(url, options, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.any([controller.signal, shutdownSignal]) });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!response.ok) throw safeArkError(response.status, body);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadBytes(url, timeoutMs = 5 * 60 * 1000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: AbortSignal.any([controller.signal, shutdownSignal]) });
    if (!response.ok) {
      const error = new Error(`PROVIDER_DOWNLOAD_FAILED_${response.status}`);
      error.httpStatus = response.status;
      throw error;
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

export async function generateSeedreamImage({ apiKey, baseUrl, model, prompt, size = "2K", watermark = false, outputPath }) {
  if (!model) throw new Error("SEEDREAM_MODEL_REQUIRED");
  const body = await arkFetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: arkHeaders(apiKey),
    body: JSON.stringify({ model, prompt, size, response_format: "url", watermark, output_format: "png" })
  }, 20 * 60 * 1000);
  const remoteUrl = body?.data?.[0]?.url;
  if (!remoteUrl) throw new Error("SEEDREAM_RESULT_URL_MISSING");
  const bytes = await downloadBytes(remoteUrl);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);
  return { outputPath, remoteUrl, usage: body.usage || null, model: body.model || model };
}

export async function createSeedanceTask({ apiKey, baseUrl, model, prompt, imageUrl, inputs = null, inputMode = "image-to-video", ratio = "9:16", duration = 5, resolution = "720p", generateAudio = false, watermark = false }) {
  if (!model) throw new Error("SEEDANCE_MODEL_REQUIRED");
  const media = inputs || (imageUrl ? [{ kind: "image", providerRole: "first_frame", url: imageUrl }] : []);
  const parameters = { ratio, duration, watermark, return_last_frame: true, resolution, generate_audio: generateAudio };
  const errors = validateSeedanceRequest({ model, inputMode, inputs: media, parameters });
  if (errors.length) throw new Error(errors.map(error => error.code).join(","));
  const payload = { model, content: providerContent(prompt, media), ...parameters };
  const body = await arkFetch(`${baseUrl.replace(/\/$/, "")}/contents/generations/tasks`, {
    method: "POST",
    headers: arkHeaders(apiKey),
    body: JSON.stringify(payload)
  });
  if (!body?.id) throw new Error("SEEDANCE_TASK_ID_MISSING");
  return body.id;
}

export async function getSeedanceTask({ apiKey, baseUrl, taskId }) {
  return arkFetch(`${baseUrl.replace(/\/$/, "")}/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: arkHeaders(apiKey)
  });
}

export async function waitForSeedanceTask({ apiKey, baseUrl, taskId, maxWaitMs = 30 * 60 * 1000, pollMs = 6000, onStatus, onPoll }) {
  const started = Date.now();
  let previous = "";
  while (Date.now() - started < maxWaitMs) {
    const task = await getSeedanceTask({ apiKey, baseUrl, taskId });
    const status = task.status || "unknown";
    await onPoll?.(status, task);
    if (status !== previous) await onStatus?.(status, task);
    previous = status;
    if (status === "succeeded") return task;
    if (["failed", "cancelled", "expired"].includes(status)) throw new Error(`SEEDANCE_${status.toUpperCase()}`);
    await delay(pollMs, undefined, { signal: shutdownSignal });
  }
  throw new Error("SEEDANCE_STATUS_UNKNOWN_AFTER_TIMEOUT");
}

export async function downloadSeedanceVideo(task, outputPath) {
  const remoteUrl = task?.content?.video_url || task?.video_url || task?.output?.video_url;
  if (!remoteUrl) throw new Error("SEEDANCE_RESULT_URL_MISSING");
  const bytes = await downloadBytes(remoteUrl);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);
  // Decode the actual delivered video's tail, avoiding expired URLs or guessed image formats.
  const lastFramePath = await extractLastFrame(outputPath, `${outputPath}.last-frame.png`);
  return { outputPath, remoteUrl, lastFramePath };
}
