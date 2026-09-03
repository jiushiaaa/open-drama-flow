# Audio, Dialogue, Lyrics, And Beat Sync

Use when voice, dialogue, lyrics, lip sync, music rhythm, audio reuse, or beat-sync editing is central.

## Required Rules

- Write exact dialogue, lyrics, or spoken words when fidelity matters.
- Identify who speaks or sings.
- Keep dialogue length compatible with shot duration.
- If one sentence spans multiple shots, explicitly say it continues from the previous shot.
- If a voice-over becomes an on-screen speaker after a cut, explain the transition.
- If using audio reference, state whether it controls timbre, rhythm, mood, lyrics, or full audio reuse.

## Sound Planning (not provider API fields)

Set the real ShotSpec audioMode explicitly. Use provider-native for generated speech/ambience/music, none for silence, or source-asset/post with the actual audio binding contract. Check drama_get_capabilities before execution. Bind real reference_audio asset IDs for audio guidance; writing a filename or a voice description does not attach an audio file. If standard-voice TTS is available, use the actual speech job schema (text; the voice uses the configured supported speaker), never send prose voice directions as text to be spoken. ASR checks words/timing, not identity, emotion, or music quality. Listen to the result.

The following headings are creative planning labels, not JSON parameters:

- `overall_soundscape`: diegetic ambience, Foley, physical action sounds, UI sounds, non-verbal human sounds.
- `non_diegetic_music`: audience-only score/background music.
- If no BGM is desired, write `non_diegetic_music: N/A` or `非叙事性音乐：N/A，不要额外添加背景音乐。`

## Beat-Sync / MV Rules

Map visual events to rhythm drivers:

- hi-hat roll -> micro shake, jump-frame, small typography reassembly.
- snare -> hard cut, text punch-in, shoulder/head accent.
- 808 bass hit -> low-frequency screen compression, flash, text stretch.
- vocal keyword -> mouth shape, jaw, head nod, hand gesture, typography reveal.

Avoid random text motion. Text and cuts should follow audible events.
