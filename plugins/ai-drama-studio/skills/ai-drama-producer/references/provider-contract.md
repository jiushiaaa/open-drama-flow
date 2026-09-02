# Provider Contract

## Credentials

The Ark key is entered only in the local Settings dialog. It is encrypted with Windows DPAPI CurrentUser and is not available through MCP state tools.

## Codex Image Gen

Codex Image Gen is an agent tool route, not a localhost provider endpoint. Claim queued tasks, generate and inspect the image, then attach the absolute local file. This keeps the workflow compatible with the model/tool surface available to Codex.

## Seedream

- Endpoint: `POST {arkBaseUrl}/images/generations`.
- The system-managed model ID is locked in the local runtime and is not exposed as a user field.
- Download URL output immediately; official URLs are temporary.
- Record both the immutable local master and temporary provider URL while valid.

## Seedance

- Create: `POST {arkBaseUrl}/contents/generations/tasks`.
- Query: `GET {arkBaseUrl}/contents/generations/tasks/{id}`.
- Creation is not success. Poll through `queued`/`running`; only `succeeded` has a usable video.
- Preserve task IDs for uncertain timeouts and query before retrying.
- The system-managed Seedance 2.5 model ID and generation profile are locked in the local runtime; upgrades are plugin migrations.
- Local Codex images normally need an Ark-accessible URL, trusted Asset ID, or an object-storage upload bridge. Do not send a Windows file path as `image_url`.

## Paid-call gate

Every real batch has `maxImageCalls` and `maxVideoCalls`. The user approves the batch, not the agent. Stop when either cap is reached. A failed provider generation consumes a call unless authoritative billing evidence says otherwise.
