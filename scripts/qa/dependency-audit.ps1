[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $repoRoot
try {
    $blocked = $false
    foreach ($scope in @('all', 'production')) {
        $auditArgs = @('audit', '--package-lock-only', '--json')
        if ($scope -eq 'production') { $auditArgs += '--omit=dev' }
        $raw = & npm @auditArgs
        $code = $LASTEXITCODE
        $json = $raw -join [Environment]::NewLine
        $json | Set-Content "audit-$scope.json" -Encoding utf8
        $report = $json | ConvertFrom-Json
        if ($code -gt 1 -or $null -eq $report.PSObject.Properties['metadata']) {
            throw "Audit service failed for $scope. See audit-$scope.json"
        }
        Write-Output "Scope: $scope"
        $report.metadata.vulnerabilities | Format-List | Out-Host
        foreach ($entry in $report.vulnerabilities.PSObject.Properties) {
            $v = $entry.Value
            Write-Output "$($v.severity): $($v.name) [$($v.nodes -join ', ')]"
            foreach ($via in $v.via) {
                if ($via -isnot [string]) { Write-Output "  $($via.title) $($via.url)" }
            }
        }
        if ($scope -eq 'production' -and
            ($report.metadata.vulnerabilities.high -gt 0 -or $report.metadata.vulnerabilities.critical -gt 0)) {
            $blocked = $true
        }
    }
} finally { Pop-Location }
if ($blocked) { exit 1 }
