import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const pluginRoot = path.resolve(".");
const mcpServerPath = path.join(pluginRoot, "src", "mcp-server.mjs");

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function toolError(result) {
  return result.content?.filter(item => item.type === "text").map(item => item.text).join("\n") || "MCP_TOOL_FAILED";
}

function toolValue(result) {
  assert.notEqual(result.isError, true, toolError(result));
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find(item => item.type === "text")?.text;
  assert.ok(text, "Expected a JSON text result from the MCP tool");
  return JSON.parse(text);
}

async function callTool(client, name, args = {}) {
  return toolValue(await client.callTool({ name, arguments: args }));
}

async function openMcp({ onElicitation, supportsElicitation = true, mode = "manual" } = {}) {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-mcp-elicitation-"));
  const port = await freePort();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpServerPath],
    cwd: pluginRoot,
    env: {
      ...process.env,
      AI_DRAMA_DATA_DIR: dataRoot,
      AI_DRAMA_PORT: String(port),
      AI_DRAMA_BRIDGE_PORT: String(port + 1),
      AI_DRAMA_BRIDGE_CONTROL_PORT: String(port + 2)
    },
    stderr: "pipe"
  });
  const stderr = [];
  transport.stderr?.on("data", chunk => stderr.push(String(chunk)));
  const client = new Client(
    { name: "ai-drama-elicitation-test", version: "1.0.0" },
    { capabilities: supportsElicitation ? { elicitation: { form: {} } } : {} }
  );
  if (supportsElicitation) {
    client.setRequestHandler(ElicitRequestSchema, async request => onElicitation(request));
  }
  try {
    await client.connect(transport);
    if (mode === "manual") await callTool(client, "drama_set_execution_mode", { mode });
  } catch (error) {
    await transport.close().catch(() => {});
    await fs.rm(dataRoot, { recursive: true, force: true });
    throw new Error(`${error?.message || error}\n${stderr.join("")}`);
  }
  return {
    client,
    dataRoot,
    stderr,
    async close() {
      await client.close().catch(() => {});
      await transport.close().catch(() => {});
      await fs.rm(dataRoot, { recursive: true, force: true });
    }
  };
}

async function createPendingStaticBatch(client, title) {
  const { project } = await callTool(client, "drama_create_project", { title });
  const { creation } = await callTool(client, "drama_create_creation", {
    projectId: project.id,
    title: "15 秒商业素材",
    type: "episode"
  });
  await callTool(client, "drama_update_plan", {
    projectId: project.id,
    creationId: creation.id,
    brief: {
      objective: "制作一条无线耳机产品广告",
      contentType: "电商广告",
      audience: "通勤用户",
      platform: "抖音",
      durationSeconds: 5,
      aspectRatio: "9:16",
      deliverables: ["竖屏 MP4"],
      acceptanceCriteria: ["产品外观准确"]
    },
    selectedSkills: ["minimalist-product-ad-generator"],
    premise: "用产品特写表现轻便与降噪",
    shots: [{
      id: "shot-1",
      duration: 5,
      scene: "通勤车厢",
      framing: "产品特写",
      action: "耳机在灯光中缓慢旋转",
      prompt: "银色无线耳机在冷色灯光中旋转",
      subtitle: "安静，由你掌控",
      generationMode: "static-motion",
      acceptanceCriteria: ["产品边缘无明显瑕疵"]
    }]
  });
  const { approval } = await callTool(client, "drama_request_paid_batch", {
    projectId: project.id,
    creationId: creation.id,
    maxImageCalls: 1,
    maxVideoCalls: 0
  });
  return { project, creation, approval };
}

async function stateFor(client, projectId) {
  return callTool(client, "drama_get_state", { projectId });
}

