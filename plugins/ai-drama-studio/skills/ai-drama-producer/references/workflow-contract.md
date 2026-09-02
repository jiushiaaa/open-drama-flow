# Workflow Contract

## State precedence

1. The user's current explicit instruction.
2. Current creation revision and its persisted brief, selected Skills and shot contracts from `drama_get_state`.
3. The latest `drama_get_context_pack` result for the exact active project, creation and planning purpose; it contains approved memory only.
4. Version-bound accepted assets, provider-call records, jobs, tasks, reviews and delivery manifests.
5. Skill defaults.

Never treat a prior chat promise, UI label or old revision as stronger than current durable evidence.

## Production graph

The required control loop is:

1. Read `drama_get_state`, then fetch `drama_get_context_pack` for the exact active project, creation and purpose.
2. Understand the request and material constraints from current state plus that approved context.
3. Route professional Skills and persist `selectedSkills`.
4. Persist the complete brief, subjects/characters/products and ordered shot contracts.
5. Call `drama_get_next_actions` and resolve its blockers in order.
6. Freeze a paid-batch scope with `drama_request_paid_batch` when model calls are required.
7. Ask through `drama_authorize_and_start_paid_batch`; only an accepted MCP form starts paid work.
8. Generate, inspect, complete/fail tasks, poll recorded provider tasks, and resume the same waiting job when necessary.
9. Render deterministic inputs locally with `drama_render_project`.
10. Run `drama_prepare_quality_evidence`, open and inspect its returned frames, and perform applicable full-video motion/audio/subtitle checks.
11. Persist the resulting observations with `drama_record_quality_review`.
12. Revalidate the reviewed bytes and create the SHA-256 manifest with `drama_finalize_delivery`.

Call `drama_get_next_actions` again after any plan edit, completed task, resumed job, render or review failure. It is the authoritative stage transition, not a decorative checklist.

## Stage gates

| Stage | Required evidence before advancing |
|---|---|
| Intent | objective, content type, audience/platform, duration/aspect, exactly one local MP4 deliverable per creation page, and acceptance criteria |
| Context | fresh context pack scoped to the exact active creation and purpose; only explicitly approved memory included |
| Route | selected professional Skills persisted on the current plan revision |
| Subjects | stable, version-aware character/product/scene definitions and source asset bindings |
| Storyboard | ordered shot ID, duration, framing, action, generation mode, prompt, audio/subtitle intent and acceptance criteria |
| Approval | immutable scope snapshot plus call caps, confirmed through the MCP form |
| Images | inspected local master bound to the approved shot revision; provider-accessible reference only when needed downstream |
| Videos | recorded provider task reached `succeeded` and its local clip exists, or an explicit uploaded/static-motion treatment applies |
| Edit | ordered input bindings and successful FFmpeg/local render job |
| Review evidence | evidence pack generated for the current rendered bytes and every returned frame actually opened |
| Review | frame observations plus applicable full-video motion/audio/subtitle checks; required acceptance criteria have evidence |
| Delivery | reviewed bytes unchanged and SHA-256 delivery manifest recorded |

Jobs may be `queued`, `running`, `waiting`, `succeeded`, `failed` or superseded by a new revision. Only evidence bound to the current revision can advance its production graph.

## Revision and recovery rules

- A material brief or shot change opens a new revision. Visual/source changes invalidate affected generated images and clips; order/subtitle/audio edit changes preserve paid clips but invalidate the local edit; acceptance-only changes preserve output bytes but invalidate review and delivery evidence.
- `drama_upsert_memory` creates a candidate, not active production context. Only an exact version moved to `approved` by `drama_review_memory` may appear in a later context pack. `superseded`, `disabled`, draft and candidate entries remain excluded.
- Fetch a new context pack before every initial plan, replan or resume. An approved-memory change can stale a bound paid approval; do not continue from a previously fetched pack or silently copy candidate text into the brief or prompts.
- Approval binds exact prompts, settings, references, asset IDs and asset versions. Do not silently substitute the newest file or a similarly named asset.
- Persist provider task IDs before polling. On timeout or uncertain transport failure, query that task or resume its original job; do not automatically resubmit.
- Preserve successful partial outputs and record the exact failed stage. Recovery must continue from recorded evidence and the original cap.
- A completed image task must record the resulting asset identity. A later folder move or rename cannot change that identity.

## Deterministic edit and quality gate

Use FFmpeg/local editing for operations that do not require creative inference. The render result must record its input shots and asset versions. A process exit code of zero establishes only that encoding completed.

Immediately after rendering, call `drama_prepare_quality_evidence` for that output. Open every returned frame path and inspect the pixels; a successful command, frame count, byte size, checksum or manifest is evidence preparation, not visual acceptance. Use frame labels, timestamps and shot IDs in review notes. Because still frames cannot establish motion, synchronization or sound quality, inspect the playable output for those dimensions whenever they apply.

Before delivery, inspect the actual rendered file for all applicable dimensions:

- visual integrity and crop/framing;
- identity, product and brand accuracy;
- continuity and shot order;
- subtitle timing/readability and dialogue match;
- audio presence, synchronization and acceptable levels;
- every brief-level and shot-level acceptance criterion.

A passed review must include concrete evidence and remain bound to the reviewed file. If the file changes afterward, review it again. `drama_finalize_delivery` is the only completion transition and must create a SHA-256 manifest for the unchanged output.

## Interaction and canvas boundary

The current Codex task is the conversational control surface. Ask decision-changing questions and report progress there. The plugin canvas is a projection of persisted production state and evidence, not a second chat client or a manual node editor required to make the workflow run.

Create and update briefs, assets, shots, jobs, outputs and review evidence through MCP so their canvas nodes and links can be derived automatically. The user may inspect or correct the resulting state, but never require them to recreate the prompt in another input, add a node, or connect workflow edges before Codex can continue.

## Cost strategy

Choose duration, shot count and generation mode from the user's distribution goal and approved budget. Use deterministic/static motion deliberately where it meets the brief; reserve generative video for shots that require it. Never create a demo episode, sample story or placeholder media merely to validate the Harness.
