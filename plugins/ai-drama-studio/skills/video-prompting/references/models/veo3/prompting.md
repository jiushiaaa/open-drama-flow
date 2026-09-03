# Veo Video Prompting Guide

Use this guide when Veo is selected for cinematic scenes where dialogue, ambience, or synchronized sound design matters. Confirm current clip length, frame shapes, reference modes, and sound support before generation.

## Prompt Structure

Use five connected sections:

```text
[cinematography] + [subject] + [action] + [scene] + [style and sound]
```

Write a smooth descriptive passage rather than a list of disconnected tags.

## Audio Guidance

- Write dialogue exactly as it should be spoken and identify the speaker.
- Describe voice character only when it matters to the scene.
- Name concrete ambient sources: rain on glass, footsteps, market chatter, or distant sirens.
- State whether music is diegetic, background score, or absent.
- Keep dialogue and action simple enough to fit the confirmed clip length.

## Visual Guidance

- Use one principal camera movement and one plot beat for a short clip.
- Describe professional camera language only when it changes the visible result.
- A starting and ending reference can guide a transition when the current model supports both; describe the transformation connecting them.
- Describe the desired clean state positively when unwanted elements must be avoided.

## Common Pitfalls

- Assuming the model will infer the desired audio without a sound description.
- Cramming several lines of dialogue and multiple plot events into one clip.
- Depending on generated text for titles or captions.
- Treating old capability limits as permanent without checking current availability.

## Example

```text
Medium shot, a detective in a dark trench coat stands beneath a single streetlamp in a rain-soaked alley. He exhales slowly, turns toward the camera, and says in a low voice, “She was already gone when I arrived.” Rain strikes the pavement and distant sirens pass behind him. Restrained neo-noir framing, desaturated color, harsh side light, subtle 35mm texture.
```