test("default automatic MCP starts one bounded batch without forms, but still gates memory", async () => {
  const session = await openMcp({ mode: "automatic", supportsElicitation: false });
  try {
    const initial = await callTool(session.client, "drama_get_state");
    assert.equal(initial.settings.executionMode, "automatic");
    assert.equal(initial.speech.requiresPaidApproval, false);
    const { project, creation, approval } = await createPendingStaticBatch(session.client, "Automatic fixture");
    const guidance = await callTool(session.client, "drama_get_next_actions", { projectId: project.id, creationId: creation.id });
    assert.equal(guidance.nextActions[0].tool, "drama_authorize_and_start_paid_batch");
    assert.equal(guidance.nextActions[0].authority, "agent");
    const first = await callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id });
    const second = await callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id });
    assert.equal(first.job.id, second.job.id);
    const state = await stateFor(session.client, project.id);
    assert.equal(state.jobs.length, 1);
    assert.equal(state.providerCalls.length, 0); // only a Codex image task is queued, no model invoked
    assert.equal(state.approvals[0].authorization.method, "automatic-policy");
    assert.equal(state.approvals[0].authorization.scopeDigest, state.approvals[0].scopeDigest);
    const { memory } = await callTool(session.client, "drama_upsert_memory", { projectId: project.id, scope: "series", kind: "canon", title: "Candidate", content: "Unapproved setting" });
    const review = await session.client.callTool({ name: "drama_review_memory", arguments: { projectId: project.id, memoryId: memory.id, version: memory.version, status: "approved" } });
    assert.equal(review.isError, true);
  } finally { await session.close(); }
});

test("policy setter starts nothing, validates modes and invalidates old pending scopes", async () => {
  const session = await openMcp({ mode: "automatic", supportsElicitation: false });
  try {
    const { project, approval } = await createPendingStaticBatch(session.client, "Mode change fixture");
    const changed = await callTool(session.client, "drama_set_execution_mode", { mode: "manual" });
    assert.equal(changed.startedJobs, 0);
    const state = await stateFor(session.client, project.id);
    assert.equal(state.jobs.length, 0);
    assert.equal(state.speech.requiresPaidApproval, true);
    const start = await session.client.callTool({ name: "drama_authorize_and_start_paid_batch", arguments: { approvalId: approval.id } });
    assert.equal(start.isError, true);
    assert.match(toolError(start), /MANUAL_APPROVAL_REQUIRED/);
    const invalid = await session.client.callTool({ name: "drama_set_execution_mode", arguments: { mode: "unlimited" } });
    assert.equal(invalid.isError, true);
    assert.equal((await stateFor(session.client, project.id)).providerCalls.length, 0);
  } finally { await session.close(); }
});

for (const action of ["accept", "cancel", "decline"]) {
  test(`memory activation requires trusted MCP confirmation: ${action}`, { timeout: 30_000 }, async () => {
    const requests = [];
    const session = await openMcp({ onElicitation: request => { requests.push(request); return { action, content: { confirm: true } }; } });
    try {
      const { project } = await callTool(session.client, "drama_create_project", { title: "Isolated memory approval test" });
      const { memory } = await callTool(session.client, "drama_upsert_memory", { projectId: project.id, scope: "series", kind: "canon", title: "Identity", content: "The approved hero wears a blue coat." });
      await callTool(session.client, "drama_review_memory", { projectId: project.id, memoryId: memory.id, version: memory.version, status: "approved" });
      assert.equal(requests.length, 1);
      assert.match(requests[0].params.message, /blue coat/);
      const state = await stateFor(session.client, project.id);
      assert.equal(state.projects[0].memories[0].status, action === "accept" ? "approved" : "candidate");
      assert.deepEqual(state.providerCalls, []);
    } finally { await session.close(); }
  });
}

test("MCP protocol exposes stable media bindings and persists contextual Skill routing", { timeout: 30_000 }, async () => {
  const session = await openMcp({ onElicitation: () => ({ action: "cancel" }) });
  try {
    const listed = await session.client.listTools();
    const updatePlan = listed.tools.find(tool => tool.name === "drama_update_plan");
    const routeSkillsTool = listed.tools.find(tool => tool.name === "drama_route_skills");
    assert.ok(updatePlan);
    assert.ok(routeSkillsTool);
    assert.ok(updatePlan.inputSchema.properties.shots.items.properties.sourceVideoAssetId);
    assert.ok(updatePlan.inputSchema.properties.shots.items.properties.sourceAudioAssetId);
    assert.match(updatePlan.description, /stable assetId/);
    assert.ok(routeSkillsTool.inputSchema.properties.projectId);
    assert.ok(routeSkillsTool.inputSchema.properties.creationId);

    const capabilities = await callTool(session.client, "drama_get_capabilities");
    assert.equal(capabilities.image.primary, "codex-imagegen");
    assert.equal(capabilities.image.seedream, false);

    const { project } = await callTool(session.client, "drama_create_project", { title: "MCP 路由上下文验证" });
    const { creation } = await callTool(session.client, "drama_create_creation", {
      projectId: project.id,
      title: "上下文创作页",
      type: "episode"
    });
    const routed = await callTool(session.client, "drama_route_skills", {
      request: "为无线耳机制作极简产品广告",
      projectId: project.id,
      creationId: creation.id,
      maxResults: 1
    });
    assert.equal(routed.persisted, true);
    assert.deepEqual(routed.context, { projectId: project.id, creationId: creation.id });
    assert.equal(routed.selected.length, 1);
    const after = await stateFor(session.client, project.id);
    const production = after.projects[0].creations.find(item => item.id === creation.id).plan;
    assert.deepEqual(production.selectedSkills, routed.selected.map(item => item.name));
    assert.equal(routed.planRevision, production.planRevision);
  } finally {
    await session.close();
  }
});

