// Ark content contract. Capability declaration is not account/runtime verification.
export const VIDEO_INPUT_MODES = ["text-to-video", "image-to-video", "first-last-frame", "multimodal-reference", "video-extend", "video-edit"];
export const MEDIA_ROLES = { first_frame: "image", last_frame: "image", reference_image: "image", reference_video: "video", reference_audio: "audio" };
export const SEEDANCE_RATIOS = ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"];

export function seedanceProfile(model = "") {
  const v25 = /seedance-2-5-/.test(model);
  const v20 = /seedance-2-0(?:-|$)/.test(model);
  return { model, recognized: v25 || v20, version: v25 ? "2.5" : v20 ? "2.0" : "unknown",
    modes: VIDEO_INPUT_MODES, maxImages: v25 ? 30 : 9, maxVideos: v25 ? 10 : 3, maxAudios: v25 ? 10 : 3,
    maxReferenceSeconds: v25 ? 30 : 15, minimum: 4, maximum: v25 ? 30 : 15,
    resolutions: ["480p", "720p"], ratios: SEEDANCE_RATIOS, accountVerified: false };
}

export function shotMediaReferences(shot = {}) {
  if (Array.isArray(shot.mediaReferences) && shot.mediaReferences.length) return shot.mediaReferences;
  const ids = shot.referenceAssetIds || [];
  return ids.map(assetId => ({ assetId, role: ids.length === 1 && !["multimodal-reference", "video-edit", "video-extend"].includes(shot.videoInputMode) ? "first_frame" : "reference_image" }));
}

export function shotInputMode(shot = {}) {
  return shot.videoInputMode || (shotMediaReferences(shot).length > 1 ? "multimodal-reference" : "image-to-video");
}

export function shotNeedsImage(shot = {}) {
  return shot.generationMode === "static-motion" || (!["uploaded-video"].includes(shot.generationMode) && shotInputMode(shot) === "image-to-video" && !shot.continuation);
}

export function validateSeedanceRequest({ model, inputMode, inputs = [], parameters = {}, edit = null }) {
  const profile = seedanceProfile(model);
  const errors = [];
  const add = (code, field) => errors.push({ code, field });
  if (!profile.recognized) add("SEEDANCE_MODEL_PROFILE_UNVERIFIED", "model");
  if (!VIDEO_INPUT_MODES.includes(inputMode)) add("VIDEO_INPUT_MODE_UNSUPPORTED", "videoInputMode");
  const roles = inputs.map(input => input.providerRole || input.role);
  for (const [index, input] of inputs.entries()) {
    const role = roles[index];
    if (!MEDIA_ROLES[role] || (input.kind && input.kind !== MEDIA_ROLES[role])) add("VIDEO_REFERENCE_ROLE_KIND_INVALID", `inputs.${index}`);
  }
  const count = role => roles.filter(value => value === role).length;
  const frames = count("first_frame") + count("last_frame");
  if (inputMode === "text-to-video" && inputs.length) add("T2V_REFERENCES_NOT_ALLOWED", "inputs");
  if (inputMode === "image-to-video" && (inputs.length !== 1 || count("first_frame") !== 1)) add("FIRST_FRAME_REQUIRED", "inputs");
  if (inputMode === "first-last-frame" && (inputs.length !== 2 || count("first_frame") !== 1 || count("last_frame") !== 1)) add("FIRST_LAST_FRAME_REQUIRED", "inputs");
  if (["multimodal-reference", "video-edit", "video-extend"].includes(inputMode)) {
    if (frames) add("REFERENCE_AND_FRAME_MODES_CANNOT_MIX", "inputs");
    if (!inputs.length) add("MEDIA_REFERENCE_REQUIRED", "inputs");
    if (!/seedance-2-5-/.test(model) && inputs.length && roles.every(role => role === "reference_audio")) add("AUDIO_ONLY_REFERENCE_UNSUPPORTED", "inputs");
  }
  if (["video-edit", "video-extend"].includes(inputMode) && !count("reference_video")) add("SOURCE_REFERENCE_VIDEO_REQUIRED", "inputs");
  for (const [role, max] of [["reference_image", profile.maxImages], ["reference_video", profile.maxVideos], ["reference_audio", profile.maxAudios]]) {
    if (count(role) > max) add("SEEDANCE_REFERENCE_LIMIT_EXCEEDED", role);
  }
  if (!Number.isInteger(parameters.duration) || parameters.duration < profile.minimum || parameters.duration > profile.maximum) add("SEEDANCE_DURATION_UNSUPPORTED", "duration");
  if (!profile.ratios.includes(parameters.ratio)) add("SEEDANCE_RATIO_UNSUPPORTED", "ratio");
  if (!profile.resolutions.includes(parameters.resolution)) add("SEEDANCE_RESOLUTION_UNSUPPORTED", "resolution");
  if (typeof parameters.generate_audio !== "boolean") add("EXPLICIT_AUDIO_BOOLEAN_REQUIRED", "generate_audio");
  if (edit && (inputMode !== "video-edit" || !Number.isFinite(edit.startSeconds) || !Number.isFinite(edit.endSeconds) || edit.startSeconds < 0 || edit.endSeconds <= edit.startSeconds || !String(edit.instruction || "").trim())) add("VIDEO_EDIT_RANGE_INVALID", "edit");
  return errors;
}

export function providerContent(prompt, inputs) {
  return [{ type: "text", text: prompt }, ...inputs.map(input => {
    const kind = MEDIA_ROLES[input.providerRole || input.role];
    if (!kind) throw new Error("VIDEO_REFERENCE_ROLE_KIND_INVALID");
    const url = new URL(input.url);
    if (!["https:", "asset:"].includes(url.protocol)) throw new Error("SEEDANCE_REFERENCE_URL_UNSUPPORTED");
    return { type: `${kind}_url`, [`${kind}_url`]: { url: input.url }, role: input.providerRole || input.role };
  })];
}
