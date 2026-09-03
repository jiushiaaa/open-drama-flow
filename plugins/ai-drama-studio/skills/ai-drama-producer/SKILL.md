---
name: ai-drama-producer
description: Route and execute general AI video production through durable briefs, professional Skills, bounded automatic image/video generation with optional manual approval, deterministic editing, evidence-based review and verifiable delivery. Use for ads, ecommerce, brand films, KOC content, short drama, animation, MV, explainers and other video work so Codex can lead the full workflow without requiring manual Skill selection.
---

# AI 视频制片 Harness

Use the local `ai-drama-studio` MCP tools as the production source of truth. Read [execution rules](references/execution-contract.md) first; their automatic/manual policy and acceptance boundaries govern every specialist. Read `references/routing-contract.md` before routing, `references/workflow-contract.md` before changing production state, `references/prompt-contract.md` and [the Seedance guide](references/seedance-prompting.md) before creating or revising shots, and `references/provider-contract.md` before any real model call.

Before generating, editing or importing generated images, read [the image asset contract](references/image-asset-contract.md). Default to the current Codex session's built-in image tool (called image2 by the user), show candidates outside the project library, and import only the exact images the user accepts. This applies in automatic mode and overrides older migrated instructions to inspect and immediately write back. Use the project's image model only on explicit user request or verified built-in-tool unavailability/failure.

The canonical chain is:

`load approved context -> understand request -> route and persist Skills -> create brief and shot contracts -> derive next actions -> freeze capped scope and apply execution policy -> generate and inspect -> recover/resume -> edit locally -> prepare and inspect review evidence -> record quality review -> finalize with SHA-256 manifest`

## Operating rules

1. Route every new creative request with `drama_route_skills` using the user's current wording plus the active `projectId`/`creationId`. The tool persists up to three ranked professional Skills on that plan revision. Do not ask the user to install, tick or manually choose a Skill.
2. Before every initial plan, replan or resume, read `drama_get_state`, then call `drama_get_context_pack` for the exact active `projectId`/`creationId` and current purpose. Use `drama_search_memory` to retrieve relevant approved passages from long bibles; retain returned provenance. Plan from scoped approved context plus durable state, not remembered chat or another volume.
3. Read original library documents with `drama_read_memory_source`, paging until the needed source range is covered. Propose source-quoted candidates through `drama_extract_memory_candidates`; extraction validates quotations and source versions, not factual truth. `drama_upsert_memory` also creates only candidates. Only user acceptance through the trusted `drama_review_memory` form activates an exact candidate version. Never copy unapproved candidates into a production plan. Fetch fresh context after approval.
4. Understand the commercial goal before generating. Persist a complete `brief` with the objective, content type, audience, platform, duration, aspect ratio, language, brand/selling points/CTA when applicable, style, constraints, deliverables, acceptance criteria and source assets. The current delivery contract is one reviewed local MP4 per creation page; put additional ratios or variants in separate creation pages.
5. Re-read and verify the persisted `selectedSkills`, then use `drama_update_plan` to persist stable subject/character definitions and an ordered shot plan. Every new shot uses `promptContractVersion: 2`, separates the static `imagePrompt` from the motion-focused `videoPrompt`, and follows `references/prompt-contract.md`; the legacy single `prompt` exists only for migration compatibility.
6. After each material state change, call `drama_get_next_actions`. Execute its exact unblocked action instead of guessing a later stage. A material change opens a new revision, but invalidation is layered: visual/source changes discard affected generated evidence, edit-only changes preserve paid clips and require a new local render, and acceptance-only changes preserve the output bytes but require a fresh review.
7. If no project or creation exists, create a clearly named blank one only when needed. Never seed a sample story, fake asset or placeholder result.
8. Keep identity, costume, palette, locations, products and hero props in versioned asset records. Bind shots to stable `assetId` and approved versions; moving or renaming folders must not change asset identity.
9. Before paid work, compile the provider request and call `drama_request_paid_batch` to freeze the current revision, approved-memory context, input asset versions, generation settings, call caps, execution policy and exact provider `requestDigest`. Then call `drama_authorize_and_start_paid_batch`. The default `automatic` policy starts this bounded user-requested work without a product confirmation popup and records `automatic-policy`, not fabricated human confirmation. A changed digest requires a newly frozen scope.
10. When the user explicitly asks for per-call approval, call `drama_set_execution_mode` with `manual` before preparing work; when they request automatic operation, set `automatic`. Never switch modes merely to escape a blocked manual confirmation. In manual mode only an accepted trusted MCP form with confirm=true starts work; cancellation, missing confirmation or unavailable elicitation means zero calls. Policy changes do not start jobs or rewrite old pending/rejected records. Codex host permissions remain independent and must be respected. Production memory activation still requires explicit approval in either mode.
11. For `codex-imagegen`, follow the image asset contract: when a valid queued task exists, claim once and generate within its cap; inspect and show the candidate, then wait for user acceptance before completing/importing. Standalone image work uses the built-in tool directly without inventing a video brief or task. An image task is not complete merely because the Agent inspected it.
12. Preserve provider task IDs, call records and successful partial outputs. An uncertain timeout is recoverable state, not proof of failure; query/resume the original work before considering another paid call. A retry is another call unless authoritative billing evidence proves otherwise.
13. Resume only the original waiting job with `drama_resume_paid_batch`, so the immutable approval and remaining caps continue to apply. Never create a replacement approval merely to bypass an exhausted cap or uncertain call.
14. Use `drama_render_project` and FFmpeg for deterministic concat, timing, crop/scale, subtitles, audio preservation/mixing and export. FFmpeg success proves that a file was rendered; it does not prove creative correctness or delivery.
15. Immediately after each render, call `drama_prepare_quality_evidence` for the current output, then actually open and inspect the returned evidence frames before calling `drama_record_quality_review`. Cite concrete frame labels/timestamps and applicable full-video audio, subtitle and motion checks. Extraction, hashes and a populated manifest prove only that review material exists; they are never an automatic pass.
16. Call `drama_finalize_delivery` last. Delivery is complete only when the output still matches the reviewed file and the Harness creates a SHA-256 manifest. This tool records a local delivery; it does not imply upload, publication or delivery to another person.
17. Treat the currently loaded provider adapter as the only authority for model capabilities. Do not claim or plan unsupported reference types, modes, durations, resolutions, audio or editing features merely because a model or tutorial advertises them.
18. Use the current Codex task as the sole conversational control surface. Persist production work through MCP so the canvas reflects it automatically; never require a duplicate plugin chat, manual node creation or manual connection as part of the production path.
19. Never paste, request, echo, log or store an API key in chat or project files. The user configures credentials locally.

