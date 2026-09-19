# Episode-one production integration — 2026-09-12

This release turns observed production failures and successful recovery methods into runtime fixes, scoped Skills and reproducible checks. It does not bundle the private episode, model weights or third-party reference films.

## Runtime changes

- Seedance 2.5 first-frame, first/last-frame and source-video extension use adaptive ratio. Source-video editing uses adaptive ratio and duration `-1`; extension retains the planned new duration. Invalid combinations fail locally.
- 2026-09-17 incident: three Ark `video-extend` submissions reached authentication and task creation but failed with `InvalidParameter.TaskTypeConstraint` because the adapter sent an explicit `16:9` ratio. The local compiler and validator now force `adaptive` for Seedance 2.5 extension requests before a paid batch is frozen; a 1280×720 source still yields 16:9 output.
- Reference preparation keeps the owning job heartbeat alive. Recoverable state-lock timeouts retain the original frozen scope and provider work rather than paying again.
- Windows state writes retry transient sharing violations; permanent errors remain failures. Live lock ownership is not silently bypassed.
- ASR retains actual supplied word timestamps; missing, null, blank and boolean timing fields are not fabricated into zero-millisecond timestamps.
- Last-frame extraction follows the video stream rather than padded audio duration.
- `AI_DRAMA_MEDIA_DIR` supports separate placement of new media, including HTTP upload, preview and versioned document editing. Old references are not migrated automatically. Project deletion retains external media with a recovery manifest.

## Skill and working-rule changes

- Narrative continuity: event states, spatial handoff, actor-relative limbs, contact, injury, dialogue and cut-point review.
- Scoped episode-one project references distinguish accepted baselines, historical failures and unverified techniques. The latest local master is referenced by filename/hash; historical intermediates are not assumed to remain on disk forever.
- Postproduction preservation separates technical validation from actual audiovisual review. Templates naming unavailable NLE APIs are examples, not executable adapter promises; advertising pacing heuristics do not override narrative scenes.
- Default automatic execution retains frozen bounds. Explicit delegated image review applies only to the named project/scope; trusted memory approval and host permissions are unchanged.
- Approved deterministic local postproduction can continue from verified files without pretending MCP state was updated. New generation and asset admission still follow their contracts.
- Root working agreement and bilingual README now describe actual integration rather than planned features.

## Production experiments are not automatically adapters

SeedAudio 1.0 music cues, Video Depth Anything references and Real-ESRGAN upscaling were used outside the general MCP adapter layer. Depth does not recover skeletons or guarantee precise fighting motion; upscaled 4K is not native generated detail. SkillOpt results are tracked separately and must not be described as video-model training.

[SkillOpt experiment package](../production/publish-examples/skillopt-evaluation/README.md): one epoch on 4 training / 4 validation / 4 final-test synthetic production decisions, using the existing Skill snapshot. Baseline validation 4/4; no patches produced, original Skill retained; final tests 4/4 both before and after. **No optimization gain observed.** This is neither an audiovisual benchmark nor strong file-isolated evaluation. The public runner/config was checked without additional model calls; its input cases and Skill snapshot match the original hashes.

Public examples: [four-second environment and upscale comparison](../production/publish-examples/README.md). No audio, private episode or original novel is published.

## Verification

- Syntax checks passed; full regression **235/235**, no skips.
- Source and installed-copy real MCP checks: **46 Skills, 179 route checks each**, disabled-alias behavior passed, **0 paid provider calls**.
- Installed version: `0.1.0+codex.20260912100336`; **556 non-dependency files matched, 0 SHA-256 differences** at verification time.
- Current task's direct MCP listing returned 46 Skills. Existing processes are not claimed to have hot-loaded all new contracts; use a new Codex task after installation.
- Both public comparison clips fully decoded. Preview and contact-sheet inspection only establish the stated sample evidence, not exhaustive final-film quality.

These are local validation results, not a benchmark of all accounts or model combinations. Source-video editing, speech quality, identity and motion still need scene-specific acceptance during real production.
