// Legacy identifiers are confined to this compatibility boundary, never the public catalog.
import { specializedSkills } from "./skill-catalog.mjs";

export const legacySkillIdentifiers = Object.freeze(Object.fromEntries(specializedSkills.filter(skill => skill.legacyIdentifier !== false).map(skill => [
  `minimax-${skill.name.replace(/^seedance-/, "h3-")}`, skill.name
])));

export function canonicalSkillName(value) {
  const name = String(value || "").trim();
  return legacySkillIdentifiers[name] || name;
}

export function canonicalSkillNames(values = []) {
  return [...new Set(values.map(value => canonicalSkillName(typeof value === "string" ? value : value?.name)).filter(Boolean))];
}

export function migrateSkillSettings(enabled = {}) {
  // Preserve unknown/imported entries. An explicitly saved canonical value wins,
  // including false; do not resurrect a disabled skill when both names exist.
  return Object.fromEntries(Object.entries(enabled).map(([name, value]) => {
    const canonical = canonicalSkillName(name);
    return [canonical, Object.hasOwn(enabled, canonical) ? enabled[canonical] : value];
  }));
}

export function canonicalSkillFile(value) {
  return String(value || "SKILL.md").replace(/minimax-h3/g, "seedance")
    .replace(/h3-/g, "seedance-").replace(/official-hilo/g, "seedance")
    .replace(/modes-t2va\.md$/, "text-to-video.md").replace(/modes-i2va\.md$/, "image-to-video.md")
    .replace(/modes-fl2va\.md$/, "first-last-frame.md").replace(/modes-l2va\.md$/, "last-frame-boundary.md")
    .replace(/atlas-cloud-api\.md$/, "runtime-tools-contract.md");
}