test("MCP form accept atomically creates exactly one job for one approval", { timeout: 30_000 }, async () => {
  const requests = [];
  const session = await openMcp({
    onElicitation: request => {
      requests.push(request);
      return { action: "accept", content: { confirm: true } };
    }
  });
  try {
    const { project, approval } = await createPendingStaticBatch(session.client, "MCP 批准原子性验证");
    const [first, second] = await Promise.all([
      callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id }),
      callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id })
    ]);

    assert.equal(requests.length, 2);
    assert.equal(requests[0].params.mode, "form");
    assert.equal(requests[0].params.requestedSchema.properties.confirm.type, "boolean");
    assert.match(requests[0].params.message, /最多图片调用：1/);
    assert.match(requests[0].params.message, /codex-imagegen/);
    assert.doesNotMatch(requests[0].params.message, /doubao-seedream/);
    assert.equal(first.job.id, second.job.id);

    const state = await stateFor(session.client, project.id);
    const jobs = state.jobs.filter(job => job.approvalId === approval.id);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].id, first.job.id);
    assert.equal(state.approvals.find(item => item.id === approval.id).jobId, first.job.id);
    assert.deepEqual(state.providerCalls, []);
  } finally {
    await session.close();
  }
});

test("MCP form cancel keeps the approval pending and creates no job", { timeout: 30_000 }, async () => {
  const requests = [];
  const session = await openMcp({
    onElicitation: request => {
      requests.push(request);
      return { action: "cancel" };
    }
  });
  try {
    const { project, approval } = await createPendingStaticBatch(session.client, "MCP 取消验证");
    const result = await callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id });
    assert.equal(requests.length, 1);
    assert.equal(result.status, "pending");
    assert.equal(result.job, null);

    const state = await stateFor(session.client, project.id);
    assert.equal(state.approvals.find(item => item.id === approval.id).status, "pending");
    assert.equal(state.jobs.some(job => job.approvalId === approval.id), false);
    assert.deepEqual(state.providerCalls, []);
  } finally {
    await session.close();
  }
});

test("MCP form decline rejects the approval and creates no job", { timeout: 30_000 }, async () => {
  const requests = [];
  const session = await openMcp({
    onElicitation: request => {
      requests.push(request);
      return { action: "decline" };
    }
  });
  try {
    const { project, approval } = await createPendingStaticBatch(session.client, "MCP 拒绝验证");
    const result = await callTool(session.client, "drama_authorize_and_start_paid_batch", { approvalId: approval.id });
    assert.equal(requests.length, 1);
    assert.equal(result.approval.status, "rejected");
    assert.equal(result.job, null);

    const state = await stateFor(session.client, project.id);
    const savedApproval = state.approvals.find(item => item.id === approval.id);
    assert.equal(savedApproval.status, "rejected");
    assert.equal(savedApproval.authorization.method, "mcp-elicitation");
    assert.equal(savedApproval.authorization.action, "decline");
    assert.equal(state.jobs.some(job => job.approvalId === approval.id), false);
    assert.deepEqual(state.providerCalls, []);
  } finally {
    await session.close();
  }
});

test("a client without elicitation support cannot authorize a paid batch", { timeout: 30_000 }, async () => {
  const session = await openMcp({ supportsElicitation: false });
  try {
    const { project, approval } = await createPendingStaticBatch(session.client, "MCP 不支持确认验证");
    const result = await session.client.callTool({
      name: "drama_authorize_and_start_paid_batch",
      arguments: { approvalId: approval.id }
    });
    assert.equal(result.isError, true);
    assert.match(toolError(result), /USER_CONFIRMATION_UNAVAILABLE/);

    const state = await stateFor(session.client, project.id);
    assert.equal(state.approvals.find(item => item.id === approval.id).status, "pending");
    assert.equal(state.jobs.some(job => job.approvalId === approval.id), false);
    assert.deepEqual(state.providerCalls, []);
  } finally {
    await session.close();
  }
});
