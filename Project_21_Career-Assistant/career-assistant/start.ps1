$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Test-Python {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
    }
    if (Get-Command python -ErrorAction SilentlyContinue) {
        & python -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
    }
    return $false
}

function Test-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) { return $false }
    & node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)" 2>$null
    return ($LASTEXITCODE -eq 0)
}

if (-not (Test-Python) -or -not (Test-Node)) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "Python 3.12+ or Node.js 22.12+ is missing, and winget is unavailable. Install the missing runtime, then run this command again."
    }
    if (-not (Test-Python)) {
        Write-Host "Installing Python 3.13 with winget..."
        & winget install --id Python.Python.3.13 --exact --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw "Python installation failed (winget exit code $LASTEXITCODE)." }
    }
    if (-not (Test-Node)) {
        Write-Host "Installing Node.js LTS with winget..."
        & winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { throw "Node.js installation failed (winget exit code $LASTEXITCODE)." }
    }
    Refresh-Path
}

if (-not (Test-Python)) { throw "Python 3.12+ is still unavailable. Reopen PowerShell after installation and run .\start.ps1 again." }
if (-not (Test-Node)) { throw "Node.js 22.12+ is still unavailable. Reopen PowerShell after installation and run .\start.ps1 again." }

if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 (Join-Path $root "scripts\run_local.py")
} else {
    & python (Join-Path $root "scripts\run_local.py")
}
exit $LASTEXITCODE
