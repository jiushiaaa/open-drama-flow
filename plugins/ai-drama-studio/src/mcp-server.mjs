#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { agentHost } from "./platform.mjs";
import { renderLocalEdit } from "./local-edit.mjs";
import { processLocalAudio } from "./local-audio.mjs";
import { prepareAudioEventEvidence } from "./audio-event-evidence.mjs";
import { compareLocalEdits } from "./local-edit-reuse.mjs";
import { getToolCatalog } from "./tool-catalog.mjs";
import { configureUpscale, upscaleRuntimeSchema, upscaleRequestSchema, createUpscale, getUpscale, startUpscale, pauseUpscale } from "./upscale.mjs";
import { providerCatalog, providerRequestSchema, prepareProviderJob, getProviderJob, submitProviderJob, reconcileProviderJob, downloadProviderOutput } from "./providers.mjs";
import { assetSearchSchema, searchShotAssets, selectWorkflow, WORKFLOWS } from "./production-discovery.mjs";
import { productionScopeSchema, stageCheckpointSchema, productionDecisionSchema, getProductionProgress, recordStageCheckpoint, recordProductionDecision } from "./production-journal.mjs";
import { knowledgeIndex, readProductionKnowledge } from "./production-knowledge.mjs";
import { syncBilling } from "./billing-sync.mjs";
import { costReport, setPriceRule, recordSettlement, priceRuleSchema, settlementSchema } from "./cost-ledger.mjs";
import { VIDEO_INPUT_MODES, MEDIA_ROLES } from "./seedance-contract.mjs";
import { drainBackgroundJobs, backgroundJobStatus, stopBackgroundJobs } from "./background-jobs.mjs";
import { hasArkKey, hasSpeechKey } from "./secrets.mjs";
import { speechCapabilities } from "./speech.mjs";
import { requestSpeechJob, authorizeSpeechJob, getSpeechJob } from "./speech-workflow.mjs";
import { listSkills, routeSkills } from "./skill-router.mjs";
import { createManagedSkill, setManagedSkillEnabled } from "./skill-registry.mjs";
import { readState, mutateState, appendEvent } from "./store.mjs";
import { executionMode, confirmationOutcome } from "./execution-policy.mjs";
import { startHttpServer } from "./http-server.mjs";
import { closeAssetBridge, getAssetBridgeStatus } from "./asset-bridge.mjs";
import { buildProductionStatus, getSeedanceCapabilityProfile } from "./production-harness.mjs";
import { importLocalAsset, inspectAsset, prepareReferenceAsset, createAssetFolder, searchProjectMemory, readMemorySource, extractMemoryCandidates } from "./workflow.mjs";
import { appendCreationMessage, attachTaskRemoteUrl, authorizeAndStartPipeline, claimTask, completeTask, createApproval, createCreation, createProject, createWorld, decideApproval, failTask, finalizeDelivery, getApprovalSummary, getContextPack, prepareQualityEvidence, promoteAsset, recordQualityReview, resumeRealPipeline, reviewMemory, startLocalRender, updateCreation, updateProjectPlan, upsertMemory } from "./workflow.mjs";

