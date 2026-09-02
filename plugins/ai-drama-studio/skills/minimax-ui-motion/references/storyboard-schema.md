# Storyboard JSON schema (v4)

`storyboard.json` carries the brand profile reference, the style anchor reference, one narrative for a single segment, and a `takes` array for a numbered continuation chain. The field name `takes` is retained for the stitcher, but every entry is a **segment**, not a fresh opening. Write every production `motion_prompt` with `motion-prompt-writing.md`.

## Single segment (≤15s, default)

```json
{
  "version": 4,
  "subject": "Notely — AI note-taking app",
  "aspect_ratio": "9:16",
  "resolution": "1K",
  "total_duration_sec": 15,
  "generation": {
    "mode": "single_segment",
    "reference_mode": "all_purpose",
    "reference_is_not_first_frame": true
  },
  "brand_profile_ref": "brand_profile.json",
  "style_anchor_ref": "style_anchor.json",
  "brand_assets": {
    "reference_image": {
      "image_path": "brand/notely-editor.png",
      "description": "Notely main editor screen, dark mode, with the New Note button highlighted"
    },
    "end_card": {
      "image_path": "brand/notely-logo.png",
      "description": "Notely wordmark, transparent PNG"
    }
  },
  "narrative": {
    "reference_prompt": "Near-black background with a warm undertone. Preserve the Notely editor structure and the warm coral interaction route as visual reference. Do not treat this image as the opening frame.",
    "motion_prompt": "Create a 15-second premium single-take UI motion film for Notely. A warm-coral route line is the recurring motion cause: it must touch, pull, outline, or transform every major element before that element moves. Keep a near-black warm background, light editorial serif headlines, restrained glass surfaces, and three depth planes: the active editor in the midground, contextual cards in the foreground, and a dim note constellation behind. Use one continuous camera path: extreme close-up along the route line, push through its first ring into the editor, arc slightly around the active card, tilt toward the canvas, then pull back for the system reveal. Connect every beat through the same line, shared-card expansion, foreground occlusion, and surface folding. Use confident acceleration and controlled deceleration: cursor actions snap first, nearby layers answer with a short stagger, and the camera arrives only after the active object establishes direction. Preserve legible interface proportions throughout; no random particles, flash frames, hard cuts, detached floating symbols, rubbery warping, or newly invented colors. Reflections and shadows must follow the same spatial light source.\n\n0.0–1.5s | hook. Begin extremely close on the warm-coral line as it travels across the texture of a note card. The camera tracks beside it; shallow focus reveals paper grain and a thin glass edge. The line curls into a ring, the camera pushes through the opening, and the ring becomes the focus outline around the main Capture card. Settle for a short readable beat.\n\n1.5–4.0s | workspace reveal. A white light cursor follows the coral line toward Capture. Hover lifts the card slightly, sharpens its shadow, and dims the background constellation. Press compresses the card to 98%; release restores it and draws two alignment guides. The camera eases to a three-quarter view so foreground controls move faster than the background notes. The card's right edge stretches into a horizontal rail that carries the camera into the next state.\n\n4.0–7.0s | direct interaction. The cursor drags the Capture card along the rail. Neighboring notes slide aside in sequence, connection lines bend without breaking, and the active card keeps its title and typography stable. On release, a magnetic ring closes around the new position and nearby cards settle with smaller delayed motion. The rail curves upward across the lens as a warm-coral foreground wipe; its surface becomes the top edge of the expanded editor.\n\n7.0–10.5s | layout transformation. Continue inside the editor with no cut. The selected card expands through shared-element motion while its original title remains anchored. Its body unfolds into three note layers; the camera tilts toward top-down as those layers flatten into a connected canvas. The cursor traces one layer, and the same coral line branches into a compact map of related notes. Foreground handles stay sharp, the active canvas occupies the midground, and inactive notes recede with softer blur. One branch grows toward camera, bends into a rounded frame, and becomes the transition aperture.\n\n10.5–13.3s | system reveal. The camera passes through that aperture, orbits a few degrees, then pulls back to show Capture, editor, canvas, and note map as regions of one continuous workspace rather than separate screens. The coral route runs through all regions; each connection pulses once from near to far. Panels fold toward the center in order, preserving their content until the last moment, and the route line draws the Notely brand frame. Let the motion peak, then decelerate cleanly.\n\n13.3–15.0s | resolve. The folded panels become a calm end composition with the real Notely mark centered in the brand's serif, the complete stable tagline 'Thought, in motion.' below, and monochrome store badges at the bottom. The coral route completes one soft outline around the mark and stops. Hold the final frame for at least 0.8 seconds; keep text, spacing, logo shape, and colors completely stable."
  }
}
```

