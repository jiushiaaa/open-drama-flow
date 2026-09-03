# Image Model Prompting Guide

Default to the current Codex session's built-in image tool (image2). Read the [image asset contract](../../../../ai-drama-producer/references/image-asset-contract.md) before generation or editing. Only explicit user choice or verified built-in-tool failure/unavailability permits the project's image model. A provider setting alone is not permission to switch. Keep candidates outside the project library until the user accepts the exact image; Agent inspection is not acceptance.

## Creative Requirements, Not a Provider Menu

| Need | Default route | Prompting emphasis |
|---|---|---|
| Generation or editing | Codex image2 | Natural-language intent and preservation constraints |
| Text-heavy poster/title | Codex image2 | Exact text, hierarchy, placement and contrast; inspect every character |
| Style transfer/local changes | Codex image2 | What changes versus what stays fixed; verify actual preservation |
| Character continuity | Codex image2 | Accepted identity anchors, wardrobe, pose and allowed variation |
| Illustration/logo/isolated asset | Codex image2 | Shape, edges, palette and required background |
| Stylized art/multiple references | Codex image2 | Composition and a clear job for each supplied reference |

Check actual tool limits and input delivery before calling. If the allowed route cannot satisfy the brief, explain the limitation; do not silently choose an unconnected model.

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

## Historical Model Notes (Comparison Only)

Read this section only when the user explicitly asks about an older prompt/model. These names are not registered production routes or recommendations to switch away from image2. Reuse relevant craft intent, not vendor syntax or unverified capability claims.

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
