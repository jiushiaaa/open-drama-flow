import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { specializedSkills } from "../src/skill-catalog.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const targetSkillsRoot = path.join(pluginRoot, "skills");

const sourceRoots = {
  user: process.env.MINIMAX_USER_SKILLS_ROOT || "C:\\Users\\C2023\\.hub\\skills",
  core:
    process.env.MINIMAX_CORE_SKILLS_ROOT ||
    "D:\\Program Files (x86)\\MiniMax Design\\current\\resources\\agent-profiles\\v2\\config\\skills"
};

const bundledRoot =
  process.env.MINIMAX_BUNDLED_PLUGINS_ROOT ||
  "D:\\Program Files (x86)\\MiniMax Design\\current\\resources\\bundled-plugins";

const pluginSourceRoots = {
  "3d-director-stage": path.join(bundledRoot, "3d-director-stage", "skills"),
  "clip-studio-craft": path.join(bundledRoot, "clip-studio", "skills")
};

const TEXT_EXTENSIONS = new Set(["", ".csv", ".json", ".md", ".py", ".txt", ".yaml", ".yml"]);

const LEGACY_TOOL_REPLACEMENTS = new Map([
  ["hub_canvas_group_recent_outputs", "drama_update_plan（记录最近产物关系）"],
  ["hub_canvas_apply_text_edits", "drama_update_plan（写入已确认的结构化文本）"],
  ["hub_canvas_get_selection", "drama_get_state（读取当前项目选择与状态）"],
  ["hub_generate_audio_speech", "已接入并获授权的 TTS 供应商；未接入时仅输出配音合同"],
  ["hub_generate_audio_music", "用户授权音乐或已接入的音乐供应商；未接入时不得生成"],
  ["hub_canvas_grep_text", "drama_get_state（检索项目脚本与镜头）"],
  ["hub_canvas_get_node", "drama_get_state（读取项目实体）"],
  ["hub_canvas_write_node", "drama_update_plan（写入项目实体）"],
  ["hub_canvas_read_text", "drama_get_state（读取项目文本）"],
  ["hub_save_file_to_session", "保存到真实项目资产/输出目录并登记产物"],
  ["hub_generate_video", "drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）"],
  ["hub_generate_image", "Codex Image Gen 任务领取、生成、目检与回填流程"],
  ["hub_analyse_media", "本地媒体核验（view_image、ffprobe 或 FFmpeg）"],
  ["hub_list_capabilities", "核验当前工具注册表与供应商合同"],
  ["hub_get_asset_relations", "drama_get_state（读取资产与镜头关系）"],
  ["hub_audio_analyze_music", "ffprobe/FFmpeg 音频节拍与时长分析"],
  ["hub_generate_music", "用户授权音乐或已接入的音乐供应商；未接入时不得生成"],
  ["hub_generate_audio", "已接入并获授权的音频供应商；未接入时不得生成"],
  ["hub_subtitle_format", "本地字幕格式化与 FFmpeg 烧录流程"],
  ["hub_audio_meta", "ffprobe 音频元数据核验"],
  ["hub_image_search", "联网图片检索（须核验来源与授权）"],
  ["hub_video_edit", "本地 FFmpeg 剪辑或 drama_render_project"],
  ["hub_ffmpeg", "本地 FFmpeg"],
  ["hub_read", "读取本地文件或 drama_get_state"],
  ["minimax_h3_video_generation", "Seedance 2.5 视频生成审批链"],
  ["asset_uri", "项目资产本地路径、Asset ID 或供应商可访问 URL"],
  ["opencode", "Codex"]
]);

