# Cloudflare Pages Deployment Troubleshooting Guide

## Overview
This document covers common deployment issues when using GitHub integration with Cloudflare Pages for SvelteKit applications using `@sveltejs/adapter-cloudflare`.

---

## Issue #1: Duplicate Endpoint Files (SvelteKit Build Error)

### Symptoms
- Cloudflare Pages build fails during `npm run build`
- Error message: `Multiple endpoint files found in src/routes/api/[endpoint] : +server.js and +server.ts`
- Build exits with error code 1

### Root Cause
SvelteKit doesn't allow multiple endpoint files with the same route but different extensions. This commonly happens when:
1. Converting from JavaScript to TypeScript
2. Creating new `.ts` files without removing old `.js` files
3. Accidentally committing both versions during development

### Example Error Log
```
Error: Multiple endpoint files found in src/routes/api/subscribe : +server.js and +server.ts
    at duplicate_files_error (file:///opt/buildhome/repo/node_modules/@sveltejs/kit/src/core/sync/create_manifest_data/index.js:285:13)
```

### Fix Steps
1. **Identify duplicate files:**
   ```bash
   find src/routes -name "+server.*" | sort
   ```

2. **Remove unwanted duplicates:**
   ```bash
   # Remove JavaScript version if using TypeScript
   rm src/routes/api/[endpoint]/+server.js
   ```

3. **Commit and push:**
   ```bash
   git add -A
   git commit -m "fix: remove duplicate endpoint files"
   git push origin master
   ```

### Prevention
- **Always check for existing files** before creating new endpoints
- **Use consistent file extensions** throughout your project
- **Set up a pre-commit hook** to detect duplicates:
  ```bash
  # Add to .git/hooks/pre-commit
  find src/routes -name "+server.*" | cut -d'.' -f1 | sort | uniq -d | while read dup; do
    echo "Error: Duplicate endpoint files found for $dup"
    exit 1
  done
  ```

---

## Issue #2: Incorrect Build Output Directory

### Symptoms
- Build succeeds but production site shows old content
- Preview deployments work but production doesn't update
- Deployment URLs return 404 errors initially

### Root Cause
Cloudflare Pages is configured to look for build artifacts in the wrong directory. `@sveltejs/adapter-cloudflare` outputs to `.svelte-kit/cloudflare/` but Pages might be configured for `.svelte-kit/output/`.

### Fix Steps
1. **Go to Cloudflare Dashboard:**
   - Workers & Pages → [your-project] → Settings → Build & deploy

2. **Update Build Configuration:**
   - Build output directory: `.svelte-kit/cloudflare/`
   - Build command: `npm run build`

3. **Trigger new deployment:**
   ```bash
   git commit --allow-empty -m "chore: trigger pages rebuild"
   git push origin master
   ```

4. **Verify locally:**
   ```bash
   npm run build
   ls -la .svelte-kit/cloudflare/  # Should contain _worker.js and other assets
   ```

---

## Issue #3: Branch Mismatch (No Deployment Triggered)

### Symptoms
- Push to GitHub succeeds but no deployment appears in Cloudflare
- Working on feature branches but production never updates

### Root Cause
Cloudflare Pages production branch setting doesn't match the branch you're pushing to.

### Fix Steps
1. **Check current production branch:**
   - Cloudflare Dashboard → Settings → Build & deploy → Production branch

2. **Option A - Merge to production branch:**
   ```bash
   git checkout master  # or main
   git merge your-feature-branch
   git push origin master
   ```

3. **Option B - Change production branch:**
   - Update production branch setting in Cloudflare to match your active branch

---

## General Troubleshooting Checklist

### When deployment fails, check in this order:

1. **GitHub Integration Status**
   - [ ] Cloudflare → Settings → Git integration shows "Connected"
   - [ ] No red warning triangles or expired tokens

2. **Branch Configuration**
   - [ ] Production branch matches the branch you pushed to
   - [ ] Latest commit appears in Cloudflare deployments list

3. **Build Configuration**
   - [ ] Build command: `npm run build`
   - [ ] Build output directory: `.svelte-kit/cloudflare/`
   - [ ] Node.js version: 18+ (check package.json engines if specified)

4. **Code Issues**
   - [ ] No duplicate endpoint files (`+server.js` AND `+server.ts`)
   - [ ] No syntax errors in TypeScript files
   - [ ] All imports resolve correctly

5. **Local Verification**
   ```bash
   npm install
   npm run build
   ls .svelte-kit/cloudflare/  # Should contain _worker.js
   ```

---

## Quick Recovery Commands

### Force new deployment:
```bash
git commit --allow-empty -m "chore: trigger deployment"
git push origin master
```

### Check for duplicate endpoints:
```bash
find src/routes -name "+server.*" | cut -d'.' -f1-3 | sort | uniq -d
```

### Verify build output:
```bash
npm run build && ls -la .svelte-kit/cloudflare/
```

### Clean rebuild:
```bash
rm -rf node_modules .svelte-kit
npm install
npm run build
```

---

## Timeline Reference

### 2025-01-28: Duplicate File Issue
| Time | Action | Result |
|------|--------|--------|
| 17:12 | Push to master with new API endpoints | Build failed |
| 17:12 | Error: Multiple endpoint files found | `+server.js` and `+server.ts` conflict |
| 17:15 | Removed duplicate `+server.js` file | Build succeeded |
| 17:16 | Pushed fix to master | Deployment successful |

### Previous: Build Output Directory Issue
| Time | Action | Result |
|------|--------|--------|
| 01:54 | Merged "Hello world" change | Preview worked, production didn't |
| 02:05 | Identified wrong build output directory | `.svelte-kit/output/` vs `.svelte-kit/cloudflare/` |
| 02:10 | Updated Pages settings | Fixed production deployment |

---

**Maintained by:** Development Team  
**Last Updated:** 2025-01-28  
**Related:** [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/) 