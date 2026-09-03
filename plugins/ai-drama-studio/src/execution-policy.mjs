// Product execution policy is independent of the Codex host's sandbox permissions.
export function executionMode(settings = {}) {
  const mode = settings.executionMode ?? "automatic";
  if (!["automatic", "manual"].includes(mode)) throw new Error("EXECUTION_MODE_INVALID");
  return mode;
}

export function hasExecutionAuthorization(approval) {
  const evidence = approval?.authorization;
  if (evidence?.method === "mcp-elicitation") return true;
  return approval?.scopeSnapshot?.executionMode === "automatic"
    && evidence?.method === "automatic-policy" && evidence.action === "start"
    && Boolean(approval.scopeDigest) && evidence.scopeDigest === approval.scopeDigest;
}

export function confirmationOutcome(answer) {
  return {
    action: ["accept", "decline", "cancel"].includes(answer?.action) ? answer.action : "unknown",
    confirmed: answer?.action === "accept" && answer?.content?.confirm === true,
    at: new Date().toISOString()
  };
}