## Continuation chain (>15s, 2+ numbered segments)

Add a `takes` array whose entries are numbered segments. Segment 1 uses the all-purpose reference image. Segment N+1 can only use the verified tail frame of segment N as its first frame. The `motion_prompt` strings below are abbreviated only to show the segment fields; before generation, expand every segment independently with `motion-prompt-writing.md` to the density required by its local duration. Never send these abbreviated strings to `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）`.

```json
{
  "version": 4,
  "subject": "AURA Smart Home — 30s product film",
  "aspect_ratio": "9:16",
  "resolution": "1K",
  "total_duration_sec": 30,
  "generation": {
    "mode": "continuation_chain",
    "segment_count": 2,
    "reference_mode": "segment_1_all_purpose_then_tail_frame",
    "reference_is_not_first_frame": true
  },
  "brand_profile_ref": "brand_profile.json",
  "style_anchor_ref": "style_anchor.json",
  "music": {
    "vendor": "official",
    "model_id": "music-3.0",
    "mode": "instrumental",
    "generation_stage": "after_all_segments",
    "mood": "warm acoustic",
    "prompt": "gentle acoustic morning, soft nylon guitar, 70 BPM, no vocals, 30 seconds",
    "file": "audio/bg.mp3"
  },
  "narrative": {
    "summary": "Two 15s segments. Segment 1 uses the all-purpose reference; segment 2 continues from segment 1's extracted tail frame. BGM is generated only after both segments succeed."
  },
  "brand_assets": {
    "reference_image": {
      "image_path": "brand/aura-home.png",
      "description": "AURA home interface reference"
    }
  },
  "takes": [
    {
      "sequence": 1,
      "duration_sec": 15,
      "continuation_of": null,
      "reference_mode": "all_purpose",
      "reference_image_file": "brand/aura-home.png",
      "first_frame_source": "none",
      "motion_prompt": "The AURA home glyph materializes, then a room-card grid fades in (Living Room / Bedroom / Kitchen / Bathroom). The 'Bedroom' card highlights in coral. The view switches into the Bedroom card; a 'Good Night' scene pill highlights.",
      "last_frame_file": "frames/segment-1-last.png",
      "clip_file": "clips/segment-1.mp4"
    },
    {
      "sequence": 2,
      "duration_sec": 15,
      "continuation_of": 1,
      "reference_mode": "previous_tail",
      "first_frame_source": "previous_tail",
      "first_frame_file": "frames/segment-1-last.png",
      "motion_prompt": "From the highlighted 'Good Night' scene, the background shifts to soft blue (evening), the light card drops to 5%, the curtain closes to 0%, and the AC card highlights in sage green. The view zooms out to show the full home, then the end card fades in: the AURA home glyph + 'AURA — The Home That Glows.' in serif, with App Store and Google Play badges in color below. The frame holds.",
      "last_frame_file": "frames/segment-2-last.png",
      "clip_file": "clips/segment-2.mp4"
    }
  ]
}
```

## Version

- `version: 4` — the schema after the single-take redesign. Replaces v3 (which had a `shots` array). v4 supports `narrative` for one segment and a `takes` array for >15s continuation segments.

## Top-level fields

- `version` — `4`.
- `subject` — one-line description.
- `aspect_ratio` — `9:16` or `16:9`.
- `resolution` — `1K` for 9:16, `2K` for 16:9.
- `total_duration_sec` — must equal the sum of `takes[*].duration_sec` for a continuation chain (or the implicit single segment).
- `generation.mode` — `single_segment` for ≤15s or `continuation_chain` for >15s.
- `generation.reference_mode` — `all_purpose` maps to `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5） mode="multimodal"` with `reference_image_paths`; `segment_1_all_purpose_then_tail_frame` means segment 1 uses that route and every later segment maps to `mode="i2v"` with `first_frame_image`.
- `generation.reference_is_not_first_frame` — must be `true` whenever the user's image is used as the all-purpose reference.
- `brand_profile_ref` — path to brand_profile.json.
- `style_anchor_ref` — path to style_anchor.json.
- `music` — optional. Omit it for ≤15s by default. For >15s, store exactly one instrumental BGM generated **after all segments succeed**, defaulting to `vendor: "official"`, `model_id: "music-3.0"`, and `mode: "instrumental"`. If the user explicitly requests another supported route, record that choice instead. On the default Music 3.0 route, do not add lyrics or ElevenLabs-only vendor params.

