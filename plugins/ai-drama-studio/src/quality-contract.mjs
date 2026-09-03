export function shotExpectsAudio(shot) {
  return Boolean(shot.sourceAudioAssetId || shot.audioMode === "provider-native" || shot.audio || Object.values(shot.soundPlan || {}).some(Boolean));
}

export function reviewRequirements(shots = []) {
  let cursor = 0;
  return shots.map((shot, index) => {
    const start = cursor; cursor += Number(shot.duration);
    return { shotId: shot.id, start, end: cursor,
      required: { motion: shot.generationMode !== "static-motion", identity: Boolean(shot.subjectIds?.length || shot.continuityConstraints?.length),
        continuity: index > 0 || Boolean(shot.continuation), audio: shotExpectsAudio(shot),
        dialogue: Boolean(shot.soundPlan?.dialogue), subtitles: Boolean(shot.subtitle), editPreservation: shot.videoInputMode === "video-edit" },
      expectedDialogue: shot.soundPlan?.dialogue || "", expectedSubtitles: shot.subtitle || "", preserve: shot.edit?.preserve || [], edit: shot.edit || null };
  });
}

export function validatePlaybackReview(input, evidence, shots, decision) {
  if (!evidence.temporal || input.playbackSourceSha256 !== evidence.source.sha256) throw new Error("QUALITY_PLAYBACK_EVIDENCE_REQUIRED");
  if (evidence.temporal.audioPlayback && input.listenedAudioSha256 !== evidence.temporal.audioPlayback.sha256) throw new Error("QUALITY_AUDIO_LISTENING_REQUIRED");
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const requirements = reviewRequirements(shots);
  if (observations.length !== requirements.length) throw new Error("QUALITY_EVERY_SHOT_PLAYBACK_REQUIRED");
  return requirements.map(requirement => {
    const matches = observations.filter(item => item.shotId === requirement.shotId);
    const row = matches[0];
    if (matches.length !== 1 || !Number.isFinite(row.start) || !Number.isFinite(row.end) || Math.abs(row.start - requirement.start) > 0.1 || Math.abs(row.end - requirement.end) > 0.1 || !String(row.notes || "").trim()) throw new Error("QUALITY_PLAYBACK_SPAN_INVALID");
    for (const [check, required] of Object.entries(requirement.required)) {
      if (!["passed", "failed", "not-applicable"].includes(row[check])) throw new Error(`QUALITY_OBSERVATION_REQUIRED:${check}`);
      if (decision === "passed" && (row[check] === "failed" || (required && row[check] !== "passed"))) throw new Error(`QUALITY_OBSERVATION_NOT_PASSED:${check}`);
    }
    if (requirement.required.dialogue && !String(row.heardDialogue || "").trim()) throw new Error("QUALITY_HEARD_DIALOGUE_REQUIRED");
    if (requirement.required.subtitles && !String(row.observedSubtitles || "").trim()) throw new Error("QUALITY_OBSERVED_SUBTITLES_REQUIRED");
    return { ...row, expectedDialogue: requirement.expectedDialogue, expectedSubtitles: requirement.expectedSubtitles, edit: requirement.edit };
  });
}
