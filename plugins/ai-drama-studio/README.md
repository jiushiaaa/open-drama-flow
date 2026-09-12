# OpenDramaFlow Codex plugin

This directory contains the local HTTP workbench, MCP runtime, provider adapters and 46 shipped Skills (one producer + 45 specialists).

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

Default automatic execution stays within frozen budgets; manual approval and trusted memory gates remain available. Codex built-in image generation is the default. Project-specific delegated review is not global authorization.

Seedance modes and input limits are validated in `src/seedance-contract.mjs`; actual provider responses remain authoritative. ASR and standard TTS are integrated. Independent music, depth and upscaling experiments are not advertised as general MCP adapters.

## Storage

State defaults to `%LOCALAPPDATA%\OpenDramaFlow\data` (`AI_DRAMA_DATA_DIR`). Optional `AI_DRAMA_MEDIA_DIR` controls new media placement, not migration of existing references. External files are retained on project deletion with recovery metadata.

Never put credentials, private runtime state, novels or downloaded third-party media into this directory. Reinstall through the system plugin-creator flow and verify the installed copy; don't overwrite a live cache manually.