const SKILL_BOUNDARIES = {
  "clip-studio-craft": "没有真实剪辑工程适配器时，只能用 FFmpeg 产出可核验媒体文件，不得声称已写入剪辑软件工程。",
  "h3-prompt-expert": "把 H3 当作待迁移的旧输入语法，不是当前模型。最终交付必须是 Seedance 2.5 可执行的连续自然语言，并重新核验时长、画幅、参考资产和音频约束。",
  "h3-visual-design": "保留旧 H3 的视觉设计方法，但执行提示词必须改写给 Seedance 2.5；旧模型的参数、时长、原生音频和参考模式不能直接继承。",
  "video-prompting": "当前可执行生成路线只有 Codex Image Gen 与获批后的 Seedance 2.5。Kling、Veo、Wan 等章节仅可作为比较资料，除非项目以后真实接入对应供应商。"
};

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function assertInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing path outside target root: ${candidate}`);
  }
}

function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

function adaptText(content, entry) {
  let adapted = String(content).replace(/\r\n/g, "\n");
  for (const [legacy, replacement] of [...LEGACY_TOOL_REPLACEMENTS].sort(
    (left, right) => right[0].length - left[0].length
  )) {
    adapted = adapted.replaceAll(legacy, replacement);
  }
  adapted = adapted
    .replace(
      /视频生成默认使用\s*(?:MiniMax[- ]?)?H3[^。\n]*。/gi,
      "视频生成默认使用项目锁定的 Seedance 2.5 配置；模型 ID 与生成档位由 OpenDramaFlow 运行时管理。"
    )
    .replace(
      /(?:调用|使用|交给|提交给)\s*(?:MiniMax[- ]?)?H3/gi,
      "先把旧 H3 意图改写成连续自然语言，再通过审批链调用 Seedance 2.5"
    )
    .replace(/MiniMax[- ]?H3/gi, "__LEGACY_MINIMAX_H3__")
    .replace(/\bH3\b/g, "旧 H3")
    .replaceAll("__LEGACY_MINIMAX_H3__", "旧 MiniMax H3")
    .replace(/`question`\s*工具/g, "当前对话中的澄清或确认")
    .replace(/question\s*工具/g, "当前对话中的澄清或确认")
    .replace(/MiniMax Design Canvas/g, "OpenDramaFlow 项目工作台")
    .replace(/MiniMax Canvas/g, "OpenDramaFlow 项目工作台")
    .replace(/MiniMax 专属 Canvas/g, "OpenDramaFlow 项目工作台")
    .replace(/本会话 canvas/g, "当前 OpenDramaFlow 项目")
    .replace(/写回 canvas/g, "通过 drama_update_plan 写回项目")
    .replace(/写入 canvas/g, "通过 drama_update_plan 写入项目")
    .replace(/从 canvas/g, "从 drama_get_state 返回的项目状态中")
    .replace(/allowed-tools\s*:[^\n]*/g, "")
    .replace(/\n{3,}/g, "\n\n");

  if (entry?.slug === "h3-prompt-expert") {
    adapted = adapted
      .replace(/旧 MiniMax H3 提示词/g, "Seedance 2.5 提示词（从旧 H3 结构迁移）")
      .replace(/旧 H3 prompt/gi, "Seedance 2.5 prompt（从旧 H3 结构迁移）")
      .replace(/最终提示词只使用官方 Seedance 2\.5 提示词（从旧 H3 结构迁移）格式。/g, "最终提示词只使用当前 Seedance 2.5 可执行的连续自然语言格式。")
      .replace(/只使用官方旧 H3 格式/g, "只输出当前 Seedance 2.5 可执行格式")
      .replace(/只使用官方 旧 H3 格式/g, "只输出当前 Seedance 2.5 可执行格式")
      .replace(/官方旧 H3 结构/g, "经核验的 Seedance 2.5 结构")
      .replace(/官方 旧 H3 结构/g, "经核验的 Seedance 2.5 结构");
  }

  if (entry?.slug === "h3-visual-design") {
    adapted = adapted
      .replace(/旧 MiniMax H3 Prompt/g, "Seedance 2.5 执行提示词（由旧 H3 语法迁移）")
      .replace(/旧 H3 Prompt/g, "Seedance 2.5 执行提示词（由旧 H3 语法迁移）");
  }
  return adapted.trimEnd() + "\n";
}

async function walkFiles(root) {
  const output = [];
  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) output.push(absolute);
    }
  }
  await visit(root);
  return output;
}

function sourceRootFor(entry) {
  if (entry.origin === "plugin") return pluginSourceRoots[entry.slug];
  return path.join(sourceRoots[entry.origin], entry.slug);
}

function renderEntrypoint(entry, supportFiles) {
  const focus = entry.focus.map(item => `- ${item}`).join("\n");
  const quality = entry.quality.map(item => `- ${item}`).join("\n");
  const references = supportFiles
    .filter(file => file.startsWith("references/"))
    .map(file => `- [${file}](./${file})`)
    .join("\n");
  const assets = supportFiles
    .filter(file => !file.startsWith("references/") && file !== "meta.yaml")
    .map(file => `- [${file}](./${file})`)
    .join("\n");
  const boundary = SKILL_BOUNDARIES[entry.slug]
    ? `\n## 本能力的硬边界\n\n${SKILL_BOUNDARIES[entry.slug]}\n`
    : "";

  return `---
name: ${entry.name}
description: ${entry.description} 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# ${entry.label}（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 \`references/\`；不要一次性加载无关资料。
3. 先调用 \`drama_get_state\` 获取真实项目状态；能力重叠时调用 \`drama_route_skills\`，并由得分最高的专用 Skill 主导。
4. 用 \`drama_update_plan\` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

${focus}

## 质量锁

${quality}

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 \`drama_request_paid_batch\` 后由用户批准，再以 \`drama_resume_paid_batch\` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 \`drama_render_project\`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 \`image_url\`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。
${boundary}
## 专业资料索引

${references || "- 本 Skill 的完整专业细节位于 [WORKFLOW.md](./WORKFLOW.md)。"}

${assets ? `## 脚本与数据\n\n${assets}\n` : ""}`.trimEnd() + "\n";
}

