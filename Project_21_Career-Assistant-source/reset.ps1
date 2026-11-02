$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "career-assistant\reset.ps1") @args
exit $LASTEXITCODE
