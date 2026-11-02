$ErrorActionPreference = "Stop"
$resetScript = Join-Path $PSScriptRoot "scripts\reset_data.py"
$localPython = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"
if (Test-Path -LiteralPath $localPython) {
    & $localPython $resetScript @args
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 $resetScript @args
} else {
    & python $resetScript @args
}
exit $LASTEXITCODE
