# Kling Video Prompting Guide

Use this guide when Kling is selected for character performance, facial detail, or controlled camera motion. Confirm current reference, sound, duration, and delivery capabilities before generation.

## Prompt Style

Kling responds well to concise directorial language:

```text
[camera setup] + [subject identity] + [action progression] +
[environment] + [lighting] + [emotion and style]
```

## Character and Motion Guidance

- Describe facial expression, wardrobe, and identity anchors that must remain stable.
- Use temporal words such as slowly, gradually, suddenly, and gently to control pacing.
- Give one main action to a short clip and reserve multi-beat performance for a longer supported clip.
- Keep scenes with several interacting characters simple; complex blocking can weaken identity.
- Use a strong first frame when face or costume continuity matters.

## Camera Guidance

- Static framing suits facial performance and dialogue-like action.
- A slow pan or tracking move suits environment reveals.
- A restrained dolly zoom can support a dramatic emotional change.
- Low-angle, over-the-shoulder, and overhead views should have a clear story purpose.

## Sound Intent

When sound is part of the approved brief, describe the expected audible result—rain, footsteps, room tone, crowd ambience, or another concrete source. Confirm that the selected model currently supports native sound rather than encoding an internal setting in the prompt.

## Exclusions

If the current model accepts exclusions, keep them short and limited to visible defects such as distorted faces, extra fingers, watermark-like text, or unwanted blur. Do not put desired content in the exclusion list.

## Example

```text
Close-up portrait of a woman seated beside a rainy window. She slowly raises a coffee cup, pauses, and looks toward the glass as steam crosses the frame. Warm interior light contrasts with the cool blue rain outside. Intimate, contemplative performance, shallow depth of field, restrained camera movement, soft rain ambience.
```
