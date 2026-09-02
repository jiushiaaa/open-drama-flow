# Skill Routing Contract

## Automatic path

For every creative request, call `drama_route_skills` with the user's original wording. The tool scores the 44 enabled Codex-adapted MiniMax capability profiles, loads up to three matching `SKILL.md` bodies, and returns the generic `ai-drama-producer` only when no specialized route matches.

The user never needs to install, attach, tick or choose a Skill. Codex implicit skill discovery remains enabled, while the MCP router provides deterministic fallback and makes the selected guidance available in the same turn.

## Precedence

1. User's current explicit request and authorization.
2. Real project state and accepted assets.
3. The highest-scoring specialized skill.
4. Secondary routed skills only for non-conflicting craft guidance.
5. Generic producer defaults.

Do not combine mutually exclusive media or authorship assumptions. For example, FPV flight and first-person drama share a camera perspective but have different physical and narrative contracts. When routing remains ambiguous after project evidence is read, ask one material question rather than exposing the full Skill catalog.

## Provider adaptation

The imported profiles describe creative decisions, not MiniMax tool availability. Their Codex versions must use:

- `drama_update_plan` for durable story, character and shot state;
- Codex Image Gen tasks for primary image assets;
- Seedream only when the project setting selects it;
- Seedance 2.5 only after a real approval;
- FFmpeg for deterministic editing;
- an explicit capability boundary for voice cloning, NLE export or 3D scene editing when no real adapter is configured.

Never translate a MiniMax-specific tool name into a claim that the action already happened.
