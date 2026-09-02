# Image Model Prompting Guide

Choose an image model for its visible creative strengths, then verify current reference limits, editing modes, delivery sizes, and supported frame shapes before generation. Do not copy provider request fields or internal model identifiers into the Skill workflow.

## Model-Family Selection

| Need | Useful model family | Prompting emphasis |
|---|---|---|
| General generation or conversational editing | Gemini image models | Natural-language intent and explicit preservation constraints |
| Text-heavy poster or title image | Qwen image models | Exact text, hierarchy, placement, font character, and contrast |
| Style transfer or localized editing | FLUX Kontext | What changes versus what remains fixed |
| Face or character continuity | Kling image models | Identity anchors, wardrobe, pose, and allowed variation |
| Illustration, logo, or transparent asset | GPT-Image | Shape language, edge quality, palette, and background treatment |
| Highly stylized artwork | Midjourney | Concise visual language, composition, material, and mood |
| Many coordinated references | Seedream | A clear role for each reference and conflict resolution |

User choice takes priority when the selected model can satisfy the brief. If it cannot, explain the visible limitation and recommend an equivalent currently available option.

## General Prompt Structure

```text
[subject and identity] + [composition and pose] + [environment] +
[lighting and palette] + [material and style] + [delivery intent]
```

For editing, add:

```text
[change these elements] + [preserve these elements exactly]
```

## First Frames for Video

- Depict the moment immediately before the main action.
- Leave visual space in the direction of movement.
- Keep the subject away from unsafe crop edges for the confirmed delivery shape.
- Preserve identity, wardrobe, props, and scene anchors needed by later clips.
- Avoid frozen poses that give the video no plausible motion path.
- Confirm the frame with the user before using it to generate video.

## Reference Handling

State the purpose of every reference: identity, pose, wardrobe, product, environment, composition, palette, or style. Do not let an identity reference control the background, or a style reference introduce unwanted people and objects.

When references conflict, prioritize the user-confirmed hierarchy instead of blending all attributes indiscriminately.

## Text and Logo Work

Provide exact copy, language, capitalization, hierarchy, placement, color, and legibility requirements. For brand-critical text or logos, treat generated typography as a draft and verify every character before delivery.

## Style-Specific Notes

### Gemini

Write natural instructions as if briefing an artist. For edits, name both the requested change and the elements that must stay unchanged.

### Qwen

Use for tasks where readable text is central. Keep copy concise and describe layout separately from decorative style.

### FLUX Kontext

State the transformation clearly while locking composition and subject identity when required. Avoid contradictory style cues.

### Kling

Separate face identity from full-subject continuity. Describe which parts of clothing, pose, and setting may change.

### GPT-Image

Describe graphic structure, silhouette, line quality, palette, and whether the asset needs an isolated or transparent background.

### Midjourney

Favor concise, evocative visual language. Express delivery shape and reference intent in user-facing terms; keep platform syntax outside the Skill.

### Seedream

With several references, assign each one a single job and resolve overlapping control before generation.

## Quality Check

Review composition, anatomy, identity, text accuracy, material rendering, edge quality, unwanted objects, and suitability for the confirmed delivery shape. For edits, compare protected regions against the source and report visible drift.
