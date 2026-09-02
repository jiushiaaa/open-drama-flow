# Hilo Video Prompting Guide

Use this guide when Hilo is the selected creative model family. Confirm current input modes, sound support, clip limits, and delivery formats at execution time.

## Creative Strengths

- General cinematic motion from a confirmed first frame.
- Natural camera movement and environmental motion.
- Smooth transitions when both starting and ending visual states are supported.
- Ambient sound when the currently available model exposes that capability.

## Prompt Structure

Write a natural-language shot description:

```text
[shot and camera movement], [subject and action], [environment],
[lighting and atmosphere], [visual style], [sound intent when required]
```

## Best Practices

- Prefer a confirmed first frame when subject appearance or composition must remain stable.
- Use one or two clear actions for a short clip; add complexity only when the confirmed clip length can contain it.
- Describe the motion that should happen after the first frame rather than repeating every visible detail.
- State camera movement precisely: static, tracking, slow push, pan, crane, orbit, or handheld.
- When using an ending reference, describe the visual transformation connecting the two states.
- Describe ambient sound in creative terms, such as wind through trees or distant city traffic, instead of writing an implementation switch.

## Common Pitfalls

- Keyword piles with no subject-action relationship.
- Several incompatible camera movements in one short clip.
- Too many full-body actions, which can destabilize anatomy.
- Relying on generated on-screen text for typography-critical work.
- Assuming a capability is available without checking the current model.

## Example

```text
Medium tracking shot, a street musician plays acoustic guitar on a rain-soaked city sidewalk at night. Neon reflections shimmer in nearby puddles while pedestrians with umbrellas pass in soft background focus. The camera makes a slow, restrained orbit around the performer. Moody urban-night color, natural rain and distant traffic ambience.
```
