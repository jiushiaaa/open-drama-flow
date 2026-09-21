import { spawn } from "node:child_process";
import { agentHost } from "./platform.mjs";
import { getSeedanceCapabilityProfile } from "./production-harness.mjs";
import { SPEECH } from "./speech.mjs";
import { callModel } from "./cost-ledger.mjs";
import { knowledgeForTool, knowledgeIndex } from "./production-knowledge.mjs";

function probe(command, args) {
  return new Promise(resolve => {
    let stdout = "";
    const child = spawn(command, args, { windowsHide: true, timeout: 5000, stdio: ["ignore", "pipe", "ignore"] });
    child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-200000); });
    child.once("error", () => resolve(null));
    child.once("close", code => resolve(code === 0 ? stdout : null));
  });
}

export async function probeLocalTools() {
  const [ffmpeg, ffprobe, filters] = await Promise.all([probe("ffmpeg", ["-version"]), probe("ffprobe", ["-version"]), probe("ffmpeg", ["-hide_banner", "-filters"])]);
  return { ffmpeg: ffmpeg !== null, ffprobe: ffprobe !== null,
    filters: Object.fromEntries(["afftdn", "loudnorm", "subtitles", "amix", "silencedetect", "blackdetect", "freezedetect"].map(name => [name, new RegExp(`\\s${name}\\s`).test(filters || "")])),
    versions: { ffmpeg: ffmpeg?.split(/\r?\n/)[0] || null, ffprobe: ffprobe?.split(/\r?\n/)[0] || null } };
}

