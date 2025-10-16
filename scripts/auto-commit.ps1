# Auto-commit script for Git
# This script commits changes automatically with a timestamp

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Auto-save: $timestamp"

# Change to the project directory
Set-Location $PSScriptRoot\..

# Check if there are any changes
$status = git status --porcelain

if ($status) {
    Write-Host "Changes detected. Committing..." -ForegroundColor Green
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    git commit -m $commitMessage
    
    # Optional: Push to remote (uncomment if you want auto-push)
    # git push origin main
    
    Write-Host "Auto-commit completed: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}
