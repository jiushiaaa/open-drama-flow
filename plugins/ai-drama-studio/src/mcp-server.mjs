#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { hasArkKey } from "./secrets.mjs";
import { listSkills, routeSkills } from "./skill-router.mjs";
import { readState } from "./store.mjs";
import { claimTask, completeTask, createApproval, createProject, resumeRealPipeline, startLocalRender, updateProjectPlan } from "./workflow.mjs";

const server = new McpServer({ name: "ai-drama-studio", version: "0.1.0" });

function result(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

server.registerTool("drama_get_state", {
  description: "Read local AI drama projects, shots, jobs, approvals and Codex media tasks. Secrets are never returned.",
  inputSchema: { projectId: z.string().optional().describe("Optional project ID to narrow the result") }
}, async ({ projectId }) => {
  const state = await readState();
  const projects = projectId ? state.projects.filter(project => project.id === projectId) : state.projects;
  return result({ credentialStatus: { arkConfigured: await hasArkKey() }, settings: state.settings, projects, jobs: state.jobs.filter(job => !projectId || job.projectId === projectId), approvals: state.approvals.filter(item => !projectId || item.projectId === projectId), tasks: state.tasks.filter(task => !projectId || task.projectId === projectId), recentEvents: state.events.slice(0, 20) });
});

server.registerTool("drama_route_skills", {
  description: "Automatically identify and load the most relevant OpenDramaFlow creative skills for a user request. Call this before planning any image, video, drama, ad, MV, explainer, dubbing or editing task so the user never has to choose skills manually.",
  inputSchema: {
    request: z.string().min(1).max(4000).describe("The user's current creative request, kept in the user's original language"),
    maxResults: z.number().int().min(1).max(5).optional().describe("Maximum specialized skills to load; defaults to 3")
  }
}, async ({ request, maxResults }) => result(await routeSkills(request, maxResults)));

server.registerTool("drama_list_skills", {
  description: "List all Codex-adapted MiniMax creative skills available in OpenDramaFlow without loading their full instructions.",
  inputSchema: {}
}, async () => result({ count: listSkills().length, skills: listSkills() }));

server.registerTool("drama_create_project", {
  description: "Create a local AI drama project. This makes no model call.",
  inputSchema: { title: z.string().min(1).max(80), logline: z.string().max(500).optional() }
}, async input => result({ project: await createProject(input) }));

server.registerTool("drama_update_plan", {
  description: "Write a formal story plan, character bible and ordered shot list into a project. This is the main Codex authoring tool and makes no model call.",
  inputSchema: {
    projectId: z.string(),
    title: z.string().max(80).optional(),
    logline: z.string().max(500).optional(),
    premise: z.string().max(1200).optional(),
    scenes: z.array(z.object({ id: z.string().optional(), heading: z.string(), summary: z.string() })).max(100).optional(),
    characters: z.array(z.object({ id: z.string().optional(), name: z.string(), visual: z.string() })).max(50).optional(),
    shots: z.array(z.object({ id: z.string().optional(), duration: z.number().min(0.5).max(30), scene: z.string(), framing: z.string(), prompt: z.string(), subtitle: z.string().optional() })).max(300).optional()
  }
}, async ({ projectId, ...plan }) => result({ project: await updateProjectPlan(projectId, plan) }));

server.registerTool("drama_request_paid_batch", {
  description: "Create a pending approval for real Seedream/Seedance calls. This tool never approves or runs the paid batch.",
  inputSchema: { projectId: z.string(), maxImageCalls: z.number().int().min(0).max(20).optional(), maxVideoCalls: z.number().int().min(0).max(20).optional() }
}, async ({ projectId, ...limits }) => result({ approval: await createApproval(projectId, limits) }));

server.registerTool("drama_resume_paid_batch", {
  description: "Resume a waiting real batch after all Codex Image Gen tasks have been completed. The original approval and remaining call caps still apply.",
  inputSchema: { jobId: z.string() }
}, async ({ jobId }) => result({ job: await resumeRealPipeline(jobId) }));

server.registerTool("drama_render_project", {
  description: "Deterministically edit available Seedance clips and static image shots into a local MP4 with an audio track and timed Chinese subtitles. No model call.",
  inputSchema: { projectId: z.string() }
}, async ({ projectId }) => result({ job: await startLocalRender(projectId) }));

server.registerTool("drama_claim_image_task", {
  description: "Claim one queued Codex Image Gen task before invoking Codex image generation.",
  inputSchema: { taskId: z.string() }
}, async ({ taskId }) => result({ task: await claimTask(taskId, "codex") }));

server.registerTool("drama_complete_image_task", {
  description: "Attach an image generated by Codex to its shot. remoteUrl is optional but required later if Seedance cannot access the local file.",
  inputSchema: { taskId: z.string(), localPath: z.string().min(1), remoteUrl: z.string().url().optional() }
}, async ({ taskId, localPath, remoteUrl }) => result({ task: await completeTask(taskId, localPath, remoteUrl || "") }));

const transport = new StdioServerTransport();
await server.connect(transport);
