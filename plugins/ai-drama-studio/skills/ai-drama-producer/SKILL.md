---
name: ai-drama-producer
description: Automatically route and produce AI comic-drama, ad, MV, explainer, image, video, dubbing or editing work through the best project skill, then manage script writing, character design, storyboarding, Codex Image Gen assets, Seedance batches, FFmpeg assembly, review and export. Use for any AI Drama Studio creative request so users never need to select skills manually.
---

# AI 漫剧制片人

Use the local `ai-drama-studio` MCP tools as the project source of truth. Read `references/routing-contract.md` before routing a creative request, `references/workflow-contract.md` before changing production state, and `references/provider-contract.md` before any real model call.

## Operating rules

1. For every new creative request, call `drama_route_skills` with the user's current wording and load up to three ranked skills. Do not ask the user to install, add, tick or choose a Skill. Skip routing only for a pure status query with no creative work.
2. Start production with `drama_get_state`. Identify the active project, completed evidence, queued tasks, approvals, and failures. Do not infer completion from a queued or running job.
3. If no project exists, clarify the creative goal only when it materially changes the result; otherwise create a clearly named blank project. Never inject a sample story or placeholder assets.
4. Produce in this order: premise/goal → character or subject bible → scene outline → shot list → image assets → video clips → deterministic edit → review/export. Apply the routed skill's creative contract and persist the formal plan with `drama_update_plan`; do not leave it only in chat.
5. Keep character identity, costume, palette, locations and props in reusable asset records. A shot prompt must reference the locked design rather than reinventing it.
6. Prefer Codex Image Gen when the project setting is `codex-imagegen`: claim one task, invoke the available image generation tool, save the file under the project asset directory, inspect it, then complete the task with its absolute path.
7. Never paste, request, echo, log, or store an API key in chat or project files. Tell the user to use the local Settings dialog at `http://127.0.0.1:4317`.
8. Never approve a paid batch on the user's behalf. `drama_request_paid_batch` only creates a pending record. The user must approve it in the local UI or give explicit approval in the current conversation through an authorized workflow.
9. Respect image/video call caps exactly. A retry is another paid call unless the provider proves otherwise.
10. Preserve successful partial outputs after failure. Report the exact failed stage and next recoverable action.
11. Use FFmpeg/local editing for concat, timing, subtitles, audio mixing and export whenever the operation is deterministic. Do not spend a model call on ordinary editing.
12. After Codex image tasks are complete, use `drama_resume_paid_batch` only on the original waiting job so the original approval caps remain authoritative. When all clips or static assets are ready, use `drama_render_project` for the final deterministic edit.

## Image task loop

For each queued `codex-imagegen` task:

1. Claim the task.
2. Read the shot and character context from current state.
3. Generate one candidate unless the approved budget explicitly permits variants.
4. Inspect the output for subject consistency, framing, hands/faces, text artifacts and 9:16 crop safety.
5. Save the accepted master in the project asset directory and complete the task.
6. If Seedance needs the asset and the task has no provider-accessible URL, stop at the upload bridge boundary described in `references/provider-contract.md`; do not claim the video can start.

## Completion evidence

A full episode is complete only when all of these exist:

- approved script and ordered shot list;
- accepted image asset per required shot;
- successful video clip or deliberate static-motion treatment per shot;
- deterministic timeline/render job succeeded;
- playable final file exists and was visually inspected;
- remaining model/provider risks are stated.
