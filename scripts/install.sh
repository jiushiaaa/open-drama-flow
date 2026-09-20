#!/usr/bin/env bash
set -euo pipefail

# macOS installation. No sudo, credential writes, paid calls or process termination.
host="${1:-generic}"
case "$host" in codex|generic) ;; *) echo "Usage: bash scripts/install.sh [codex|generic]" >&2; exit 2 ;; esac
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "On Windows use scripts/install.ps1 (Codex) or AGENT_GUIDE.md (other Agents)." >&2
  exit 1
fi
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugin_root="$repo_root/plugins/ai-drama-studio"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
for pair in "node:node" "ffmpeg:ffmpeg" "cloudflared:cloudflared"; do
  command_name="${pair%%:*}"
  formula="${pair##*:}"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    if ! command -v brew >/dev/null 2>&1; then
      echo "Missing $command_name. Install it from its official distribution or install Homebrew, then rerun." >&2
      exit 1
    fi
    brew install "$formula"
  fi
done
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.error("Node.js 20+ required"); process.exit(1); }'
for port in "${AI_DRAMA_PORT:-4317}" 4319; do
  if curl --silent --fail --max-time 2 "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
    echo "A workbench is running. Finish its work before reinstalling; no process was stopped." >&2
    exit 1
  fi
done
npm --prefix "$plugin_root" ci
node "$repo_root/scripts/agent-setup.mjs" --check
node "$plugin_root/scripts/sync-skill-manifest.mjs" --check
AI_DRAMA_AGENT_HOST="$host" node "$plugin_root/scripts/verify-skill-mcp.mjs"
if [[ "$host" == "codex" ]]; then
  if ! command -v codex >/dev/null 2>&1; then
    echo "Codex CLI is missing from PATH. Enable/install it, or use generic MCP configuration below." >&2
    node "$repo_root/scripts/agent-setup.mjs" --print-config --host codex
    exit 1
  fi
  # Existing marketplace conflicts must be reconciled by the Agent, never removed here.
  codex plugin marketplace add "$repo_root"
  codex plugin add ai-drama-studio@ai-drama-local
  echo "Reload Codex's plugin or open a new task. Use the built-in image tool; configure Ark for video."
else
  node "$repo_root/scripts/agent-setup.mjs" --print-config --host generic
  echo "Merge this entry into your Agent's MCP settings and reload. Configure an image API key (Ark/Seedream, fal or Replicate) and a video API key in the workbench."
fi
echo "Open the workbench URL from drama_get_state. Installation made no paid model calls."
