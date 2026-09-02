#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { hasArkKey } from "./secrets.mjs";
import { listSkills, routeSkills } from "./skill-router.mjs";
import { createManagedSkill, setManagedSkillEnabled } from "./skill-registry.mjs";
import { readState } from "./store.mjs";
import { startHttpServer } from "./http-server.mjs";
import { closeAssetBridge, getAssetBridgeStatus } from "./asset-bridge.mjs";
import { buildProductionStatus, getSeedanceCapabilityProfile } from "./production-harness.mjs";
import { appendCreationMessage, attachTaskRemoteUrl, authorizeAndStartPipeline, claimTask, completeTask, createApproval, createCreation, createProject, createWorld, decideApproval, failTask, finalizeDelivery, getApprovalSummary, getContextPack, prepareQualityEvidence, promoteAsset, recordQualityReview, resumeRealPipeline, reviewMemory, startLocalRender, updateCreation, updateProjectPlan, upsertMemory } from "./workflow.mjs";

const server = new McpServer({ name: "ai-drama-studio", version: "0.1.0" });
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

server.registerTool("drama_get_state", {
  description: "Read local video projects, current production gates, exact next actions, jobs, approvals and Codex media tasks. Secrets are never returned.",
  inputSchema: { projectId: z.string().optional().describe("Optional project ID to narrow the result"), creationId: z.string().optional().describe("Optional creation page for production guidance") }
}, async ({ projectId, creationId }) => {
  const state = await readState();
  const projects = projectId ? state.projects.filter(project => project.id === projectId) : state.projects;
  const credentialStatus = { arkConfigured: await hasArkKey() };
  const guidance = projectId ? buildProductionStatus(state, projectId, creationId || null, { credentialStatus }) : null;
  return result({ workbench, credentialStatus, assetBridge: await getAssetBridgeStatus(), settings: state.settings, capabilities: { seedance: getSeedanceCapabilityProfile(state.settings) }, projects, guidance, jobs: state.jobs.filter(job => !projectId || job.projectId === projectId), approvals: state.approvals.filter(item => !projectId || item.projectId === projectId), tasks: state.tasks.filter(task => !projectId || task.projectId === projectId), providerCalls: (state.providerCalls || []).filter(call => !projectId || call.projectId === projectId), recentEvents: state.events.slice(0, 20) });
});

server.registerTool("drama_get_next_actions", {
  description: "Derive the deterministic production graph, blockers and exact next Codex action from durable evidence. This makes no model or paid call.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional() }
}, async ({ projectId, creationId }) => {
  const state = await readState();
  return result(buildProductionStatus(state, projectId, creationId || null, { credentialStatus: { arkConfigured: await hasArkKey() } }));
});

server.registerTool("drama_get_capabilities", {
  description: "Read the exact generation capabilities and explicit unsupported boundaries of the currently installed adapters. This makes no model call.",
  inputSchema: {}
}, async () => {
  const state = await readState();
  const arkConfigured = await hasArkKey();
  return result({ image: { primary: state.settings.imageProvider, codexImageGen: true, seedream: state.settings.imageProvider === "ark-seedream" && arkConfigured }, video: getSeedanceCapabilityProfile(state.settings), deterministicEdit: { ffmpeg: true, concat: true, subtitles: true, audioPreservation: true }, unavailable: ["voice cloning", "managed TTS", "managed music generation", "3D scene editing", "professional NLE project export"] });
});

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
  description: "List all Codex-adapted MiniMax creative skills available in OpenDramaFlow without loading their full instructions.",
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
    canvas: z.object({ viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(), positions: z.record(z.string(), z.object({ x: z.number(), y: z.number() })).optional() }).optional()
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
}, async ({ projectId, memoryId, version, status, notes }) => result({ memory: await reviewMemory(projectId, memoryId, version, status, notes || "") }));

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
      imagePrompt: z.string().max(3000).optional(), videoPrompt: z.string().max(3000).optional(), videoInputMode: z.literal("image-to-video").optional(),
      action: z.string().max(1200).optional(), subtitle: z.string().optional(), audio: z.string().max(1000).optional(),
      generationMode: z.enum(["auto", "seedance", "static-motion", "uploaded-video"]).optional(),
      sourceVideoAssetId: z.string().max(120).optional(), sourceAudioAssetId: z.string().max(120).optional(),
      referenceAssetIds: z.array(z.string()).max(20).optional(),
      acceptanceCriteria: z.array(z.string().max(300)).max(20).optional()
    })).max(300).optional()
  }
}, async ({ projectId, ...plan }) => result({ project: await updateProjectPlan(projectId, plan) }));

