# Agent onboarding

OpenDramaFlow is a local video-production harness. The Agent handles creative decisions and orchestration; MCP tools enforce state, versions, budgets and parameter constraints. The Codex plugin is the native distribution. Other Agents can connect to the same local stdio MCP server without installing Codex.

**An installation request is not permission to create a project, spend money or generate media.** First read [AGENTS.md](AGENTS.md). Preserve existing settings, credentials, running jobs and uncommitted work.

## 1. Check the host before installing

| Requirement | What to verify |
| --- | --- |
| Windows or macOS runtime | Node.js 20+, npm, Git and FFmpeg/ffprobe. Windows uses PowerShell/DPAPI; macOS uses the system Keychain (`/usr/bin/security`). Do not install PowerShell on macOS. |
| Local stdio MCP | The host can launch a local process and call its discovered tools. Supporting a proprietary plugin format alone is insufficient. |
| Instructions and files | The Agent can read repository Markdown Skills and approved local media. If it cannot, report the limitation; do not pretend instructions were loaded. |
| Media review | Check which image, video and audio inspection tools the host actually provides. Technical probing is not viewing/listening or creative approval. |
| Trusted confirmation | Manual paid execution and production-memory approval use MCP elicitation. If the host cannot complete that flow, leave the gated operation blocked; do not forge approval or change policy to bypass it. |

Do not assume access to Codex image generation, Codex browser panels or another host's subscriptions. A cloud-only office Agent that accepts only remote MCP URLs cannot use this local server directly. No hosted MCP gateway is supplied.

## 2. Get a complete checkout

For a new installation:

```powershell
git clone https://github.com/jiushiaaa/open-drama-flow.git
cd open-drama-flow
```

For an existing checkout, inspect `git status`, its remote and active jobs first. Fetch and reconcile updates without discarding local changes. Do not run dependency replacement, reinstall or restart against an actively producing checkout. Do not kill a process merely because it owns a workbench port.

### Codex Desktop: native plugin

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

macOS:

```bash
bash scripts/install.sh codex
```

The macOS installer uses Homebrew for missing Node, FFmpeg and Cloudflared; if Homebrew is absent it stops with the missing dependency instead of running an unreviewed installer or sudo. Install dependencies from official sources, then resume. Both native routes require the Codex CLI. Preserve existing marketplace registrations; if the same name points elsewhere, stop and reconcile instead of removing it. Follow dependency and plugin-registration results, then reload the plugin or open a new task. When updating Codex packaging, follow the installed `plugin-creator` instructions rather than hand-editing Codex marketplace/configuration files.

### Other local Agents: standard MCP

Install dependencies in an inactive checkout. If Git, Node or FFmpeg is missing, explain and install it only within the user's installation authorization, using official distributions. Python is not a core dependency; optional external models have their own requirements.

```powershell
npm --prefix plugins/ai-drama-studio ci
node scripts/agent-setup.mjs --check
node scripts/agent-setup.mjs --print-config
```

On macOS, `bash scripts/install.sh generic` combines dependency setup, isolated checks and config output. On Windows, the Agent can install missing dependencies using official distributions or available `winget`, then run the commands above; `install.ps1` is for Codex only.

The helper is read-only: `--check` verifies local prerequisites; `--print-config` prints a `mcpServers` JSON object using this machine's absolute Node executable and server paths, with `AI_DRAMA_AGENT_HOST=generic`. On macOS it also includes Homebrew locations in the child PATH so desktop apps can find FFmpeg. Preserve the generated `env` fields. It never writes host configuration, reads keys or installs software. A successful check does not verify the host or model account.

For Codex hosts without the native plugin route, use `--print-config --host codex` and the supported Codex MCP configuration CLI. Do not register both routes at once under duplicate server names. The native plugin explicitly selects the Codex host profile.

Merge **only** the `ai-drama-studio` entry into the host's existing MCP settings, preserving other servers. If that name already points elsewhere, reconcile it rather than silently replacing it. Use the host's supported settings UI or CLI; adapt the JSON envelope to its documented schema. Paths containing spaces remain JSON strings, not a single shell command. After moving the repository, regenerate the paths.

