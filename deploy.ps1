# Vercel Deployment Helper Script
# This script helps prepare your project for Vercel deployment

Write-Host "🚀 Preparing Design Review App for Vercel Deployment..." -ForegroundColor Green

# Check if Git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check if vercel.json exists
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ vercel.json not found. Please ensure it exists in the root directory." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
}

# Check if all required files exist
$requiredFiles = @("index.html", "style.css", "script.js", "supabase-config.js", "supabase-api.js")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
} else {
    Write-Host "✅ All required files found" -ForegroundColor Green
}

# Check if assets folder exists
if (-not (Test-Path "assets")) {
    Write-Host "⚠️  assets folder not found. Your design images may not load." -ForegroundColor Yellow
} else {
    Write-Host "✅ assets folder found" -ForegroundColor Green
}

# Add all files to Git
Write-Host "📝 Adding files to Git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Prepare for Vercel deployment"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Project is ready for Vercel deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "2. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "3. Click 'New Project' and select your repository" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "📖 See VERCEL_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan 