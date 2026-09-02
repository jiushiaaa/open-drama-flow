# Prompt Contract v2

Read this contract whenever creating, revising, migrating or approving a shot. It governs the persisted shot description and the provider requests compiled from it; it is not a provider capability list.

## Version rule

- Set `promptContractVersion: 2` on every new shot.
- A legacy shot with only `prompt` may be loaded and compiled for compatibility, but legacy text is not evidence that appearance and motion were separated correctly.
- Do not create new version-1 shots. Before materially changing or submitting a legacy shot for new paid work, migrate it to version 2 and review the resulting static and motion prompts.

## ShotSpec

Each version-2 shot must carry these production dimensions:

| Dimension | Persisted representation | Contract |
| --- | --- | --- |
| Scene | `sceneId` and `scene` | Use a stable scene identifier; describe only the scene facts needed by this shot. |
| Purpose | `purpose` | State why the shot exists in the story or commercial argument. Use it to judge whether a visually attractive result is still the wrong shot. |
| Subjects | `subjectIds` | Bind stable character, product or hero-prop identities. Appearance versions remain asset bindings, not prose invented per shot. |
| State | `startState`, `endState` | Describe the observable entry and target states. A state change is the motion problem; it is not a request to redesign the subject. |
| Camera | `camera.shotSize`, `angle`, `movement`, `speed`, `relation` | Specify one primary camera treatment and its relation to the subject. `locked` is a valid deliberate treatment. |
| Motion | `motion.subject`, `environment`, `timing` | Use one primary subject action. Environment motion is secondary. Timing segments guide pacing only. |
| Style | `style` | Keep approved visual treatment concise and compatible with bound references. |
| Sound | `soundPlan.dialogue`, `ambience`, `soundEffects`, `music`, `notes` | Plan sound independently even when the selected adapter cannot generate it. Compile it into a provider request only when the adapter supports that feature. |
| Continuity | `continuityFromShotId`, `continuityConstraints` | Record the preceding shot and the facts that must survive the cut, such as costume, prop hand, screen direction, light and damage state. |
| Negative | `negativeConstraints` | Record unwanted outcomes. The compiler must express them only through syntax supported by the selected adapter. |
| Risks | `qualityRisks` | Name likely failure modes that inspection must check, such as identity drift, extra limbs, unreadable product marks, flicker or impossible motion. |

Operational fields such as `id`, `duration`, `generationMode`, reference asset bindings and `acceptanceCriteria` remain required where the workflow contract calls for them. A ShotSpec is incomplete if it cannot identify its inputs, intended duration and observable pass conditions.

## Separate appearance from motion

Compile two different prompts from the same ShotSpec:

### `imagePrompt`

Describe the approved static frame: scene, bound subjects, `startState`, shot size and angle, composition, style, visual continuity and relevant exclusions. Do not put subject animation, camera movement or time segments into this prompt.

### `videoPrompt`

Describe what changes: the primary subject action, optional environment motion, one primary camera movement, pacing, transition from `startState` to `endState`, continuity constraints and supported sound intent. Do not use it as a second appearance bible.

When an accepted image or image reference is bound and the current adapter supports image-to-video, prefer I2V and let the visual input carry subject identity, composition, lighting and style. Focus the `videoPrompt` on motion. For text-to-video, add only the scene and subject information that the model otherwise lacks.

Do not silently merge `imagePrompt` and `videoPrompt` into one universal provider prompt. An explicit prompt supplied for either stage may override the compiled text for that stage, but it does not remove the requirement for a valid ShotSpec.

## Motion and attention budget

- One shot has one primary subject action and one primary camera movement. If two independent beats must both read clearly, split the shot unless the user's intent specifically requires a continuous compound take.
- Translate mood into observable motion. Prefer “she pauses, tightens her grip, then looks up” over an abstract request to “show determination.”
- Treat reference assets as locked information. Do not repeatedly redescribe identity, clothing, product geometry or the whole scene in an I2V motion prompt.
- Treat `motion.timing` as approximate rhythm, not frame-accurate edit points or proof that an event occurred at an exact timestamp. Verify actual timing after generation and establish exact cuts during deterministic editing.
- Provider-specific positive or negative syntax, weighting syntax and reference notation must come from the current adapter. Never invent numeric prompt weights.

## Capability boundary

Resolve capabilities from the currently loaded adapter immediately before compilation and execution. Public documentation, tutorials, model names and another provider's UI do not prove that this installation exposes the same features.

If the adapter does not expose a requested reference type, generation mode, duration, ratio, resolution, audio mode or edit/extend operation:

1. Do not submit a fabricated parameter or claim the operation is available.
2. Offer an adapter-supported route only when it preserves the user's intent.
3. If the route changes provider inputs, cost, quality, duration or output, update the plan and obtain fresh approval before paid work.
4. Otherwise stop at the explicit capability boundary and preserve all completed evidence.

## Paid request freeze

Compile the exact provider request before asking for approval. Canonicalize and hash the provider kind, model, prompt, input mode, generation parameters and bound input asset versions into the provider `requestDigest`.

The paid approval freezes that digest together with the plan revision and call cap. Immediately before execution, recompute it from current state:

- If it matches, the approved request may run within the remaining cap.
- If any prompt, provider, model, parameter, input mode or bound asset version changed, the digest must change. Invalidate the pending execution and request a new approval.
- Never reuse an old approval by editing provider arguments after authorization or by creating a replacement job with the old digest.

Persist the digest and provider task ID with the result so inspection, retry and final delivery can trace the generated bytes back to the approved request.

## Inspection handoff

Use `qualityRisks`, continuity constraints and shot-level acceptance criteria as the inspection checklist. A successful provider response proves only that bytes were generated. Accept the shot only after checking the intended purpose, identity/state continuity, composition, motion, actual timing, visual artifacts and applicable sound requirements.
