# Deep Cleanup Script - Warning: This will require reinstall
# Use this only when you have serious disk space issues

Write-Host "⚠️  אזהרה: ניקוי עמוק - יידרש התקנה מחדש!" -ForegroundColor Red
Write-Host "האם להמשיך? (y/n): " -NoNewline
$confirm = Read-Host

if ($confirm -ne 'y') {
    Write-Host "ניקוי בוטל" -ForegroundColor Yellow
    exit
}

Set-Location $PSScriptRoot\..

Write-Host "`n🧹 מתחיל ניקוי עמוק..." -ForegroundColor Cyan

# Calculate initial size
$beforeSize = (Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB

# Remove all node_modules
Write-Host "`n🗑️  מוחק node_modules (זה ייקח זמן)..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ node_modules נמחק" -ForegroundColor Green
}

# Remove package-lock
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✓ package-lock.json נמחק" -ForegroundColor Green
}

# Clean all caches
Write-Host "`n🗑️  מנקה כל המטמונים..." -ForegroundColor Yellow
Remove-Item -Path ".cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "playwright-report" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "test-results" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".playwright" -Recurse -Force -ErrorAction SilentlyContinue

# Clean npm cache
npm cache clean --force 2>$null

# Calculate final size
$afterSize = (Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
$saved = $beforeSize - $afterSize

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 סיכום ניקוי עמוק" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "גודל לפני:  $([math]::Round($beforeSize, 2)) MB" -ForegroundColor White
Write-Host "גודל אחרי:  $([math]::Round($afterSize, 2)) MB" -ForegroundColor White
Write-Host "נחסך:      $([math]::Round($saved, 2)) MB" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📦 כעת הרץ: npm install" -ForegroundColor Yellow
Write-Host ""