## Library and multimodal video loop

1. Import authorized local files with `drama_import_asset`, or select existing stable library asset IDs. Organize with folders without duplicating identity.
2. Call `drama_inspect_asset` for metadata, actual playback/audio paths and reference compatibility. Actually inspect images/video and listen when sound matters. Metadata or sampled frames alone cannot establish media meaning. If this host cannot play/listen, leave semantic review pending.
3. Use `drama_prepare_reference_asset` to make a bounded video/audio segment or supported-format derivative when necessary. Check its returned inspection; conversion does not guarantee acceptable dimensions or aesthetic quality. Bind the returned derivative ID/version, not the original oversized file.
4. Set `videoInputMode`, ordered `mediaReferences`, explicit `audioMode`, and supported `videoParameters` following the prompt/provider contracts. First+last constraints, multimodal references, extension and edit are distinct requests, not interchangeable labels.
5. For continuity, use `continuation: { shotId, source: "video" | "last-frame" }` referring only to a preceding generated shot. Use `source: "video"` for extension; a last-frame chain conditions the next shot rather than guaranteeing temporal identity.
6. Freeze the exact compiled requests and execute according to the current automatic/manual policy. After generation, verify the actual clip duration, movement, identity, native sound and intended edit preservation; provider success alone is not acceptance.
7. Prepare quality evidence, then inspect all frames AND play the full output/listen to its extracted audio. Submit `playbackSourceSha256`, applicable `listenedAudioSha256`, and one timestamped observation for each shot covering motion, identity, continuity, dialogue, audio, subtitles and edit preservation. Include heard dialogue and observed subtitles. Signal scans only flag silence/freezes/black frames; they never auto-pass semantic quality.

## Optional speech loop

Read `speech` from `drama_get_capabilities` before planning sound. Seedance native sound remains the primary route, with explicit `audioMode: provider-native` for shots that need it (keep intentionally silent shots as `none`). A missing speech key is not a production blocker. Do not request credentials in chat.

When a speech key is configured, read `references/provider-contract.md` for the speech boundary. Use `drama_request_speech_job` then `drama_authorize_speech_job` for a bounded library audio/video ASR segment or a stock-voice TTS text. Query `drama_get_speech_job` until terminal; cancelled/pending work makes no paid call. Start validation with one short ASR segment, then one short TTS sentence, each with its own one-call scope. Automatic mode does not elicit; manual mode requires a separate confirmation. A failed entitlement check does not authorize trying other resources automatically.

ASR results preserve the source asset version/hash, segment offset and utterance timestamps. Compare the returned transcript with the intended dialogue and actual audio; it is not approved memory, a subtitle timing guarantee, or an automatic quality pass. TTS creates a new library audio asset: listen to it, then explicitly revise the appropriate shot's `sourceAudioAssetId` if accepted. Do not replace approved audio silently. Without ASR, retain actual listening as a review requirement and disclose that automated transcription was not performed.

## Codex Image Gen loop

Read [references/image-asset-contract.md](references/image-asset-contract.md) for both standalone images and queued tasks. For an existing valid queued task:

1. Claim the task.
2. Re-read current state and the task's frozen plan revision, shot prompt and exact input asset bindings.
3. Generate only within the approved attempt budget.
4. Inspect subject/product identity, composition, artifacts, text, crop safety and any shot-specific acceptance criteria.
5. Keep the candidate outside the project library and show it to the user. Only after the user accepts that exact candidate, verify its hash and complete the task with its absolute local path, inspection evidence and acceptance notes. Do not import unapproved candidates, even into a project candidate folder.
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
