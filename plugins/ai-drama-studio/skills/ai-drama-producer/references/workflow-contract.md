# Workflow Contract

## State precedence

1. User's current explicit instruction.
2. Accepted project script/character/shot state from `drama_get_state`.
3. Existing generated assets and job evidence.
4. This skill's defaults.

## Stage gates

| Stage | Required evidence before advancing |
|---|---|
| Story | logline, premise, episode target, ending beat |
| Characters | stable visual description and role for each recurring character |
| Storyboard | ordered shot ID, duration, framing, action, prompt, subtitle/dialogue |
| Images | accepted local master; remote URL only when a downstream provider needs it |
| Videos | provider task reached `succeeded` and downloaded local clip exists |
| Edit | ordered clips, timing, subtitle/audio policy, successful FFmpeg job |
| Final | playable file and visual inspection notes |

Job states are `queued`, `running`, `waiting`, `succeeded`, `failed`. Only `succeeded` is delivery evidence.

Use `drama_update_plan` to persist authored story/character/shot state, `drama_resume_paid_batch` to continue a waiting approved provider job, and `drama_render_project` to mix available generated clips with deliberate static-motion shots into the final local render.

## Default cost strategy

For a first real episode, choose duration from the user's distribution goal and approved budget. Use static comic motion for dialogue/setup shots and reserve Seedance for action, emotion peaks and high-value transitions. Never create a demo episode, sample story or placeholder media to validate the harness.

## Continuity checklist

- Character facial structure, hair, outfit, age and silhouette.
- Location layout, time of day, palette and light direction.
- Hero props, hand they are held in, damage/state changes.
- Eyeline, screen direction and axis continuity.
- Subtitle/dialogue match with actual shot duration.
