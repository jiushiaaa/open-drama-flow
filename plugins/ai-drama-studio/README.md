# OpenDramaFlow Agent plugin

This directory contains the Windows/macOS HTTP workbench, MCP runtime, provider adapters and 47 shipped Skills (one producer + 46 specialists).

Use the root [English guide](../../README.md) or [中文指南](../../README_zh.md) for installation, production workflow, real examples and capability boundaries. Those guides are the canonical feature overview.

## Development

```powershell
npm ci
npm run check
npm test
node scripts/sync-skill-manifest.mjs --check
node scripts/verify-skill-mcp.mjs
```

- `npm start`: loopback HTTP workbench; does not register the plugin.
- `npm run mcp`: MCP stdio server, which starts or reuses the local workbench.
- `node scripts/verify-skill-mcp.mjs <installed-plugin-root>`: isolated installed-copy catalog/routing verification; no paid generation.
- `node scripts/sync-skill-manifest.mjs`: refresh manifest after intentional Skill edits.

## Contracts

Read [producer rules](skills/ai-drama-producer/SKILL.md), [execution](skills/ai-drama-producer/references/execution-contract.md), [image acceptance](skills/ai-drama-producer/references/image-asset-contract.md) and [provider rules](skills/ai-drama-producer/references/provider-contract.md) before production changes.

Default automatic execution stays within frozen budgets; manual approval and trusted memory gates remain available. Codex defaults to built-in image generation; other Agents use configured image APIs through the `generic` host profile. Both routes require image acceptance before library import. Project-specific delegated review is not global authorization.

Seedance modes and input limits are validated in `src/seedance-contract.mjs`; actual provider responses remain authoritative. ASR, standard TTS, SeedAudio music and resumable local Real-ESRGAN tools are integrated, subject to credentials and local dependencies. Video Depth Anything remains an external experiment.

## Storage

State defaults to `%LOCALAPPDATA%\OpenDramaFlow\data` on Windows or `~/Library/Application Support/OpenDramaFlow/data` on macOS (`AI_DRAMA_DATA_DIR` overrides either). Keys use Windows DPAPI or macOS Keychain. Optional `AI_DRAMA_MEDIA_DIR` controls new media placement, not migration of existing references. External files are retained on project deletion with recovery metadata.

Never put credentials, private runtime state, novels or downloaded third-party media into this directory. Reinstall through the system plugin-creator flow and verify the installed copy; don't overwrite a live cache manually.
