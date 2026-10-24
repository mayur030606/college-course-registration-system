# ==============================================================================
# Start Spring Boot Backend
# ==============================================================================
# Usage:
#   .\start-backend.ps1
# Or with your MySQL password directly:
#   $env:DB_PASSWORD = "your_mysql_password"; .\start-backend.ps1
# ==============================================================================

param(
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$DbUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "root" }),
    [string]$OwnerUsername = $(if ($env:OWNER_USERNAME) { $env:OWNER_USERNAME } else { "owner" }),
    [string]$OwnerPassword = $env:OWNER_PASSWORD
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "     College Course Registration System - Starting Backend       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Check/Prompt for DB_PASSWORD
if ([string]::IsNullOrWhiteSpace($DbPassword)) {
    $secPass = Read-Host "Enter MySQL password for user '$DbUser'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
    $DbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Check/Prompt for OWNER_PASSWORD (used for first-time owner account bootstrap)
if ([string]::IsNullOrWhiteSpace($OwnerPassword)) {
    Write-Host "`nConfigure First Owner Account (Bootstrap):" -ForegroundColor Yellow
    $secOwnerPass = Read-Host "Enter Initial Owner Password (or press Enter to skip if already created)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secOwnerPass)
    $OwnerPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Set Environment Variables for Spring Boot process
$env:DB_URL = "jdbc:mysql://localhost:3306/CollegeRegistration?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true"
$env:DB_USERNAME = $DbUser
$env:DB_PASSWORD = $DbPassword
$env:OWNER_USERNAME = $OwnerUsername
if (-not [string]::IsNullOrWhiteSpace($OwnerPassword)) {
    $env:OWNER_PASSWORD = $OwnerPassword
}
$env:OWNER_EMAIL = "owner@college.edu"
$env:OWNER_FULLNAME = "System Owner"

Write-Host "`nEnvironment configured:" -ForegroundColor Green
Write-Host "  DB_URL      = $env:DB_URL"
Write-Host "  DB_USERNAME = $env:DB_USERNAME"
Write-Host "  DB_PASSWORD = ********"
Write-Host "  OWNER_USER  = $env:OWNER_USERNAME"

Set-Location "$PSScriptRoot\backend"
Write-Host "`nLaunching Spring Boot on port 8080..." -ForegroundColor Cyan
mvn spring-boot:run
