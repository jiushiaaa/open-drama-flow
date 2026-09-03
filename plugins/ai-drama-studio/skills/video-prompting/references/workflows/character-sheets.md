# Character Sheet Workflow

## Overview

Character sheets provide inspectable identity anchors; they reduce drift but do not guarantee consistency. Start from scoped approved character facts and accepted image versions, not invented examples. Follow the [image asset contract](../../../ai-drama-producer/references/image-asset-contract.md): default Codex image2, candidates outside the library, exact user acceptance before import.

## Character Sheet Types

### 1. Turnaround Sheet

Shows the character from multiple angles: front, 3/4 view, side, and back.

```
Prompt template:
"Character turnaround sheet of [character description], showing front view, 3/4 view, side view, and back view. [clothing description]. Clean white background, consistent lighting, full body, character design reference sheet, anime/realistic style."
```

### 2. Expression Sheet

Shows the character in different emotional states.

```
Prompt template:
"Expression sheet of [character description], showing 6 different emotions: neutral, happy, sad, angry, surprised, contemplative. Same angle (front-facing), consistent lighting, bust shot, clean layout, character reference sheet."
```

### 3. Pose Sheet

Shows the character in different action poses.

```
Prompt template:
"Pose reference sheet of [character description] in [clothing description], showing 4 dynamic poses: standing, walking, sitting, [specific action]. Full body, clean white background, consistent proportions, action reference sheet."
```

## Workflow

### Step 1: Define Character Description

Write a detailed character text description including:
- **Body type**: Height, build (slim, athletic, curvy...)
- **Facial features**: Face shape, eye color, hairstyle and hair color
- **Clothing**: Detailed outfit description
- **Aura**: Overall impression/vibe

Example:
```
A young Chinese woman in her mid-20s with delicate features. She has long straight
black hair reaching her waist, almond-shaped dark brown eyes, and fair skin.
She wears a modern hanfu-inspired outfit: a white silk top with subtle floral
embroidery and a flowing navy blue pleated skirt. Elegant and ethereal presence.
```

### Step 2: Select Generation Model

Use Codex's built-in image2 for realistic, anime, concept and stylized sheets. Only explicit user request or verified built-in-tool failure/unavailability permits a project image-model fallback. Do not select a different provider just because of style. Reuse existing accepted anchors instead of regenerating them unnecessarily.

### Step 3: Generate Character Sheets

1. **Generate the front-facing base image first**:
   ```
   "Portrait of [character description], front-facing, neutral expression, soft studio lighting,
   clean background, character reference, high detail"
   ```

2. **Using the base image as the identity reference, generate a turnaround sheet**:
   ```
   "Create a character turnaround sheet based on the approved base image. Preserve facial identity, hairstyle, wardrobe, body proportions, and illustration style across front, three-quarter, side, and back views."
   ```

3. **Generate an expression sheet from the same identity reference**:
   ```
   "Create an expression sheet of the same character. Preserve facial structure, hairstyle, wardrobe, palette, and drawing style while varying only the approved expressions."
   ```

### Step 4: Verify Consistency

After generation, check:
- [ ] Are facial features consistent across all angles?
- [ ] Is the hairstyle logical from all angles?
- [ ] Are clothing details maintained consistently?
- [ ] Are body proportions stable?
- [ ] Is the overall style unified?

Propose the smallest correction using the same authorized route and accepted identity anchor, within the call limit. Show the corrected candidate again; inspection alone never authorizes import.

### Step 5: Output for Downstream Use

Character sheet applications:
- **Video first frame generation**: Use image2 with the accepted identity anchor and the intended scene; accept the generated frame before binding it to Seedance.
- **Storyboard generation**: Use as character reference images
- **Dialogue shot**: A clear face can help review mouth motion, but does not guarantee lip sync. Select the actual Seedance input role and explicit native-audio setting, then check dialogue and mouth timing.

## Photorealistic Character Design

When "real-person photo" quality is needed for character design:

```
Prompt template:
"Professional photography headshot of [character description], [expression],
shot on Canon EOS R5, 85mm f/1.4 lens, natural window light,
clean neutral background, magazine quality portrait, photorealistic,
8K detail, skin texture visible, catchlight in eyes."
```

Key elements:
- Specify camera and lens parameters to increase realism
- Describe light direction and quality
- Mention skin texture and catchlight
- Use photography terminology rather than painting terminology

## MV Character Design Best Practices

1. **Prepare for lip sync**: Front-facing character close-ups should have mouth slightly open or in a speech-ready state
2. **Multiple outfits**: If the MV has scene changes, prepare corresponding outfit versions for each scene
3. **Emotional range**: MVs require rich expressions — ensure the expression sheet covers all emotions in the song
4. **First-frame friendly**: Character image composition should work as a video first frame (leave room for motion)
5. **Save all prompts**: Record the prompt used for each generated image for easy reuse and adjustment
