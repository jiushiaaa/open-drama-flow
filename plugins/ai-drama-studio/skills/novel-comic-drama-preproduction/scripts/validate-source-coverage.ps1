[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestPath,
  [string]$ReportPath,
  [switch]$NoFail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Sha256Hex([string]$Path) {
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
    finally { $algorithm.Dispose() }
  } finally { $stream.Dispose() }
}

$manifestFile = (Resolve-Path -LiteralPath $ManifestPath).Path
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
$baseDirectory = Split-Path -Parent $manifestFile
$errors = [System.Collections.Generic.List[string]]::new()

$sourceChapterIds = @($manifest.source.chapterIds | ForEach-Object { [string]$_ })
$episodeIds = @($manifest.episodes | ForEach-Object { [string]$_.id })
$referencedChapterIds = @($manifest.episodes | ForEach-Object { @($_.sourceChapterIds) } | ForEach-Object { [string]$_ })

if ($sourceChapterIds.Count -eq 0) { $errors.Add('SOURCE_CHAPTERS_EMPTY') }
if (@($episodeIds | Group-Object | Where-Object Count -gt 1).Count -gt 0) { $errors.Add('DUPLICATE_EPISODE_IDS') }

$unknown = @($referencedChapterIds | Where-Object { $_ -notin $sourceChapterIds } | Sort-Object -Unique)
$uncovered = @($sourceChapterIds | Where-Object { $_ -notin $referencedChapterIds } | Sort-Object -Unique)
$episodesWithoutSource = @($manifest.episodes | Where-Object { @($_.sourceChapterIds).Count -eq 0 } | ForEach-Object { [string]$_.id })

if ($unknown.Count -gt 0) { $errors.Add('UNKNOWN_CHAPTER_REFERENCES') }
if ($uncovered.Count -gt 0) { $errors.Add('UNCOVERED_SOURCE_CHAPTERS') }
if ($episodesWithoutSource.Count -gt 0) { $errors.Add('EPISODES_WITHOUT_SOURCE') }

$sourcePath = [string]$manifest.source.path
if ([string]::IsNullOrWhiteSpace($sourcePath)) {
  $errors.Add('SOURCE_PATH_MISSING')
} else {
  if (-not [System.IO.Path]::IsPathRooted($sourcePath)) { $sourcePath = Join-Path $baseDirectory $sourcePath }
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { $errors.Add('SOURCE_FILE_MISSING') }
  elseif ([string]$manifest.source.sha256 -notmatch '^[a-f0-9]{64}$') { $errors.Add('SOURCE_SHA256_INVALID') }
  else {
    $actual = Get-Sha256Hex $sourcePath
    if ($actual -ne [string]$manifest.source.sha256) { $errors.Add('SOURCE_SHA256_MISMATCH') }
  }
}

$report = [ordered]@{
  schemaVersion = '1.0'
  check = 'source-coverage'
  manifestPath = $manifestFile
  passed = $errors.Count -eq 0
  sourceChapterCount = $sourceChapterIds.Count
  episodeCount = @($manifest.episodes).Count
  uncoveredChapterIds = $uncovered
  unknownChapterIds = $unknown
  episodesWithoutSource = $episodesWithoutSource
  errors = @($errors)
}

$json = $report | ConvertTo-Json -Depth 8
if ($ReportPath) {
  $target = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReportPath)
  $parent = Split-Path -Parent $target
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($target, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}
$json
if (-not $report.passed -and -not $NoFail) { exit 1 }
