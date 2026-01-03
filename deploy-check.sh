#!/bin/bash

# Quick Deployment Script for Second Brain
# This script helps verify your setup before deployment

echo "🚀 Second Brain - Pre-Deployment Checklist"
echo "=========================================="
echo ""

# Check if git is clean
echo "📋 Checking Git Status..."
if git diff-index --quiet HEAD --; then
    echo "✅ Git working directory is clean"
else
    echo "⚠️  You have uncommitted changes. Commit them before deploying:"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit all changes now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    fi
fi

echo ""
echo "📋 Checking Required Files..."

# Check for required files
files=(
    "backend/server.js"
    "backend/package.json"
    "js/config.js"
    "index.html"
    "render.yaml"
    "vercel.json"
    "backend/.env.example"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        all_files_exist=false
    fi
done

echo ""
echo "📋 Checking Configuration..."

# Check if config.js has production URL
if grep -q "second-brain-backend.*\.onrender\.com" js/config.js; then
    echo "✅ Production backend URL configured in config.js"
else
    echo "⚠️  Production backend URL not found in config.js"
    echo "   You'll need to update this after deploying to Render"
fi

# Check if .env is gitignored
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env is in .gitignore (secure)"
else
    echo "⚠️  .env should be in .gitignore"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create MongoDB Atlas database (if not done)"
echo "   → https://www.mongodb.com/cloud/atlas/register"
echo ""
echo "2. Deploy Backend to Render"
echo "   → https://dashboard.render.com/"
echo "   → Connect GitHub repository"
echo "   → Set environment variables (see .env.example)"
echo ""
echo "3. Update js/config.js with your Render URL"
echo ""
echo "4. Deploy Frontend to Vercel"
echo "   → https://vercel.com/dashboard"
echo "   → Import GitHub repository"
echo ""
echo "5. Update Render CORS settings with Vercel URL"
echo ""
echo "📖 Full guide: See DEPLOYMENT.md"
echo ""

if [ "$all_files_exist" = true ]; then
    echo "✅ All required files present - Ready to deploy!"
else
    echo "❌ Some files are missing - Fix issues before deploying"
fi
