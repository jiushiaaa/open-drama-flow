import fs from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const references = [
  { id: "stage-director", layer: "production", path: "skills/ai-drama-producer/references/stage-contract.md", when: "开始、恢复阶段或记录制作决策时" },
  { id: "execution-contract", layer: "production", path: "skills/ai-drama-producer/references/execution-contract.md", when: "涉及执行权限、预算或验收边界时" },
  { id: "seedance-inputs", layer: "technical", path: "skills/ai-drama-producer/references/provider-contract.md", when: "提交 Seedance / 豆包请求前，核对当前能力工具而非假设广告能力" },
  { id: "seedance-prompts", layer: "technical", path: "skills/ai-drama-producer/references/seedance-prompting.md", when: "编译 Seedance 镜头提示词时" },
  { id: "local-edit", layer: "technical", path: "skills/clip-studio-craft/references/local-edit-tools.md", when: "编写 FFmpeg 本地剪辑、音频及复用计划时" },
  { id: "provider-upscale", layer: "technical", path: "docs/toolchain.md", when: "使用 fal / Replicate、配置本地 Real-ESRGAN 或检查费用语义时" }
];

export function knowledgeForTool(id) {
  if (id === "seedance-video") return ["execution-contract", "seedance-inputs", "seedance-prompts"];
  if (id.startsWith("speech-") || id === "seedream-image") return ["execution-contract", "seedance-inputs"];
  if (["real-esrgan-upscale", "external-text-generation"].includes(id)) return ["execution-contract", "provider-upscale"];
  if (id.startsWith("drama_process_local_audio") || ["drama_edit_local_media", "drama_compare_local_edits", "drama_prepare_audio_event_evidence"].includes(id)) return ["local-edit"];
  return ["stage-director"];
}

export function knowledgeIndex() {
  return { version: 1, layers: [
    { id: "capability", sources: ["drama_list_tool_capabilities", "drama_select_production_workflow"], purpose: "Executable capabilities, input limits, dependencies and stage contracts" },
    { id: "production", sources: ["drama_route_skills", "stage-director", "execution-contract"], purpose: "Codex directs and self-reviews; code retains authorization and validation" },
    { id: "technical", sources: references.filter(r => r.layer === "technical").map(r => r.id), purpose: "Load only selected tool references; availability is determined by live capability tools" }
  ], references, authority: "Technical references do not override user scope, runtime constraints or production acceptance. No automatic Skill rewrite or network research." };
}

export async function readProductionKnowledge(id) {
  const entry = references.find(r => r.id === id);
  if (!entry) throw new Error("KNOWLEDGE_REFERENCE_UNKNOWN");
  const content = await fs.readFile(new URL(entry.path, root), "utf8");
  return { ...entry, sha256: createHash("sha256").update(content).digest("hex"), content };
}
