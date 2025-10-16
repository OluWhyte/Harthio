#!/bin/bash

# Quick Status Check for Harthio Development
echo "🔍 HARTHIO QUICK STATUS CHECK"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

echo "📅 Current Time: $(date)"
echo ""

# Git status
echo "📝 GIT STATUS:"
git status --porcelain | head -10
if [ $? -eq 0 ]; then
    echo "✅ Git repository is clean"
else
    echo "⚠️  Uncommitted changes detected"
fi
echo ""

# Check for incomplete files (simple check)
echo "🔍 CHECKING FOR INCOMPLETE FILES:"
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "export$\|function.*($\|class.*{$" 2>/dev/null | head -5
if [ $? -eq 0 ]; then
    echo "⚠️  Potential incomplete files found (check above)"
else
    echo "✅ No obvious incomplete files detected"
fi
echo ""

# Check build status (quick)
echo "🔨 BUILD STATUS:"
if npm run build > /dev/null 2>&1; then
    echo "✅ Build: PASSING"
else
    echo "❌ Build: FAILING (run 'npm run build' for details)"
fi
echo ""

# Check TypeScript status (quick)
echo "📘 TYPESCRIPT STATUS:"
if npm run typecheck > /dev/null 2>&1; then
    echo "✅ TypeScript: PASSING"
else
    echo "❌ TypeScript: FAILING (run 'npm run typecheck' for details)"
fi
echo ""

# Show last commit
echo "📝 LAST COMMIT:"
git log --oneline -1 2>/dev/null || echo "No git history found"
echo ""

# Check if progress tracker exists
if [ -f "PROGRESS_TRACKER.md" ]; then
    echo "📋 Progress tracker: ✅ FOUND"
    echo "   Last updated: $(stat -c %y PROGRESS_TRACKER.md 2>/dev/null || stat -f %Sm PROGRESS_TRACKER.md 2>/dev/null || echo 'Unknown')"
else
    echo "📋 Progress tracker: ❌ NOT FOUND"
fi
echo ""

echo "🎯 READY TO CONTINUE DEVELOPMENT!"
echo "================================"