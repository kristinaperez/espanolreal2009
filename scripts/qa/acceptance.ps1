# Requires PowerShell 7 and Node.js 24.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $repoRoot
$results = [System.Collections.Generic.List[object]]::new()
$failed = $false
try {
    $package = Get-Content package.json -Raw | ConvertFrom-Json
    $checks = @('build', 'typecheck', 'lint', 'test:security')
    foreach ($optional in @('test:arabic', 'test:arabic:http')) {
        if ($package.scripts.PSObject.Properties.Name -contains $optional) {
            $checks += $optional
        }
    }
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed: $LASTEXITCODE" }
    foreach ($check in $checks) {
        Write-Output "Running npm run $check"
        & npm run $check
        $code = $LASTEXITCODE
        $results.Add([pscustomobject]@{ check = $check; exitCode = $code })
        if ($code -ne 0) { $failed = $true }
    }
} catch {
    $failed = $true
    $results.Add([pscustomobject]@{ check = 'setup/runtime'; exitCode = 1 })
    Write-Warning $_.Exception.Message
} finally {
    $report = [pscustomobject]@{
        status = $(if ($failed) { 'FAIL' } else { 'PASS' })
        headSha = $env:QA_HEAD_SHA
        testedSha = $env:GITHUB_SHA
        checks = @($results.ToArray())
        limitations = @('No live Telegram/Stars transactions', 'No mobile visual or native Arabic review', 'Browser/interaction checks require a separate configured environment')
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content qa-results.json -Encoding utf8
    if ($env:GITHUB_STEP_SUMMARY) {
        @(
            "# Windows QA: $($report.status)"
            ""
            "PR head: $($report.headSha)"
            "Tested checkout: $($report.testedSha)"
            ""
            "| Check | Exit code |"
            "| --- | --- |"
        ) | Add-Content $env:GITHUB_STEP_SUMMARY
        foreach ($result in $results) {
            "| $($result.check) | $($result.exitCode) |" | Add-Content $env:GITHUB_STEP_SUMMARY
        }
        "" | Add-Content $env:GITHUB_STEP_SUMMARY
        "Limitations: $($report.limitations -join '; ')." | Add-Content $env:GITHUB_STEP_SUMMARY
    }
    Pop-Location
}
if ($failed) { exit 1 }
