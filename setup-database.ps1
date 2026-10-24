# ==============================================================================
# College Course Registration System - Safe Database Setup Script
# ==============================================================================
# Script: setup-database.ps1
# Purpose: Connects to local MySQL Server, creates the CollegeRegistration database,
#          creates all 5 tables (department, student, course, registration, admin),
#          and seeds initial sample data.
# Safety:
#   - Idempotent: safe to run multiple times.
#   - Does NOT drop existing databases or tables.
#   - Does NOT delete existing records.
#   - Prevents duplicate sample rows using INSERT IGNORE.
#   - Credentials are never stored, logged, or hardcoded.
# ==============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$MySqlUser,

    [Parameter(Mandatory = $false)]
    [string]$MySqlPassword,

    [Parameter(Mandatory = $false)]
    [string]$HostName = "127.0.0.1",

    [Parameter(Mandatory = $false)]
    [int]$Port = 3306
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " College Course Registration System - Database Setup & Init       " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Locate MySQL Client Executable (mysql.exe)
# -----------------------------------------------------------------------------
Write-Host "[1/4] Locating MySQL client (mysql.exe)..." -ForegroundColor Yellow

$candidatePaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe"
)

$mysqlExe = $null

# Check candidate paths first
foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        break
    }
}

# Check system PATH if not found
if (-not $mysqlExe) {
    $cmd = Get-Command "mysql.exe" -ErrorAction SilentlyContinue
    if ($cmd) {
        $mysqlExe = $cmd.Source
    }
}

# Deep search if still not found
if (-not $mysqlExe) {
    $search = Get-ChildItem -Path "C:\Program Files\MySQL", "C:\Program Files (x86)\MySQL" -Recurse -Filter "mysql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($search) {
        $mysqlExe = $search.FullName
    }
}

if (-not $mysqlExe -or -not (Test-Path $mysqlExe)) {
    Write-Host "`n[ERROR] mysql.exe could not be found automatically." -ForegroundColor Red
    Write-Host "Please ensure MySQL Server is installed, or execute the SQL file directly:" -ForegroundColor Yellow
    Write-Host "  File: $PSScriptRoot\database\schema.sql" -ForegroundColor White
    Write-Host "  Method: Open in MySQL Workbench and click the lightning icon (Execute)." -ForegroundColor White
    exit 1
}

Write-Host "      Found MySQL client: $mysqlExe" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. Collect Credentials Securely
# -----------------------------------------------------------------------------
Write-Host "`n[2/4] Authenticating with MySQL Server ($HostName`:$Port)..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($MySqlUser)) {
    if (-not [string]::IsNullOrWhiteSpace($env:DB_USERNAME)) {
        $MySqlUser = $env:DB_USERNAME
    } else {
        $inputUser = Read-Host "Enter MySQL Username [Default: root]"
        if ([string]::IsNullOrWhiteSpace($inputUser)) {
            $MySqlUser = "root"
        } else {
            $MySqlUser = $inputUser.Trim()
        }
    }
}

