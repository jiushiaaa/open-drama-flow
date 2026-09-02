# Skill Routing Contract

## Automatic path

For every new creative request, call `drama_route_skills` with the user's original wording and the active `projectId`/`creationId`. The router ranks the enabled Codex-adapted professional video capabilities, loads up to three matching Skill bodies, persists the selected names on that production plan, and returns the generic producer only when no specialized route matches.

If the route is requested without project context, it is guidance only. Supply project context whenever possible; otherwise write the selected Skill names to the active creation's `selectedSkills` with `drama_update_plan`. Re-read state afterward; later execution must use the persisted selection rather than a remembered chat response.

The user never needs to install, attach, tick or choose a Skill manually. If real project evidence still leaves a material ambiguity, ask one decision-changing question instead of exposing the Skill catalog.

## Precedence

1. The user's current explicit request and authorization.
2. Current project revision, accepted asset versions and verified output evidence.
3. The highest-scoring specialized Skill.
4. Secondary routed Skills for compatible craft guidance.
5. Generic producer defaults.

Do not merge conflicting production assumptions. For example, product KOC, official brand film, FPV tour and first-person narrative can all use similar shots while requiring different authorship, truthfulness, camera and CTA contracts.

## Route-to-plan contract

Routing is complete only when the durable plan contains:

- a normalized commercial brief;
- the persisted `selectedSkills` list;
- source asset IDs and stable subject/character/product definitions;
- ordered shot contracts with generation modes and acceptance criteria;
- an explicit deliverable and review target.

After persisting these fields, call `drama_get_next_actions`. Do not skip directly from a route result to a provider call.

## Provider adaptation

Imported profiles describe professional decisions, not guaranteed provider availability. Their Codex versions must use:

- `drama_update_plan` for durable brief, Skill, subject and shot state;
- Codex Image Gen tasks for primary images when the project selects `codex-imagegen`;
- Seedream only when the installed project adapter selects it;
- Seedance only after an immutable paid-batch request and trusted MCP form confirmation;
- FFmpeg for deterministic editing;
- an explicit boundary for voice cloning, managed TTS/music, professional NLE export or 3D editing when no real adapter exists.

Never translate a MiniMax-specific tool name into a claim that an action occurred. A creative Skill may recommend a technique; only adapter state and recorded evidence can prove execution.