export async function getToolCatalog(state, credentials = {}, { probeDependencies = probeLocalTools } = {}) {
  const dependencies = await probeDependencies();
  const local = (id, operation, inputs, outputs, filters, limits) => ({
    id, category: "local-postproduction", tool: id.split("/")[0], operation,
    inputs, outputs, provider: "local-ffmpeg", model: null, adapterImplemented: true,
    readiness: dependencies.ffmpeg && dependencies.ffprobe && filters.every(name => dependencies.filters[name]) ? "dependency-ready" : "dependency-missing",
    credentialConfigured: null, dependencies: ["ffmpeg", "ffprobe", ...filters.map(name => `filter:${name}`)],
    execution: "explicit-local-plan", cost: "no-provider-fee; hardware/electricity-untracked",
    limits, recovery: "Preserve sources and failed outputs; rerun in a NEW output directory. No paid generation.",
    acceptance: "technical evidence only; listening/viewing and asset admission remain separate"
  });
  const remote = (id, kind, model, configured, inputs, outputs, limits) => {
    const evidence = (state.providerCalls || []).filter(call => call.kind === kind && callModel(call) === model && (call.status === "succeeded" || call.providerStatus === "succeeded"))
      .sort((a, b) => String(b.updatedAt || b.finishedAt || b.at || "").localeCompare(String(a.updatedAt || a.finishedAt || a.at || "")))[0];
    return { id, category: "generation", tool: kind === "seedance-video" || kind === "seedream-image" ? "drama_request_paid_batch" : "drama_request_speech_job",
      provider: kind.startsWith("seed") ? "volcengine-ark" : "doubao-speech", model, adapterImplemented: true,
      inputs, outputs, readiness: configured ? "credential-configured-not-entitlement-verified" : "credential-missing", credentialConfigured: Boolean(configured),
      dependencies: [], execution: state.settings.executionMode || "automatic", limits,
      historicalProviderSuccess: evidence ? { callId: evidence.id, at: evidence.updatedAt || evidence.finishedAt || evidence.at, currentEntitlementVerified: false } : null,
      cost: "paid; explicit price estimate and provider-bill reconciliation", recovery: "Original task ID only after uncertain submission; never auto-resubmit to fix postprocessing.",
      acceptance: "Generation success is not production acceptance or approved memory." };
  };
  const video = getSeedanceCapabilityProfile(state.settings);
  const entries = [
    { id: "codex-imagegen", category: "generation", tool: "Codex host image tool", provider: "codex-host", model: "host-managed", adapterImplemented: true,
      inputs: ["text", "image-reference"], outputs: ["image-candidate"], readiness: agentHost.codexImageGen ? "host-session-dependent" : "unavailable-in-this-host", credentialConfigured: null, dependencies: ["host-image-tool"],
      execution: "default-image-route", cost: "host-managed-untracked", limits: "Discover the actual host tool; never infer a model version from its nickname.",
      recovery: "Project image model only on explicit request or verified host failure/unavailability.", acceptance: "User accepts exact candidates before import unless exact-scope review delegation exists." },
    remote("seedance-video", "seedance-video", state.settings.seedanceModel, credentials.arkConfigured, video.acceptedInputs, ["video", "last-frame"], video),
    { ...remote("seedream-image", "seedream-image", state.settings.seedreamModel, credentials.arkConfigured, ["text"], ["image-candidate"], "Text only; drama_prepare_provider_job stages candidates without import."), tool: "drama_prepare_provider_job", fallbackOnly: agentHost.codexImageGen },
    remote("speech-asr", "asr", SPEECH.asr.resourceId, credentials.speechConfigured, ["version-bound-audio/video-segment"], ["transcript"], { maxSeconds: 120, maxCallsPerJob: 1 }),
    remote("speech-tts", "tts", SPEECH.tts.resourceId, credentials.speechConfigured, ["text", "stock-speaker", "performance-context"], ["audio"], { maxCharacters: 500, voiceCloning: false, maxCallsPerJob: 1 }),
    remote("speech-music", "music", SPEECH.music.model, credentials.speechConfigured, ["prompt/lyrics"], ["audio"], { maxCharacters: 500, maxCallsPerJob: 1 }),
    local("drama_edit_local_media", "edit", ["hash-bound-edit-plan", "accepted-media"], ["video", "seam-evidence"], ["subtitles"], "CFR frame cuts; optional bilingual captions; validateOnly available."),
    local("drama_process_local_audio/measure", "measure", ["audio/video", "interval"], ["LUFS/true-peak"], ["loudnorm"], "Read-only first audio stream measurement."),
    local("drama_process_local_audio/normalize", "normalize", ["hash-bound-audio/video"], ["WAV", "before/after-LUFS"], ["loudnorm"], "Two-pass; mono/stereo <=2h; no trimming; no automatic mixback."),
    local("drama_process_local_audio/denoise", "denoise", ["hash-bound-audio/video"], ["WAV", "measurement"], ["afftdn", "loudnorm"], "Explicit 0.01–20dB spectral reduction; not source separation; mono/stereo <=2h."),
    local("drama_process_local_audio/mix", "mix", ["native-video", "music/SFX", "reviewed-dialogue-intervals"], ["video-stream-copy", "mixed-audio"], ["amix", "loudnorm"], "No video re-encode. Duck only music with reviewed intervals."),
    local("drama_process_local_audio/extract", "extract", ["approved-audio", "sample-range"], ["WAV"], [], "Sample-exact excerpt; acceptance reference required."),
    local("drama_process_local_audio/derive", "derive", ["approved-audio", "provider-format-contract"], ["WAV"], [], "Explicit rate/channel/duration/size limits; no padding."),
    local("drama_prepare_audio_event_evidence", "review", ["hash-bound-contact/sound-markers"], ["AV-preview", "waveform", "frames"], [], "Reviewed frame markers, not inferred sound events."),
    local("drama_inspect_asset", "inspect", ["assetId"], ["media-evidence"], [], "Does not approve media."),
    local("drama_prepare_reference_asset", "derive-reference", ["assetId", "range/format"], ["version-bound-reference"], [], "Creates a separate derivative; generation compatibility still requires media inspection."),
    local("drama_prepare_quality_evidence", "quality-evidence", ["projectId", "creationId"], ["frames", "playback/audio-evidence", "signal-scan"], ["silencedetect", "blackdetect", "freezedetect"], "Signal thresholds are not motion, identity or dialogue acceptance."),
    local("drama_render_project", "render", ["approved-shots", "timeline"], ["candidate-video"], ["subtitles"], "Existing project render gates apply; not automatic final delivery approval."),
    { id: "drama_compare_local_edits", category: "local-postproduction", tool: "drama_compare_local_edits", inputs: ["previous/next-edit-plan", "optional-derivatives"], outputs: ["reuse-plan"], adapterImplemented: true, readiness: "dependency-ready", dependencies: [], cost: "no-provider-fee", limits: "Hash/range comparison only; does not run super-resolution." },
    { id: "real-esrgan-upscale", tool: "drama_create_upscale_job", category: "local-postproduction", adapterImplemented: true, readiness: state.settings.upscaleRuntime ? "runtime-configured-not-inference-verified" : "runtime-missing", inputs: ["hash-bound-CFR-video"], outputs: ["upscaled-video", "chunk-hashes"], dependencies: ["Real-ESRGAN NCNN runtime", "weights", "GPU/storage", "ffmpeg", "ffprobe"], cost: "no-provider-fee-local-compute-untracked", recovery: "drama_start_upscale_job reuses verified chunks; pause/get tools persist progress", limits: "<=2h CFR, >1x <=4x, long edge <=3840; copies audio and verifies decoded audio hashes; visual review pending." },
    { id: "external-text-generation", tool: "drama_prepare_provider_job", category: "generation", adapterImplemented: true, readiness: "consult-drama_list_providers", inputs: ["text"], outputs: ["image/video/audio-candidate"], limits: "Use live provider/model catalog for protocols and fixed specifications. One frozen call per job, no advanced references, no automatic admission; Codex image priority remains. Saved credentials/mock tests are not live entitlement." },
    { id: "shot-asset-search", tool: "drama_search_shot_assets", category: "retrieval", adapterImplemented: true, readiness: "dependency-ready", inputs: ["project/creation/shot", "query"], outputs: ["ranked-version-bound-assets"], limits: "Metadata and bindings, not semantic visual embeddings; validates returned file hashes." },
    { id: "production-workflow", tool: "drama_select_production_workflow", category: "planning", adapterImplemented: true, readiness: "dependency-ready", inputs: ["production-type"], outputs: ["stage-contracts", "enabled-specialists"], limits: "Read-only contracts; checkpoint and decision tools record evidence, never authorize generation." }
  ];
  return { version: 1, checkedAt: new Date().toISOString(), dependencies,
    externalTools: { videoDepthAnything: { configuration: state.settings.videoDepthRuntime || null, execution: "agent-operated-external-tool", adapterImplemented: false, verification: "Configured paths are checked on save; Python dependencies, weights compatibility and inference must be verified by the Agent before use." } },
    entries: entries.map(entry => ({ ...entry, knowledgeRefs: knowledgeForTool(entry.id) })), knowledge: knowledgeIndex(),
    policy: "Catalog is descriptive, not a router or permission grant. Explicit model choice, frozen budgets, approval policy and image-acceptance gates override convenience. Dependency readiness is not a tested task or quality guarantee." };
}