## Brand assets

`brand_assets` is optional. A map from slot to asset descriptor.

| Slot | Used for |
|---|---|
| `reference_image` | The all-purpose reference for a single segment or segment 1. It informs subject, product, style, and composition but is not the video's first frame. |
| `end_card` | The brand mark for the end card beat. Either composited over the last frame by the i2v, or used as the i2v's reference for the end card beat. |

| Field | Type | Notes |
|---|---|---|
| `image_path` | file path (workspace-relative) | PNG or JPG. Transparent PNGs work best for logos |
| `description` | string | What the image is, for the model's reference |

## Narrative (single-segment case)

`narrative` is required for a single segment. It has 2 fields:

- `reference_prompt` — required when no `brand_assets.reference_image` is set. It describes the visual reference to generate or select; it must not ask the model to render a technical first frame. Colors come from `brand_profile.colors`, typography from `brand_profile.typography`, geometry from style anchor.
- `motion_prompt` — required. A complete chronological director's treatment following `motion-prompt-writing.md`. Cover the full duration with 5–7 timed beats for 15s, and specify trigger, UI response, spatial response, camera response, transition bridge, and settle in each beat. Use the brand's color names and the style anchor's motion verbs.

## Takes (continuation-chain storage)

`takes` is required for >15s. Each entry is a numbered segment:

| Field | Type | Notes |
|---|---|---|
| `sequence` | number | 1-based, contiguous, and strictly increasing |
| `duration_sec` | number | 6, 10, or 15 |
| `continuation_of` | number or null | `null` only for segment 1; segment N must equal N-1 |
| `reference_mode` | enum | `"all_purpose"` only for segment 1 (`mode="multimodal"`); `"previous_tail"` for every later segment (`mode="i2v"`) |
| `reference_image_file` | path | Required only for segment 1 when an all-purpose reference image is used |
| `first_frame_source` | enum | `"none"` for segment 1; `"previous_tail"` for every later segment |
| `first_frame_file` | path | Required for segment N>1 and must equal segment N-1's `last_frame_file` |
| `motion_prompt` | string | Required. Complete timed direction for this segment only — the model does not see prior prose, so do not summarize or restage the opening |
| `last_frame_file` | path | Where this segment's real tail frame is extracted and probed |
| `clip_file` | path | Where the i2v output is saved |

Segment 1's `reference_mode` is `"all_purpose"`; its uploaded image is never silently converted into a first frame. For segment N>1, `continuation_of` must point to N-1 and `first_frame_file` must be the probed tail frame from N-1. A second call with segment-1 fields is an invalid continuation.

## Validation

Sum check: `Σ takes[*].duration_sec == total_duration_sec` (when `takes` is present).

Mode coherence: ≤15s has no `music` block by default and uses one all-purpose reference call. >15s has contiguous segment sequences, exactly one tail-frame handoff per join, and one `music.generation_stage: "after_all_segments"` block.

Brand coherence: every prompt that mentions a color uses a color from `brand_profile.colors` (or a derived shade). Stray colors = bug.

Motion coherence: motion verbs come from the style anchor's motion signature. Camera and transition bridges follow `motion-prompt-writing.md` and stay causally linked to the same recurring motion carrier.

Prompt density: `reference_prompt` stays 20–60 words. A 15s `motion_prompt` must never contain fewer than 1000 Chinese characters or 600 English words; 10s uses about 700–1200 Chinese characters or 400–700 English words; 6s uses about 400–800 Chinese characters or 250–450 English words. Do not pad—every sentence must specify visible action, timing, camera, spatial response, transition, or stability.

Transition coverage: a 15s `motion_prompt` contains at least three explicit bridges that preserve a shared object, path, surface, or occluder. Generic phrases such as “smooth transition” do not count.

Lineage coverage: for each segment N>1, verify `continuation_of=N-1`, `first_frame_file=previous.last_frame_file`, and that the file dimensions are probed before generation. Never accept a segment whose first-frame input is the original reference image.

End card: when `brand_assets.end_card` is set, the end card beat in the motion_prompt must reference the real brand mark in the brand's font and color — not a generic glyph.