| Host | Configuration path / method | Status |
| --- | --- | --- |
| Cursor | Merge into project `.cursor/mcp.json` or its MCP settings UI; see [official MCP documentation](https://docs.cursor.com/context/model-context-protocol). | Documented local stdio route; this project's end-to-end production is not host-verified. |
| Claude Code | Merge the full generated entry including `env` into project `.mcp.json`; see [official MCP documentation](https://code.claude.com/docs/en/mcp). | Documented local stdio route; this project's end-to-end production is not host-verified. |
| Trae / WorkBuddy / DeepSeekHarness / other Agents | Detect the exact product/version and consult its official local MCP configuration. Do not invent a manifest path or treat a model API as an Agent host. | Pending host-specific verification. Use only if the requirements above are met. |

Do not install this repository's `.codex-plugin` manifest into an unrelated plugin manager. Skills can be read as ordinary files or loaded through `drama_route_skills`; native `$skill` commands are host-specific and are not required for MCP routing.

## 3. Verify without spending

Run the isolated server check:

```powershell
node plugins/ai-drama-studio/scripts/verify-skill-mcp.mjs
```

It launches a fresh standard MCP client/server using disposable test data and an isolated port, checks Skills, routing and production contracts, and makes no model calls. This validates the server, **not** the target application's connection.

Then reload the target host and verify there:

1. Discover tools; confirm `drama_list_skills`, `drama_route_skills`, `drama_get_capabilities` and `drama_get_state` are available.
2. Read `drama_get_capabilities`, `drama_list_tool_capabilities` and `drama_list_providers` before promising a model or input mode.
3. Call `drama_list_skills`, then call `drama_route_skills` with `{"request":"seedance-prompt-expert","maxResults":1}`. Omit `projectId` and `creationId` so routing does not change a production plan; verify `persisted: false` and read the returned instructions. Read the live schema before calling tools; do not invent argument names or a host-specific tool prefix.
4. Call `drama_get_state`. Open its reported `workbench.url` only when `available` is true. MCP normally starts or reuses the local workbench. In Codex it can appear on the right; elsewhere use the host's browser panel or the default browser.
5. Report separately: prerequisites, server smoke test, host connection, media-review support, confirmation support and account generation tests. Mark untested items as untested.

Default workbench ports are **4317 for Codex and 4319 for generic Agents**; `AI_DRAMA_PORT` overrides them. These are UI URLs, not remote HTTP MCP endpoints. Host/data-root mismatches are not reused. If another version owns the port, report the conflict and arrange a safe restart with its owner; do not stop active production or claim the old UI is current.

Let the user enter provider keys in **API Key** / **Usage & Tools**, not conversation text or tracked configuration. Ark/Seedance and optional Doubao Speech remain defaults. No key is needed for the isolated smoke test. Cloud models consuming local references additionally need a reachable asset URL: configure the existing asset bridge with Cloudflared (`AI_DRAMA_CLOUDFLARED_PATH` can select an installed executable) or a supported existing bridge. Inspect the [bridge implementation and supported configuration](plugins/ai-drama-studio/src/asset-bridge.mjs) before setup. Explain that approved reference bytes become accessible to the model service; do not expose the whole workspace or workbench publicly.

## 4. Start production only when requested

Read the [producer Skill](plugins/ai-drama-studio/skills/ai-drama-producer/SKILL.md) and its required contracts. Host-specific tool names in instructions must be matched to actually available tools; missing tools are limitations, not permission to fabricate outcomes.

1. Read project state, approved context and `drama_get_next_actions` for the intended project/creation. Existing projects must not be recreated because a new Agent connected.
2. Select one of the five production workflows with `drama_select_production_workflow`; route professional Skills and read their instructions. There is no mandatory web-research stage.
3. Inspect stage inputs, deliverables, allowed tools, review criteria and recovery. Load technical references via `drama_read_production_knowledge` only as needed.
4. Save the plan and frozen call limits before generation. Record important choices with `drama_record_production_decision`: alternatives, choice, rejected options and cost impact. Unknown cost is not zero cost.
5. Use `drama_record_stage_checkpoint` and `drama_get_production_progress` for evidence and recovery. Checkpoints do not grant spending, accept images, approve memory or finalize delivery.
6. Reconcile unknown paid submissions with their original provider task ID. Never resubmit simply because the host restarted. Review outputs, repair affected intervals and preserve accepted masters before final delivery.

### Images and host differences

In Codex, use the current built-in image tool by default. Show candidates outside the production library and import only after acceptance, unless the user has explicitly delegated image checking for this exact scope; label delegated review accurately.

Outside Codex, require the user's configured image API key (unless working only with accepted existing images). Default to Ark Seedream; fal FLUX or Replicate FLUX are selectable. Ark's key may serve both Seedream images and Seedance video if the account has both entitlements. Remind the user to configure it in the workbench, never in chat.

Use `drama_prepare_provider_job` with the selected image profile, a stable `requestKey`, `maxCalls: 1`, `imageFallbackReason: verified-host-unavailable` and the actual generic-host evidence. Then start, query and download the candidate through the provider tools. Generic hosts must not create Codex image tasks or use the old image-and-video batch's automatic image registration. Accept/import the image first, then prepare video with `maxImageCalls: 0`. These image adapters currently accept text only; do not drop reference-image/editing requirements to make a request fit. Preserve the same image acceptance and budget boundaries on every host.

For synchronous Seedream, an unknown submission has no pollable task ID and cannot be automatically resubmitted. Saved output URLs can be downloaded again without new generation. Host selection is an installation setting, not a paid-task retry workaround.

### Execution and shared state

Automatic mode executes within the authorized objective and frozen budget; it does not disable the host's permissions or acceptance boundaries. Manual mode remains available on request. Missing trusted confirmation cannot be replaced with a text claim of user approval.

On one OS account, hosts use the same local project store by default: `%LOCALAPPDATA%/OpenDramaFlow/data` on Windows, `~/Library/Application Support/OpenDramaFlow/data` on macOS. Windows credential locations are preserved; macOS keys stay in Keychain, with no plaintext fallback. Never bypass a locked Keychain by writing secrets into a file. Coordinate ownership before changing the same creation from two Agents. State locks are not a creative conflict-resolution system. Do not run competing render/generation owners.

Platform adapters and both host profiles have automated tests. macOS native Keychain tests run only on macOS; the Windows/macOS CI workflow is provided for native validation. Do not claim that a Windows mock test proves macOS end-to-end production. Linux secret storage and cloud-hosted MCP transport are not implemented.

## 5. Installation handoff

Report the checkout, version, host configuration location, workbench URL, tests performed and remaining prerequisites. State explicitly that paid calls were zero during installation. Do not publish private data, add demo assets to real projects, or claim all Agent products are supported because one MCP client connected.

Continue with the user's creative brief only after installation is usable and production is requested. See [production contracts](plugins/ai-drama-studio/docs/production-contracts.md) and [production guide](docs/production-guide.md) for the detailed operating rules.