const server = new McpServer({ name: "ai-drama-studio", version: "0.1.0" });
server.registerTool("drama_configure_upscale", { description: "Configure an existing local Real-ESRGAN NCNN executable and model directory. Hashes files; does not download weights or claim a GPU test.", inputSchema: { runtime: upscaleRuntimeSchema } }, async ({ runtime }) => result(await configureUpscale(runtime)));
server.registerTool("drama_create_upscale_job", { description: "Prepare a hash-bound local Real-ESRGAN job (CFR <=2h, scale >1 <=4, max long edge 3840). No source overwrite/import. Start separately; output preserves audio streams and requires viewing/listening acceptance.", inputSchema: upscaleRequestSchema.shape }, async input => result(await createUpscale(input)));
server.registerTool("drama_start_upscale_job", { description: "Start/resume local GPU upscale; durable input/runtime hashes and verified chunk checkpoints prevent restarting completed chunks. No paid model call. Use status tool; paused/failed jobs can resume.", inputSchema: { jobId: z.string() } }, async ({ jobId }) => result(await startUpscale(jobId)));
server.registerTool("drama_get_upscale_job", { description: "Read managed local upscale progress/output hash; omitted ID lists jobs. Success means technical checks, not creative acceptance.", inputSchema: { jobId: z.string().optional() } }, async ({ jobId }) => result(await getUpscale(jobId)));
server.registerTool("drama_pause_upscale_job", { description: "Pause only the specified upscale job, retaining verified chunks. Does not stop other tasks.", inputSchema: { jobId: z.string() } }, async ({ jobId }) => result(await pauseUpscale(jobId)));
server.registerTool("drama_list_providers", { description: "Read configured provider selection, adapter input limits, credential presence. Ark/Doubao remain defaults; Codex built-in images remain primary. Additional adapters have no implied account verification.", inputSchema: {} }, async () => result(await providerCatalog()));
server.registerTool("drama_prepare_provider_job", { description: "Freeze ONE text-to-image/video or TTS request using a profile from drama_list_providers (including custom providers). Follow that profile's fixed specification, not the vendor's full model envelope. Generic hosts use API images with verified-host-unavailable evidence; Codex defaults to its built-in image tool. No paid call. Candidates stay outside the library pending acceptance. Unsupported references are rejected. Ark video and Doubao speech use their dedicated tools.", inputSchema: providerRequestSchema.shape }, async input => result(await prepareProviderJob(input)));
server.registerTool("drama_start_provider_job", { description: "Submit frozen external-provider request ONCE under current automatic/manual policy. Repeated/unknown submissions are blocked; no automatic fallback or increased cap. Generated media stays outside library until accepted.", inputSchema: { jobId: z.string() } }, async ({ jobId }) => {
  const job = await getProviderJob(jobId); let trusted = false;
  if (job.executionMode === "manual") {
    const answer = await server.server.elicitInput({ mode: "form", message: `批准一次 ${job.provider}/${job.model} 调用？项目 ${job.projectId}，提示词 ${job.prompt}，输入 ${JSON.stringify(job.payload)}。结果仅为候选，不自动入库。`, requestedSchema: { type: "object", properties: { confirm: { type: "boolean", title: "批准一次付费调用", default: false } }, required: ["confirm"] } });
    if (!confirmationOutcome(answer).confirmed) return result({ status: "pending", calls: 0 }); trusted = true;
  }
  return result(await submitProviderJob(jobId, trusted));
});
server.registerTool("drama_get_provider_job", { description: "Read saved external task or query its ORIGINAL provider task ID, including after restart. Never creates a generation; some provider query APIs use POST. Unknown submissions without an original task ID cannot be automatically retried.", inputSchema: { jobId: z.string(), refresh: z.boolean().default(false) } }, async ({ jobId, refresh }) => result(await (refresh ? reconcileProviderJob(jobId) : getProviderJob(jobId))));
server.registerTool("drama_download_provider_output", { description: "Download an existing completed provider task to private candidate staging; no new model call or library admission. Verify/show result before explicit import. Expired URLs require reconciliation, not a new paid submit.", inputSchema: { jobId: z.string() } }, async ({ jobId }) => result(await downloadProviderOutput(jobId)));
server.registerTool("drama_search_shot_assets", { description: "Rank project assets by shot, locked creation references and lexical metadata. Returns hashes, versions, matching reasons and actual byte verification; not semantic video search. Excludes stale/candidate assets by default; never approves references.", inputSchema: assetSearchSchema.shape }, async input => result(await searchShotAssets(await readState(), input)));
server.registerTool("drama_select_production_workflow", { description: "Read one of five production contracts: stage inputs, required artifacts, tools, acceptance criteria, recovery and director instructions. Codex orchestrates; existing update_plan and execution gates remain authoritative. No research stage or per-stage approval added.", inputSchema: { type: z.enum(WORKFLOWS.map(w => w.id)) } }, async ({ type }) => result(selectWorkflow(type, (await listSkills()).filter(s => s.enabled !== false).map(s => s.name))));
server.registerTool("drama_get_production_progress", { description: "Read scoped stage checkpoints and decision history. Rehash artifact files and invalidate downstream evidence after revision/file/upstream changes. Returns first incomplete stage/recovery instructions, NOT permission to bypass existing next_actions gates.", inputSchema: productionScopeSchema.shape }, async input => result(await getProductionProgress(input)));
server.registerTool("drama_record_stage_checkpoint", { description: "Append a current-revision stage checkpoint: required local report/manifest hashes, per-criterion observations, recovery note and frozen cost snapshot. Complete requires all previous stages and evidence; blocked may be partial. Agent-reported review is NOT image acceptance, memory approval or delivery. Idempotent requestKey; no model calls or budget changes.", inputSchema: stageCheckpointSchema.shape }, async input => result(await recordStageCheckpoint(input)));
server.registerTool("drama_record_production_decision", { description: "Append a scoped decision with alternatives, selected option, rejection reasons and explicit estimated/unknown cost impact. Optional supersedes preserves history. Does not execute a choice, activate memory, change pricing/budgets or fabricate user approval. Evidence files are hash-checked. Idempotent requestKey.", inputSchema: productionDecisionSchema.innerType().shape }, async input => result(await recordProductionDecision(input)));
server.registerTool("drama_read_production_knowledge", { description: "List the capability/production/technical knowledge index, or read one allowlisted reference with SHA-256. Load only references required by selected tools; no network research, Skill rewrite or arbitrary file read.", inputSchema: { id: z.string().optional() } }, async ({ id }) => result(id ? await readProductionKnowledge(id) : knowledgeIndex()));
server.registerTool("drama_sync_account_bill", { description: "Read Volcengine account bill using separately configured read-only AK/SK. Account scope can include other cloud products; NEVER assign aggregate bills to shots or add them to estimates. No generation call. Not Ark bearer API key.", inputSchema: { period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) } }, async ({ period }) => result(await syncBilling(period)));
server.registerTool("drama_prepare_audio_event_evidence", {
  description: "Compare reviewed contact/sound frame markers in a hash-bound local JSON plan; export native-speed AV preview, waveform and consecutive contact frames. Reports offset and suggested correction, never infers semantic events or shifts sound automatically. Requires NEW absolute outputDirectory. See local-edit-tools.md.",
  inputSchema: { planPath: z.string(), outputDirectory: z.string() }
}, async input => result(await prepareAudioEventEvidence(input)));
server.registerTool("drama_edit_local_media", {
  description: "Validate or execute a local version-1 JSON edit manifest: hash-bound accepted sources, CFR frame ranges, native audio, bilingual captions, seam movies/contact sheets. Requires absolute planPath and a NEW outputDirectory with an existing parent. No model call, upload, master overwrite, project registration or automatic creative acceptance. Read clip-studio-craft/references/local-edit-tools.md for schema and limits. validateOnly performs preflight without writing.",
  inputSchema: { planPath: z.string(), outputDirectory: z.string(), validateOnly: z.boolean().default(false) }
}, async input => result(await renderLocalEdit(input)));
server.registerTool("drama_process_local_audio", {
  description: "Execute a hash-bound local JSON audio plan: measure LUFS, normalize (two-pass targetLufs/truePeakDbtp/loudnessRange), denoise (explicit reductionDb/noiseFloorDb), approved sample excerpt, provider derivative or native-video music/SFX mix with reviewed-dialogue ducking. normalize/denoise output separate WAV; never replace video/audio masters. Non-measure operations require NEW outputDirectory. No paid call or automatic acceptance. Read docs/toolchain.md and clip-studio-craft/references/local-edit-tools.md.",
  inputSchema: { planPath: z.string(), outputDirectory: z.string() }
}, async input => result(await processLocalAudio(input)));
server.registerTool("drama_compare_local_edits", {
  description: "Compare two version-1 edit plans and verify explicitly listed approved 4K derivatives. Returns conservative reusable/changed intervals; never upscales, deletes or auto-accepts media. Each derivative must bind the source SHA and exact source frame range. See local-edit-tools.md.",
  inputSchema: { previousPlanPath: z.string(), nextPlanPath: z.string(), derivativesPath: z.string().optional() }
}, async input => result(await compareLocalEdits(input)));
let workbench = { url: "http://127.0.0.1:4317", available: false, reused: false };
let ownedWorkbenchServer = null;
try {
  const started = await startHttpServer({ log: false });
  ownedWorkbenchServer = started.server;
  workbench = { url: started.url, available: true, reused: started.reused };
} catch (error) {
  process.stderr.write(`[OpenDramaFlow] 工作台自动启动失败：${error?.message || error}\n`);
}

