// Cloudflare Workers Compatible Environment Variable Loader
// Environment variables are provided by the platform (Cloudflare, Vercel, etc.)

/**
 * Get environment variable from platform.env (Cloudflare Workers compatible)
 * @param {Object} platform_env - Environment variables from SvelteKit platform
 * @param {string} key - Environment variable key
 * @returns {string|null} Environment variable value or null if not found
 */
export function getEnvVar(platform_env, key) {
  // Use platform.env for Cloudflare Workers compatibility
  if (platform_env && platform_env[key]) {
    return platform_env[key];
  }
  
  // Environment variable not found
  return null;
} 