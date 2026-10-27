$ErrorActionPreference = 'Stop'
$root = 'D:\ApexifyWorkspaceParallel\text-strict-20261023'
$evidence = Join-Path $root 'evidence\workspace-text\strict'
$cfg = Join-Path $root 'next.config.js'
$backup = Join-Path $evidence 'next.config.original.js'
Set-Location $root
$changed = (& git diff -- next.config.js)
if ($changed) { throw 'Refusing to modify pre-existing next.config.js changes' }
Copy-Item -LiteralPath $cfg -Destination $backup -ErrorAction Stop
$originalHash = (Get-FileHash -Algorithm SHA256 $cfg).Hash
$buildExit = 999
try {
  $body = [IO.File]::ReadAllText($cfg)
  if (-not $body.Contains('  experimental: {')) { throw 'Build worker config anchor missing' }
  [IO.File]::WriteAllText($cfg,$body.Replace('  experimental: {',("  experimental: {`r`n    cpus: 1,")))
  $env:NODE_OPTIONS = '--max-old-space-size=3072'
  & cmd /c 'npm run build > evidence\workspace-text\strict\production-build-single-worker-3072.log 2>&1'
  $buildExit = $LASTEXITCODE
}
finally {
  Copy-Item -LiteralPath $backup -Destination $cfg -Force
  $restoredHash = (Get-FileHash -Algorithm SHA256 $cfg).Hash
  if ($restoredHash -ne $originalHash) { throw 'Build config restoration hash MISMATCH' }
  Write-Output "NEXT_CONFIG_RESTORED_SHA256=$restoredHash"
}
Write-Output "CONTROLLED_SINGLE_WORKER_BUILD_EXIT=$buildExit"
exit $buildExit