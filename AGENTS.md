# OpenDramaFlow working agreement

## Scope and autonomy

Follow the user's current objective and existing authorization. Requests to build, fix, produce media, organize files, or continue an existing task authorize the necessary in-scope work. Questions and reviews remain read-only unless implementation is also requested.

Proceed through routine reversible choices without asking again. State material assumptions. Ask only when missing information changes the goal, creates an irreversible outcome, exceeds the authorized spending/call limit, or requires an explicit approval that has not been given. A long-running task should continue between stages; a timer is for recovery, not an artificial stage gate.

## Implementation

- Inspect current files, branch, uncommitted changes, and applicable project context first. Preserve concurrent work; coordinate ownership where edits overlap.
- Make the smallest change that solves the observed problem. Do not add speculative features or refactor unrelated code.
- Validate changed behavior with proportionate checks. Report baseline failures separately from regressions and never claim a test, playback, model call, or installation happened without evidence.
- When the user authorizes publication, prepare and verify the concrete changes, then publish within that scope. Keep credentials, private runtime state, account data, full source novels and third-party reference media out of public commits. Explicitly selected public examples belong in `production/publish-examples/`.

## Production invariants

- Use the producer contract and live capabilities for generation. Default `automatic` executes within the authorized objective and frozen budgets; `manual` still requires trusted approval. These project instructions never change Codex host permissions.
- Unknown paid submissions must be reconciled using the original task ID before another call. Preserve successful outputs and recover failed postprocessing without paying for generation again.
- Default image generation uses the current Codex built-in image tool. Show candidates and obtain acceptance before import, unless the user has explicitly delegated image checking for that exact project/scope. Record delegated Agent review as such, never as user inspection of a specific image. Preserve locked masters and approved memory gates.
- Read project-specific instructions only for the matching project. Episode-one preferences and experiments do not become universal defaults or authorization for episode two.
- Preserve approved scripts, dialogue, assets and master versions. Local repairs must identify the affected interval and retained content. Distinguish technical checks, actual viewing/listening, user acceptance, and outstanding review.
- Approved local-media inspection and deterministic export can proceed from verified files when MCP is unavailable. Record input/output hashes and the operation. This does not authorize new generation, budget changes, asset admission, memory activation, or a false MCP delivery claim.
- Before deletion or migration, resolve exact paths and active references, protect final masters and dependent assets, and verify copies before switching or removing originals. Absence from a keep list alone is not evidence that a file is disposable. Do not stop unrelated tasks or Codex itself.

## Verification entrypoints

From `plugins/ai-drama-studio`: `npm run check`, `npm test`, `node scripts/sync-skill-manifest.mjs --check`, and `node scripts/verify-skill-mcp.mjs [installed-plugin-root]`. The MCP check uses disposable data and makes no model calls. Follow the installed system `plugin-creator` skill for marketplace validation, cachebuster and reinstall; do not hand-edit user marketplace/config files.
