---
name: ai-drama-producer
description: Route and execute general AI video production through durable briefs, professional Skills, approval-gated image/video generation, deterministic editing, evidence-based review and verifiable delivery. Use for ads, ecommerce, brand films, KOC content, short drama, animation, MV, explainers and other video work so Codex can lead the full workflow without requiring manual Skill selection.
---

# AI 视频制片 Harness

Use the local `ai-drama-studio` MCP tools as the production source of truth. Read `references/routing-contract.md` before routing, `references/workflow-contract.md` before changing production state, `references/prompt-contract.md` before creating or revising shots, and `references/provider-contract.md` before any real model call.

The canonical chain is:

`load approved context -> understand request -> route and persist Skills -> create brief and shot contracts -> derive next actions -> obtain trusted approval -> generate and inspect -> recover/resume -> edit locally -> prepare and inspect review evidence -> record quality review -> finalize with SHA-256 manifest`

## Operating rules

1. Route every new creative request with `drama_route_skills` using the user's current wording plus the active `projectId`/`creationId`. The tool persists up to three ranked professional Skills on that plan revision. Do not ask the user to install, tick or manually choose a Skill.
2. Before every initial plan, replan or resume, read `drama_get_state`, then call `drama_get_context_pack` for the exact active `projectId`/`creationId` and current purpose. Plan from that returned, token-bounded approved context plus current durable state; do not substitute remembered chat or another creation/volume.
3. `drama_upsert_memory` creates only a candidate. It cannot influence planning, prompts or paid requests until its exact version is explicitly accepted through `drama_review_memory` and appears in a later context pack. Never copy a candidate into the plan to bypass review; after a memory decision, fetch a fresh context pack before planning again.
4. Understand the commercial goal before generating. Persist a complete `brief` with the objective, content type, audience, platform, duration, aspect ratio, language, brand/selling points/CTA when applicable, style, constraints, deliverables, acceptance criteria and source assets. The current delivery contract is one reviewed local MP4 per creation page; put additional ratios or variants in separate creation pages.
5. Re-read and verify the persisted `selectedSkills`, then use `drama_update_plan` to persist stable subject/character definitions and an ordered shot plan. Every new shot uses `promptContractVersion: 2`, separates the static `imagePrompt` from the motion-focused `videoPrompt`, and follows `references/prompt-contract.md`; the legacy single `prompt` exists only for migration compatibility.
6. After each material state change, call `drama_get_next_actions`. Execute its exact unblocked action instead of guessing a later stage. A material change opens a new revision, but invalidation is layered: visual/source changes discard affected generated evidence, edit-only changes preserve paid clips and require a new local render, and acceptance-only changes preserve the output bytes but require a fresh review.
7. If no project or creation exists, create a clearly named blank one only when needed. Never seed a sample story, fake asset or placeholder result.
8. Keep identity, costume, palette, locations, products and hero props in versioned asset records. Bind shots to stable `assetId` and approved versions; moving or renaming folders must not change asset identity.
9. Before paid work, compile the provider request and call `drama_request_paid_batch` to freeze the current revision, approved-memory context, input asset versions, generation settings, call caps and exact provider `requestDigest`. Then call `drama_authorize_and_start_paid_batch`; only its trusted MCP form may authorize and start the batch. A changed digest requires a new approval.
10. Never approve a paid batch on the user's behalf. HTTP endpoints, ordinary chat text, button state, booleans supplied by the agent, or a string saying “approved” are not authorization. If MCP elicitation is unavailable or the user does not confirm, stop with the approval pending and make no provider call.
11. For `codex-imagegen`, claim one queued task, generate one candidate unless the approved cap permits more, inspect the saved file, and then complete or fail the task honestly. Never attach an uninspected file as accepted evidence.
12. Preserve provider task IDs, call records and successful partial outputs. An uncertain timeout is recoverable state, not proof of failure; query/resume the original work before considering another paid call. A retry is another call unless authoritative billing evidence proves otherwise.
13. Resume only the original waiting job with `drama_resume_paid_batch`, so the immutable approval and remaining caps continue to apply. Never create a replacement approval merely to bypass an exhausted cap or uncertain call.
14. Use `drama_render_project` and FFmpeg for deterministic concat, timing, crop/scale, subtitles, audio preservation/mixing and export. FFmpeg success proves that a file was rendered; it does not prove creative correctness or delivery.
15. Immediately after each render, call `drama_prepare_quality_evidence` for the current output, then actually open and inspect the returned evidence frames before calling `drama_record_quality_review`. Cite concrete frame labels/timestamps and applicable full-video audio, subtitle and motion checks. Extraction, hashes and a populated manifest prove only that review material exists; they are never an automatic pass.
16. Call `drama_finalize_delivery` last. Delivery is complete only when the output still matches the reviewed file and the Harness creates a SHA-256 manifest. This tool records a local delivery; it does not imply upload, publication or delivery to another person.
17. Treat the currently loaded provider adapter as the only authority for model capabilities. Do not claim or plan unsupported reference types, modes, durations, resolutions, audio or editing features merely because a model or tutorial advertises them.
18. Use the current Codex task as the sole conversational control surface. Persist production work through MCP so the canvas reflects it automatically; never require a duplicate plugin chat, manual node creation or manual connection as part of the production path.
19. Never paste, request, echo, log or store an API key in chat or project files. The user configures credentials locally.

## Codex Image Gen loop

For each queued image task:

1. Claim the task.
2. Re-read current state and the task's frozen plan revision, shot prompt and exact input asset bindings.
3. Generate only within the approved attempt budget.
4. Inspect subject/product identity, composition, artifacts, text, crop safety and any shot-specific acceptance criteria.
5. Save the accepted master in the project asset directory and complete the task with its absolute local path plus inspection evidence.
6. If generation or inspection fails, record the real reason with `drama_fail_image_task`; do not invent an asset.
7. If downstream Seedance needs the image, rely only on the controlled HTTPS bridge or a trusted `asset://` reference described in `references/provider-contract.md`.

## Completion evidence

A production is delivered only when all applicable evidence exists:

- a persisted commercial brief and persisted `selectedSkills`;
- stable subject/character/product definitions and an ordered, revisioned shot plan;
- an inspected image or approved source asset for every shot that needs one;
- a succeeded video task, uploaded video, or deliberately declared `static-motion` treatment for every rendered shot;
- a deterministic local edit whose ordered inputs and asset versions are recorded;
- a generated quality-evidence pack whose returned frames were actually opened and inspected;
- an evidence-based quality review against the brief and shot acceptance criteria, distinct from evidence extraction;
- an unchanged playable final file with a SHA-256 delivery manifest;
- unsupported capabilities and remaining provider risks stated explicitly.

Queued, running, waiting, rendered, downloaded and visually plausible are intermediate states, not synonyms for delivered.
