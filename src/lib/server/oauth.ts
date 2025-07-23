import { Google } from "arctic";
import { env } from '$env/dynamic/private';

/**
 * Google OAuth client configuration
 * Uses the same environment variable pattern as other services in this project
 */
export function createGoogleClient(platform_env?: any): Google {
  // Follow the existing pattern: SvelteKit env with platform.env fallback for production
  const clientId = env.GOOGLE_CLIENT_ID || platform_env?.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET || platform_env?.GOOGLE_CLIENT_SECRET;
  const publicOrigin = env.PUBLIC_ORIGIN || platform_env?.PUBLIC_ORIGIN || 'http://localhost:5176';

  if (!clientId || !clientSecret) {
    console.warn('⚠️ Google OAuth credentials not found. Google authentication will be disabled.');
    console.warn('To enable Google OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    throw new Error('Google OAuth credentials not found. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  // Construct redirect URI based on the environment
  const redirectUri = `${publicOrigin}/auth/google/callback`;

  console.log(`🔧 Google OAuth configured with redirect URI: ${redirectUri}`);

  return new Google(clientId, clientSecret, redirectUri);
} 