function result(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

server.registerTool("drama_set_execution_mode", {
  description: "Set product model execution policy only when requested by the user: automatic (default, no per-call popup) or manual (trusted confirmation for every frozen batch). This starts no job, does not change Codex host permissions, and never approves production memory. Existing scopes retain their original policy and may need re-preparation.",
  inputSchema: { mode: z.enum(["automatic", "manual"]) }
}, async ({ mode }) => result(await mutateState(state => {
  state.settings.executionMode = mode;
  appendEvent(state, "execution.policy_changed", mode === "automatic" ? "模型调用使用自动执行模式" : "模型调用使用逐批审批模式", { mode });
  return { executionMode: mode, startedJobs: 0, memoryApprovalRequired: true };
})));

server.registerTool("drama_get_state", {
  description: "Read local video projects, current production gates, exact next actions, jobs, approvals and Codex media tasks. Secrets are never returned.",
  inputSchema: { projectId: z.string().optional().describe("Optional project ID to narrow the result"), creationId: z.string().optional().describe("Optional creation page for production guidance") }
}, async ({ projectId, creationId }) => {
  const state = await readState();
  const projects = projectId ? state.projects.filter(project => project.id === projectId) : state.projects;
  const credentialStatus = { arkConfigured: await hasArkKey(), speechConfigured: await hasSpeechKey() };
  const guidance = projectId ? buildProductionStatus(state, projectId, creationId || null, { credentialStatus }) : null;
return result({ workbench, credentialStatus, speech: speechCapabilities(credentialStatus.speechConfigured, state.settings), speechJobs: (state.speechJobs || []).filter(job => !projectId || job.projectId === projectId), assetBridge: await getAssetBridgeStatus(), settings: state.settings, capabilities: { seedance: getSeedanceCapabilityProfile(state.settings) }, projects, guidance, jobs: state.jobs.filter(job => !projectId || job.projectId === projectId), approvals: state.approvals.filter(item => !projectId || item.projectId === projectId), tasks: state.tasks.filter(task => !projectId || task.projectId === projectId), providerCalls: (state.providerCalls || []).filter(call => !projectId || call.projectId === projectId), recentEvents: state.events.slice(0, 20) });
});

server.registerTool("drama_get_next_actions", {
  description: "Derive the deterministic production graph, blockers and exact next Codex action from durable evidence. This makes no model or paid call.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional() }
}, async ({ projectId, creationId }) => {
  const state = await readState();
  const speechConfigured = await hasSpeechKey();
  return result({ ...buildProductionStatus(state, projectId, creationId || null, { credentialStatus: { arkConfigured: await hasArkKey(), speechConfigured } }), speech: speechCapabilities(speechConfigured, state.settings) });
});

server.registerTool("drama_get_capabilities", {
  description: "Read the exact generation capabilities and explicit unsupported boundaries of the currently installed adapters. This makes no model call.",
  inputSchema: {}
}, async () => {
  const state = await readState();
  const arkConfigured = await hasArkKey();
  const speechConfigured = await hasSpeechKey();
  const tools = await getToolCatalog(state, { arkConfigured, speechConfigured });
  return result({ host: agentHost.host, image: { primary: agentHost.codexImageGen ? "codex-imagegen" : state.settings.providerSelection?.fallbackImage || "ark-seedream", codexImageGen: agentHost.codexImageGen, seedream: arkConfigured, apiTool: "drama_prepare_provider_job", requiresImageApiKey: !agentHost.codexImageGen }, video: getSeedanceCapabilityProfile(state.settings), speech: speechCapabilities(speechConfigured, state.settings), deterministicEdit: { ffmpeg: tools.dependencies.ffmpeg, concat: true, subtitles: true, audioPreservation: true, localManifestEdit: true, frameRangeCfr: true, bilingualCaptionMapping: true, seamEvidence: true, localAudioMix: true, loudnessMeasurement: true, sampleExactVoiceExcerpt: true, exactRange4kReusePlan: true, automaticDucking: true, duckingRequiresReviewedIntervals: true, audioEventEvidence: true, voiceProviderDerivative: true, audioDenoise: true, twoPassNormalization: true }, tools, legacyCapabilityFlags: "Adapter features, not live readiness; consult tools.entries for dependencies and verification boundaries.", unavailable: ["voice cloning", "3D scene editing", "professional NLE project export"] });
});

server.registerTool("drama_list_tool_capabilities", {
  description: "Unified generation/local-post tool catalog: inputs, outputs, actual local dependencies, credentials vs historical provider success, limits, cost/recovery/acceptance rules. No network/model call. Host image tool stays primary; this is not permission to switch models or overwrite masters.", inputSchema: {}
}, async () => result(await getToolCatalog(await readState(), { arkConfigured: await hasArkKey(), speechConfigured: await hasSpeechKey() })));

server.registerTool("drama_get_cost_report", {
  description: "Read per-call estimated costs, numeric provider usage and separately recorded bills. Filter by project/creation/shot; aggregate each currency separately. Unknown/failed calls are NOT free; historical calls without frozen prices remain unknown. No paid submission or budget change.",
  inputSchema: { projectId: z.string().optional(), creationId: z.string().optional(), shotId: z.string().optional() }
}, async input => result(costReport(await readState(), input)));

server.registerTool("drama_set_cost_price", {
  description: "Set an explicit user-sourced ESTIMATE rate for an exact provider/kind/model/profile and optional variant/conditions (ISO currency, price per request/image/second/character/million_tokens/megapixel). Preserve variant conditions when overriding an official specification. Only future call reservations use it; later numeric usage uses that frozen rate. Never invent current prices; source is required. Does not set or increase call/spending budgets. No model call.",
  inputSchema: { rule: priceRuleSchema }
}, async ({ rule }) => result(await mutateState(state => ({ rule: setPriceRule(state, rule) }))));

server.registerTool("drama_record_cost_settlement", {
  description: "Record a provider-bill receipt for one existing call only when actual billing evidence is supplied. Each new receipt is the cumulative net amount for that call, replacing the previous amount for totals while preserving history (refund/correction uses a new receipt ID). Same ID/payload is idempotent; conflicting ID/currency rejected. Estimate/usage is never proof of actual charges. No paid call.",
  inputSchema: { callId: z.string(), receipt: settlementSchema }
}, async ({ callId, receipt }) => result(await mutateState(state => ({ receipt: recordSettlement(state, callId, receipt) }))));

server.registerTool("drama_request_speech_job", {
  description: "Prepare exactly one pending ASR, TTS or SeedAudio 1.0 music/song request. Music uses up to 500 characters of prompt/lyrics and returns WAV; requires listening and explicit asset binding. ASR uses a version-bound library audio/video segment (default 5 seconds); TTS uses up to 500 characters; optional contextText freezes TTS2 emotion/dialect direction separately from spoken text; optional speaker selects a verified stock voice ID and is frozen into the request. No paid call. Requires the optional locally configured Doubao Speech key; otherwise use Seedance native sound and manual listening, not fake transcription.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional(), mode: z.enum(["asr", "tts", "music"]), contextText: z.string().min(1).max(500).optional(), speaker: z.string().regex(/^[A-Za-z0-9_-]{1,100}_bigtts$/).optional(), assetId: z.string().optional(), startSeconds: z.number().min(0).optional(), durationSeconds: z.number().min(0.2).max(120).optional(), text: z.string().min(1).max(500).optional(), expectedText: z.string().max(8000).optional() }
}, async input => result({ job: await requestSpeechJob(input) }));

server.registerTool("drama_authorize_speech_job", {
  description: "Execute one frozen speech request automatically by default; in explicitly selected manual mode require trusted human confirmation. No automatic retry or extra calls. Query drama_get_speech_job for actual outcome. Transcripts are review evidence, never automatic quality passes or approved memory.",
  inputSchema: { jobId: z.string() }
}, async ({ jobId }) => result({ job: await authorizeSpeechJob(jobId, request => server.server.elicitInput(request), { background: true }) }));

server.registerTool("drama_get_speech_job", {
  description: "Read speech approval/call status, exact input/output versions, transcript and media evidence. For TTS, inspect the audio asset and explicitly bind its assetId as sourceAudioAssetId when revising the shot; never automatically replace approved audio.",
  inputSchema: { jobId: z.string() }
}, async ({ jobId }) => result({ job: await getSpeechJob(jobId) }));

server.registerTool("drama_get_background_status", {
  description: "Read owned background task counts and bounded failure codes. No task is started or cancelled.", inputSchema: {}
}, async () => result(backgroundJobStatus()));

server.registerTool("drama_import_asset", {
  description: "Copy an explicit local media/document file into the project library with stable identity and content hash. Never uploads externally.",
  inputSchema: { projectId: z.string(), localPath: z.string(), folderId: z.string().optional(), creationId: z.string().optional() }
}, async ({ projectId, localPath, ...options }) => result({ asset: await importLocalAsset(projectId, localPath, options) }));

server.registerTool("drama_create_asset_folder", {
  description: "Create a library folder for original sources, references or production media. No model call.",
  inputSchema: { projectId: z.string(), name: z.string().min(1).max(120), parentId: z.string().nullable().optional() }
}, async ({ projectId, name, parentId }) => result({ folder: await createAssetFolder(projectId, name, parentId || null) }));

server.registerTool("drama_inspect_asset", {
  description: "Read a registered image/video/audio version, verify its bytes and Seedance constraints, prepare video frames and WAV listening evidence. Open/play the returned files before claiming semantic understanding; technical scans are not a quality verdict.",
  inputSchema: { projectId: z.string(), assetId: z.string(), preparePlayback: z.boolean().optional() }
}, async ({ projectId, assetId, ...options }) => result({ evidence: await inspectAsset(projectId, assetId, options) }));

server.registerTool("drama_prepare_reference_asset", {
  description: "Locally trim/transcode an existing library asset to MP4/PNG/WAV or extract audio from video. Creates a separate derived asset with source hash and time range; never edits the original or automatically changes an approved binding. Bind the returned asset only after checking compatibility.",
  inputSchema: { projectId: z.string(), assetId: z.string(), kind: z.enum(["image", "video", "audio"]).optional(), startSeconds: z.number().min(0).optional(), durationSeconds: z.number().min(2).max(30).optional(), folderId: z.string().optional() }
}, async ({ projectId, assetId, ...options }) => result(await prepareReferenceAsset(projectId, assetId, options)));

server.registerTool("drama_read_memory_source", {
  description: "Read library MD/TXT/CSV/JSON/DOCX as untrusted source text with a version hash for grounded memory extraction.",
  inputSchema: { projectId: z.string(), assetId: z.string(), offset: z.number().int().min(0).optional(), maxChars: z.number().int().min(1).max(50000).optional() }
}, async ({ projectId, assetId, ...options }) => result(await readMemorySource(projectId, assetId, options)));

server.registerTool("drama_extract_memory_candidates", {
  description: "Persist Codex-extracted claims only as candidates after checking exact quotations against a registered source version. Provenance is not truth; user approval is still mandatory before production.",
  inputSchema: { projectId: z.string(), sourceAssetId: z.string(), scope: z.enum(["series", "volume", "creation"]), volumeId: z.string().optional(), creationId: z.string().optional(),
    proposals: z.array(z.object({ title: z.string().min(1).max(500), content: z.string().min(1).max(4000), quote: z.string().min(4).max(4000), stableKey: z.string().max(500).optional(), kind: z.enum(["canon", "decision", "constraint", "continuity", "summary", "unresolved"]), tags: z.array(z.string()).max(30).optional() })).min(1).max(30) }
}, async ({ projectId, sourceAssetId, proposals, ...options }) => result(await extractMemoryCandidates(projectId, sourceAssetId, proposals, options)));

server.registerTool("drama_search_memory", {
  description: "Search approved latest memory versions using Chinese/English terms and bounded source excerpts. Strictly scoped to series + current volume + current creation; candidates and unrelated scopes never enter results.",
  inputSchema: { projectId: z.string(), query: z.string().min(1).max(1000), creationId: z.string().optional(), volumeId: z.string().optional(), maxTokens: z.number().int().min(0).max(10000).optional() }
}, async ({ projectId, ...options }) => result(await searchProjectMemory(projectId, options)));

server.registerTool("drama_route_skills", {
  description: "Automatically identify and load the most relevant OpenDramaFlow creative skills for a user request. Call this before planning any image, video, drama, ad, MV, explainer, dubbing or editing task so the user never has to choose skills manually.",
  inputSchema: {
    request: z.string().min(1).max(4000).describe("The user's current creative request, kept in the user's original language"),
    maxResults: z.number().int().min(1).max(5).optional().describe("Maximum specialized skills to load; defaults to 3"),
    projectId: z.string().optional().describe("Optional project whose selected Skill routing should be persisted"),
    creationId: z.string().optional().describe("Optional creation page whose selected Skill routing should be persisted")
  }
}, async ({ request, maxResults, projectId, creationId }) => {
  if (creationId && !projectId) throw new Error("PROJECT_ID_REQUIRED_FOR_CREATION_ROUTING");
  const routing = await routeSkills(request, maxResults);
  let persisted = false;
  let planRevision = null;
  if (projectId) {
    const project = await updateProjectPlan(projectId, {
      creationId: creationId || undefined,
      selectedSkills: (routing.selected || []).map(item => item.name)
    });
    const production = creationId
      ? project.creations?.find(item => item.id === creationId)?.plan
      : project;
    planRevision = Number(production?.planRevision || 0);
    persisted = true;
  }
  return result({ ...routing, context: { projectId: projectId || null, creationId: creationId || null }, persisted, planRevision });
});

server.registerTool("drama_list_skills", {
  description: "List all OpenDramaFlow creative skills available in Codex without loading their full instructions.",
  inputSchema: {}
}, async () => {
  const skills = await listSkills();
  return result({ count: skills.length, skills });
});

server.registerTool("drama_create_skill", {
  description: "Create a project-compatible Codex Skill directly in OpenDramaFlow's local Skill library. The automatic router can use it immediately; no manual UI setup is required.",
  inputSchema: {
    skillMd: z.string().min(1).max(200000).describe("Complete SKILL.md content with valid YAML frontmatter"),
    files: z.record(z.string(), z.string().max(500000)).optional().describe("Optional relative text files such as references/guide.md")
  }
}, async input => result({ skill: await createManagedSkill(input) }));

server.registerTool("drama_set_skill_enabled", {
  description: "Enable or disable one OpenDramaFlow Skill for automatic routing.",
  inputSchema: { name: z.string().min(1).max(80), enabled: z.boolean() }
}, async ({ name, enabled }) => result({ skill: await setManagedSkillEnabled(name, enabled) }));

server.registerTool("drama_create_project", {
  description: "Create a local AI drama project. This makes no model call.",
  inputSchema: { title: z.string().min(1).max(80), logline: z.string().max(500).optional() }
}, async input => result({ project: await createProject(input) }));

server.registerTool("drama_create_world", {
  description: "Create one volume or season subdivision inside a parent IP project and initialize its standard asset folders. The legacy tool name is kept only for data compatibility. This makes no model call.",
  inputSchema: { projectId: z.string(), title: z.string().min(1).max(80), description: z.string().max(500).optional() }
}, async ({ projectId, ...input }) => result({ world: await createWorld(projectId, input) }));

server.registerTool("drama_create_creation", {
  description: "Create an independent production canvas inside a project, optionally under one volume or season. Use episode for one episode/task and world-control for a volume/season overview (the internal enum name is retained for compatibility).",
  inputSchema: {
    projectId: z.string(), title: z.string().min(1).max(80), worldId: z.string().nullable().optional(),
    type: z.enum(["episode", "world-control", "series-control", "asset-development"]).optional()
  }
}, async ({ projectId, ...input }) => result({ creation: await createCreation(projectId, input) }));

server.registerTool("drama_update_creation", {
  description: "Update a creation canvas hierarchy, version-pinned asset references, or saved node/viewport positions without changing asset identity.",
  inputSchema: {
    projectId: z.string(), creationId: z.string(), title: z.string().max(80).optional(), worldId: z.string().nullable().optional(),
    type: z.enum(["episode", "world-control", "series-control", "asset-development"]).optional(),
    assetRefs: z.array(z.object({ assetId: z.string(), locked: z.boolean().optional(), version: z.number().int().positive().optional() })).max(1000).optional(),
    canvas: z.object({ viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(), positions: z.record(z.string(), z.object({ x: z.number(), y: z.number(), width: z.number().optional(), height: z.number().optional() })).optional() }).optional()
  }
}, async ({ projectId, creationId, ...patch }) => result({ creation: await updateCreation(projectId, creationId, patch) }));

server.registerTool("drama_record_creation_response", {
  description: "Write a Codex response or production note into one creation's Agent timeline so the canvas and conversation remain synchronized.",
  inputSchema: { projectId: z.string(), creationId: z.string(), content: z.string().min(1).max(8000) }
}, async ({ projectId, creationId, content }) => result({ message: await appendCreationMessage(projectId, creationId, { role: "assistant", content }) }));

server.registerTool("drama_upsert_memory", {
  description: "Create or update one candidate project memory. Candidate memory is durable but cannot enter production context until explicitly reviewed and approved.",
  inputSchema: {
    projectId: z.string(), id: z.string().min(1).max(160).optional(), version: z.number().int().positive().optional(),
    scope: z.enum(["series", "volume", "creation"]), volumeId: z.string().max(160).nullable().optional(), creationId: z.string().max(160).nullable().optional(),
    kind: z.enum(["canon", "decision", "constraint", "continuity", "summary", "unresolved"]),
    stableKey: z.string().max(500).optional(), title: z.string().max(500).optional(), content: z.string().min(1).max(100000),
    sourceRefs: z.array(z.union([
      z.string().min(1).max(2000),
      z.object({ sourceId: z.string().max(160).optional(), assetId: z.string().max(160).optional(), version: z.number().int().positive().optional(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(), uri: z.string().max(2000).optional(), locator: z.string().max(1000).optional(), label: z.string().max(300).optional() })
    ])).max(100).optional(),
    tags: z.array(z.string().max(120)).max(100).optional(), purposes: z.array(z.string().max(200)).max(50).optional(), priority: z.number().min(0).max(100).optional()
  }
}, async ({ projectId, ...memory }) => result({ memory: await upsertMemory(projectId, memory) }));

server.registerTool("drama_review_memory", {
  description: "Explicitly approve, supersede or disable one exact candidate memory version. Only approved memory enters future context packs and paid approval snapshots.",
  inputSchema: { projectId: z.string(), memoryId: z.string().min(1).max(160), version: z.number().int().positive(), status: z.enum(["approved", "superseded", "disabled"]), notes: z.string().max(1000).optional() }
}, async ({ projectId, memoryId, version, status, notes }) => {
  if (status === "approved") {
    const memory = (await readState()).projects.find(item => item.id === projectId)?.memories?.find(item => item.id === memoryId && item.version === version);
    if (!memory) throw new Error("MEMORY_NOT_FOUND");
    const response = await server.server.elicitInput({ mode: "form", message: `批准这条候选进入生产记忆？${memory.title}（v${version} / ${memory.scope}）\n${memory.content}\n批准后会影响后续生产，已有待执行审批可能失效。`, requestedSchema: { type: "object", properties: { confirm: { type: "boolean", title: "批准这条设定", default: false } }, required: ["confirm"] } });
    if (response.action !== "accept" || response.content?.confirm !== true) return result({ status: "candidate", message: "未批准，未写入生产记忆。" });
    const current = (await readState()).projects.find(item => item.id === projectId)?.memories?.find(item => item.id === memoryId && item.version === version);
    if (JSON.stringify(current) !== JSON.stringify(memory)) throw new Error("MEMORY_CHANGED_DURING_CONFIRMATION");
  }
  return result({ memory: await reviewMemory(projectId, memoryId, version, status, notes || "") });
});

server.registerTool("drama_get_context_pack", {
  description: "Build a deterministic token-bounded context pack from approved current-creation, current-volume and series memory. Other projects, volumes and creation pages are strictly excluded.",
  inputSchema: { projectId: z.string(), creationId: z.string().max(160).optional(), purpose: z.string().max(1000).optional(), maxTokens: z.number().int().min(0).max(100000).optional() }
}, async ({ projectId, ...options }) => result({ contextPack: await getContextPack(projectId, options) }));

server.registerTool("drama_promote_asset", {
  description: "Promote a validated asset to series-wide or volume/season common scope without changing its stable assetId or any existing creation reference.",
  inputSchema: { projectId: z.string(), assetId: z.string(), scope: z.enum(["series", "world"]), folderId: z.string().nullable().optional() }
}, async ({ projectId, assetId, scope, folderId }) => result({ asset: await promoteAsset(projectId, assetId, scope, folderId || null) }));

server.registerTool("drama_update_plan", {
  description: "Persist a general commercial-video brief, selected professional skills, subject/character bible and ordered shot contracts. Uploaded video or audio must be referenced by its stable assetId through sourceVideoAssetId or sourceAudioAssetId. Prompt changes open a revision and invalidate only affected downstream evidence. This makes no model call.",
  inputSchema: {
    projectId: z.string(),
    creationId: z.string().optional().describe("Target creation canvas. Omit only for legacy project-wide plans."),
    title: z.string().max(80).optional(),
    logline: z.string().max(500).optional(),
    premise: z.string().max(1200).optional(),
    brief: z.object({
      objective: z.string().max(1200).optional(),
      contentType: z.string().max(80).optional(),
      audience: z.string().max(500).optional(),
      platform: z.string().max(120).optional(),
      durationSeconds: z.number().positive().max(86400).optional(),
      aspectRatio: z.enum(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"]).optional(),
      language: z.string().max(80).optional(),
      brandName: z.string().max(160).optional(),
      sellingPoints: z.array(z.string().max(300)).max(30).optional(),
      callToAction: z.string().max(500).optional(),
      style: z.string().max(800).optional(),
      constraints: z.array(z.string().max(500)).max(50).optional(),
      deliverables: z.array(z.string().max(300)).max(30).optional(),
      acceptanceCriteria: z.array(z.string().max(500)).max(50).optional(),
      sourceAssetIds: z.array(z.string().max(120)).max(500).optional()
    }).optional(),
    selectedSkills: z.array(z.string().min(1).max(120)).max(5).optional(),
    scenes: z.array(z.object({ id: z.string().optional(), heading: z.string(), summary: z.string() })).max(100).optional(),
    characters: z.array(z.object({ id: z.string().optional(), name: z.string(), role: z.string().max(300).optional(), visual: z.string(), referenceAssetIds: z.array(z.string()).max(20).optional() })).max(50).optional(),
    shots: z.array(z.object({
      id: z.string().optional(), duration: z.number().min(0.5).max(30), scene: z.string().max(500).optional(), framing: z.string().max(80).optional(), prompt: z.string().max(3000).optional(),
      promptContractVersion: z.union([z.literal(1), z.literal(2)]).optional(),
      sceneId: z.string().max(80).optional(), purpose: z.string().max(500).optional(), subjectIds: z.array(z.string().max(120)).max(20).optional(),
      startState: z.string().max(800).optional(), endState: z.string().max(800).optional(),
      camera: z.object({ shotSize: z.string().max(80).optional(), angle: z.string().max(80).optional(), movement: z.string().max(160).optional(), speed: z.string().max(80).optional(), relation: z.string().max(180).optional(), movements: z.array(z.string().max(80)).max(10).optional() }).optional(),
      motion: z.union([z.string().max(1200), z.object({ subject: z.string().max(1200).optional(), environment: z.string().max(800).optional(), timing: z.array(z.string().max(240)).max(12).optional() })]).optional(),
      style: z.string().max(500).optional(), transition: z.string().max(300).optional(),
      soundPlan: z.object({ dialogue: z.string().max(1000).optional(), ambience: z.string().max(500).optional(), soundEffects: z.string().max(500).optional(), music: z.string().max(500).optional(), notes: z.string().max(1000).optional() }).optional(),
      audioMode: z.enum(["provider-native", "source-asset", "post", "none"]).optional(),
      continuityFromShotId: z.string().max(80).nullable().optional(),
      continuityConstraints: z.array(z.string().max(300)).max(30).optional(), negativeConstraints: z.array(z.string().max(300)).max(30).optional(), qualityRisks: z.array(z.string().max(300)).max(30).optional(),
      imagePrompt: z.string().max(3000).optional(), videoPrompt: z.string().max(3000).optional(), videoInputMode: z.enum(VIDEO_INPUT_MODES).optional(),
      mediaReferences: z.array(z.object({ assetId: z.string().max(120), role: z.enum(Object.keys(MEDIA_ROLES)), version: z.number().int().positive().optional() })).max(50).optional(),
      videoParameters: z.object({ ratio: z.enum(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"]).optional(), resolution: z.enum(["480p", "720p"]).optional() }).strict().optional(),
      continuation: z.object({ shotId: z.string().max(80), source: z.enum(["last-frame", "video"]) }).nullable().optional(),
      edit: z.object({ startSeconds: z.number().min(0), endSeconds: z.number().positive(), instruction: z.string().min(1).max(1500), preserve: z.array(z.string().max(300)).max(30).optional() }).nullable().optional(),
      action: z.string().max(1200).optional(), subtitle: z.string().optional(), audio: z.string().max(1000).optional(),
      generationMode: z.enum(["auto", "seedance", "static-motion", "uploaded-video"]).optional(),
      sourceVideoAssetId: z.string().max(120).optional(), sourceAudioAssetId: z.string().max(120).optional(),
      referenceAssetIds: z.array(z.string()).max(30).optional(),
      acceptanceCriteria: z.array(z.string().max(300)).max(20).optional()
    })).max(300).optional()
  }
}, async ({ projectId, ...plan }) => result({ project: await updateProjectPlan(projectId, plan) }));

server.registerTool("drama_request_paid_batch", {
  description: "Create an immutable pending approval snapshot for real Codex Image Gen, Seedream and Seedance calls. This tool never approves or runs the batch.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional(), maxImageCalls: z.number().int().min(0).optional(), maxVideoCalls: z.number().int().min(0).optional() }
}, async ({ projectId, ...limits }) => result({ approval: await createApproval(projectId, limits) }));

server.registerTool("drama_authorize_and_start_paid_batch", {
  description: "Atomically start one frozen, capped batch for the user's task. Automatic policy (default) needs no product popup; explicitly selected manual policy requires trusted MCP confirmation. Does not bypass Codex host permissions, input hashes, budgets or duplicate-call protection.",
  inputSchema: { approvalId: z.string() }
}, async ({ approvalId }) => {
  const summary = await getApprovalSummary(approvalId);
  if (summary.executionMode === "automatic") return result({ approvalId, executionMode: "automatic", job: await authorizeAndStartPipeline(approvalId, { method: "automatic-policy", action: "start" }) });
  if (executionMode((await readState()).settings) !== "manual") throw new Error("EXECUTION_MODE_CHANGED_PREPARE_NEW_SCOPE");
  const referenceSummary = summary.inputAssets.length
    ? summary.inputAssets.slice(0, 8).map(item => `${item.shotId}:${item.assetId}@v${item.version}`).join("、")
    : "无已锁定参考图（缺图镜头会按所选图片能力生成）";
  const imageProviderSummary = summary.imageProvider === "ark-seedream" && summary.imageModel
    ? `${summary.imageProvider} / ${summary.imageModel}`
    : summary.imageProvider || "未配置";
  let elicited;
  try {
    elicited = await server.server.elicitInput({
      mode: "form",
      message: `确认启动真实模型批次？项目：${summary.projectTitle}；目标：${summary.objective || "未填写"}；方案修订：v${summary.planRevision}；镜头：${summary.shotCount}；最多图片调用：${summary.maxImageCalls}（${imageProviderSummary}）；最多视频调用：${summary.maxVideoCalls}（${summary.model || "未配置"}）；逐镜头模式/时长/参数/声音/输入角色：${JSON.stringify(summary.videoRequests)}；水印：${summary.watermark ? "是" : "否"}；参考素材：${referenceSummary}；${summary.warning}`,
      requestedSchema: {
        type: "object",
        properties: {
          confirm: { type: "boolean", title: "批准并启动", description: "只有你本人确认后才会调用真实模型。", default: false }
        },
        required: ["confirm"]
      }
    });
  } catch {
    throw new Error("USER_CONFIRMATION_UNAVAILABLE");
  }
  if (elicited.action === "decline") {
    const approval = await decideApproval(approvalId, "rejected", { method: "mcp-elicitation", action: "decline" });
    return result({ approval, job: null });
  }
  if (!confirmationOutcome(elicited).confirmed) return result({ approval: summary, job: null, status: "pending", confirmation: confirmationOutcome(elicited), message: "未收到有效确认，批次保持待审批且没有产生模型调用。" });
  return result({ approvalId, job: await authorizeAndStartPipeline(approvalId, { method: "mcp-elicitation", action: "accept" }) });
});

server.registerTool("drama_resume_paid_batch", {
  description: "Resume a waiting real batch after all Codex Image Gen tasks have been completed. The original approval and remaining call caps still apply.",
  inputSchema: { jobId: z.string() }
}, async ({ jobId }) => result({ job: await resumeRealPipeline(jobId) }));

server.registerTool("drama_render_project", {
  description: "Deterministically edit available Seedance clips and static image shots into a local MP4 with an audio track and timed Chinese subtitles. No model call.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional().describe("Optional creation canvas whose asset versions should be locked when rendering succeeds") }
}, async ({ projectId, creationId }) => result({ job: await startLocalRender(projectId, creationId || null) }));

server.registerTool("drama_claim_image_task", {
  description: "Claim one queued Codex Image Gen task before invoking Codex image generation.",
  inputSchema: { taskId: z.string() }
}, async ({ taskId }) => result({ task: await claimTask(taskId, "codex") }));

server.registerTool("drama_complete_image_task", {
  description: "After visual inspection, attach an accepted Codex image to its exact plan revision. A public URL is optional because the controlled HTTPS bridge can prepare it for Seedance.",
  inputSchema: {
    taskId: z.string(), localPath: z.string().min(1), remoteUrl: z.string().refine(value => value.startsWith("https://") || value.startsWith("asset://"), "Expected HTTPS or asset:// URL").optional(),
    inspection: z.object({
      accepted: z.literal(true),
      composition: z.enum(["passed", "not-applicable"]),
      identity: z.enum(["passed", "not-applicable"]),
      artifacts: z.enum(["passed", "not-applicable"]),
      cropSafety: z.enum(["passed", "not-applicable"]),
      notes: z.string().min(1).max(2000)
    })
  }
}, async ({ taskId, localPath, remoteUrl, inspection }) => result({ task: await completeTask(taskId, localPath, remoteUrl || "", inspection) }));

server.registerTool("drama_fail_image_task", {
  description: "Record a claimed Codex Image Gen attempt as failed without inventing an asset. A claimed attempt remains charged against its approved cap.",
  inputSchema: { taskId: z.string(), reason: z.string().min(1).max(2000) }
}, async ({ taskId, reason }) => result({ task: await failTask(taskId, reason) }));

server.registerTool("drama_attach_image_remote_url", {
  description: "Attach a public HTTPS or Ark asset:// source to an already completed Codex Image Gen task. Normally the automatic controlled bridge makes this unnecessary.",
  inputSchema: { taskId: z.string(), remoteUrl: z.string().refine(value => value.startsWith("https://") || value.startsWith("asset://"), "Expected HTTPS or asset:// URL") }
}, async ({ taskId, remoteUrl }) => result({ task: await attachTaskRemoteUrl(taskId, remoteUrl) }));

server.registerTool("drama_prepare_quality_evidence", {
  description: "Prepare current MP4 review evidence: frames, shot spans, full-video playback path, WAV listening track and freeze/black/silence signals. Read temporal.requirements; actually play/listen before recording each observation. No automatic semantic acceptance.",
  inputSchema: { projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string() }
}, async ({ projectId, creationId, outputId }) => result({ evidence: await prepareQualityEvidence(projectId, creationId || null, outputId) }));

server.registerTool("drama_record_quality_review", {
  description: "Persist an evidence-based review after Codex or the user has actually inspected the rendered video. A failed check cannot be reported as passed.",
  inputSchema: {
    projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string(), decision: z.enum(["passed", "changes-required"]),
    checks: z.object({ visual: z.enum(["passed", "failed"]), continuity: z.enum(["passed", "failed", "not-applicable"]), subtitles: z.enum(["passed", "failed", "not-applicable"]), audio: z.enum(["passed", "failed", "not-applicable"]), brandAccuracy: z.enum(["passed", "failed", "not-applicable"]) }),
    criteriaResults: z.array(z.object({ criterion: z.string().min(1).max(500), status: z.enum(["passed", "failed", "not-applicable"]), evidence: z.string().max(2000) })).max(200).optional(),
    inspectedFrameSha256s: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(25),
    playbackSourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    listenedAudioSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    observations: z.array(z.object({ shotId: z.string(), start: z.number().min(0), end: z.number().positive(), notes: z.string().min(1).max(2000),
      motion: z.enum(["passed", "failed", "not-applicable"]), identity: z.enum(["passed", "failed", "not-applicable"]), continuity: z.enum(["passed", "failed", "not-applicable"]), audio: z.enum(["passed", "failed", "not-applicable"]), dialogue: z.enum(["passed", "failed", "not-applicable"]), subtitles: z.enum(["passed", "failed", "not-applicable"]), editPreservation: z.enum(["passed", "failed", "not-applicable"]), heardDialogue: z.string().max(2000).optional(), observedSubtitles: z.string().max(2000).optional() })).max(500),
    notes: z.string().min(1).max(5000)
  }
}, async ({ projectId, creationId, outputId, ...review }) => result({ review: await recordQualityReview(projectId, creationId || null, outputId, review) }));

server.registerTool("drama_finalize_delivery", {
  description: "After a passed quality review, re-probe the local output and create a SHA-256 delivery manifest. This does not upload or send the file externally.",
  inputSchema: { projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string(), notes: z.string().max(3000).optional() }
}, async ({ projectId, creationId, outputId, notes }) => result({ delivery: await finalizeDelivery(projectId, creationId || null, outputId, notes || "") }));

const transport = new StdioServerTransport();
await server.connect(transport);

async function closeOwnedWorkbench() {
  stopBackgroundJobs();
  await drainBackgroundJobs();
  if (ownedWorkbenchServer?.listening) ownedWorkbenchServer.close();
  closeAssetBridge();
}

let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  void closeOwnedWorkbench().catch(() => { process.exitCode = 1; });
}
process.stdin.once("end", shutdown);
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