if ([string]::IsNullOrWhiteSpace($MySqlPassword)) {
    if (-not [string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
        $MySqlPassword = $env:DB_PASSWORD
    } else {
        $securePass = Read-Host "Enter MySQL password for '$MySqlUser'" -AsSecureString
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
        $MySqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
}

# Helper function to execute queries safely via process
function Invoke-MySqlQuery {
    param(
        [string]$SqlStatement,
        [string]$Database = ""
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $mysqlExe
    
    $argsList = "-h $HostName -P $Port -u $MySqlUser"
    if ($MySqlPassword) {
        $argsList += " --password=`"$MySqlPassword`""
    }
    if ($Database) {
        $argsList += " -D $Database"
    }
    $argsList += " --default-character-set=utf8mb4 --batch --raw"

    $psi.Arguments = $argsList
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.Write($SqlStatement)
    $p.StandardInput.Close()

    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()

    return [PSCustomObject]@{
        ExitCode = $p.ExitCode
        Output   = $stdout
        Error    = $stderr
    }
}

# Test connection
$pingTest = Invoke-MySqlQuery -SqlStatement "SELECT 1 AS ping;"
if ($pingTest.ExitCode -ne 0) {
    Write-Host "`n[ERROR] Could not connect to MySQL Server." -ForegroundColor Red
    if ($pingTest.Error -match "Access denied") {
        Write-Host "Reason: Access denied for user '$MySqlUser'. Please verify your password." -ForegroundColor Red
    } elseif ($pingTest.Error -match "Can't connect") {
        Write-Host "Reason: Unable to reach MySQL server on $HostName`:$Port." -ForegroundColor Red
        Write-Host "Please ensure the MySQL Windows Service (MySQL80) is started." -ForegroundColor Yellow
    } else {
        Write-Host "Details: $($pingTest.Error)" -ForegroundColor Red
    }
    exit 1
}

Write-Host "      Connection successful!" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. Execute Schema Script (Safe & Idempotent)
# -----------------------------------------------------------------------------
Write-Host "`n[3/4] Creating database and tables using schema.sql..." -ForegroundColor Yellow

$schemaPath = Join-Path $PSScriptRoot "database\schema.sql"
if (-not (Test-Path $schemaPath)) {
    # Check current directory
    $schemaPath = Join-Path $PSScriptRoot "schema.sql"
}

if (-not (Test-Path $schemaPath)) {
    Write-Host "[ERROR] Could not find schema.sql file at: $schemaPath" -ForegroundColor Red
    exit 1
}

$sqlScript = Get-Content -Path $schemaPath -Raw -Encoding UTF8
$execResult = Invoke-MySqlQuery -SqlStatement $sqlScript

if ($execResult.ExitCode -ne 0) {
    Write-Host "`n[ERROR] Failed to execute schema.sql:" -ForegroundColor Red
    Write-Host $execResult.Error -ForegroundColor Red
    exit $execResult.ExitCode
}

Write-Host "      Database and schema initialized successfully!" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 4. Verification and Record Summary
# -----------------------------------------------------------------------------
Write-Host "`n[4/4] Verifying database structure and records..." -ForegroundColor Yellow

$verifySql = @"
SELECT 
    'department' AS table_name, COUNT(*) AS record_count FROM CollegeRegistration.department
UNION ALL
SELECT 
    'course' AS table_name, COUNT(*) AS record_count FROM CollegeRegistration.course
UNION ALL
SELECT 
    'student' AS table_name, COUNT(*) AS record_count FROM CollegeRegistration.student
UNION ALL
SELECT 
    'registration' AS table_name, COUNT(*) AS record_count FROM CollegeRegistration.registration
UNION ALL
SELECT 
    'admin' AS table_name, COUNT(*) AS record_count FROM CollegeRegistration.admin;
"@

$verifyResult = Invoke-MySqlQuery -SqlStatement $verifySql -Database "CollegeRegistration"

if ($verifyResult.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "           CollegeRegistration Verification Summary               " -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    
    $lines = $verifyResult.Output.Trim() -split "`n"
    $rows = @()
    foreach ($line in $lines) {
        $parts = $line.Trim() -split "`t"
        if ($parts.Count -ge 2 -and $parts[0] -ne "table_name") {
            $rows += [PSCustomObject]@{
                "Table Name"   = $parts[0]
                "Record Count" = [int]$parts[1]
                "Status"       = "Ready"
            }
        }
    }

    if ($rows.Count -gt 0) {
        $rows | Format-Table -AutoSize | Out-String | Write-Host -ForegroundColor Cyan
    } else {
        Write-Host "Database verified, all 5 tables present." -ForegroundColor Green
    }
} else {
    Write-Host "Warning: Could not fetch record counts: $($verifyResult.Error)" -ForegroundColor Yellow
}

Write-Host "==================================================================" -ForegroundColor Green
Write-Host "                   DATABASE SETUP COMPLETE!                      " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps to run the system:" -ForegroundColor White
Write-Host "  1. Start the Backend:" -ForegroundColor Cyan
Write-Host "     .\start-backend.ps1" -ForegroundColor Yellow
Write-Host "  2. Open the Frontend:" -ForegroundColor Cyan
Write-Host "     http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
