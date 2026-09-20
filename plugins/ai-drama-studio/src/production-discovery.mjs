import { z } from "zod";
import { fileHash } from "./upscale.mjs";
import { stageContracts } from "./production-stages.mjs";
import { agentHost } from "./platform.mjs";

export const WORKFLOWS = [
  { id: "drama", name: "剧情 / 小说漫剧", skills: ["novel-comic-drama-preproduction", "character-scene-storyboard", "film-shot"], stages: ["原文依据与改编边界", "角色 / 场景母版验收", "分场拍摄脚本", "空间与动作预演", "版本锁定的多参考生成", "对白 / 连续性复核", "剪辑与交付"] },
  { id: "advertising", name: "广告 / 电商", skills: ["brand-ad", "minimalist-product-ad-generator"], stages: ["品牌与产品事实", "受众 / 卖点 / CTA", "产品一致性参考", "短镜头与文案", "视频生成", "商标 / 字幕 / 宣称核对", "平台规格交付"] },
  { id: "explainer", name: "知识 / 教学", skills: ["education-studio", "transcript-broll-planner"], stages: ["证据与知识提纲", "逐字稿", "镜头与素材映射", "旁白与演示", "字幕与音画同步", "事实复核", "成片交付"] },
  { id: "music-video", name: "MV / 节奏短片", skills: ["cool-music-video", "music-video-subtitle-generator"], stages: ["音乐权利与节奏结构", "视觉主题", "分镜与节拍点", "视觉素材生成", "节拍剪辑 / 歌词同步", "听看复核", "交付"] },
  { id: "motion", name: "动效 / 产品演示", skills: ["ui-motion", "digital-product-promo-generator"], stages: ["真实界面与品牌规范", "信息层级", "时间线与转场", "确定性动效优先", "必要镜头生成", "文字 / 界面可读性检查", "交付"] }
];
export function selectWorkflow(type, enabledSkillNames) {
  const workflow = WORKFLOWS.find(w => w.id === type); if (!workflow) throw new Error("PRODUCTION_TYPE_UNSUPPORTED");
  return { ...workflow, contractVersion: 1, stageContracts: stageContracts(type, workflow.stages),
    journalTools: ["drama_get_production_progress", "drama_record_stage_checkpoint", "drama_record_production_decision"],
    knowledgeTool: "drama_read_production_knowledge",
    skills: workflow.skills.map(name => ({ name, enabled: enabledSkillNames.includes(name) })),
    defaults: { image: agentHost.codexImageGen ? "codex-imagegen" : "configured-image-api-default-ark-seedream", video: "configured-provider-default-ark", audio: "doubao-speech-if-configured-otherwise-seedance-native" },
    next: "Use drama_update_plan to persist the actual brief and shot contracts; this selection itself creates no assets, approvals or model calls." };
}
export const assetSearchSchema = z.object({ projectId: z.string(), creationId: z.string().optional(), shotId: z.string().optional(), query: z.string().max(2000).default(""),
  kind: z.enum(["image", "video", "audio", "document", "all"]).default("all"), limit: z.number().int().min(1).max(50).default(12), includeCandidates: z.boolean().default(false)
}).strict();
function terms(value) { const text = String(value || "").toLocaleLowerCase(); return [...new Set([...text.matchAll(/[a-z0-9_-]+|[\p{Script=Han}]{1,2}/gu)].map(m => m[0]))]; }
export async function searchShotAssets(state, input, hash = fileHash) {
  const request = assetSearchSchema.parse(input), project = state.projects.find(p => p.id === request.projectId);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const creation = request.creationId ? project.creations?.find(c => c.id === request.creationId) : null;
  if (request.creationId && !creation) throw new Error("CREATION_NOT_FOUND");
  const production = creation && creation.planSource !== "project-legacy" ? creation.plan || {} : project;
  const shot = request.shotId ? production.shots?.find(s => s.id === request.shotId) : null;
  if (request.shotId && !shot) throw new Error("SHOT_NOT_FOUND");
  const keywords = terms([request.query, shot?.title, shot?.description, shot?.prompt, shot?.imagePrompt, shot?.videoPrompt].filter(Boolean).join(" "));
  const matches = [];
  for (const asset of project.assets || []) {
    if (asset.stale || asset.deletedAt || asset.status === "rejected" || asset.status === "superseded" || (request.kind !== "all" && asset.kind !== request.kind)) continue;
    const folder = project.assetFolders?.find(f => f.id === asset.folderId);
    const candidate = asset.scope === "candidate" || folder?.scope === "candidate" || asset.status === "candidate";
    if (candidate && !request.includeCandidates) continue;
    if (creation && asset.creationId && asset.creationId !== creation.id && asset.scope === "creation") continue;
    if (creation?.worldId && asset.worldId && asset.worldId !== creation.worldId) continue;
    const searchable = [asset.name, asset.originalName, asset.description, ...(asset.tags || []), folder?.name].filter(Boolean).join(" ").toLocaleLowerCase();
    const matched = keywords.filter(word => searchable.includes(word));
    const ref = creation?.assetRefs?.find(r => r.assetId === asset.id && Number(r.version) === Number(asset.version || 1));
    const reasons = [...(asset.shotId === shot?.id && shot ? ["same-shot"] : []), ...(ref ? [ref.locked ? "locked-creation-reference" : "creation-reference"] : []), ...matched.map(word => `metadata:${word}`)];
    if (!reasons.length && keywords.length) continue;
    matches.push({ asset, reasons, score: matched.length + (asset.shotId === shot?.id && shot ? 30 : 0) + (ref?.locked ? 20 : ref ? 10 : 0), ref, candidate });
  }
  matches.sort((a, b) => b.score - a.score || String(a.asset.id).localeCompare(String(b.asset.id)));
  const results = [];
  for (const { asset, score, reasons, ref, candidate } of matches.slice(0, request.limit)) {
    const actual = asset.localPath ? await hash(asset.localPath).catch(() => null) : null;
    results.push({ assetId: asset.id, familyId: asset.familyId || asset.id, version: asset.version || 1, sha256: asset.sha256 || null, kind: asset.kind,
      name: asset.originalName || asset.name, localPath: asset.localPath, score, reasons, bytesCurrent: Boolean(actual && actual === asset.sha256),
      acceptance: candidate ? "candidate" : asset.inspection?.accepted ? "inspection-recorded" : ref?.locked ? "locked-reference" : "registered-acceptance-unspecified",
      sourceRange: asset.derivedFrom || null, next: "drama_inspect_asset; view/listen before reference selection" });
  }
  return { results, ranking: "shot/creation bindings plus lexical metadata; not visual embeddings or inferred motion", automaticAdmission: false };
}
