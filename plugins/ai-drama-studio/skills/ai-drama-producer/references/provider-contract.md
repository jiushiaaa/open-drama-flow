# Provider Contract

## Credentials

The Ark key is entered only in local settings, protected by the host credential mechanism, and never returned through MCP state tools. Never request, paste, echo, log or persist it in project content.

## Paid-call authorization

`drama_request_paid_batch` creates an immutable pending snapshot of the current plan revision, prompts, generation settings, exact input asset bindings and maximum image/video call counts. It does not authorize or start anything.

Only `drama_authorize_and_start_paid_batch` transitions a frozen scope to execution. Product policy defaults to `automatic`: execute the user's requested task without per-call popups, recording `automatic-policy` bound to the scope digest. It is not a claim that a human accepted an MCP form.

Use `drama_set_execution_mode` only in response to a user preference: `manual` for explicit per-call approval, `automatic` to return to automatic operation. Manual mode requires the trusted server MCP form with action=accept and confirm=true; HTTP actions, agent-supplied assertions and prior silence do not satisfy it. Unavailable/cancelled/unconfirmed elicitation means zero calls. Changing policy starts nothing and does not reinterpret an old manual or rejected scope; prepare a new scope when its policy no longer matches.

Start at most one job for one scope. Enforce both call caps; a failed or claimed attempt consumes its cap unless authoritative billing evidence establishes otherwise. Never create new scopes to bypass exhausted budgets or uncertain calls. Host sandbox/network/tool permissions are separate and remain enforced. Production memory approval is unaffected.

## Codex Image Gen

Codex Image Gen is the default agent tool route, not a localhost provider endpoint. Follow [the image asset contract](image-asset-contract.md): generate with the current Codex session's built-in image tool, inspect and display candidates outside the project library, then wait for user acceptance of the exact bytes before import or task completion. Automatic call execution is not image acceptance. For an existing queued task, retain its frozen prompt and budget; standalone image tasks need no fabricated video brief or duration. Record failure honestly instead of attaching a placeholder.

The resulting asset must keep a stable `assetId`, version and approval/revision binding. Downstream work must use the exact approved version, not whichever file is newest.

## Seedream

This is an exceptional fallback, not an equal default. Use it only when the user explicitly requests the project image model or the Codex built-in tool is verifiably unavailable/failing, following the evidence, retry and acceptance rules in [the image asset contract](image-asset-contract.md). A configured Ark key or old provider setting alone does not authorize switching. Do not use a pipeline that auto-imports its generated output for unaccepted candidates; retain standalone output outside the library until the user approves it.

- Endpoint: `POST {arkBaseUrl}/images/generations`.
- The model ID is system-managed by the installed adapter.
- Persist the provider-call reservation before dispatch so restart or timeout cannot silently create a duplicate.
- Download temporary provider output immediately to candidate staging outside the library, and record its hash, call status and task/result evidence. It becomes a library master only after user acceptance.
- An uncertain call must be reconciled before retrying.

## Seedance adapter boundary

- Create: `POST {arkBaseUrl}/contents/generations/tasks`.
- Query: `GET {arkBaseUrl}/contents/generations/tasks/{id}`.
- The Seedance 2.5 profile accepts integer output durations of 4–30 seconds, 480p/720p, and the enumerated aspect ratios. The 2.0 compatibility profile remains limited to 4–15 seconds. Unknown models and unsupported parameters fail closed; a model appearing in the account list is not generation entitlement evidence.
- Six explicit input modes are supported: `text-to-video`, `image-to-video`, `first-last-frame`, `multimodal-reference`, `video-extend`, and `video-edit`. Provider content uses `first_frame`, `last_frame`, `reference_image`, `reference_video`, or `reference_audio`; a subject reference is not automatically a first frame. Never mix frame constraints with general-reference mode.
- The 2.5 profile allows up to 30 images, 10 videos and 10 audio references, within the per-file size/format/dimension limits and 30-second aggregate duration limit for each of reference video and audio. Call `drama_inspect_asset` on each input before approval. Conversion/segment preparation creates a derivative asset; it never overwrites the source.
- A Windows/local path is not a provider URL. Approved library images, videos and audio are resolved to HTTPS or trusted `asset://` inputs. The controlled bridge supports byte ranges for media. HTTPS does not bypass provider real-person/material-library compliance. Its temporary tunnel must stay running; network availability and long queue delays remain operational risks.
- Always send `generate_audio: true` or `false`. `audioMode: provider-native` requests native sound, while `none` explicitly disables it; presence of an audio stream does not establish audible or correct dialogue.
- Extension and edit use the generation endpoint with a source video and explicit prompt instructions. Edit time range and preservation constraints are frozen. This is not a mask/region-edit API and does not promise pixel-exact preservation or replacement of only the requested frames.
- `continuation` binds the preceding shot's actual downloaded video or extracted last frame. Upstream request digest, output asset ID/version/hash and downstream call inputs are traced; changing an upstream shot invalidates dependent work.
- Persist the provider task ID and exact input `assetId`/version before polling. Creation or `running` status is not success; only `succeeded` plus a downloaded local clip is usable evidence.
- Timeouts and indeterminate transport errors remain uncertain. Query the recorded task before any retry.
- The model ID and generation profile are system-managed by the installed adapter; changing them requires a verified adapter migration.

