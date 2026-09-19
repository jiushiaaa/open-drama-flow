# OpenDramaFlow

[简体中文](README_zh.md)

A local-first video production harness for **Codex Desktop on Windows**. Codex leads planning, specialist Skills, generation, media organization and editing; you do not have to build a graph by hand.

![A real generated environment from episode-one production](production/publish-examples/ending-720p-preview.jpg)

[720p generated sample](production/publish-examples/ending-720p-4s.mp4) · [4K upscaled comparison](production/publish-examples/ending-upscaled-4k-4s.mp4) · [Provenance and limitations](production/publish-examples/README.md)

These are the same four seconds of an original environment, without audio. **4K is a postproduction upscale, not native Seedance 4K.** The full episode, source novel and third-party reference films are not distributed.

## What the harness does

Creative brief → approved context → scene and shot contracts → role-bound references → bounded model tasks → versioned media → edit and review → delivery evidence.

- **46 shipped Skills:** one producer and 45 specialists, including novel preproduction, Seedance prompting, narrative continuity and postproduction craft. Natural-language routing, explicit names and saved enable switches share the catalog.
- **One project per IP:** optional volume/season groups, independent creation pages and a folder-based asset library. Stable asset IDs and versions survive reorganization.
- **Codex conversation + canvas:** chat stays in Codex; the workbench displays production artifacts, previews, playback and task relationships.
- **Durable production state:** frozen request digests, reference versions, call limits, provider IDs and resumable jobs. An unknown submission must be reconciled before retrying.
- **Scoped memory:** candidate extraction and retrieval are separate from approved production facts. Project-specific methods do not silently become defaults for every project.
- **Evidence-based editing:** preserve accepted shots, inspect real cut points, map subtitles once, and distinguish decoding/hash checks from actual viewing/listening.

## Install

Prerequisites: Windows, Codex Desktop/CLI, Node.js 20+, npm, FFmpeg. Model generation requires your own provider credentials and incurs provider charges.

Clone this repository, open it in Codex, and ask:

> Install this repository's OpenDramaFlow plugin using scripts/install.ps1. Check dependencies and the local marketplace, then verify Skills and MCP without generating paid media. Do not interrupt another running production task.

Or run from the repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

The installer can install missing dependencies and registers the local marketplace. An active workbench blocks an in-use upgrade to protect its cache. Finish active work first, then follow the installer instructions. Open a fresh Codex task or restart Desktop after updating; an updated disk cache does not replace the tools already loaded into a running task.

Configure **Ark** and optionally **Doubao Speech** under the workbench's API Key page. Keys are stored using Windows DPAPI, not committed or returned by MCP.

For local development only:

```powershell
cd plugins\ai-drama-studio
npm ci
npm start
```

Open [the local workbench](http://127.0.0.1:4317). HTTP alone is not a substitute for loading the Codex MCP plugin.

## Model and tool coverage

| Capability | Current integration and limits |
| --- | --- |
| Image assets | Default: the current Codex built-in image tool. Candidates enter the library only after acceptance, unless explicit project-scoped delegation permits Agent review. The project's image provider is a fallback on verified unavailability or explicit request. |
| Seedance 2.5 | Text, first image, first+last frames, multimodal references, video extension and source-video editing contracts; image/video/audio reference roles; explicit native-audio flag. |
| Parameters | Local 2.5 profile validates up to 30 image, 10 video and 10 audio references and 4–30 second generation. First-frame and source-video extension modes use adaptive ratio; source-video editing uses adaptive ratio and duration `-1`. Actual account/API entitlement and media constraints still apply. |
| Reference delivery | Registered local media is resolved to provider-reachable HTTPS or Ark asset references. Only required media is exposed, not the whole library. |
| ASR / standard TTS | Integrated using optional Doubao Speech credentials. Without that key, plan native Seedance sound; independent transcription/TTS is unavailable, not simulated. |
| FFmpeg | Local assembly, media inspection and delivery checks. Approved local postproduction may use a recorded deterministic workflow when MCP is unavailable; it must not pretend to have updated MCP state. |
| SeedAudio 1.0 | Used through an independent production script for accepted music cues. **Not yet a general music-generation MCP adapter.** |
| Video Depth Anything | Used for depth-reference experiments outside the plugin. Depth is not a skeleton, identity model or motion-capture solution. |
| Real-ESRGAN | Local production upscaling experiment and published comparison. Not a native Seedance resolution option or a bundled one-click inference service. |

See [Seedance validation history](docs/seedance-2.5-validation.md) for dated evidence. Input support is not a guarantee of exact motion, identity, sound or editing fidelity. Source-video edits are generative, not pixel-exact masked edits. Voice cloning and professional NLE project export remain unintegrated.

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

[Small SkillOpt experiment](production/publish-examples/skillopt-evaluation/README.md): existing rules passed 4/4 final synthetic decision tests. No patches were produced and the original Skill was retained; **no optimization gain or video-quality improvement is claimed**. Inputs, a portable runner and sanitized results are included.

## Storage and publication

Default state: `%LOCALAPPDATA%\OpenDramaFlow\data`.

- `AI_DRAMA_DATA_DIR`: changes the state root.
- `AI_DRAMA_MEDIA_DIR`: optional separate root for **new** imported/generated/edited media.
- Existing absolute paths are not automatically migrated. Copy, hash-verify and update references before removing originals.
- Deleting a project retains externally stored media and saves a recovery manifest with its references in the local trash.
- Private `production/`, reference downloads, local model checkouts and runtime logs are excluded. Only curated `production/publish-examples/` is published.

Software licensing does not grant rights to novels, films, music, likenesses or third-party model weights. Supply material you are entitled to use; verify redistribution rights separately.

## Verify and contribute

```powershell
cd plugins\ai-drama-studio
npm run check
npm test
node scripts/sync-skill-manifest.mjs --check
node scripts/verify-skill-mcp.mjs
```

The MCP verifier starts a fresh disposable process, checks catalog/routing and makes **zero paid model calls**. Run it with an installed plugin root to test that copy too. This is distinct from checking direct tool availability in a new Codex task.

[Iteration and verification](docs/production-iteration-20260912.md) · [Model/reference sources](docs/reference-sources.md) · [Working agreement](AGENTS.md) · [Plugin details](plugins/ai-drama-studio/README.md) · [MIT software license](LICENSE)
