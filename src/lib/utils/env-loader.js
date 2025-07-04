// Manual Environment Variable Loader for SvelteKit Development
import { readFileSync } from 'fs';
import { resolve } from 'path';

let envCache = null;

/**
 * Load environment variables from .env file
 * This is needed because SvelteKit with Cloudflare adapter doesn't auto-load .env in development
 */
function loadEnvFile() {
  if (envCache) return envCache;
  
  try {
    const envPath = resolve('.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    envCache = envVars;
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables from .env file`);
    return envVars;
    
  } catch (error) {
    console.warn('⚠️ Could not load .env file:', error.message);
    return {};
  }
}

/**
 * Get environment variable from platform.env, process.env, or .env file
 */
export function getEnvVar(platform_env, key) {
  // Try platform.env first (Cloudflare production)
  if (platform_env && platform_env[key]) {
    return platform_env[key];
  }
  
  // Try process.env (standard Node.js)
  if (process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Fall back to manual .env file loading (SvelteKit development)
  const envVars = loadEnvFile();
  if (envVars[key]) {
    return envVars[key];
  }
  
  return null;
} 