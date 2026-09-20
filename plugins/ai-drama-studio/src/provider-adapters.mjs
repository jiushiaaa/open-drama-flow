import { createHash, createHmac } from "node:crypto";
import { publicFetch, providerUrl } from "./provider-network.mjs";
import { readProviderKey } from "./secrets.mjs";
import { credentialSlot } from "./provider-config.mjs";

const sha = v => createHash("sha256").update(v).digest("hex");
const hmac = (k, v) => createHmac("sha256", k).update(v).digest();
const dimensions = ratio => ({ "16:9": "1280:720", "9:16": "720:1280", "1:1": "720:720" }[ratio]);
export function tencentHeaders(url, body, action, ak, sk, timestamp = Math.floor(Date.now() / 1000)) {
  const host = new URL(url).host, service = host.split(".")[0], date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const canonical = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${sha(body)}`;
  const scope = `${date}/${service}/tc3_request`, stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${scope}\n${sha(canonical)}`;
  const signature = hmac(hmac(hmac(hmac(`TC3${sk}`, date), service), "tc3_request"), stringToSign).toString("hex");
  return { Authorization: `TC3-HMAC-SHA256 Credential=${ak}/${scope}, SignedHeaders=content-type;host, Signature=${signature}`,
    "X-TC-Action": action, "X-TC-Version": service === "aiart" ? "2022-12-29" : "2024-05-23", "X-TC-Region": "ap-guangzhou", "X-TC-Timestamp": String(timestamp) };
}
export function adapterPayload(p, r) {
  const { protocol: type, model } = p, prompt = r.prompt, ratio = r.aspectRatio;
  const maxPrompt = type === "tencent-video" ? 200 : type === "zhipu-video" ? 512 : type === "tencent-image" ? 1024 : type.startsWith("runway") || p.provider === "zhipu" && p.kind === "image" ? 1000 : type.startsWith("kling") ? 2500 : type === "dashscope-video" ? 5000 : 10000;
  if (prompt.length > maxPrompt) throw new Error(`PROVIDER_PROMPT_MAX_${maxPrompt}`);
  if (r.frames !== 81 && type !== "fal-video") throw new Error("PROVIDER_FRAMES_UNSUPPORTED");
  const duration = p.duration || ({ "minimax-video": 6, "dashscope-video": 5, "runway-video": 5, "kling-video": 5, "zhipu-video": 5 }[type]);
  if (r.duration !== undefined && (duration === undefined || r.duration !== duration)) throw new Error("PROVIDER_DURATION_USE_CATALOG_SPECIFICATION");
  const expectedResolution = type === "minimax-video" ? "768p" : type === "zhipu-video" ? "1080p" : "720p";
  if (r.resolution && (p.kind !== "video" || r.resolution !== expectedResolution)) throw new Error("PROVIDER_RESOLUTION_USE_CATALOG_SPECIFICATION");
  if (type === "zhipu-video" && ratio === "1:1" && r.resolution) throw new Error("PROVIDER_SQUARE_USES_1024_RESOLUTION");
  if (type === "openai-image" && p.provider !== "zhipu" && ratio !== "1:1") throw new Error("PROVIDER_ASPECT_RATIO_UNSUPPORTED_USE_SQUARE");
  if (["minimax-video", "tencent-video"].includes(type) && ratio !== "16:9") throw new Error("PROVIDER_ASPECT_RATIO_UNSUPPORTED");
  if (type === "runway-video" && ratio === "1:1") throw new Error("PROVIDER_ASPECT_RATIO_UNSUPPORTED");
  if (type === "minimax-image") return { model, prompt, aspect_ratio: ratio, n: 1, response_format: "url", prompt_optimizer: false };
  if (type === "minimax-video") return { model, prompt, duration: 6, resolution: "768P", prompt_optimizer: false };
  if (type === "minimax-tts") return { model, text: prompt, stream: false, output_format: "url", voice_setting: { voice_id: r.voiceId || "English_expressive_narrator", speed: 1, vol: 1, pitch: 0 }, audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 } };
  if (type === "dashscope-image") return { model, input: { prompt }, parameters: { n: 1, size: { "16:9": "1280*720", "9:16": "720*1280", "1:1": "1024*1024" }[ratio] } };
  if (type === "dashscope-video") return { model, input: { prompt }, parameters: { resolution: "720P", ratio, duration: 5, prompt_extend: false, watermark: true } };
  if (type === "tencent-image") return { Prompt: prompt, Resolution: { "16:9": "1280:720", "9:16": "720:1280", "1:1": "1024:1024" }[ratio], RspImgType: "url", LogoAdd: 1 };
  if (type === "tencent-video") return { Prompt: prompt, Resolution: "720p", LogoAdd: 1 };
  if (type === "kling-image") return { model_name: model, prompt, aspect_ratio: ratio, resolution: "1k", n: 1 };
  if (type === "kling-video") return { prompt, settings: { aspect_ratio: ratio, duration: 5, resolution: "720p", audio: "off", multi_shot: false } };
  if (type === "openai-image") return { model, prompt, size: p.provider === "zhipu" ? { "16:9": "1728x960", "9:16": "960x1728", "1:1": "1280x1280" }[ratio] : "1024x1024", ...(p.provider === "zhipu" ? {} : { n: 1, response_format: "url" }) };
  if (type === "zhipu-video") return { model, prompt, quality: "quality", with_audio: true, size: { "16:9": "1920x1080", "9:16": "1080x1920", "1:1": "1024x1024" }[ratio], fps: 30, duration: 5 };
  if (type.startsWith("runway")) return { model, promptText: prompt, ratio: dimensions(ratio), ...(type === "runway-video" ? { duration: 5 } : {}) };
  if (type === "fal-image") return { prompt, image_size: { "16:9": "landscape_16_9", "9:16": "portrait_16_9", "1:1": "square_hd" }[ratio], num_images: 1, output_format: "png", enable_safety_checker: true };
  if (type === "fal-video") return { prompt, aspect_ratio: ratio, num_frames: r.frames, resolution: r.resolution || "720p", frames_per_second: 16, enable_safety_checker: true };
  if (type === "replicate-image") return { prompt, aspect_ratio: ratio, num_outputs: 1, output_format: "png" };
  throw new Error("PROVIDER_PROTOCOL_UNSUPPORTED");
}
export async function adapterCredentials(connection, dependencies = {}) {
  const read = dependencies.readKey || readProviderKey;
  const values = {};
  for (const field of connection.credentials) values[field] = await read(credentialSlot(connection.provider, field));
  return values;
}
export async function adapterRequest(connection, credentials, endpoint, method, payload, dependencies = {}, action) {
  const url = providerUrl(endpoint.startsWith("https:") ? endpoint : `${connection.baseUrl}${endpoint}`);
  if (url.origin !== new URL(connection.baseUrl).origin) throw new Error("PROVIDER_URL_REJECTED");
  const type = connection.protocol, body = payload === undefined ? undefined : JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };
  if (type.startsWith("tencent")) Object.assign(headers, tencentHeaders(url, body, action, credentials.accessKey, credentials.secretKey));
  else headers.Authorization = `${type.startsWith("fal") ? "Key" : "Bearer"} ${credentials.apiKey}`;
  if (type.startsWith("runway")) headers["X-Runway-Version"] = "2024-11-06";
  if (type.startsWith("dashscope") && method === "POST") headers["X-DashScope-Async"] = "enable";
  const response = await (dependencies.fetcher || publicFetch)(url, { method, headers, body, redirect: "error" });
  if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`);
  // Provider errors may echo prompts/secrets; only retain normalized error categories.
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > 2 * 1024 ** 2) throw new Error("PROVIDER_RESPONSE_TOO_LARGE"); chunks.push(chunk); }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("PROVIDER_RESPONSE_INVALID_JSON"); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("PROVIDER_RESPONSE_INVALID_JSON");
  if (data.error || data.Response?.Error || (data.base_resp && data.base_resp.status_code !== 0) || (type.startsWith("kling") && data.code !== 0) || (type.startsWith("dashscope") && data.code)) throw new Error("PROVIDER_RESPONSE_ERROR");
  return data;
}
function generated(urls, usage) {
  if (!Array.isArray(urls) || !urls.length || urls.some(u => typeof u !== "string")) throw new Error("PROVIDER_OUTPUT_MISSING");
  urls.forEach(providerUrl);
  return { status: "generated", outputUrls: urls.slice(0, 1), usage };
}
export async function adapterSubmit(job, credentials, dependencies) {
  const p = job.connection, type = p.protocol;
  const data = await adapterRequest(p, credentials, p.submitPath, "POST", type === "replicate-image" ? { input: job.payload } : job.payload, dependencies, job.model);
  if (type === "minimax-image") return generated(data.data?.image_urls, data.metadata);
  if (type === "minimax-tts") return generated([data.data?.audio], data.extra_info);
  if (type === "openai-image") return generated(data.data?.map(i => i.url), data.usage);
  if (type === "tencent-image") return generated([data.Response?.ResultImage]);
  const taskId = type.startsWith("fal") ? data.request_id : data.task_id || data.output?.task_id || data.data?.task_id || data.data?.id || data.Response?.JobId || data.id;
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(taskId || "")) throw new Error("PROVIDER_TASK_ID_MISSING");
  return { providerTaskId: taskId, status: "submitted", links: type.startsWith("fal") ? { status: data.status_url, response: data.response_url } : null };
}
export async function adapterPoll(job, credentials, dependencies) {
  const p = job.connection, type = p.protocol, id = encodeURIComponent(job.providerTaskId);
  let endpoint, body, action;
  if (type === "minimax-video") endpoint = `/query/video_generation?task_id=${id}`;
  else if (type.startsWith("dashscope")) endpoint = `/tasks/${id}`;
  else if (type.startsWith("runway")) endpoint = `/tasks/${id}`;
  else if (type === "kling-video") endpoint = `/tasks?task_ids=${id}`;
  else if (type === "kling-image") endpoint = `${p.submitPath}/${id}`;
  else if (type === "zhipu-video") endpoint = `/async-result/${id}`;
  else if (type === "tencent-video") { endpoint = "/"; body = { JobId: job.providerTaskId }; action = "DescribeHunyuanToVideoJob"; }
  else if (type.startsWith("fal")) endpoint = job.links?.status;
  else if (type === "replicate-image") endpoint = `/predictions/${id}`;
  else throw new Error("SYNCHRONOUS_SUBMISSION_UNKNOWN_NO_AUTOMATIC_RESUBMIT");
  if (!endpoint) throw new Error("PROVIDER_POLL_URL_MISSING");
  const data = await adapterRequest(p, credentials, endpoint, body ? "POST" : "GET", body, dependencies, action);
  const result = type === "kling-video" ? data.data?.find(item => item.id === job.providerTaskId) : data.output && typeof data.output === "object" && !Array.isArray(data.output) ? data.output : data.data || data.Response || data;
  if (!result) throw new Error("PROVIDER_TASK_RESULT_MISSING");
  const status = result.task_status || result.Status || result.status || data.task_status || data.status;
  if (["FAILED", "FAIL", "Fail", "failed", "CANCELLED", "CANCELED", "canceled"].includes(status)) return { status: "failed", error: "PROVIDER_TASK_FAILED" };
  if (!["Success", "SUCCEEDED", "DONE", "succeed", "SUCCESS", "COMPLETED", "succeeded"].includes(status)) return { status: "running", providerStatus: String(status || "unknown").slice(0, 40) };
  if (type === "minimax-video") {
    if (!/^\d+$/.test(String(data.file_id || ""))) throw new Error("PROVIDER_FILE_ID_MISSING");
    const file = await adapterRequest(p, credentials, `/files/retrieve?file_id=${data.file_id}`, "GET", undefined, dependencies);
    return generated([file.file?.download_url]);
  }
  if (type.startsWith("dashscope")) return generated(job.kind === "image" ? result.results?.map(i => i.url) : [result.video_url], data.usage);
  if (type === "kling-video") return generated(result.outputs?.filter(i => i.type === "video").map(i => i.url));
  if (type === "kling-image") return generated(result.task_result?.images?.map(i => i.url));
  if (type === "tencent-video") return generated([result.ResultVideoUrl]);
  if (type === "zhipu-video") return generated(data.video_result?.map(i => i.url));
  if (type.startsWith("fal")) {
    const output = await adapterRequest(p, credentials, job.links.response, "GET", undefined, dependencies);
    return generated(job.kind === "image" ? output.images?.map(i => i.url) : [output.video?.url], output.timings);
  }
  return generated(Array.isArray(data.output) ? data.output : [data.output], data.metrics);
}
