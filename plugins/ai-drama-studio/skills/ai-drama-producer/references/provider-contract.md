# Provider Contract

## Credentials

The Ark key is entered only in local settings, protected by the host credential mechanism, and never returned through MCP state tools. Never request, paste, echo, log or persist it in project content.

## Paid-call authorization

`drama_request_paid_batch` creates an immutable pending snapshot of the current plan revision, prompts, generation settings, exact input asset bindings and maximum image/video call counts. It does not authorize or start anything.

Only `drama_authorize_and_start_paid_batch` may transition that snapshot to execution, and only after the user accepts the trusted MCP form displayed by the server. The following are never approval:

- an HTTP request or local web UI action;
- a normal chat message interpreted by the agent;
- a string, boolean or tool argument asserting approval;
- approval inferred from previous work or silence.

If elicitation is unavailable, cancelled or not affirmatively confirmed, leave the request pending and perform zero provider calls. Start at most one job for one approval. Enforce both call caps; a failed or claimed attempt consumes its cap unless authoritative billing evidence establishes otherwise.

## Codex Image Gen

Codex Image Gen is an agent tool route, not a localhost provider endpoint. Claim the exact queued task, generate within its frozen prompt and budget, save and inspect the image, then complete it with the absolute local path and structured inspection evidence. Record failure honestly instead of attaching a placeholder.

The resulting asset must keep a stable `assetId`, version and approval/revision binding. Downstream work must use the exact approved version, not whichever file is newest.

## Seedream

- Endpoint: `POST {arkBaseUrl}/images/generations`.
- The model ID is system-managed by the installed adapter.
- Persist the provider-call reservation before dispatch so restart or timeout cannot silently create a duplicate.
- Download temporary provider output immediately and record the immutable local master, call status and task/result evidence.
- An uncertain call must be reconciled before retrying.

## Seedance adapter boundary

- Create: `POST {arkBaseUrl}/contents/generations/tasks`.
- Query: `GET {arkBaseUrl}/contents/generations/tasks/{id}`.
- The current Harness adapter supports an integer duration of 4–15 seconds per generated clip and at most one provider-readable reference image supplied as `https://...` or trusted `asset://...`.
- A Windows/local filesystem path is not a valid Seedance `image_url`. The controlled bridge may expose an approved local image over HTTPS; otherwise stop at the bridge boundary.
- Persist the provider task ID and exact input `assetId`/version before polling. Creation or `running` status is not success; only `succeeded` plus a downloaded local clip is usable evidence.
- Timeouts and indeterminate transport errors remain uncertain. Query the recorded task before any retry.
- The model ID and generation profile are system-managed by the installed adapter; changing them requires a verified adapter migration.

The current adapter does **not** claim arbitrary multiple reference images, reference video, uploaded audio conditioning, managed voice cloning, managed TTS/music, 3D scene editing, or professional NLE project export. If a routed Skill describes one of these creative techniques, explain the missing adapter and stop or use a genuinely available alternative approved by the user. Never simulate completion with prose, a local path or an unrelated output.

## Local editing and delivery boundary

FFmpeg may deterministically concatenate, crop/scale, time, subtitle, preserve/mix available audio and encode a local file. The current delivery scope is one reviewed local MP4 per creation page; create separate pages for additional aspect ratios or variants. A successful FFmpeg command proves only that rendering completed.

It does not prove that the story, identity, brand, continuity, subtitles, sound or acceptance criteria are correct. Delivery requires actual inspection, a passed evidence-based review, revalidation that the file has not changed, and a SHA-256 manifest from `drama_finalize_delivery`.
