// Environment Variable Debug Endpoint - Cloudflare Pages Compatible

import { json } from '@sveltejs/kit';
// Remove Node.js imports - these don't work in Cloudflare Pages
// import { readFileSync } from 'fs';
// import { resolve } from 'path';

// Import the custom loader (this should still work)
import { getEnvVar } from '$lib/utils/env-loader.js';

export async function GET({ platform }) {
  try {
    const response = {
      platform_env: {},
      process_env: {},
      custom_loader: {},
      environment: 'cloudflare-pages'
    };

    // 1. Platform Environment (Cloudflare Workers/Pages runtime)
    if (platform?.env) {
      const geminiKey = platform.env.GEMINI_API_KEY;
      response.platform_env = {
        gemini_key_exists: !!geminiKey,
        gemini_key_length: geminiKey?.length || 0,
        gemini_key_preview: geminiKey ? `${geminiKey.substring(0, 8)}...` : 'not found',
        all_platform_keys: Object.keys(platform.env)
      };
    } else {
      response.platform_env = { error: 'Platform environment not available' };
    }

    // 2. Process Environment (Standard Node.js - limited in Cloudflare)
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      response.process_env = {
        gemini_key_exists: !!geminiKey,
        gemini_key_length: geminiKey?.length || 0,
        gemini_key_preview: geminiKey ? `${geminiKey.substring(0, 8)}...` : 'not found',
        node_env: process.env.NODE_ENV || 'unknown'
      };
    } catch (error) {
      response.process_env = { error: 'Process environment access failed in Cloudflare Pages' };
    }

    // 3. Custom Loader (Manual .env file parsing)
    // Note: This might not work in production since there's no .env file
    try {
      const geminiKey = getEnvVar(platform?.env, 'GEMINI_API_KEY');
      response.custom_loader = {
        gemini_key_exists: !!geminiKey,
        gemini_key_length: geminiKey?.length || 0,
        gemini_key_preview: geminiKey ? `${geminiKey.substring(0, 8)}...` : 'not found',
        loader_working: true
      };
    } catch (error) {
      response.custom_loader = {
        loader_working: false,
        error: error.message || 'Custom loader failed'
      };
    }

    // 4. Additional debugging info for Cloudflare Pages
    response.debug_info = {
      runtime: 'cloudflare-pages',
      platform_available: !!platform,
      env_keys_count: platform?.env ? Object.keys(platform.env).length : 0,
      timestamp: new Date().toISOString()
    };

    return json(response);

  } catch (error) {
    return json({
      error: 'Debug endpoint failed',
      message: error.message,
      environment: 'cloudflare-pages'
    }, { status: 500 });
  }
} 