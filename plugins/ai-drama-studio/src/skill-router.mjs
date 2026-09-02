import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { specializedSkills } from "./skill-catalog.mjs";

const skillsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "skills");
const genericProducer = {
  name: "ai-drama-producer",
  label: "AI 漫剧制片人",
  description: "通用的 AI 漫剧全流程总导演，负责项目状态、剧本、分镜、素材、审批、视频和剪辑。",
  origin: "project",
  author: "OpenDramaFlow"
};

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function countOccurrences(haystack, needle) {
  if (!needle || !haystack.includes(needle)) return 0;
  let count = 0;
  let cursor = 0;
  while ((cursor = haystack.indexOf(needle, cursor)) !== -1) {
    count += 1;
    cursor += needle.length;
  }
  return count;
}

function scoreEntry(entry, request) {
  const normalizedRequest = normalize(request);
  const directName = normalize(entry.name.replace(/^minimax-/, ""));
  let score = normalizedRequest.includes(directName) ? 30 : 0;
  const matches = [];
  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalize(keyword);
    const occurrences = countOccurrences(normalizedRequest, normalizedKeyword);
    if (!occurrences) continue;
    score += (8 + Math.min(normalizedKeyword.length, 12)) * occurrences;
    matches.push(keyword);
  }
  for (const exclusion of entry.excludes) {
    if (normalizedRequest.includes(normalize(exclusion))) score -= 18;
  }
  return { score, matches };
}

function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

async function loadSkill(entry) {
  const directory = path.resolve(skillsRoot, entry.name);
  if (!directory.startsWith(`${skillsRoot}${path.sep}`)) throw new Error("SKILL_PATH_INVALID");
  const content = await fs.readFile(path.join(directory, "SKILL.md"), "utf8");
  return stripFrontmatter(content);
}

export async function routeSkills(request, maxResults = 3) {
  const limit = Math.min(Math.max(Number.parseInt(maxResults, 10) || 3, 1), 5);
  const ranked = specializedSkills
    .map(entry => ({ entry, ...scoreEntry(entry, request) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.name.localeCompare(right.entry.name))
    .slice(0, limit);

  if (!ranked.length) {
    return {
      request: String(request || ""),
      fallback: true,
      selected: [{ ...genericProducer, score: 0, matchedKeywords: [], instructions: await loadSkill(genericProducer) }]
    };
  }

  return {
    request: String(request || ""),
    fallback: false,
    selected: await Promise.all(ranked.map(async item => ({
      name: item.entry.name,
      label: item.entry.label,
      description: item.entry.description,
      origin: item.entry.origin,
      author: item.entry.author,
      score: item.score,
      matchedKeywords: item.matches,
      instructions: await loadSkill(item.entry)
    })))
  };
}

export function listSkills() {
  return specializedSkills.map(({ name, label, description, origin, author, keywords }) => ({ name, label, description, origin, author, keywords }));
}
