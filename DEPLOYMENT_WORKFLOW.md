# SimpleDCC Deployment Workflow

This document establishes the correct deployment procedures for SimpleDCC's dual-service architecture to prevent configuration issues and ensure secure secrets management.

## Architecture Overview

SimpleDCC uses a dual-service architecture:
- **Main SvelteKit App**: Deployed to Cloudflare Pages (`simpledcc.pages.dev`)
- **Cron Worker**: Deployed to Cloudflare Workers (`simpledcc-cron-worker`)

## Secrets Management: The "Set-It-and-Forget-It" Workflow

### Production Secrets (Cloudflare Dashboard)
- **Location**: Cloudflare Dashboard → Workers & Pages → simpledcc-cron-worker → Settings → Variables
- **Purpose**: Single source of truth for all production secrets
- **Security**: All secrets are encrypted and automatically injected into the worker environment
- **Required Variables**:
  - `ECFS_API_KEY`
  - `JINA_API_KEY`
  - `GEMINI_API_KEY`
  - `RESEND_API_KEY`
  - `CRON_SECRET`

### Local Development Secrets (wrangler.toml)
- **Location**: `cron-worker/wrangler.toml` → `[vars]` section
- **Purpose**: ONLY for local development when running `npm run dev:worker`
- **Security**: Uses placeholder values or dedicated test keys
- **Important**: These values are completely ignored during production deployment

## Deployment Procedures

### 1. Cron Worker Deployment

**Prerequisites**: Ensure all production secrets are set in the Cloudflare Dashboard (one-time setup)

**Command**:
```bash
cd cron-worker
wrangler deploy
```

**What happens**:
- Deploys code changes only
- Inherits encrypted secrets from Cloudflare Dashboard
- Ignores local `[vars]` section completely
- Uses production database binding

**Common Mistakes to Avoid**:
- ❌ Don't use `--env` flags (unnecessary and can cause issues)
- ❌ Don't try to pass secrets via command line
- ❌ Don't modify secrets in wrangler.toml for production

### 2. Main App Deployment

**Method**: Git-based deployment via Cloudflare Pages

**Process**:
1. Push changes to GitHub repository
2. Cloudflare Pages automatically builds and deploys
3. No manual deployment command needed

### 3. Local Development

**Cron Worker**:
```bash
npm run dev:worker
```
- Uses placeholder values from `wrangler.toml [vars]` section
- Connects to local/development database
- Safe for testing without production keys

**Main App**:
```bash
npm run dev
```
- Standard SvelteKit development server
- Uses local configuration

## Troubleshooting

### "Secrets Not Working in Production"
- **Cause**: Secrets not properly set in Cloudflare Dashboard
- **Solution**: Verify all required variables are encrypted in Dashboard → Settings → Variables

### "Local Development Can't Access APIs"
- **Cause**: Placeholder values in `wrangler.toml [vars]` section
- **Solution**: Replace placeholders with valid development keys (never commit real production keys)

### "Worker Deploy Fails"
- **Cause**: Usually authentication or configuration issues
- **Solution**: Ensure you're authenticated with `wrangler login` and in the correct directory

## Security Best Practices

1. **Never commit real API keys** to version control
2. **Use encrypted variables** in Cloudflare Dashboard for production
3. **Use placeholder values** in wrangler.toml for local development
4. **Rotate secrets regularly** using the Cloudflare Dashboard
5. **Test locally** before deploying to production

## Emergency Procedures

### If Production Secrets Are Compromised
1. Immediately rotate all API keys at their respective providers
2. Update encrypted variables in Cloudflare Dashboard
3. Redeploy worker: `cd cron-worker && wrangler deploy`
4. No code changes needed - secrets are injected automatically

### If Deployment Fails
1. Check Cloudflare Workers logs in dashboard
2. Verify all required secrets are set and encrypted
3. Ensure database bindings are correct
4. Test locally first with `npm run dev:worker`

## Reference Commands

```bash
# Deploy cron worker (from cron-worker directory)
wrangler deploy

# Local development
npm run dev:worker  # Cron worker
npm run dev         # Main app

# Check worker logs
wrangler tail

# Authentication
wrangler login
```

---

**Remember**: The `[vars]` section in wrangler.toml is for local development only. Production secrets live securely in the Cloudflare Dashboard and are automatically injected during deployment. 