Managed voice cloning, standalone music generation, mask-based pixel editing, controllable 3D scene editing, and professional NLE project export remain unconnected. Native Seedance sound is not a substitute for a controllable voice service. If a Skill requires these features, state the boundary rather than inventing an adapter. All six video modes have isolated contract/workflow tests; account-specific paid acceptance must still be verified by actual bounded calls under the selected execution policy. Never report mocked provider fixtures as real generation results.

## Optional Doubao speech

- Configure a separate speech API key in the local vault. It is protected by DPAPI independently of the Ark key, is never returned through state/MCP, and is not shipped to forks. No speech key means Seedance native sound plus actual listening; do not pretend ASR/TTS ran.
- ASR: official `https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash`, resource `volc.bigasr.auc_turbo`, `X-Api-Key`. Only an approved registered audio/video segment is sent, as embedded WAV data (16 kHz mono). The adapter's bounded limit is 120 seconds per approval, default 5 seconds; longer sources require explicitly selected segments. This is an adapter limit, not the provider's advertised maximum.
- TTS: official `https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse`, resource `seed-tts-2.0`, fixed stock voice `zh_female_vv_uranus_bigtts`, MP3 / 24 kHz, at most 500 characters per approval. This is not voice cloning or music generation.
- `drama_request_speech_job` freezes one request, source versions/hash, execution policy and parameters without submitting it. `drama_authorize_speech_job` reserves and dispatches one call automatically in automatic mode; manual mode requires an accepted trusted MCP form. HTTP does not expose an approval/execution route. In manual mode cancel, absent confirmation or absent elicitation means zero calls. Error/timeout consumes the one attempt and never triggers automatic retry or service switching.
- `drama_get_speech_job` returns durable status, request ID/digest, provider code/log ID and versioned output evidence. Interrupted tasks become uncertain when their owner is gone; do not resubmit them automatically. If provider success is followed by local import failure, preserve the job output directory for manual recovery instead of paying again.
- Service availability and actual quality are separate from credential configuration. ASR produces unreviewed transcript evidence with relative timestamps and source offset. TTS produces an unreviewed library asset, not a replaced soundtrack. Use explicit asset binding and existing revision/approval rules after listening. Cloning and independent music remain out of scope.

Official contracts: [ASR flash](https://www.volcengine.com/docs/6561/1631584), [TTS V3](https://www.volcengine.com/docs/6561/1598757), [ByteDance TTS sample](https://github.com/bytedance/agentkit-samples/blob/main/skills/byted-text-to-speech/scripts/text_to_speech.py).

Official capability references: [Seedance 2.5 announcement](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5), [BytePlus video generation contract](https://docs.byteplus.com/en/docs/byteplus_las/video_gen_enhanced). BytePlus LAS and Ark use different model IDs/endpoints; do not replace the locally configured Ark endpoint with a LAS example.

## Local editing and delivery boundary

FFmpeg may deterministically concatenate, crop/scale, time, subtitle, preserve/mix available audio and encode a local file. The current delivery scope is one reviewed local MP4 per creation page; create separate pages for additional aspect ratios or variants. A successful FFmpeg command proves only that rendering completed.

It does not prove that the story, identity, brand, continuity, subtitles, sound or acceptance criteria are correct. Delivery requires actual inspection, a passed evidence-based review, revalidation that the file has not changed, and a SHA-256 manifest from `drama_finalize_delivery`.
