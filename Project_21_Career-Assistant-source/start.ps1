$ErrorActionPreference = "Stop"
$launcher = Join-Path $PSScriptRoot "career-assistant\start.ps1"

if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    throw "Career Assistant launcher not found at '$launcher'. Make sure the Project_21_Career-Assistant-source folder is complete."
}

& $launcher
exit $LASTEXITCODE