server.registerTool("drama_request_paid_batch", {
  description: "Create an immutable pending approval snapshot for real Codex Image Gen, Seedream and Seedance calls. This tool never approves or runs the batch.",
  inputSchema: { projectId: z.string(), creationId: z.string().optional(), maxImageCalls: z.number().int().min(0).optional(), maxVideoCalls: z.number().int().min(0).optional() }
}, async ({ projectId, ...limits }) => result({ approval: await createApproval(projectId, limits) }));

server.registerTool("drama_authorize_and_start_paid_batch", {
  description: "Ask the human for a trusted MCP confirmation, then atomically approve and start exactly one paid batch. Never call this as a substitute for user consent; the server itself presents the frozen scope and cost caps.",
  inputSchema: { approvalId: z.string() }
}, async ({ approvalId }) => {
  const summary = await getApprovalSummary(approvalId);
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
      message: `确认启动真实模型批次？项目：${summary.projectTitle}；目标：${summary.objective || "未填写"}；方案修订：v${summary.planRevision}；镜头：${summary.shotCount}；最多图片调用：${summary.maxImageCalls}（${imageProviderSummary}）；最多视频调用：${summary.maxVideoCalls}（${summary.model || "未配置"}）；画幅/清晰度：${summary.ratio || "未配置"} / ${summary.resolution || "未配置"}；生成音频：${summary.generateAudio ? "是" : "否"}；水印：${summary.watermark ? "是" : "否"}；参考素材：${referenceSummary}；${summary.warning}`,
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
  if (elicited.action !== "accept" || elicited.content?.confirm !== true) return result({ approval: summary, job: null, status: "pending", message: "用户未确认，批次保持待审批且没有产生模型调用。" });
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
  description: "Extract a deterministic start/middle/end and shot-boundary JPEG evidence pack from the current rendered MP4. This prepares evidence only and never claims that visual review passed.",
  inputSchema: { projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string() }
}, async ({ projectId, creationId, outputId }) => result({ evidence: await prepareQualityEvidence(projectId, creationId || null, outputId) }));

server.registerTool("drama_record_quality_review", {
  description: "Persist an evidence-based review after Codex or the user has actually inspected the rendered video. A failed check cannot be reported as passed.",
  inputSchema: {
    projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string(), decision: z.enum(["passed", "changes-required"]),
    checks: z.object({ visual: z.enum(["passed", "failed"]), continuity: z.enum(["passed", "failed", "not-applicable"]), subtitles: z.enum(["passed", "failed", "not-applicable"]), audio: z.enum(["passed", "failed", "not-applicable"]), brandAccuracy: z.enum(["passed", "failed", "not-applicable"]) }),
    criteriaResults: z.array(z.object({ criterion: z.string().min(1).max(500), status: z.enum(["passed", "failed", "not-applicable"]), evidence: z.string().max(2000) })).max(200).optional(),
    inspectedFrameSha256s: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(25),
    notes: z.string().min(1).max(5000)
  }
}, async ({ projectId, creationId, outputId, ...review }) => result({ review: await recordQualityReview(projectId, creationId || null, outputId, review) }));

server.registerTool("drama_finalize_delivery", {
  description: "After a passed quality review, re-probe the local output and create a SHA-256 delivery manifest. This does not upload or send the file externally.",
  inputSchema: { projectId: z.string(), creationId: z.string().nullable().optional(), outputId: z.string(), notes: z.string().max(3000).optional() }
}, async ({ projectId, creationId, outputId, notes }) => result({ delivery: await finalizeDelivery(projectId, creationId || null, outputId, notes || "") }));

const transport = new StdioServerTransport();
await server.connect(transport);

function closeOwnedWorkbench() {
  if (ownedWorkbenchServer?.listening) ownedWorkbenchServer.close();
  closeAssetBridge();
}

process.stdin.once("end", closeOwnedWorkbench);
process.once("SIGINT", closeOwnedWorkbench);
process.once("SIGTERM", closeOwnedWorkbench);
