# ==============================================================================
# Start React + Vite Frontend
# ==============================================================================
# Usage:
#   .\start-frontend.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "     College Course Registration System - Starting Frontend      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Launching Vite dev server on http://localhost:5173..." -ForegroundColor Green
npm run dev
