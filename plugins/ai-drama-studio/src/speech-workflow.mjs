import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { assertInside, dataRoot, safeId } from "./config.mjs";
import { readState, mutateState, appendEvent } from "./store.mjs";
import { readSpeechKey, hasSpeechKey } from "./secrets.mjs";
import { inspectMediaFile, mediaCommand } from "./media-inspection.mjs";
import { importLocalAsset } from "./workflow.mjs";
import { SPEECH, runSpeechRequest } from "./speech.mjs";
import { launchBackground } from "./background-jobs.mjs";
import { executionMode, confirmationOutcome } from "./execution-policy.mjs";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const digest = snapshot => hash(JSON.stringify(snapshot));
const jobDirectory = id => assertInside(path.join(dataRoot, "speech"), path.join(dataRoot, "speech", id));
const now = () => new Date().toISOString();

function scope(state, projectId, creationId) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  if (creationId && !project.creations.some(item => item.id === creationId)) throw new Error("CREATION_NOT_FOUND");
  return project;
}

export async function getSpeechJob(jobId) {
  const job = (await readState()).speechJobs?.find(item => item.id === jobId);
  if (!job) throw new Error("SPEECH_JOB_NOT_FOUND");
  if (job.status === "running" && job.ownerPid) {
    try { process.kill(job.ownerPid, 0); }
    catch (error) {
      if (error.code === "ESRCH") return mutateState(state => {
        const target = state.speechJobs.find(item => item.id === jobId);
        if (target.status === "running") {
          target.status = "uncertain";
          target.error = { code: "SPEECH_OWNER_EXITED", logId: "" };
          const call = state.providerCalls.find(item => item.id === target.requestId);
          if (call) call.status = "uncertain";
        }
        return target;
      });
    }
  }
  return job;
}

async function verifySnapshot(job, state) {
  if (digest(job.snapshot) !== job.requestDigest) throw new Error("SPEECH_SNAPSHOT_CHANGED");
  const snapshot = job.snapshot;
  if ((snapshot.executionMode || "manual") !== executionMode(state.settings)) throw new Error("SPEECH_EXECUTION_MODE_CHANGED");
  const project = scope(state, snapshot.projectId, snapshot.creationId);
  if (JSON.stringify(snapshot.profile) !== JSON.stringify(SPEECH[snapshot.mode])) throw new Error("SPEECH_PROFILE_CHANGED");
  if (snapshot.mode === "asr") {
    const asset = project.assets.find(item => item.id === snapshot.source.assetId && !item.stale);
    if (!asset || asset.version !== snapshot.source.version || asset.sha256 !== snapshot.source.sha256
      || hash(await fs.readFile(asset.localPath)) !== snapshot.source.sha256) throw new Error("SPEECH_SOURCE_CHANGED");
    const audio = await fs.readFile(path.join(jobDirectory(job.id), "input.wav"));
    if (hash(audio) !== snapshot.audio.sha256) throw new Error("SPEECH_INPUT_CHANGED");
    return audio;
  }
  return null;
}

