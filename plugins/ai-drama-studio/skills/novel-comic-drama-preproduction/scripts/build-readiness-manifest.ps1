[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
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
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$temporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("odf-preproduction-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null

try {
  $sourceReportPath = Join-Path $temporaryDirectory 'source.json'
  $assetReportPath = Join-Path $temporaryDirectory 'assets.json'
  & (Join-Path $scriptDirectory 'validate-source-coverage.ps1') -ManifestPath $manifestFile -ReportPath $sourceReportPath -NoFail | Out-Null
  & (Join-Path $scriptDirectory 'audit-project-assets.ps1') -ManifestPath $manifestFile -ReportPath $assetReportPath -NoFail | Out-Null
  $sourceReport = Get-Content -LiteralPath $sourceReportPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $assetReport = Get-Content -LiteralPath $assetReportPath -Raw -Encoding UTF8 | ConvertFrom-Json

  $issues = [System.Collections.Generic.List[string]]::new()
  if (-not [bool]$sourceReport.passed) { $issues.Add('SOURCE_COVERAGE_FAILED') }
  if (-not [bool]$assetReport.passed) { $issues.Add('ASSET_AUDIT_FAILED') }

  foreach ($episode in @($manifest.episodes)) {
    foreach ($field in @('script', 'directorOverview', 'promptPackage')) {
      $document = $episode.$field
      if ($null -eq $document -or [string]$document.status -ne 'approved') {
        $issues.Add("EPISODE_DOCUMENT_NOT_APPROVED:$($episode.id):$field")
        continue
      }
      $path = [string]$document.path
      if (-not [System.IO.Path]::IsPathRooted($path)) { $path = Join-Path $baseDirectory $path }
      if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $issues.Add("EPISODE_DOCUMENT_MISSING:$($episode.id):$field")
        continue
      }
      $sha = [string]$document.sha256
      if ($sha -notmatch '^[a-f0-9]{64}$' -or (Get-Sha256Hex $path) -ne $sha) {
        $issues.Add("EPISODE_DOCUMENT_HASH_INVALID:$($episode.id):$field")
      }
    }
    if ([int]$episode.shotCount -le 0) { $issues.Add("EPISODE_SHOTS_EMPTY:$($episode.id)") }
    if ([int]$episode.durationSeconds -le 0) { $issues.Add("EPISODE_DURATION_INVALID:$($episode.id)") }
  }

  foreach ($asset in @($manifest.assets | Where-Object { [bool]$_.required })) {
    if ([string]$asset.status -notin @('approved', 'verified-source')) { $issues.Add("REQUIRED_ASSET_NOT_APPROVED:$($asset.id)") }
    if (-not [bool]$asset.libraryImported) { $issues.Add("REQUIRED_ASSET_NOT_IMPORTED:$($asset.id)") }
  }
  if (@($manifest.audits.unresolved).Count -gt 0) { $issues.Add('UNRESOLVED_AUDIT_ITEMS') }
  if ([string]$manifest.production.audioPlanStatus -ne 'approved') { $issues.Add('AUDIO_PLAN_NOT_APPROVED') }
  if ([string]$manifest.production.subtitlePlanStatus -ne 'approved') { $issues.Add('SUBTITLE_PLAN_NOT_APPROVED') }
  if ([bool]$manifest.production.videoStarted) { $issues.Add('VIDEO_ALREADY_STARTED') }

  $uniqueIssues = @($issues | Sort-Object -Unique)
  $videoApproved = [bool]$manifest.approvals.videoStartApproved
  $status = if ($uniqueIssues.Count -gt 0) { 'needs-work' } elseif ($videoApproved) { 'approved-to-start-video' } else { 'ready-for-video-approval' }
  $manifestHash = Get-Sha256Hex $manifestFile
  $readiness = [ordered]@{
    schemaVersion = '1.0'
    recordType = 'novel-comic-drama-preproduction-readiness'
    project = $manifest.project
    sourceManifestPath = $manifestFile
    sourceManifestSha256 = $manifestHash
    status = $status
    ready = $uniqueIssues.Count -eq 0
    videoStartApproved = $videoApproved
    episodeCount = @($manifest.episodes).Count
    shotCount = [int](($manifest.episodes | Measure-Object -Property shotCount -Sum).Sum)
    assetCount = @($manifest.assets).Count
    sourceCoverage = $sourceReport
    assetAudit = $assetReport
    issues = $uniqueIssues
    boundary = 'This record never starts video generation. It only proves readiness for the user decision.'
  }

  $target = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
  $parent = Split-Path -Parent $target
  if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $json = $readiness | ConvertTo-Json -Depth 12
  [System.IO.File]::WriteAllText($target, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
  $json
  if (-not $readiness.ready) { exit 1 }
} finally {
  if (Test-Path -LiteralPath $temporaryDirectory) { Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force }
}
