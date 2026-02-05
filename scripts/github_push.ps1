# GitHub Push Automation Script
# Automatically stages, commits, and pushes changes

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Automated GitHub Push..." -ForegroundColor Cyan

# 1. Check Git Status
if (!(Test-Path ".git")) {
    Write-Error "❌ Not a git repository. Please run this command in the project root."
    exit 1
}

# 2. Add Changes
Write-Host "📦 Staging files..."
git add .

# 3. Commit
$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "Auto-save: $timestamp"
    Write-Host "lz Committing changes: $message"
    git commit -m "$message"
} else {
    Write-Host "ℹ️ No changes to commit."
}

# 4. Push
Write-Host "⬆️ Pushing to GitHub..."
try {
    # Capture output to check for errors
    $pushOutput = git push origin main 2>&1
    Write-Host $pushOutput
    Write-Host "✅ Push completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host $_
    
    if ("$_" -match "403" -or "$_" -match "permission") {
        Write-Host "`n⚠️  AUTHENTICATION ERROR DETECTED" -ForegroundColor Yellow
        Write-Host "Your token may be invalid, expired, or missing 'repo' permissions."
        Write-Host "Please run the setup script to update your token:"
        Write-Host "   .\scripts\setup_token.ps1 -Token 'YOUR_NEW_TOKEN'"
    }
    exit 1
}