export async function requestSpeechJob(input, deps = {}) {
  if (!(await (deps.hasKey || hasSpeechKey)())) throw new Error("SPEECH_KEY_NOT_CONFIGURED");
  if (!SPEECH[input.mode]) throw new Error("SPEECH_MODE_INVALID");
  const currentState = await readState();
  const project = scope(currentState, input.projectId, input.creationId);
  const id = safeId("speech");
  const snapshot = { projectId: project.id, creationId: input.creationId || null, executionMode: executionMode(currentState.settings), mode: input.mode, profile: SPEECH[input.mode], maxCalls: 1 };
  if (input.mode === "tts") {
    if (typeof input.text !== "string" || !input.text.trim() || input.text.trim().length > 500) throw new Error("SPEECH_TEXT_INVALID");
    snapshot.text = input.text.trim();
  } else {
    const asset = project.assets.find(item => item.id === input.assetId && !item.stale && ["video", "audio"].includes(item.kind));
    if (!asset?.sha256) throw new Error("SPEECH_SOURCE_REQUIRED");
    if (hash(await fs.readFile(asset.localPath)) !== asset.sha256) throw new Error("SPEECH_SOURCE_CHANGED");
    const media = await (deps.inspect || inspectMediaFile)(asset.localPath);
    if (!media.audio) throw new Error("SPEECH_SOURCE_HAS_NO_AUDIO");
    const start = input.startSeconds ?? 0;
    const duration = input.durationSeconds ?? Math.min(5, media.duration - start);
    if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration < 0.2 || duration > 120 || start + duration > media.duration + 0.05) throw new Error("SPEECH_RANGE_INVALID");
    const directory = jobDirectory(id);
    await fs.mkdir(directory, { recursive: true });
    const destination = path.join(directory, "input.wav");
    await (deps.convert || mediaCommand)("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", asset.localPath, "-ss", String(start), "-t", String(duration), "-map", "0:a:0", "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", destination]);
    const audio = await fs.readFile(destination);
    if (!audio.length || audio.length > 4 * 1024 * 1024) throw new Error("SPEECH_AUDIO_INVALID");
    snapshot.source = { assetId: asset.id, version: asset.version, sha256: asset.sha256, name: asset.originalName || asset.id };
    snapshot.audio = { sha256: hash(audio), bytes: audio.length, startSeconds: start, durationSeconds: duration, format: "wav", sampleRate: 16000, channels: 1 };
    if (input.expectedText) snapshot.expectedText = String(input.expectedText).slice(0, 8000);
  }
  const job = { id, projectId: project.id, creationId: snapshot.creationId, status: "pending", attempts: 0, snapshot, requestDigest: digest(snapshot), createdAt: now() };
  return mutateState(state => {
    scope(state, project.id, snapshot.creationId);
    state.speechJobs ||= [];
    state.speechJobs.push(job);
    appendEvent(state, "speech.approval_requested", snapshot.executionMode === "automatic" ? "语音调用范围已冻结，等待自动执行" : "语音任务等待本人审批，尚未调用模型", { projectId: project.id, jobId: id, mode: snapshot.mode });
    return job;
  });
}

