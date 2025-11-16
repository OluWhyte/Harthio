# Simple Workflow Guide

## Daily Work (Most of the Time)

Just work on `main` branch like before:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

Goes straight to production. Simple.

## When to Use develop Branch

Only use it for **risky changes** you want to test first:

```bash
# Switch to develop
git checkout develop

# Make risky changes
git add .
git commit -m "Testing new feature"
git push origin develop

# Test on preview URL
# If it works, merge to main:
git checkout main
git merge develop
git push origin main
```

## The Setup You Have

✅ **develop branch** - Available when you need it (preview URL + dev database)  
✅ **main branch** - Your normal workflow (production)

**You don't have to use develop if you don't want to.**

## Quick Commands

```bash
# Check which branch you're on
git branch

# Go back to main (normal work)
git checkout main

# Use develop (testing)
git checkout develop
```

## Summary

- **Normal work:** Stay on `main`, push directly
- **Risky stuff:** Use `develop`, test on preview, then merge
- **Your choice:** Use what feels comfortable

The setup is there if you need it, but you can ignore it most of the time.
