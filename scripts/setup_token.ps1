# GitHub Token Setup Script
# Configures git remote with Personal Access Token

param (
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"
$Username = "effect082"
$RepoName = "SMS"

Write-Host "🔧 Configuring GitHub Authentication..." -ForegroundColor Cyan

# 1. Configure User
git config user.name "$Username"
git config user.email "$Username@users.noreply.github.com"

# 2. Configure Remote URL
$RemoteUrl = "https://$($Username):$($Token)@github.com/$Username/$RepoName.git"
git remote remove origin 2>$null
git remote add origin $RemoteUrl

Write-Host "✅ Remote URL updated with new token."

# 3. Test Connection
Write-Host "🔄 Testing connection..."
try {
    git push --dry-run origin main 2>&1 | Out-Null
    Write-Host "✅ Connection successful! Your token is valid." -ForegroundColor Green
} catch {
    Write-Host "❌ Connection failed!" -ForegroundColor Red
    Write-Host "The token provided does not have permission to access https://github.com/$Username/$RepoName.git"
    Write-Host "Please check that you selected 'repo' scope when generating the token."
}
