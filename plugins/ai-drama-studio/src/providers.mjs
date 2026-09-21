import { z } from "zod";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { dataRoot, safeId } from "./config.mjs";
import { mutateState, readState } from "./store.mjs";
import { readProviderKey, readArkKey } from "./secrets.mjs";
import { agentHost } from "./platform.mjs";
import { freezeCallCost, numericUsage, falImageUsage } from "./cost-ledger.mjs";
import { shutdownSignal } from "./background-jobs.mjs";
import { inspectMediaFile } from "./media-inspection.mjs";
import { fileHash } from "./upscale.mjs";
import { PROFILES, CUSTOM_PROTOCOLS, SPEECH_PRICE_MODELS } from "./provider-presets.mjs";
import { configuredProfiles, configuredVendors, vendorCredentials } from "./provider-config.mjs";
import { adapterPayload, adapterCredentials, adapterSubmit, adapterPoll } from "./provider-adapters.mjs";
import { publicFetch } from "./provider-network.mjs";

export const PROVIDERS = PROFILES;
export const providerSettingsSchema = z.object({ video: z.string().max(100), fallbackImage: z.string().max(100), speech: z.string().max(100).default("speech") }).strict();
export function validateProviderSelection(state, input) {
  const selection = providerSettingsSchema.parse(input), profiles = configuredProfiles(state);
  for (const [key, kind] of [["video", "video"], ["fallbackImage", "image"], ["speech", "audio"]]) {
    if (!profiles.some(p => p.id === selection[key] && p.kind === kind)) throw new Error("PROVIDER_SELECTION_KIND_INVALID");
  }
  return selection;
}
export async function providerCatalog() {
  const state = await readState(), vendors = await Promise.all(configuredVendors(state).map(async v => ({ ...v, credentialStatus: await vendorCredentials(v) })));
  const keys = Object.fromEntries(vendors.map(v => [v.id, Object.values(v.credentialStatus).every(Boolean)]));
  return { selection: { video: "ark", fallbackImage: "ark-seedream", speech: "speech", ...state.settings.providerSelection }, host: agentHost.host, imagePrimary: agentHost.codexImageGen ? "codex-imagegen" : state.settings.providerSelection?.fallbackImage || "ark-seedream", speechPrimary: state.settings.providerSelection?.speech || "speech",
    vendors, customProtocols: CUSTOM_PROTOCOLS, speechPriceModels: SPEECH_PRICE_MODELS,
    providers: configuredProfiles(state).map(p => ({ ...p, credentialConfigured: keys[p.provider || p.id], verification: "configuration-is-not-account-entitlement-test" })),
    boundary: "Additional adapters support text only. They do not inherit Seedance reference/edit/audio capabilities. No credential fallback or automatic image route switching." };
}
export const providerRequestSchema = z.object({ projectId: z.string(), creationId: z.string().optional(), shotId: z.string().optional(),
  requestKey: z.string().regex(/^[\w.-]{1,100}$/), profile: z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/),
  prompt: z.string().trim().min(1).max(10000), aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  frames: z.number().int().min(17).max(161).default(81), resolution: z.enum(["480p", "580p", "720p", "768p", "1080p"]).optional(),
  duration: z.number().int().min(1).max(30).optional(), voiceId: z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/).optional(),
  maxCalls: z.literal(1), imageFallbackReason: z.enum(["user-explicit-request", "verified-host-unavailable"]).optional(),
  fallbackEvidence: z.string().trim().min(1).max(1000).optional()
}).strict();
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function scope(state, input) {
  const project = state.projects.find(p => p.id === input.projectId); if (!project) throw new Error("PROJECT_NOT_FOUND");
  const creation = input.creationId ? project.creations?.find(c => c.id === input.creationId) : null;
  if (input.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  const production = creation && creation.planSource !== "project-legacy" ? creation.plan || {} : project;
  const shot = input.shotId ? production.shots?.find(s => s.id === input.shotId) : null;
  if (input.shotId && !shot) throw new Error("SHOT_NOT_FOUND");
  return digest({ projectId: project.id, brief: production.brief, planRevision: production.planRevision, shot });
}
export function providerPayload(input, selectedProfile) {
  const request = providerRequestSchema.parse(input), profile = selectedProfile || PROVIDERS.find(p => p.id === request.profile);
  if (!profile || profile.protocol === "native") throw new Error("PROVIDER_PROFILE_USE_CATALOG_TOOL");
  if (profile.kind === "image" && (!request.imageFallbackReason || !request.fallbackEvidence)) throw new Error("HOST_IMAGE_PRIMARY_FALLBACK_EVIDENCE_REQUIRED");
  if (profile.kind !== "audio" && request.voiceId) throw new Error("PROVIDER_VOICE_NOT_SUPPORTED");
  if (profile.kind === "image" && (request.duration !== undefined || request.resolution !== undefined || request.frames !== 81)) throw new Error("PROVIDER_PARAMETER_UNSUPPORTED");
  if (!["ark-seedream", "fal-wan", "fal-flux", "replicate-flux"].includes(request.profile)) return adapterPayload(profile, request);
  if (request.profile === "ark-seedream") return { model: profile.model, prompt: request.prompt, size: { "16:9": "2560x1440", "9:16": "1440x2560", "1:1": "2048x2048" }[request.aspectRatio], response_format: "url", output_format: "png", watermark: false };
  if (request.duration !== undefined || (request.resolution && !["480p", "580p", "720p"].includes(request.resolution))) throw new Error("PROVIDER_PARAMETER_UNSUPPORTED");
  if (request.profile === "fal-wan") return { prompt: request.prompt, aspect_ratio: request.aspectRatio, num_frames: request.frames, resolution: request.resolution || "720p", frames_per_second: 16, enable_safety_checker: true };
  if (request.profile === "fal-flux") return { prompt: request.prompt, image_size: { "16:9": "landscape_16_9", "9:16": "portrait_16_9", "1:1": "square_hd" }[request.aspectRatio], num_images: 1, output_format: "png", enable_safety_checker: true };
  return { prompt: request.prompt, aspect_ratio: request.aspectRatio, num_outputs: 1, output_format: "png" };
}
export async function prepareProviderJob(input) {
  const request = providerRequestSchema.parse(input);
  return mutateState(state => {
    const profile = configuredProfiles(state).find(p => p.id === request.profile);
    if (!profile || profile.protocol === "native") throw new Error("PROVIDER_PROFILE_USE_CATALOG_TOOL");
    const vendor = configuredVendors(state).find(v => v.id === profile.provider);
    const connection = { provider: vendor.id, protocol: profile.protocol, baseUrl: profile.baseUrl || vendor.baseUrl, submitPath: profile.submitPath, credentials: vendor.credentials };
    const scopeDigest = scope(state, request), requestDigest = digest({ request, scopeDigest, connection });
    state.externalJobs ||= [];
    const old = state.externalJobs.find(j => j.projectId === request.projectId && j.requestKey === request.requestKey);
    if (old) {
      // Old jobs used a schema default of 720p and did not include connection in the digest.
      const legacyRequest = providerRequestSchema.parse({ ...request, resolution: request.resolution || "720p" });
      if (old.requestDigest !== requestDigest && (old.connection || digest({ request: legacyRequest, scopeDigest }) !== old.requestDigest)) throw new Error("PROVIDER_REQUEST_KEY_CONFLICT");
      return old;
    }
    const payload = providerPayload(request, profile);
    if (state.externalJobs.some(j => j.projectId === request.projectId && (j.creationId || null) === (request.creationId || null)
      && (j.shotId || null) === (request.shotId || null) && j.kind === profile.kind
      && ["submitting", "submission-unknown", "submitted", "running"].includes(j.status))) throw new Error("PROVIDER_UNRESOLVED_SCOPE_RECONCILE_ORIGINAL_TASK");
    const job = { id: safeId("provider"), ...request, provider: profile.provider, model: profile.model, kind: profile.kind, payload, connection, scopeDigest, requestDigest,
      executionMode: state.settings.executionMode || "automatic", status: "prepared", createdAt: new Date().toISOString(), acceptance: "pending-no-library-import" };
    state.externalJobs.push(job); return job;
  });
}
export async function getProviderJob(id) { const job = (await readState()).externalJobs?.find(j => j.id === id); if (!job) throw new Error("PROVIDER_JOB_NOT_FOUND"); return job; }
async function updateJob(id, patch) {
  return mutateState(state => {
    const job = state.externalJobs?.find(j => j.id === id); if (!job) throw new Error("PROVIDER_JOB_NOT_FOUND");
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    const call = state.providerCalls.find(c => c.id === job.callId);
    if (call) Object.assign(call, { status: job.status, providerTaskId: job.providerTaskId, usage: numericUsage(job.usage), updatedAt: job.updatedAt });
    return job;
  });
}
async function requestJson(url, provider, key, method = "GET", body, fetcher = fetch) {
  const parsed = new URL(url), host = provider === "ark" ? "ark.cn-beijing.volces.com" : provider === "fal" ? "queue.fal.run" : "api.replicate.com";
  if (parsed.protocol !== "https:" || parsed.host !== host || parsed.username || parsed.password) throw new Error("PROVIDER_URL_REJECTED");
  const response = await fetcher(parsed, { method, headers: { Authorization: `${provider === "fal" ? "Key" : "Bearer"} ${key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), redirect: "error", signal: AbortSignal.any([shutdownSignal, AbortSignal.timeout(60000)]) });
  if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`);
  return response.json();
}
export async function submitProviderJob(id, trustedManual = false, dependencies = {}) {
  const initial = await getProviderJob(id), extended = initial.connection && !["ark", "fal", "replicate"].includes(initial.provider);
  const key = extended ? await adapterCredentials(initial.connection, dependencies) : await (dependencies.readKey || (provider => provider === "ark" ? readArkKey() : readProviderKey(provider)))(initial.provider);
  const job = await mutateState(state => {
    const job = state.externalJobs.find(j => j.id === id);
    if (job.status !== "prepared") throw new Error("PROVIDER_ALREADY_SUBMITTED_RECONCILE_ORIGINAL_TASK");
    if (scope(state, job) !== job.scopeDigest) throw new Error("PROVIDER_SCOPE_CHANGED");
    if ((state.settings.executionMode || "automatic") !== job.executionMode) throw new Error("EXECUTION_MODE_CHANGED_PREPARE_NEW_SCOPE");
    if (job.executionMode === "manual" && !trustedManual) throw new Error("APPROVAL_REQUIRED");
    if (state.externalJobs.some(j => j.id !== id && j.projectId === job.projectId && (j.creationId || null) === (job.creationId || null)
      && (j.shotId || null) === (job.shotId || null) && j.kind === job.kind
      && ["submitting", "submission-unknown", "submitted", "running"].includes(j.status))) throw new Error("PROVIDER_UNRESOLVED_SCOPE_RECONCILE_ORIGINAL_TASK");
    const call = { id: safeId("call"), projectId: job.projectId, creationId: job.creationId, shotId: job.shotId, provider: job.provider,
      model: job.model, profile: job.profile, kind: `${job.provider}-${job.kind}`, pricingContext: { resolution: job.payload.resolution }, requestDigest: job.requestDigest, status: "submitting", createdAt: new Date().toISOString() };
    const seconds = job.payload.duration || job.payload.parameters?.duration || job.payload.settings?.duration || (job.profile === "fal-wan" || job.connection?.protocol === "fal-video" ? job.frames / 16 : undefined);
    const characters = [...job.prompt].reduce((n, c) => n + (job.connection?.protocol === "minimax-tts" && /\p{Script=Han}/u.test(c) ? 2 : 1), 0);
    freezeCallCost(state, call, job.kind === "video" ? { second: seconds === undefined ? undefined : Number(seconds) } : job.kind === "audio" ? { character: characters } : { image: 1 });
    state.providerCalls.push(call);
    Object.assign(job, { status: "submitting", callId: call.id, authorization: trustedManual ? "mcp-elicitation" : "automatic-policy" }); return structuredClone(job);
  });
  try {
    if (extended) return updateJob(id, await adapterSubmit(job, key, dependencies));
    if (job.provider === "ark") {
      const response = await requestJson("https://ark.cn-beijing.volces.com/api/v3/images/generations", "ark", key, "POST", job.payload, dependencies.fetcher);
      const url = response.data?.[0]?.url;
      if (typeof url !== "string") throw new Error("SEEDREAM_OUTPUT_MISSING");
      // Synchronous generation has no pollable task ID. Persist the result before download.
      return updateJob(id, { status: "generated", outputUrls: [url], usage: numericUsage(response.usage), providerRequestId: response.request_id || null, acceptance: "pending-no-library-import" });
    }
    const url = job.provider === "fal" ? `https://queue.fal.run/${job.model}` : `https://api.replicate.com/v1/models/${job.model}/predictions`;
    const response = await requestJson(url, job.provider, key, "POST", job.provider === "fal" ? job.payload : { input: job.payload }, dependencies.fetcher);
    const taskId = response.request_id || response.id;
    if (!/^[a-zA-Z0-9_-]{1,150}$/.test(taskId || "")) throw new Error("PROVIDER_TASK_ID_MISSING");
    // Save task ID before any polling or media download. Never automatically POST again.
    return updateJob(id, { providerTaskId: taskId, status: "submitted", links: job.provider === "fal" ? { status: response.status_url, response: response.response_url, cancel: response.cancel_url } : null });
  } catch (error) { await updateJob(id, { status: "submission-unknown", error: String(error.message).slice(0, 160) }); throw error; }
}
export async function reconcileProviderJob(id, dependencies = {}) {
  const job = await getProviderJob(id);
  if (["generated", "downloaded", "failed", "canceled"].includes(job.status)) return job;
  if (job.connection && !["ark", "fal", "replicate"].includes(job.provider)) {
    if (!job.providerTaskId) throw new Error("PROVIDER_ORIGINAL_TASK_ID_REQUIRED_NO_RESUBMIT");
    return updateJob(id, await adapterPoll(job, await adapterCredentials(job.connection, dependencies), dependencies));
  }
  if (job.provider === "ark") {
    if (["generated", "downloaded"].includes(job.status)) return job;
    throw new Error("SYNCHRONOUS_SUBMISSION_UNKNOWN_NO_AUTOMATIC_RESUBMIT");
  }
  if (!job.providerTaskId) throw new Error("PROVIDER_ORIGINAL_TASK_ID_REQUIRED_NO_RESUBMIT");
  const key = await (dependencies.readKey || readProviderKey)(job.provider);
  const url = job.provider === "fal" ? job.links?.status : `https://api.replicate.com/v1/predictions/${job.providerTaskId}`;
  const response = await requestJson(url, job.provider, key, "GET", undefined, dependencies.fetcher);
  if (response.error || ["failed", "canceled"].includes(response.status)) return updateJob(id, { status: response.status === "canceled" ? "canceled" : "failed", error: "PROVIDER_TASK_FAILED" });
  if (!["COMPLETED", "succeeded"].includes(response.status)) return updateJob(id, { status: "running", providerStatus: response.status });
  const output = job.provider === "fal" ? await requestJson(job.links.response, job.provider, key, "GET", undefined, dependencies.fetcher) : response;
  if (output.error) return updateJob(id, { status: "failed", error: "PROVIDER_OUTPUT_FAILED" });
  const urls = job.provider === "fal" ? (job.kind === "image" ? output.images?.map(i => i.url) : [output.video?.url]) : (Array.isArray(output.output) ? output.output : [output.output]);
  if (!urls?.length || urls.some(u => typeof u !== "string")) throw new Error("PROVIDER_OUTPUT_MISSING");
  return updateJob(id, { status: "generated", outputUrls: urls.slice(0, 1), usage: job.provider === "fal" && job.kind === "image" ? falImageUsage(output) : numericUsage(response.metrics || output.timings), acceptance: "pending-no-library-import" });
}
export async function downloadProviderOutput(id) {
  const job = await getProviderJob(id); if (!["generated", "downloaded"].includes(job.status)) throw new Error("PROVIDER_OUTPUT_NOT_READY");
  if (job.outputPath && await fileHash(job.outputPath).catch(() => "") === job.outputSha256) return job;
  const url = new URL(job.outputUrls[0]);
  const allowed = job.provider === "ark" ? ["volces.com", "volccdn.com"] : job.provider === "fal" ? ["fal.media", "fal.run"] : ["replicate.delivery"];
  const extended = job.connection && !["ark", "fal", "replicate"].includes(job.provider);
  if (!extended && (url.protocol !== "https:" || url.username || url.password || url.port || !allowed.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`)))) throw new Error("PROVIDER_MEDIA_HOST_UNSUPPORTED");
  const response = await (extended ? publicFetch : fetch)(url, { redirect: "error", signal: AbortSignal.any([shutdownSignal, AbortSignal.timeout(300000)]) });
  if (!response.ok) throw new Error(`PROVIDER_DOWNLOAD_${response.status}`);
  const dir = path.join(dataRoot, "provider-candidates", job.id); await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `candidate.${job.kind === "video" ? "mp4" : job.kind === "audio" ? "mp3" : "png"}`), partial = `${file}.${safeId("download")}.partial`;
  const handle = await fs.open(partial, "wx"); let size = 0;
  try { for await (const chunk of response.body) { size += chunk.length; if (size > 512 * 1024 ** 2) throw new Error("PROVIDER_OUTPUT_TOO_LARGE"); await handle.write(chunk); } }
  catch (error) { await handle.close(); await fs.rm(partial, { force: true }); throw error; }
  await handle.close(); let media;
  try { media = await inspectMediaFile(partial); if (job.kind === "audio" ? !media.audio || media.video : !media.video) throw new Error("PROVIDER_OUTPUT_MEDIA_INVALID"); await fs.rename(partial, file); }
  catch (error) { await fs.rm(partial, { force: true }); throw error; }
  return updateJob(id, { status: "downloaded", outputPath: file, outputSha256: await fileHash(file), media, acceptance: "pending-no-library-import" });
}
