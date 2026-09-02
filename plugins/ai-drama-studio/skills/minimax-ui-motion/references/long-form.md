# Long-form (>15s) continuation chains

The base skill has two explicit duration modes. A request up to and including 15s is one `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）` call with `mode: "multimodal"`, the user's image in `reference_image_paths`, and no extra BGM by default. Anything longer uses a **numbered continuation chain**: generate segment 1 through that same all-purpose-reference route, extract and probe its real tail frame, then generate segment 2 with `mode: "i2v"` and that file in `first_frame_image`. Repeat the tail-frame handoff for every later segment. A later segment is never produced by running the multimodal opening procedure again.

The brand-first architecture makes long-form easier: the brand profile + style anchor stay the same. Only the storyboard structure changes (from `narrative` to the `takes` array of numbered segments).

## 30s structure (2 segments × 15s)

```
Segment 1 (15s)
┌────────────────────────────────────┐
│ cold open + reveal + interaction   │  ← beats 1-3
│ + first half of wow beat           │
│ [last frame: a static moment]      │  ← chosen for minimal drift
└────────────────────────────────────┘
                ↓ extract last frame
Segment 2 (15s)
┌────────────────────────────────────┐
│ continuation + end card reveal     │  ← beats 4-5
│ [last frame: end card holding]     │
└────────────────────────────────────┘
                ↓
        ordered concat (sequence 1 → 2)
        generate one BGM after both succeed
        mux with 30s BGM using an explicit `-t 30` duration (never `-shortest`)
```

The seam is invisible when segment 1 ends on a **static moment** (held pose, ribbon fully spread, glyph at rest). The video model continues from that exact frame with minimal drift.

## 60s structure (4 segments × 15s)

For 60s, use 4 segments of 15s with 3 seams. Apply the static-end rule at every seam. The `motion_prompt` for each segment covers only that segment's local story; it must not pretend that a new opening is being generated.

For 30s stories that work:

- **Tutorial**: show 3 features sequentially, each with a real product asset
- **Comparison**: split-screen "before / after" using two half-frame panels, both in the brand colors
- **Documentary**: layer a narrator voice over the visuals (see Voice-over below)

## Voice-over

If the user wants narration, add this to the storyboard:

```json
{
  "voice": {
    "voice_id": "male-qn-qingse",
    "text": "Notely captures your thoughts, organizes them in motion, and gets out of the way.",
    "file": "audio/vo.mp3"
  }
}
```

The `stitch.mjs` script supports a `--vo` flag that mixes VO at 0 dB and BGM at -18 dB under it.

## Music length and timing

For any output longer than 15s, wait for every numbered segment to succeed and for every join to pass the tail-frame check. Then make exactly one `用户授权音乐或已接入的音乐供应商；未接入时不得生成` call with `vendor=official`, `model_id=music-3.0`, `mode=instrumental`, and `filename=ui-motion-bgm`. On this route, do not pass `lyrics`, `vendor_params`, or `music_length_ms`. Put the total target duration and the full-film energy timeline in the prompt, then record the returned actual duration for final assembly. Use another supported model only when the user explicitly requests it; do not silently switch to ElevenLabs Music v2.

For outputs up to and including 15s, do not call the music tool by default. The absence of `music` in the storyboard is intentional, not a missing step.

The music prompt should still be derived from the brand profile. A longer piece has more time to develop—the same brand mood, but with longer phrasing, more harmonic movement, section-level energy changes, and an explicit ending.

## Brand profile stability across long-form

The brand profile is the *constant* across a 30s or 60s video. You don't re-extract the brand profile per segment — the same `brand_profile.json` drives all of them. The brand's color names, typography, photography mood are stable inputs.

## Avoiding drift at the seams

Four rules keep the numbered continuation seamless:

1. **End segment N on a static moment** — held pose, fully-spread ribbon, glyph at rest. The model has nothing stable to continue if the frame is dynamic, so it invents motion that doesn't match.
2. **Persist the lineage before generating segment N+1** — set `sequence=N+1`, `continuation_of=N`, and point `first_frame_file` at segment N's extracted, probed `last_frame_file`.
3. **Keep the motion_prompt for segment N+1 focused on the local beat** — "from this static frame, fade to background and reveal the end card" — not a recap or a new opening.
4. **If drift appears, regenerate segment N+1 only** — segment N is fine. Do not re-roll the whole chain or substitute the original reference image.

## Schema extension

The base `storyboard.json` already supports the long-form case via the optional `takes` array. The version stays at `4`. The brand fields are unchanged; the required continuity fields are `sequence`, `continuation_of`, `reference_mode`, `first_frame_source`, `first_frame_file`, `last_frame_file`, and `clip_file`.
