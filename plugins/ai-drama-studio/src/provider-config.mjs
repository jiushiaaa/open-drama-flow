import { z } from "zod";
import { VENDORS, PROFILES, CUSTOM_PROTOCOLS } from "./provider-presets.mjs";
import { providerUrl } from "./provider-network.mjs";
import { readState, mutateState } from "./store.mjs";
import { hasArkKey, hasSpeechKey, hasProviderKey, saveArkKey, saveSpeechKey, saveProviderKey, clearArkKey, clearSpeechKey, clearProviderKey } from "./secrets.mjs";

export const customProviderSchema = z.object({
  id: z.string().regex(/^custom-[a-z0-9][a-z0-9-]{0,45}$/), name: z.string().trim().min(1).max(80),
  baseUrl: z.string().url().max(500), protocol: z.enum(CUSTOM_PROTOCOLS), model: z.string().trim().regex(/^[a-zA-Z0-9][a-zA-Z0-9._/:-]{0,159}$/),
  submitPath: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).max(240), notes: z.string().max(500).default("")
}).strict().superRefine((v, ctx) => {
  try { const url = providerUrl(v.baseUrl); if (url.search) throw new Error(); } catch { ctx.addIssue({ code: "custom", message: "PROVIDER_PUBLIC_HTTPS_REQUIRED" }); }
  if (v.submitPath.startsWith("//") || v.submitPath.includes("..")) ctx.addIssue({ code: "custom", message: "PROVIDER_PATH_INVALID" });
});
export function configuredVendors(state) {
  return [...VENDORS, ...(state.settings.customProviders || []).map(v => ({ ...v, region: "自定义", credentials: ["apiKey"], custom: true }))];
}
export function configuredProfiles(state) {
  return [...PROFILES, ...(state.settings.customProviders || []).map(v => ({ id: v.id, provider: v.id, name: `${v.name} · ${v.model}`, model: v.model,
    protocol: v.protocol, baseUrl: v.baseUrl, submitPath: v.submitPath, kind: v.protocol.endsWith("tts") ? "audio" : v.protocol.endsWith("image") ? "image" : "video",
    inputs: ["text"], tool: "drama_prepare_provider_job", custom: true }))];
}
export async function saveCustomProvider(input) {
  const config = customProviderSchema.parse(input);
  config.baseUrl = config.baseUrl.replace(/\/$/, "");
  return mutateState(s => {
    if ((s.settings.customProviders || []).length >= 50 && !s.settings.customProviders.some(p => p.id === config.id)) throw new Error("CUSTOM_PROVIDER_LIMIT");
    // Endpoint/protocol changes require a distinct identity and a newly entered credential.
    const old = s.settings.customProviders?.find(p => p.id === config.id);
    if (old && ["baseUrl", "protocol", "submitPath", "model"].some(k => old[k] !== config[k])) throw new Error("PROVIDER_CONNECTION_IMMUTABLE_CREATE_NEW_ID");
    s.settings.customProviders = [...(s.settings.customProviders || []).filter(p => p.id !== config.id), config]; return config;
  });
}
export function credentialSlot(id, field) { return field === "apiKey" && ["fal", "replicate"].includes(id) ? id : `vendor-${id}-${field.toLowerCase()}`; }
export async function vendorCredentials(v) {
  const result = {};
  for (const field of v.credentials) result[field] = v.id === "ark" ? await hasArkKey() : v.id === "speech" ? await hasSpeechKey() : await hasProviderKey(credentialSlot(v.id, field));
  return result;
}
export async function changeVendorSecret(id, field, value, remove = false) {
  const v = configuredVendors(await readState()).find(v => v.id === id);
  if (!v || !v.credentials.includes(field)) throw new Error("SECRET_PROVIDER_INVALID");
  if (id === "ark") return remove ? clearArkKey() : saveArkKey(value);
  if (id === "speech") return remove ? clearSpeechKey() : saveSpeechKey(value);
  return remove ? clearProviderKey(credentialSlot(id, field)) : saveProviderKey(credentialSlot(id, field), value);
}
