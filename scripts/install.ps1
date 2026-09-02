[CmdletBinding()]
param(
  [switch]$SkipDependencyInstall,
  [switch]$SkipLaunch
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($env:OS -ne "Windows_NT") {
  throw "OpenDramaFlow currently supports Codex Desktop on Windows only."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pluginRoot = Join-Path $repoRoot "plugins\ai-drama-studio"
$runtimeRoot = Join-Path $env:LOCALAPPDATA "OpenDramaFlow"
$runtimeBin = Join-Path $runtimeRoot "bin"
$cloudflaredPath = Join-Path $runtimeBin "cloudflared.exe"

function Refresh-ProcessPath {
  $current = $env:Path
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$current;$machine;$user;$runtimeBin"
}

function Find-Command([string]$Name) {
  return Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Install-WingetPackage([string]$Id) {
  if ($SkipDependencyInstall) { throw "Missing dependency: $Id" }
  if (-not (Find-Command "winget.exe")) { throw "WINGET_REQUIRED: install App Installer, then rerun this script." }
  & winget.exe install --id $Id --exact --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0) { throw "WINGET_INSTALL_FAILED: $Id" }
  Refresh-ProcessPath
}

Refresh-ProcessPath

if (-not (Find-Command "node.exe")) { Install-WingetPackage "OpenJS.NodeJS.LTS" }
$nodeMajor = [int]((& node.exe --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 20) { throw "NODE_VERSION_UNSUPPORTED: Node.js 20 or newer is required." }
if (-not (Find-Command "npm.cmd")) { throw "NPM_NOT_FOUND" }
if (-not (Find-Command "ffmpeg.exe")) { Install-WingetPackage "Gyan.FFmpeg" }
if (-not (Find-Command "codex.exe")) { throw "CODEX_CLI_NOT_FOUND: run this installation prompt inside Codex Desktop." }

New-Item -ItemType Directory -Force -Path $runtimeBin | Out-Null
if (-not (Test-Path -LiteralPath $cloudflaredPath)) {
  $architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
  $asset = if ($architecture -eq "arm64") { "cloudflared-windows-arm64.exe" } else { "cloudflared-windows-amd64.exe" }
  $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/$asset"
  $temporaryPath = "$cloudflaredPath.download"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $temporaryPath -UseBasicParsing
  Move-Item -LiteralPath $temporaryPath -Destination $cloudflaredPath -Force
}
& $cloudflaredPath --version | Out-Null

Push-Location $pluginRoot
try {
  & npm.cmd ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "NPM_INSTALL_FAILED" }
} finally {
  Pop-Location
}

$marketplaces = (& codex.exe plugin marketplace list | Out-String)
$existingMarketplace = [regex]::Match($marketplaces, '(?m)^ai-drama-local\s+(.+)$')
$hasMarketplace = $existingMarketplace.Success
if ($existingMarketplace.Success) {
  $existingRoot = $existingMarketplace.Groups[1].Value.Trim()
  $resolvedExistingRoot = Resolve-Path -LiteralPath $existingRoot -ErrorAction SilentlyContinue
  if (-not $resolvedExistingRoot -or -not [string]::Equals($resolvedExistingRoot.Path, $repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
    & codex.exe plugin remove "ai-drama-studio@ai-drama-local" --json 2>$null | Out-Null
    & codex.exe plugin marketplace remove "ai-drama-local" --json | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "MARKETPLACE_REPLACEMENT_FAILED" }
    $hasMarketplace = $false
  }
}
if (-not $hasMarketplace) {
  & codex.exe plugin marketplace add $repoRoot --json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "MARKETPLACE_INSTALL_FAILED" }
}

$plugins = (& codex.exe plugin list | Out-String)
if ($plugins -match '(?m)^ai-drama-studio@ai-drama-local\s+') {
  & codex.exe plugin remove "ai-drama-studio@ai-drama-local" --json | Out-Null
}
& codex.exe plugin add "ai-drama-studio@ai-drama-local" --json | Out-Null
if ($LASTEXITCODE -ne 0) { throw "PLUGIN_INSTALL_FAILED" }

if (-not $SkipLaunch) {
  $healthUrl = "http://127.0.0.1:4317/api/health"
  $healthy = $false
  try { $healthy = (Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1).ok -eq $true } catch {}
  if (-not $healthy) {
    Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("src/http-server.mjs") -WorkingDirectory $pluginRoot -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 40 -and -not $healthy; $attempt += 1) {
      Start-Sleep -Milliseconds 250
      try { $healthy = (Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1).ok -eq $true } catch {}
    }
  }
  if (-not $healthy) { throw "WORKBENCH_START_FAILED" }
}

[ordered]@{
  installed = $true
  plugin = "ai-drama-studio@ai-drama-local"
  skills = 49
  cloudflared = $cloudflaredPath
  workbench = if ($SkipLaunch) { "not-started" } else { "http://127.0.0.1:4317" }
  nextStep = "Restart Codex Desktop, then say: 打开 OpenDramaFlow"
} | ConvertTo-Json
