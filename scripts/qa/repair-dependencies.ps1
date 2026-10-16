# Run on a feature branch with a clean worktree. Does not commit, merge or run database migrations.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
function Invoke-CheckedNpm {
    param([string[]]$NpmArgs)
    & npm @NpmArgs
    if ($LASTEXITCODE -ne 0) { throw "npm $($NpmArgs -join ' ') failed: $LASTEXITCODE" }
}
Push-Location $repoRoot
try {
    $branch = & git branch --show-current
    if ($LASTEXITCODE -ne 0 -or -not $branch -or $branch -in @('main', 'master')) {
        throw 'Switch to a feature branch first.'
    }
    $dirty = & git status --porcelain
    if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'Commit or stash your current changes first.' }
    $testPath = 'scripts/security-regression.mjs'
    $test = Get-Content $testPath -Raw
    $oldPin = 'packageJson.dependencies.next === "16.3.3" && packageJson.devDependencies["eslint-config-next"] === "16.3.3"'
    $newPin = 'packageJson.dependencies.next === "16.3.8" && packageJson.devDependencies["eslint-config-next"] === "16.3.8"'
    if (-not ($test.Contains($oldPin) -or $test.Contains($newPin))) {
        throw 'Security version assertion changed; review it manually before upgrading.'
    }
    Invoke-CheckedNpm -NpmArgs @('install', '--save-exact', 'next@16.3.8')
    Invoke-CheckedNpm -NpmArgs @('install', '--save-dev', '--save-exact', 'eslint-config-next@16.3.8', 'postcss@8.5.29')
    # Only fixes within declared dependency ranges; never use --force.
    & npm audit fix
    $fixExit = $LASTEXITCODE
    if ($fixExit -gt 1) { throw 'npm audit fix failed to complete.' }
    $test.Replace($oldPin, $newPin) | Set-Content $testPath -Encoding utf8 -NoNewline
    & ./scripts/qa/acceptance.ps1
    if ($LASTEXITCODE -ne 0) { throw 'Acceptance failed. Keep changes on this branch for review.' }
    & ./scripts/qa/dependency-audit.ps1
    if ($LASTEXITCODE -ne 0) { throw 'Production high/critical vulnerabilities remain; review audit reports.' }
    Write-Output 'Validation passed. Review git diff and remaining development advisories before committing.'
} finally { Pop-Location }
