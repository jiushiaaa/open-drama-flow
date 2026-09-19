# Production guide

[Project home](../README.md) · [简体中文](production-guide_zh.md)

Detailed model setup, acceptance and local-data guidance. Actual tasks follow live plugin capabilities, account access and the project's approved settings.

## Directing and asset workflow

1. **Assets first.** The creator calls the built-in image workflow **image2.5**; historical project records also say **image2**. These are workflow labels, not a guaranteed API model ID. Use the current Codex session's built-in image tool, show candidates, and import accepted images. Provider fallback requires explicit request or verified built-in failure.
2. **Direct before generating.** GPT-6-astra is the creator's selected Codex model, not a required model hardcoded into the plugin. It writes shooting scripts and code for 3D previz; a renderer such as Three.js produces whitebox video. Whitebox references guide space, camera paths and timing; they do not guarantee reliable fine-grained fight choreography.
3. **Generate with explicit references.** Codex sends prompts plus role-bound images, videos, audio and/or boundary frames to Seedance 2.5. Keep appearance, motion, camera and sound responsibilities separate, and revise only affected shots.
4. **Produce sound separately when useful.** SeedAudio 1.0 is the creator's independent sound/BGM route; episode-one evidence includes generated music. Preserve accepted native video dialogue/sound where appropriate. Not every sound was regenerated, and this is not yet a general music MCP adapter.
5. **Finish, do not just download.** The current 2.5 adapter profile outputs up to 720p. Real-ESRGAN-assisted local processing produced 4K deliverables; it does not guarantee true recovered 4K detail. ChatCut is the creator's intended optional editing handoff; the verified episode-one packaging used FFmpeg. ChatCut requires its separate plugin/service and is not bundled here.


## Models and tools

| Capability | Current integration and limits |
| --- | --- |
| Image assets | Default: the current Codex built-in image tool. Candidates enter the library only after acceptance, unless explicit project-scoped delegation permits Agent review. The project's image provider is a fallback on verified unavailability or explicit request. |
| Seedance 2.5 | Text, first image, first+last frames, multimodal references, video extension and source-video editing contracts; image/video/audio reference roles; explicit native-audio flag. |
| Parameters | Local 2.5 profile validates up to 30 image, 10 video and 10 audio references and 4–30 second generation. First-frame modes use adaptive ratio; source-video editing uses adaptive ratio and duration `-1`. Actual account/API entitlement and media constraints still apply. |
| Reference delivery | Registered local media is resolved to provider-reachable HTTPS or Ark asset references. Only required media is exposed, not the whole library. |
| ASR / standard TTS | Integrated using optional Doubao Speech credentials. Without that key, plan native Seedance sound; independent transcription/TTS is unavailable, not simulated. |
| FFmpeg | Local assembly, media inspection and delivery checks. Approved local postproduction may use a recorded deterministic workflow when MCP is unavailable; it must not pretend to have updated MCP state. |
| SeedAudio 1.0 | Used through an independent production script for accepted music cues. **Not yet a general music-generation MCP adapter.** |
| Video Depth Anything | Used for depth-reference experiments outside the plugin. Depth is not a skeleton, identity model or motion-capture solution. |
| Real-ESRGAN | Local production upscaling experiment and published comparison. Not a native Seedance resolution option or a bundled one-click inference service. |

See [Seedance validation history](seedance-2.5-validation.md) for dated evidence. Input support is not a guarantee of exact motion, identity, sound or editing fidelity. Source-video edits are generative, not pixel-exact masked edits. Voice cloning and professional NLE project export remain unintegrated.

## Execution and review

Default automatic execution is bounded by the user's objective and frozen call limits. Optional manual mode retains trusted approval. Neither setting overrides Codex host permissions.

Image acceptance, production-memory approval and video quality review are distinct. Explicit delegation is recorded for its exact project and scope, never relabeled as the user having viewed an image. An API success, ASR transcript, extracted frame or passing decode is not by itself an audiovisual pass.

Episode-one methods now emphasize:

- event and spatial state at every shot handoff;
- actor-relative limbs, object contact, gaze and injury continuity;
- repairing only the failed interval while retaining accepted sections;
- real source cut points and frame-based subtitle/audio mappings;
- recording technical checks, observed checks, user acceptance and unresolved review separately.

Project examples live under the producer's scoped references; they are not universal creative requirements.

[Small SkillOpt experiment](../production/publish-examples/skillopt-evaluation/README.md): existing rules passed 4/4 final synthetic decision tests. No patches were produced and the original Skill was retained; **no optimization gain or video-quality improvement is claimed**. Inputs, a portable runner and sanitized results are included.

## Storage and publication

Default state: `%LOCALAPPDATA%\OpenDramaFlow\data`.

- `AI_DRAMA_DATA_DIR`: changes the state root.
- `AI_DRAMA_MEDIA_DIR`: optional separate root for **new** imported/generated/edited media.
- Existing absolute paths are not automatically migrated. Copy, hash-verify and update references before removing originals.
- Deleting a project retains externally stored media and saves a recovery manifest with its references in the local trash.
- Private `production/`, reference downloads, local model checkouts and runtime logs are excluded. Only curated `production/publish-examples/` is published.

Software licensing does not grant rights to novels, films, music, likenesses or third-party model weights. Supply material you are entitled to use; verify redistribution rights separately.
