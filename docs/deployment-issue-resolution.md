# Cloudflare Pages Deployment Issue – Root Cause & Resolution

## Summary
After merging a change that updated the landing-page heading from **"Welcome to SvelteKit"** to **"Hello world"**, the new text showed up in preview deployments but never appeared on the production domain (`simpledcc.pages.dev`).  The underlying problem was an incorrect **Build output directory** in the Cloudflare Pages settings.  Pointing Pages at the correct directory and redeploying resolved the issue.

---

## Symptoms
1. **Preview deployments** (created for every pull-request commit) displayed the updated heading without issue.
2. **Production deployments** completed successfully according to the dashboard, yet visiting `simpledcc.pages.dev` still served the old content.
3. Manually hitting the deployment-ID URLs (e.g. `https://94acdf72.simpledcc.pages.dev`) returned **404 Not Found** for several minutes, indicating the artefacts Cloudflare expected were missing.

---

## Root Cause
`@sveltejs/adapter-cloudflare` outputs its final artefacts (including `_worker.js`) to:

```
.svelte-kit/cloudflare/
```

However, the **Build output directory** in the Pages project was still set to the generic SvelteKit value:

```
.svelte-kit/output/
```

Therefore Pages uploaded a stale set of static files that did **not** include the newly built HTML, nor the worker bundle responsible for SSR.  Production deployments reported **"Success"** (build itself passed), but the published content was outdated.

---

## Fix Applied
1. **Cloudflare Dashboard → Workers & Pages → simpledcc → Settings (Production)**
2. Click ✎ under **Build configuration**.
3. Change **Build output directory** to:

```
.svelte-kit/cloudflare/
```

4. Save the configuration.
5. Trigger a new deployment (push an empty commit or click **Retry deployment**).
6. (Optional) Purge edge cache via **Settings → Cache → Purge Everything** or wait a few minutes for automatic edge invalidation.

After the redeploy, the production site reflected the correct heading.

---

## Verification Steps
- Rebuilt locally with `npm run build` – confirmed artefacts in `.svelte-kit/cloudflare/` contained the new HTML.
- Ran `npx wrangler pages deployment list --project-name=simpledcc` to verify the latest production deployment ID and status.
- Visited the deployment-ID URL and confirmed it displayed **"Hello world"** (later **"Hello Vietnam"**).
- Performed a hard refresh (`Ctrl/Cmd + Shift + R`) on `simpledcc.pages.dev` – the new content appeared.

---

## Takeaways
1. **Adapter matters** – each SvelteKit adapter outputs to a different directory.  Always align the Pages "Build output directory" with the adapter's documentation.
2. **Preview vs Production** – preview environments can mask output-path misconfigurations because they're generated per-commit; production may still point at an old artefact set.
3. **Edge Cache** – Cloudflare's CDN may serve stale content until propagation finishes.  Checking the deployment-ID URL helps distinguish cache issues from build-path errors.

---

## Timeline (UTC)
| Time | Action |
|------|--------|
| 01:54 | PR merged with "Hello world" change |
| 01:57 | Pages build succeeded but site still showed old text |
| 02:05 | Identified incorrect build-output directory |
| 02:10 | Updated Pages settings to `.svelte-kit/cloudflare/` |
| 02:13 | Forced new deployment via empty commit |
| 02:17 | Production domain shows **"Hello world"** |
| 02:26 | New branch `feat/hello-vietnam` created; heading updated to **"Hello Vietnam"** |
| 02:29 | PR #4 opened – CI green, previews OK |

---

**Author:** Pair-programming session – ChatGPT & rmoxo 