// Only the MCP handler supplies elicit. There is deliberately no HTTP run/approve route.
export async function authorizeSpeechJob(jobId, elicit, deps = {}) {
  const job = await getSpeechJob(jobId);
  if (job.status !== "pending" || job.attempts !== 0) throw new Error("SPEECH_JOB_NOT_PENDING");
  await verifySnapshot(job, await readState());
  const { snapshot } = job;
  const automatic = snapshot.executionMode === "automatic";
  const detail = snapshot.mode === "asr"
    ? `ASR：将素材「${snapshot.source.name}」v${snapshot.source.version} 的 ${snapshot.audio.startSeconds}–${snapshot.audio.startSeconds + snapshot.audio.durationSeconds} 秒音频发送给豆包语音识别；${snapshot.audio.bytes} 字节；输入 SHA-256 ${snapshot.audio.sha256}`
    : `TTS：使用官方预置音色 ${snapshot.profile.speaker}，生成 ${snapshot.text.length} 字旁白（非声音克隆）。全文：\n${snapshot.text}`;
  let answer;
  if (!automatic) try {
    answer = await elicit({ mode: "form", message: `${detail}\n服务：${snapshot.profile.resourceId}；最多 1 次付费请求（失败也占用本次额度，无自动重试）；按账号服务价格计费，此处不承诺免费。请求摘要：${job.requestDigest}。生成/识别成功不等于声音审核通过。`,
      requestedSchema: { type: "object", properties: { confirm: { type: "boolean", title: "批准本次语音调用", default: false } }, required: ["confirm"] } });
  } catch { throw new Error("USER_CONFIRMATION_UNAVAILABLE"); }
  if (!automatic) {
    const confirmation = confirmationOutcome(answer);
    await mutateState(state => {
      const target = state.speechJobs.find(item => item.id === jobId);
      if (target.status === "pending") {
        target.lastConfirmation = confirmation;
        if (confirmation.action === "decline") target.status = "rejected";
      }
    });
    if (!confirmation.confirmed) return getSpeechJob(jobId);
  }
  const key = await (deps.readKey || readSpeechKey)();
  const requestId = randomUUID();
  const audio = await mutateState(async state => {
    const target = state.speechJobs.find(item => item.id === jobId);
    if (target.status !== "pending" || target.attempts !== 0 || target.requestDigest !== job.requestDigest) throw new Error("SPEECH_JOB_NOT_PENDING");
    const bytes = await verifySnapshot(target, state);
    target.status = "running";
    target.ownerPid = process.pid;
    target.attempts = 1;
    target.requestId = requestId;
    target.startedAt = now();
    target.approval = { method: automatic ? "automatic-policy" : "mcp-elicitation", action: automatic ? "start" : "accept", at: now(), requestDigest: target.requestDigest };
    state.providerCalls.push({ id: requestId, jobId, projectId: job.projectId, provider: "doubao-speech", kind: snapshot.mode, status: "submitted", requestDigest: job.requestDigest, at: now() });
    return bytes;
  });
  const execute = async () => {
  let providerSucceeded = false;
  try {
    const output = await (deps.run || runSpeechRequest)(snapshot, { key, requestId, audio });
    providerSucceeded = true;
    const directory = jobDirectory(jobId);
    await fs.mkdir(directory, { recursive: true });
    const outputPath = path.join(directory, snapshot.mode === "tts" ? "speech.mp3" : "transcript.json");
    const normalize = value => String(value || "").normalize("NFKC").replace(/[\p{P}\p{Z}\s]/gu, "").toLowerCase();
    const transcript = snapshot.mode === "asr" ? { text: output.text, utterances: output.utterances, source: snapshot.source, range: snapshot.audio,
      expectedText: snapshot.expectedText || null, exactTextMatch: snapshot.expectedText ? normalize(snapshot.expectedText) === normalize(output.text) : null,
      reviewStatus: "unreviewed", boundary: "ASR may misrecognize; compare against the actual audio. No automatic quality pass or production memory approval." } : null;
    await fs.writeFile(outputPath, transcript ? JSON.stringify(transcript, null, 2) : output.audio, { flag: "wx" });
    const media = snapshot.mode === "tts" ? await (deps.inspect || inspectMediaFile)(outputPath) : null;
    if (media && (!media.audio || media.duration <= 0)) throw new Error("SPEECH_OUTPUT_INVALID");
    const asset = await importLocalAsset(job.projectId, outputPath, { creationId: snapshot.creationId, name: snapshot.mode === "tts" ? "豆包旁白.mp3" : "对白识别.json" });
    await mutateState(state => {
      const target = state.speechJobs.find(item => item.id === jobId);
      const saved = scope(state, job.projectId, snapshot.creationId).assets.find(item => item.id === asset.id);
      saved.provider = "doubao-speech";
      saved.speechJobId = jobId;
      saved.sourceBinding = snapshot.source || null;
      saved.requestDigest = job.requestDigest;
      target.status = "succeeded";
      target.finishedAt = now();
      target.result = { assetId: asset.id, version: asset.version, sha256: asset.sha256, localPath: asset.localPath, media, transcript, reviewStatus: "unreviewed", logId: output.logId, providerCode: output.providerCode };
      const call = state.providerCalls.find(item => item.id === requestId);
      if (call) Object.assign(call, { status: "succeeded", logId: output.logId, finishedAt: now(), outputAssetId: asset.id });
      appendEvent(state, "speech.completed", "语音结果已入素材库，等待内容核验", { projectId: job.projectId, jobId, assetId: asset.id });
    });
  } catch (error) {
    // Never persist provider bodies, headers or arbitrary exception messages containing credentials.
    await mutateState(state => {
      const target = state.speechJobs.find(item => item.id === jobId);
      target.status = providerSucceeded ? "output-recovery-required" : error.definitive ? "failed" : "uncertain";
      target.finishedAt = now();
      if (providerSucceeded) target.recoveryDirectory = jobDirectory(jobId);
      target.error = { code: /^SPEECH_[A-Z0-9_]+$/.test(error.message) ? error.message : "SPEECH_CALL_UNCERTAIN", providerCode: error.providerCode || null, httpStatus: error.httpStatus || null, logId: error.logId || "" };
      const call = state.providerCalls.find(item => item.id === requestId);
      if (call) Object.assign(call, { status: target.status, error: target.error });
    });
  }
  };
  if (deps.background) launchBackground(execute);
  else await execute();
  return getSpeechJob(jobId);
}
