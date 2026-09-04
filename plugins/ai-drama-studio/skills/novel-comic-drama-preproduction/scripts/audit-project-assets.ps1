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
$forbiddenPattern = '(?i)(draft|candidate|preflight|pending[-_ ]?review|rejected|superseded|\u5F85\u6838\u5BF9|\u5F85\u786E\u8BA4|\u8349\u7A3F|\u5019\u9009|\u5E9F\u6848|\u672A\u91C7\u7EB3)'
$badLibraryAssets = [System.Collections.Generic.List[object]]::new()
$missingFiles = [System.Collections.Generic.List[string]]::new()
$hashMismatches = [System.Collections.Generic.List[string]]::new()

foreach ($asset in @($manifest.assets)) {
  $name = [string]$asset.name
  $status = [string]$asset.status
  $imported = [bool]$asset.libraryImported
  $eligible = [bool]$asset.libraryEligible
  $sha = [string]$asset.sha256

  if ($imported -and ((-not $eligible) -or $status -notin @('approved', 'verified-source') -or $name -match $forbiddenPattern)) {
    $badLibraryAssets.Add([ordered]@{ id = [string]$asset.id; name = $name; status = $status })
  }
  if (($imported -or [bool]$asset.required) -and $sha -notmatch '^[a-f0-9]{64}$') {
    $errors.Add("ASSET_SHA256_INVALID:$($asset.id)")
  }
  $path = [string]$asset.path
  if (-not [string]::IsNullOrWhiteSpace($path)) {
    if (-not [System.IO.Path]::IsPathRooted($path)) { $path = Join-Path $baseDirectory $path }
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $missingFiles.Add([string]$asset.id)
    } elseif ($sha -match '^[a-f0-9]{64}$') {
      $actual = Get-Sha256Hex $path
      if ($actual -ne $sha) { $hashMismatches.Add([string]$asset.id) }
    }
  }
}

$duplicates = @($manifest.assets | Where-Object { [string]$_.sha256 -match '^[a-f0-9]{64}$' } | Group-Object sha256 | Where-Object Count -gt 1 | ForEach-Object {
  [ordered]@{ sha256 = $_.Name; assetIds = @($_.Group | ForEach-Object { [string]$_.id }) }
})

if ($badLibraryAssets.Count -gt 0) { $errors.Add('FORBIDDEN_LIBRARY_ASSETS') }
if ($missingFiles.Count -gt 0) { $errors.Add('ASSET_FILES_MISSING') }
if ($hashMismatches.Count -gt 0) { $errors.Add('ASSET_SHA256_MISMATCH') }
if ($duplicates.Count -gt 0) { $errors.Add('DUPLICATE_ASSET_CONTENT') }

$report = [ordered]@{
  schemaVersion = '1.0'
  check = 'project-assets'
  manifestPath = $manifestFile
  passed = $errors.Count -eq 0
  assetCount = @($manifest.assets).Count
  libraryImportedCount = @($manifest.assets | Where-Object { [bool]$_.libraryImported }).Count
  forbiddenLibraryAssets = @($badLibraryAssets)
  missingFileAssetIds = @($missingFiles)
  hashMismatchAssetIds = @($hashMismatches)
  duplicateHashes = $duplicates
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
