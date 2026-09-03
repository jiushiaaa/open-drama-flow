import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { dataRoot, pluginRoot, userSkillsRoot } from "./config.mjs";
import { specializedSkills } from "./skill-catalog.mjs";
import { canonicalSkillName, canonicalSkillFile, migrateSkillSettings } from "./skill-identifiers.mjs";

const builtInSkillsRoot = path.join(pluginRoot, "skills");
const registryPath = path.join(dataRoot, "skill-registry.json");
const blockedExtensions = new Set([".exe", ".dll", ".com", ".msi", ".lnk"]);
const maxArchiveFiles = 160;
const maxArchiveBytes = 20 * 1024 * 1024;

export const producerSkill = {
  name: "ai-drama-producer",
  slug: "ai-drama-producer",
  label: "AI 漫剧总制片",
  description: "负责全流程编剧、角色、分镜、素材、视频、剪辑与质量复核，并自动加载最合适的专业 Skill。",
  keywords: ["ai漫剧", "漫剧", "短剧", "全流程", "制片"],
  excludes: [],
  author: "OpenDramaFlow",
  origin: "built-in",
  source: "built-in"
};

function cleanScalar(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(content) {
  const match = String(content || "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("SKILL_FRONTMATTER_REQUIRED");
  const frontmatter = match[1];
  const name = cleanScalar(frontmatter.match(/^name:\s*(.+)$/m)?.[1]);
  let description = cleanScalar(frontmatter.match(/^description:\s*(.+)$/m)?.[1]);
  if (!description) {
    const block = frontmatter.match(/^description:\s*[>|][-+]?\s*\r?\n((?:[ \t]+.*(?:\r?\n|$))+)/m)?.[1] || "";
    description = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join(" ");
  }
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(name)) throw new Error("SKILL_NAME_INVALID");
  if (!description) throw new Error("SKILL_DESCRIPTION_REQUIRED");
  const firstHeading = String(content).match(/^#\s+(.+)$/m)?.[1]?.trim();
  return { name, description: description.slice(0, 800), label: (firstHeading || name).slice(0, 80) };
}

function wordsForSkill(name, description) {
  return [...new Set(`${name.replace(/-/g, " ")} ${description}`
    .toLowerCase()
    .match(/[\p{Script=Han}]{2,8}|[a-z][a-z0-9-]{2,}/gu) || [])].slice(0, 40);
}

function publicBuiltIn(entry) {
  return {
    ...entry,
    origin: "built-in",
    source: "built-in",
    author: entry.author || "OpenDramaFlow"
  };
}

function builtInCatalog() {
  return [producerSkill, ...specializedSkills.map(publicBuiltIn)];
}

async function readRegistry() {
  await fs.mkdir(userSkillsRoot, { recursive: true });
  try {
    const parsed = JSON.parse(await fs.readFile(registryPath, "utf8"));
    return { ...parsed, enabled: migrateSkillSettings(parsed.enabled || {}) };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return { enabled: {} };
  }
}

async function writeRegistry(registry) {
  await fs.mkdir(dataRoot, { recursive: true });
  const temp = `${registryPath}.${process.pid}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  await fs.rename(temp, registryPath);
}

async function userCatalog() {
  await fs.mkdir(userSkillsRoot, { recursive: true });
  const entries = await fs.readdir(userSkillsRoot, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(entry.name)) continue;
    try {
      const content = await fs.readFile(path.join(userSkillsRoot, entry.name, "SKILL.md"), "utf8");
      const meta = parseFrontmatter(content);
      if (meta.name !== entry.name) continue;
      results.push({ ...meta, slug: meta.name, keywords: wordsForSkill(meta.name, meta.description), excludes: [], source: "imported", origin: "imported", author: "本机导入" });
    } catch {}
  }
  return results.sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
}

export async function listManagedSkills({ enabledOnly = false } = {}) {
  const registry = await readRegistry();
  const combined = [...builtInCatalog(), ...await userCatalog()].map(skill => ({
    ...skill,
    enabled: registry.enabled[skill.name] !== false
  }));
  return enabledOnly ? combined.filter(skill => skill.enabled) : combined;
}

function skillDirectory(skill) {
  const root = skill.source === "imported" ? userSkillsRoot : builtInSkillsRoot;
  const directory = path.resolve(root, skill.name);
  if (path.dirname(directory) !== path.resolve(root)) throw new Error("SKILL_PATH_INVALID");
  return directory;
}

async function enumerateFiles(root, current = root, depth = 0) {
  if (depth > 6) return [];
  const entries = await fs.readdir(current, { withFileTypes: true });
  const output = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, "/");
    if (entry.isDirectory()) output.push({ path: `${relative}/`, type: "directory" }, ...await enumerateFiles(root, absolute, depth + 1));
    else if (entry.isFile()) output.push({ path: relative, type: "file" });
  }
  return output.slice(0, 300);
}

export async function getManagedSkill(name, requestedFile = "SKILL.md") {
  const legacy = name !== canonicalSkillName(name);
  name = canonicalSkillName(name);
  if (legacy) requestedFile = canonicalSkillFile(requestedFile);
  const skill = (await listManagedSkills()).find(item => item.name === name);
  if (!skill) throw new Error("SKILL_NOT_FOUND");
  const directory = skillDirectory(skill);
  const files = await enumerateFiles(directory);
  const normalized = String(requestedFile || "SKILL.md").replace(/\\/g, "/").replace(/^\/+/, "");
  const selected = files.find(item => item.type === "file" && item.path === normalized) ? normalized : "SKILL.md";
  const absolute = path.resolve(directory, selected);
  const relative = path.relative(directory, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("SKILL_FILE_PATH_INVALID");
  const stat = await fs.stat(absolute);
  if (stat.size > 1024 * 1024) throw new Error("SKILL_FILE_TOO_LARGE");
  const extension = path.extname(absolute).toLowerCase();
  const textual = [".md", ".txt", ".yaml", ".yml", ".json", ".js", ".mjs", ".cjs", ".py", ".ps1"].includes(extension);
  return { skill, files, selectedFile: selected, content: textual ? await fs.readFile(absolute, "utf8") : "", binary: !textual };
}

export async function setManagedSkillEnabled(name, enabled) {
  name = canonicalSkillName(name);
  if (!(await listManagedSkills()).some(item => item.name === name)) throw new Error("SKILL_NOT_FOUND");
  const registry = await readRegistry();
  registry.enabled[name] = Boolean(enabled);
  await writeRegistry(registry);
  return (await listManagedSkills()).find(item => item.name === name);
}

function validateRelativeFile(fileName) {
  const normalized = String(fileName || "").replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) || normalized.split("/").includes("..")) throw new Error("SKILL_ARCHIVE_PATH_INVALID");
  if (blockedExtensions.has(path.extname(normalized).toLowerCase())) throw new Error("SKILL_ARCHIVE_FILE_BLOCKED");
  return normalized;
}

async function installSkillFiles(files) {
  const skillEntry = files.find(item => item.relative.toLowerCase() === "skill.md");
  if (!skillEntry) throw new Error("SKILL_FILE_REQUIRED");
  const meta = parseFrontmatter(skillEntry.buffer.toString("utf8"));
  if (builtInCatalog().some(skill => skill.name === canonicalSkillName(meta.name))) throw new Error("SKILL_BUILT_IN_CONFLICT");
  const destination = path.join(userSkillsRoot, meta.name);
  try { await fs.access(destination); throw new Error("SKILL_ALREADY_EXISTS"); }
  catch (error) { if (error?.message === "SKILL_ALREADY_EXISTS") throw error; if (error?.code !== "ENOENT") throw error; }
  const staging = path.join(dataRoot, `.skill-import-${crypto.randomUUID()}`);
  await fs.mkdir(staging, { recursive: true });
  try {
    for (const file of files) {
      const relative = validateRelativeFile(file.relative);
      const target = path.resolve(staging, relative);
      const inside = path.relative(staging, target);
      if (inside.startsWith("..") || path.isAbsolute(inside)) throw new Error("SKILL_ARCHIVE_PATH_INVALID");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.buffer);
    }
    await fs.mkdir(userSkillsRoot, { recursive: true });
    await fs.rename(staging, destination);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return (await listManagedSkills()).find(skill => skill.name === meta.name);
}

export async function importSkillFile(fileName, buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("SKILL_FILE_REQUIRED");
  if (buffer.length > 8 * 1024 * 1024) throw new Error("SKILL_ARCHIVE_TOO_LARGE");
  if (String(fileName).toLowerCase().endsWith(".md")) {
    if (path.basename(String(fileName)).toLowerCase() !== "skill.md") throw new Error("SKILL_FILE_NAME_INVALID");
    return installSkillFiles([{ relative: "SKILL.md", buffer }]);
  }
  if (!String(fileName).toLowerCase().endsWith(".zip")) throw new Error("SKILL_FILE_TYPE_UNSUPPORTED");
  let entries;
  try { entries = new AdmZip(buffer).getEntries().filter(entry => !entry.isDirectory && !entry.entryName.startsWith("__MACOSX/")); }
  catch { throw new Error("SKILL_ARCHIVE_INVALID"); }
  if (!entries.length || entries.length > maxArchiveFiles) throw new Error("SKILL_ARCHIVE_FILE_COUNT_INVALID");
  const skillFiles = entries.filter(entry => /(^|\/)SKILL\.md$/i.test(entry.entryName));
  if (skillFiles.length !== 1) throw new Error("SKILL_ARCHIVE_REQUIRES_ONE_SKILL");
  const root = skillFiles[0].entryName.replace(/\\/g, "/").replace(/SKILL\.md$/i, "");
  const files = [];
  let total = 0;
  for (const entry of entries) {
    const normalized = validateRelativeFile(entry.entryName);
    if (!normalized.startsWith(root)) continue;
    const relative = validateRelativeFile(normalized.slice(root.length));
    const content = entry.getData();
    total += content.length;
    if (total > maxArchiveBytes) throw new Error("SKILL_ARCHIVE_EXPANDED_TOO_LARGE");
    files.push({ relative, buffer: content });
  }
  return installSkillFiles(files);
}

export async function createManagedSkill({ skillMd, files = {} }) {
  const payloads = [{ relative: "SKILL.md", buffer: Buffer.from(String(skillMd || ""), "utf8") }];
  for (const [fileName, content] of Object.entries(files || {})) {
    const relative = validateRelativeFile(fileName);
    if (relative.toLowerCase() === "skill.md") continue;
    payloads.push({ relative, buffer: Buffer.from(String(content), "utf8") });
  }
  return installSkillFiles(payloads);
}

export async function readManagedSkillInstructions(skill) {
  const content = await fs.readFile(path.join(skillDirectory(skill), "SKILL.md"), "utf8");
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}
