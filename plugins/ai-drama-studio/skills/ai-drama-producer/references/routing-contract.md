# Skill Routing Contract

## Automatic path

For every new creative request, call `drama_route_skills` with the user's original wording and the active `projectId`/`creationId`. The router ranks the enabled Codex-adapted professional video capabilities, loads up to three matching Skill bodies, persists the selected names on that production plan, and returns the generic producer only when no specialized route matches.

If the route is requested without project context, it is guidance only. Supply project context whenever possible; otherwise write the selected Skill names to the active creation's `selectedSkills` with `drama_update_plan`. Re-read state afterward; later execution must use the persisted selection rather than a remembered chat response.

The user never needs to install, attach, tick or choose a Skill manually. If real project evidence still leaves a material ambiguity, ask one decision-changing question instead of exposing the Skill catalog.

## Precedence

1. The user's current explicit request and authorization.
2. Current project revision, accepted asset versions and verified output evidence.
3. The producer's shared [execution rules](execution-contract.md), [workflow](workflow-contract.md), [provider](provider-contract.md), [prompt](prompt-contract.md) and [image asset contract](image-asset-contract.md): automatic execution within scope, real capability constraints, candidate staging and acceptance before import.
4. The highest-scoring specialized Skill and compatible secondary craft guidance, only within these shared contracts. Specialist stage confirmations are Agent self-checks in automatic mode unless the user requests manual review; they never waive image acceptance or production-memory approval.
5. Remaining generic creative defaults.

Do not merge conflicting production assumptions. For example, product KOC, official brand film, FPV tour and first-person narrative can all use similar shots while requiring different authorship, truthfulness, camera and CTA contracts.

## Route-to-plan contract

Routing is complete only when the durable plan contains:

For standalone image assets, persist the image objective, prompt, approved source bindings and candidate/acceptance record outside the library. Do not fabricate video durations or a complete MP4 brief to satisfy the video route-to-plan fields below.

- a normalized commercial brief;
- the persisted `selectedSkills` list;
- source asset IDs and stable subject/character/product definitions;
- ordered shot contracts with generation modes and acceptance criteria;
- an explicit deliverable and review target.

After persisting these fields, call `drama_get_next_actions`. Do not skip directly from a route result to a provider call.

## Provider adaptation

Imported profiles describe professional decisions, not guaranteed provider availability. Their Codex versions must use:

- `drama_update_plan` for durable brief, Skill, subject and shot state;
- the current Codex session's built-in image tool by default, with candidates kept outside the project library until the user accepts them;
- Seedream only on explicit user request or verified built-in-tool unavailability/failure, never just because an adapter setting selects it; its candidates require the same acceptance-before-import gate;
- Seedance after an immutable capped request and automatic-policy authorization, or trusted MCP confirmation when the user explicitly selects manual mode;
- FFmpeg for deterministic editing;
- optional Doubao ASR and stock-voice TTS through the current speech adapter when configured and authorized; without a speech key, use Seedance native sound and actual listening checks;
- an explicit unavailable boundary for voice cloning, independent music generation, professional NLE project export and 3D editing.

Never translate a OpenDramaFlow-specific tool name into a claim that an action occurred. A creative Skill may recommend a technique; only adapter state and recorded evidence can prove execution.
