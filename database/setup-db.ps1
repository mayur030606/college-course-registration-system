# Forward to root setup-database.ps1
$rootScript = Join-Path $PSScriptRoot "..\setup-database.ps1"
if (Test-Path $rootScript) {
    & $rootScript @args
} else {
    Write-Host "Error: setup-database.ps1 not found in project root." -ForegroundColor Red
}
