# Wan Video Prompting Guide

Use this guide when Wan is selected for first-frame animation, concise action prompts, or audio-driven character performance. Confirm current reference, audio, duration, and multi-shot capabilities before generation.

## Core Approach

Start from an approved first frame and describe how it comes alive:

```text
[subject] + [motion] + [environmental response] + [camera] + [style]
```

Avoid restating appearance that is already clear in the reference. Focus on changes, motion, timing, and emotion.

## Motion Guidance

- Use direct action verbs: turns, reaches, walks, sings, speaks, sways, or looks up.
- Add only the camera movement needed to support the action.
- Keep short prompts focused; verbose scene prose can dilute the motion instruction.
- Match action complexity to the confirmed clip length and place the most important beat early.

## Audio-Driven Performance

- Use a precisely selected audio excerpt that fits the intended clip.
- Choose a first frame with a performance-ready expression and natural mouth position.
- Match movement energy to the rhythm and vocal intensity.
- Fast or densely articulated vocals may need shorter phrases or simpler head movement for believable synchronization.
- Keep shared image quality and delivery shape consistent across a batch so the final edit feels continuous.

## Shot Planning

Use a continuous shot for a single performance or atmosphere beat. Use a multi-shot structure only when the selected model currently supports it and the story benefits from internal angle changes; otherwise plan separate clips in the main storyboard.

## Example

```text
Close-up, the singer performs with restrained emotion, subtle head movement, and eyes gradually lifting toward the camera. Soft warm light catches the edge of the face while the background remains still. The motion follows the vocal phrasing with no abrupt gesture, intimate music-video mood.
```
