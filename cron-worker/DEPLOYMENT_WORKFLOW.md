# Cron Worker Deployment Workflow (FINAL)

This document outlines the correct process for deploying the `simpledcc-cron-worker`.

## Configuration

The `wrangler.toml` file in this directory contains the definitive configuration for the **production worker**.

All environment variables and secrets (API keys, `CRON_SECRET`, `APP_URL`, etc.) are managed **exclusively** in the Cloudflare Dashboard under this worker's Settings > Variables.

## Production Deployment

To deploy new code changes to the live production worker, you **MUST** run the command from within this directory.

1.  Open your terminal.
2.  Navigate to the worker's directory:
    ```bash
    cd cron-worker
    ```
3.  Run the simple deploy command:
    ```bash
    wrangler deploy
    ```

This is the only command required. It will use the `wrangler.toml` in this directory and correctly deploy to the `simpledcc-cron-worker` service. 