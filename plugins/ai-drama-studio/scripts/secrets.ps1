param(
  [Parameter(Mandatory = $true)][ValidateSet('protect', 'unprotect', 'clear')][string]$Action,
  [Parameter(Mandatory = $true)][string]$SecretPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

if ($Action -eq 'protect') {
  $plain = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($plain)) { throw 'Secret is empty.' }
  $bytes = [Text.Encoding]::UTF8.GetBytes($plain)
  $encrypted = [Security.Cryptography.ProtectedData]::Protect(
    $bytes,
    $null,
    [Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  $directory = [IO.Path]::GetDirectoryName($SecretPath)
  [IO.Directory]::CreateDirectory($directory) | Out-Null
  [IO.File]::WriteAllText($SecretPath, [Convert]::ToBase64String($encrypted), [Text.UTF8Encoding]::new($false))
  exit 0
}

if ($Action -eq 'unprotect') {
  $encoded = [IO.File]::ReadAllText($SecretPath, [Text.Encoding]::UTF8)
  $encrypted = [Convert]::FromBase64String($encoded)
  $bytes = [Security.Cryptography.ProtectedData]::Unprotect(
    $encrypted,
    $null,
    [Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  [Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes))
  exit 0
}

if (Test-Path -LiteralPath $SecretPath) {
  Remove-Item -LiteralPath $SecretPath -Force
}
