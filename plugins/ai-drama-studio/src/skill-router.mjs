import { listManagedSkills, readManagedSkillInstructions } from "./skill-registry.mjs";

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
  let score = directName && normalizedRequest.includes(directName) ? 30 : 0;
  const matches = [];
  for (const keyword of entry.keywords || []) {
    const normalizedKeyword = normalize(keyword);
    const occurrences = countOccurrences(normalizedRequest, normalizedKeyword);
    if (!occurrences) continue;
    score += (8 + Math.min(normalizedKeyword.length, 12)) * occurrences;
    matches.push(keyword);
  }
  for (const exclusion of entry.excludes || []) {
    if (normalizedRequest.includes(normalize(exclusion))) score -= 18;
  }
  return { score, matches };
}

export async function routeSkills(request, maxResults = 3) {
  const limit = Math.min(Math.max(Number.parseInt(maxResults, 10) || 3, 1), 5);
  const skills = await listManagedSkills({ enabledOnly: true });
  const producer = skills.find(skill => skill.name === "ai-drama-producer");
  const ranked = skills
    .filter(skill => skill.name !== "ai-drama-producer")
    .map(entry => ({ entry, ...scoreEntry(entry, request) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.name.localeCompare(right.entry.name))
    .slice(0, limit);

  const selected = ranked.length ? ranked : producer ? [{ entry: producer, score: 0, matches: [] }] : [];

  return {
    request: String(request || ""),
    fallback: !ranked.length,
    selected: await Promise.all(selected.map(async item => ({
      name: item.entry.name,
      label: item.entry.label,
      description: item.entry.description,
      origin: item.entry.origin,
      author: item.entry.author,
      score: item.score,
      matchedKeywords: item.matches,
      instructions: await readManagedSkillInstructions(item.entry)
    })))
  };
}

export async function listSkills() {
  return listManagedSkills();
}
