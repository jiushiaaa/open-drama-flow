import { randomUUID } from "node:crypto";
import { shutdownSignal } from "./background-jobs.mjs";
import { executionMode } from "./execution-policy.mjs";

// Fixed official endpoints: credentials never go to a user-supplied host or redirect.
export const SPEECH = Object.freeze({
  asr: Object.freeze({ endpoint: "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash", resourceId: "volc.bigasr.auc_turbo", model: "bigmodel" }),
  tts: Object.freeze({ endpoint: "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse", resourceId: "seed-tts-2.0", speaker: "zh_female_vv_uranus_bigtts", format: "mp3", sampleRate: 24000 })
});

export function speechCapabilities(configured, settings = {}) {
  return { configured, strategy: configured ? "seedance-plus-speech" : "seedance-native",
    asr: { available: configured, resourceId: SPEECH.asr.resourceId, maxSecondsPerApproval: 120 },
    tts: { available: configured, resourceId: SPEECH.tts.resourceId, speaker: SPEECH.tts.speaker, maxCharactersPerApproval: 500 },
    executionMode: executionMode(settings), requiresPaidApproval: executionMode(settings) === "manual", serviceEntitlementVerified: false,
    guidance: configured
      ? "Seedance 生成原生声音；需要对白核对时申请 ASR，需要旁白/补录时申请 TTS。保存 Key 不代表已开通服务；失败时报告原因，不自动改用另一项付费服务。"
      : "仅用 Seedance 原生声音；有声音意图的镜头显式设 audioMode=provider-native，无声镜头保留 none。不调用独立 ASR/TTS，不宣称完成自动对白核验。",
    voiceCloning: false, standaloneMusic: false };
}

function providerError(code, status = 0, logId = "") {
  const safeCode = /^\d+$/.test(String(code)) ? String(code) : "INVALID_RESPONSE";
  return Object.assign(new Error(`SPEECH_PROVIDER_ERROR_${safeCode}`), { providerCode: safeCode, httpStatus: status, logId: /^[\w-]{0,100}$/.test(logId) ? logId : "", definitive: status >= 400 && status < 500 || /^[24]\d{7}$/.test(safeCode) });
}

async function readBounded(response, limit) {
  let size = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("SPEECH_RESPONSE_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function runSpeechRequest(snapshot, { key, requestId = randomUUID(), audio, fetchImpl = fetch } = {}) {
  const profile = SPEECH[snapshot.mode];
  if (!profile || JSON.stringify(snapshot.profile) !== JSON.stringify(profile)) throw new Error("SPEECH_PROFILE_CHANGED");
  if (!key) throw new Error("SPEECH_KEY_NOT_CONFIGURED");
  let body;
  if (snapshot.mode === "asr") {
    if (!Buffer.isBuffer(audio) || !audio.length || audio.length > 4 * 1024 * 1024) throw new Error("SPEECH_AUDIO_INVALID");
    body = { user: { uid: "opendramaflow" }, audio: { data: audio.toString("base64") }, request: { model_name: profile.model, enable_itn: true, enable_punc: true, show_utterances: true } };
  } else {
    if (typeof snapshot.text !== "string" || !snapshot.text.trim() || snapshot.text.length > 500) throw new Error("SPEECH_TEXT_INVALID");
    body = { user: { uid: "opendramaflow" }, req_params: { text: snapshot.text, speaker: profile.speaker,
      audio_params: { format: profile.format, sample_rate: profile.sampleRate, speech_rate: 0 } } };
  }
  const response = await fetchImpl(profile.endpoint, { method: "POST", redirect: "error", signal: AbortSignal.any([shutdownSignal, AbortSignal.timeout(120000)]),
    headers: { "Content-Type": "application/json", "X-Api-Key": key, "X-Api-Resource-Id": profile.resourceId, "X-Api-Request-Id": requestId, ...(snapshot.mode === "asr" ? { "X-Api-Sequence": "-1" } : {}) }, body: JSON.stringify(body) });
  const rawLogId = response.headers.get("X-Tt-Logid") || "";
  const logId = /^[\w-]{0,100}$/.test(rawLogId) ? rawLogId : "";
  const statusCode = response.headers.get("X-Api-Status-Code");
  if (!response.ok || (statusCode && statusCode !== "20000000")) {
    await response.body?.cancel();
    throw providerError(statusCode || response.status, response.status, logId);
  }
  const raw = await readBounded(response, snapshot.mode === "tts" ? 20 * 1024 * 1024 : 2 * 1024 * 1024);
  if (snapshot.mode === "asr") {
    if (statusCode !== "20000000") throw providerError(statusCode, response.status, logId);
    const data = JSON.parse(raw);
    if (typeof data.result?.text !== "string") throw new Error("SPEECH_TRANSCRIPT_MISSING");
    const utterances = (data.result.utterances || []).map(item => ({ text: String(item.text || ""), startMs: Number(item.start_time), endMs: Number(item.end_time) }));
    return { text: data.result.text, utterances, logId, requestId, providerCode: statusCode };
  }
  const chunks = [];
  let completed = false;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const event = JSON.parse(line.slice(5).trim());
    if (![0, 20000000].includes(event.code)) throw providerError(event.code, response.status, logId);
    if (event.code === 20000000) completed = true;
    if (event.data) {
      if (typeof event.data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(event.data)) throw new Error("SPEECH_AUDIO_INVALID");
      chunks.push(Buffer.from(event.data, "base64"));
    }
  }
  if (!completed || !chunks.length) throw new Error("SPEECH_STREAM_INCOMPLETE");
  return { audio: Buffer.concat(chunks), logId, requestId, providerCode: "20000000" };
}
