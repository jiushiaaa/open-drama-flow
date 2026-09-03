# Seedance 2.5 Harness acceptance — 2026-09-03

## Implemented and locally verified

- Owned background jobs, shutdown cancellation for network/process work, bounded failure records, and drain-before-teardown. Existing task IDs/uncertain submissions survive for reconciliation rather than automatic duplicate billing.
- Six video modes: text-to-video, first-frame image-to-video, first+last-frame, multimodal references, source-video extension, temporal content edit. Explicit native audio on/off; supported ratios, 480p/720p and integer 4–30 second 2.5 output. The 2.0 compatibility profile retains its smaller limits.
- Ordered typed inputs, asset ID/version/hash, model parameters, edit intent, upstream dependencies and request digests frozen by paid approval. Generated clips and extracted last frames receive provenance. Upstream changes invalidate dependent generation.
- MCP library import/folders, actual media metadata, video review frames, listening WAV, reference format/segment derivatives and HTTPS byte-range reads. Source files remain untouched. Preparation reports any remaining provider incompatibility; it does not silently repair composition or promise identity fidelity.
- Temporal signal evidence (silence, peak level, freezes, black frames) plus required full-playback/listening observations per shot. Motion, identity, continuity, dialogue, sound, subtitles and edit preservation cannot be passed by extraction alone.
- Scoped Chinese/English passage retrieval from approved memory, source-document paging, quote-grounded candidate proposals, exact source version/hash checks, and trusted user confirmation before production memory activation.

## Historical engineering evidence (before the current Skill migration)

Version verified in that earlier round: `0.1.0+codex.20260903harness3`. The repository plugin's 427 non-dependency files match the installed cache, with zero hash differences. An independent read-only MCP process started from that cache exposed all six modes and the new media/memory tools. Full-suite result: 163 tests passed, zero failed; syntax checks passed. These are engineering acceptance results, not paid model-output acceptance.

The account's read-only model listing returned HTTP 200 and exposed `doubao-seedance-2-5-260628`. No account key is included in reports or repository content. This proves model visibility, not per-mode generation entitlement.

The automated multimodal workflow test uses a fake account/provider and synthetic local FFmpeg media. It exercises request → approval snapshot → submission record → mocked download → actual local inspection/asset registration → downstream chaining. A mocked 30-second request returning a short fixture is **not** a real 30-second generation test.

No paid generation was performed during that engineering round. Current execution is automatic within the frozen authorized scope; trusted elicitation is required only in manual mode or when the user asks for it. A changed input must be frozen again; new requests must not bypass exhausted call caps. Host permissions and image-result/memory acceptance remain separate. See the [current Skill and execution update](skill-runtime-update.md) for the latest version and validation procedure.

## Real acceptance matrix after restart

Use owned/authorized non-sensitive input assets and explicitly approve the exact request cap. Stop on the first unsupported-mode or entitlement error; retain its redacted provider code/request ID and do not blindly retry.

| Case | Real acceptance evidence required |
|---|---|
| Text-to-video, 30 seconds, native audio on | succeeded task, downloaded file, measured duration, actual sound and motion review |
| Single first frame, audio off | role and request trace; visual anchor respected; no unintended generated sound |
| Multiple reference images | exact ordered bindings; distinct subjects/reference intent preserved |
| Reference video + audio (plus optional images) | provider accepts all types; actual reference motion/audio intent evident in output |
| First + last frame | both roles preserved; inspect actual output endpoints and intervening movement |
| Extension from preceding clip | upstream result ID/hash; actual continuity and added sequence; inspect whether provider returns only extension or whole sequence before editing |
| Local content edit in a time range | source/version/range/preservation trace; full before/after playback including outside the target range |
| Last-frame continuity chain | extracted real tail frame; downstream approved binding; identity/action continuity inspection |

A failed acceptance case remains unsupported for that account until resolved. Do not claim “all Seedance capabilities verified” based on unit tests or an announcement.

## Deliberate remaining boundaries

- Prompt-directed temporal editing is not a spatial-mask API, pixel-exact preservation guarantee, or deterministic in-place file modification.
- Model output duration, motion, identity and dialogue fidelity remain stochastic. Real output acceptance must precede delivery.
- BytePlus LAS documentation and Ark accounts have different endpoints/model IDs. The adapter does not substitute LAS credentials or assume LAS entitlements/pricing. Real-person inputs may require provider material-library review/allowlisting; HTTPS alone cannot bypass that requirement.
- Temporary local reference URLs currently expire after one hour and depend on a running tunnel/host. Long queues, host sleep and tunnel failure may require a managed asset service; do not repeatedly resubmit paid work to hide bridge failure.
- Semantic listening/playback must actually be performed by a capable agent surface or a person. No standalone ASR, voice cloning, TTS/music model, mask editor or 3D editor was added. Signal measurements are not speech recognition or identity validation.
- Retrieval is local lexical passage ranking with Chinese bigrams, not embedding/RAG infrastructure. Candidates are grounded suggestions, not automatically learned truth.
- The feature contract is not a passthrough of every provider knob (for example seed/frames are not exposed). Unsupported keys fail explicitly instead of being silently dropped.

## Sources

- [ByteDance Seedance 2.5 launch and capability examples](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)
- [BytePlus video generation API and media constraints](https://docs.byteplus.com/en/docs/byteplus_las/video_gen_enhanced)

These establish provider claims and input constraints, not this account's paid execution results.
