# Long-form (>15s) continuation chains

Read the [Seedance guide](../../ai-drama-producer/references/seedance-prompting.md). The 15-second divisions below are creative examples, not a model limit. Choose one take or segments using the actual profile and action complexity. Bind general references through `mediaReferences`/`multimodal-reference`; a true tail-frame chain uses `continuation: {shotId, source: "last-frame"}`. Video extension instead uses a source video and its supported mode. Do not submit the legacy storyboard fields as provider API parameters.

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
        preserve planned native sound or mix authorized source audio
        inspect final video and audio durations after assembly
```

A static or slowly moving endpoint can reduce seam risk, but never guarantees an invisible join. Inspect actual motion, identity and sound across every join.

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
    "route": "configured-doubao-stock-tts-or-authorized-source",
    "text": "Notely captures your thoughts, organizes them in motion, and gets out of the way.",
    "file": "audio/vo.mp3"
  }
}
```

The `stitch.mjs` script supports a `--vo` flag that mixes VO at 0 dB and BGM at -18 dB under it.

## Music length and timing

Independent music generation is not connected. Do not add a music-model call based on duration. Preserve planned Seedance native sound, or use an existing authorized music asset when requested; inspect duration, loudness and speech audibility after mixing. Stock-voice TTS requires the configured speech adapter, a frozen text scope and actual listening; a planning JSON entry does not create an audio file.

The absence of a separate `music` asset is intentional when native or silent output satisfies the brief, at any duration.

The music prompt should still be derived from the brand profile. A longer piece has more time to develop—the same brand mood, but with longer phrasing, more harmonic movement, section-level energy changes, and an explicit ending.

## Brand profile stability across long-form

The brand profile is the *constant* across a 30s or 60s video. You don't re-extract the brand profile per segment — the same `brand_profile.json` drives all of them. The brand's color names, typography, photography mood are stable inputs.

## Avoiding drift at the seams

Four rules keep the numbered continuation seamless:

1. **End segment N on a static moment** — held pose, fully-spread ribbon, glyph at rest. The model has nothing stable to continue if the frame is dynamic, so it invents motion that doesn't match.
2. **Persist the lineage before generating segment N+1** — set `sequence=N+1`, `continuation_of=N`, and point `first_frame_file` at segment N's extracted, probed `last_frame_file`.
3. **Keep the motion_prompt for segment N+1 focused on the local beat** — "from this static frame, fade to background and reveal the end card" — not a recap or a new opening.
4. **If drift appears, diagnose the affected join** — revise only the affected scope when the preceding clip is valid. Retrying requires known task status and remaining authorization/caps; do not assume a new attempt is automatically available.

## Schema extension

The base `storyboard.json` already supports the long-form case via the optional `takes` array. The version stays at `4`. The brand fields are unchanged; the required continuity fields are `sequence`, `continuation_of`, `reference_mode`, `first_frame_source`, `first_frame_file`, `last_frame_file`, and `clip_file`.
