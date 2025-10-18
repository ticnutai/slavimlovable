# Cleanup Script for Project
# This script removes temporary files and caches to free up disk space

Write-Host "🧹 מתחיל ניקוי קבצים זמניים..." -ForegroundColor Cyan

# Change to project directory
Set-Location $PSScriptRoot\..

# Function to remove directory safely
function Remove-SafeDir {
    param($Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem $Path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ נמחק: $Path ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    }
}

# Calculate initial size
Write-Host "`n📊 מחשב גודל התיקייה..." -ForegroundColor Yellow
$beforeSize = (Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB

# Clean npm cache
Write-Host "`n🗑️  מנקה npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Remove temporary directories
Write-Host "`n🗑️  מוחק תיקיות זמניות..." -ForegroundColor Yellow
Remove-SafeDir "node_modules/.vite"
Remove-SafeDir "node_modules/.cache"
Remove-SafeDir ".cache"
Remove-SafeDir "dist"
Remove-SafeDir "playwright-report"
Remove-SafeDir "test-results"
Remove-SafeDir ".playwright"

# Remove log files
Write-Host "`n🗑️  מוחק קבצי לוג..." -ForegroundColor Yellow
$logs = Get-ChildItem -Path . -Include "*.log" -Recurse -ErrorAction SilentlyContinue
if ($logs) {
    $logs | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "✓ נמחקו $($logs.Count) קבצי לוג" -ForegroundColor Green
}

# Remove temporary test files
Remove-SafeDir "test-results.json"
Remove-Item -Path "test-results.xml" -Force -ErrorAction SilentlyContinue

# Calculate final size
Write-Host "`n📊 מחשב גודל חדש..." -ForegroundColor Yellow
$afterSize = (Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
$saved = $beforeSize - $afterSize

# Summary
Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 סיכום הניקוי" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "גודל לפני:  $([math]::Round($beforeSize, 2)) MB" -ForegroundColor White
Write-Host "גודל אחרי:  $([math]::Round($afterSize, 2)) MB" -ForegroundColor White
Write-Host "נחסך:      $([math]::Round($saved, 2)) MB" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n✨ הניקוי הושלם בהצלחה!" -ForegroundColor Green
Write-Host ""
