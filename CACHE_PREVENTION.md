# Next.js Cache Prevention Guide

## The Problem
Next.js aggressively caches builds which can cause:
- Stale code being served
- MIME type errors
- 404 errors for chunks
- Slow development iteration

## Permanent Solutions Implemented

### 1. **next.config.js Settings**
```javascript
webpack: (config, { dev }) => {
  if (dev) {
    config.cache = false; // Disable webpack cache
    config.infrastructureLogging = { level: 'error' };
  }
  return config;
}
```

### 2. **Quick Clean Commands**

#### Windows (PowerShell):
```bash
npm run clean:cache
```
This runs our custom script that cleans:
- `.next` directory
- `node_modules/.cache`
- `tsconfig.tsbuildinfo`

#### Manual Clean:
```bash
npm run clean        # Remove .next only
npm run clean:all    # Remove .next and node_modules/.cache
```

### 3. **Development Workflow**

**When you encounter cache issues:**
```bash
# Option 1: Clean and restart dev server
npm run dev:clean

# Option 2: Clean and rebuild
npm run build:clean

# Option 3: Nuclear option (if above don't work)
npm run clean:all
npm install
npm run dev
```

### 4. **Best Practices**

✅ **DO:**
- Run `npm run clean:cache` before important testing
- Use `npm run dev:clean` when switching branches
- Clean cache after major dependency updates
- Clean cache if you see MIME type errors

❌ **DON'T:**
- Commit `.next` directory (already in .gitignore)
- Run dev server while building
- Have multiple dev servers running

### 5. **Automated Prevention**

The following are already configured:
- Webpack cache disabled in development
- Build artifacts in `.gitignore`
- Clean scripts in package.json

### 6. **Quick Reference**

| Issue | Solution |
|-------|----------|
| MIME type errors | `npm run clean:cache` |
| 404 for chunks | `npm run clean:cache` |
| Stale code | `npm run dev:clean` |
| Build fails | `npm run build:clean` |
| Everything broken | `npm run clean:all && npm install` |

### 7. **VS Code Integration**

Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Clean Next.js Cache",
      "type": "shell",
      "command": "npm run clean:cache",
      "problemMatcher": []
    }
  ]
}
```

Then use: `Ctrl+Shift+P` → `Tasks: Run Task` → `Clean Next.js Cache`

## Why This Happens

Next.js caches for performance, but during development:
- Code changes frequently
- Dependencies update
- Build artifacts can become stale
- Webpack cache can corrupt

Our solution disables caching in development while keeping production optimized.

## Testing the Fix

After implementing these changes:
1. Make a code change
2. Save file
3. Refresh browser
4. Changes should appear immediately

If not, run `npm run clean:cache` once.
