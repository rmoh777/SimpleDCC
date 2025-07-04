// Manual Environment Variable Loader for SvelteKit - Cloudflare Pages Compatible
// Remove Node.js imports - these don't work in Cloudflare Pages
// import { readFileSync } from 'fs';
// import { resolve } from 'path';

let envCache = null;

/**
 * Load environment variables from .env file
 * NOTE: This only works in development - Cloudflare Pages doesn't have access to .env files
 */
function loadEnvFile() {
  if (envCache) return envCache;
  
  try {
    // In Cloudflare Pages, we can't read .env files
    // This function will gracefully fail and return empty object
    console.warn('⚠️ .env file loading not available in Cloudflare Pages runtime');
    envCache = {};
    return {};
    
  } catch (error) {
    console.warn('⚠️ Could not load .env file:', error.message);
    envCache = {};
    return {};
  }
}

/**
 * Get environment variable from platform.env, process.env, or .env file
 * Cloudflare Pages Compatible Version
 */
export function getEnvVar(platform_env, key) {
  // Try platform.env first (Cloudflare production - this is the primary method)
  if (platform_env && platform_env[key]) {
    return platform_env[key];
  }
  
  // Try process.env (limited in Cloudflare Pages but may work for some vars)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (error) {
    // process.env might not be available in Cloudflare Pages
    console.warn('⚠️ process.env not available in this runtime');
  }
  
  // Fall back to manual .env file loading (only works in development)
  // In production, this will return empty object
  const envVars = loadEnvFile();
  if (envVars[key]) {
    return envVars[key];
  }
  
  return null;
} 