function renderWorkflow(entry, sourceBody) {
  return `# ${entry.label}：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 \`drama_get_state\`，正式剧本/角色/镜头写入使用 \`drama_update_plan\`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

---

${adaptText(sourceBody, entry)}`;
}

async function migrateSkill(entry) {
  const sourceRoot = sourceRootFor(entry);
  if (!sourceRoot) throw new Error(`No source root mapping for ${entry.name}`);
  const sourceFiles = await walkFiles(sourceRoot);
  const targetRoot = path.join(targetSkillsRoot, entry.name);
  assertInside(targetSkillsRoot, targetRoot);
  await fs.mkdir(targetRoot, { recursive: true });

  const records = [];
  const supportFiles = [];
  let sourceSkillBody = "";

  for (const sourceFile of sourceFiles) {
    const relative = toPosix(path.relative(sourceRoot, sourceFile));
    const sourceBuffer = await fs.readFile(sourceFile);
    let targetRelative = relative;
    let targetBuffer = sourceBuffer;
    let mode = "copied";

    if (relative === "SKILL.md") {
      targetRelative = "WORKFLOW.md";
      sourceSkillBody = stripFrontmatter(sourceBuffer.toString("utf8"));
      targetBuffer = Buffer.from(renderWorkflow(entry, sourceSkillBody), "utf8");
      mode = "adapted";
    } else if (TEXT_EXTENSIONS.has(path.extname(relative).toLowerCase())) {
      targetBuffer = Buffer.from(adaptText(sourceBuffer.toString("utf8"), entry), "utf8");
      mode = targetBuffer.equals(sourceBuffer) ? "copied" : "adapted";
      supportFiles.push(targetRelative);
    } else {
      supportFiles.push(targetRelative);
    }

    const targetFile = path.join(targetRoot, ...targetRelative.split("/"));
    assertInside(targetRoot, targetFile);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, targetBuffer);
    records.push({
      sourcePath: relative,
      sourceSha256: sha256(sourceBuffer),
      targetPath: targetRelative,
      targetSha256: sha256(targetBuffer),
      mode
    });
  }

  if (!sourceSkillBody) throw new Error(`Missing SKILL.md in ${sourceRoot}`);
  supportFiles.sort();
  const entrypoint = renderEntrypoint(entry, supportFiles);
  await fs.writeFile(path.join(targetRoot, "SKILL.md"), entrypoint, "utf8");

  return {
    name: entry.name,
    slug: entry.slug,
    origin: entry.origin,
    author: entry.author,
    entrypointSha256: sha256(Buffer.from(entrypoint, "utf8")),
    files: records
  };
}

const manifest = {
  schemaVersion: 1,
  sourceProduct: "MiniMax Design",
  targetRuntime: "OpenDramaFlow / AI Drama Studio",
  generatedBy: "scripts/migrate-minimax-skills.mjs",
  skillCount: specializedSkills.length,
  skills: []
};

for (const entry of specializedSkills) {
  manifest.skills.push(await migrateSkill(entry));
}

const manifestPath = path.join(targetSkillsRoot, "MINIMAX_MIGRATION_MANIFEST.json");
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const sourceFileCount = manifest.skills.reduce((sum, skill) => sum + skill.files.length, 0);
const referenceFileCount = manifest.skills.reduce(
  (sum, skill) => sum + skill.files.filter(file => file.sourcePath.startsWith("references/")).length,
  0
);
console.log(
  JSON.stringify(
    {
      skills: manifest.skillCount,
      sourceFiles: sourceFileCount,
      references: referenceFileCount,
      manifest: manifestPath
    },
    null,
    2
  )
);
