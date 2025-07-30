import { generateCodeVerifier, generateState } from "arctic";
import { createGoogleClient } from "$lib/server/oauth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
  try {
    const google = createGoogleClient(platform?.env);
    
    // Generate state and code verifier for security
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    
    // Check if this is a linking request (user already logged in)
    const isLinking = url.searchParams.get('link') === 'true';
    
    // Create authorization URL with required scopes
    const authUrl = google.createAuthorizationURL(state, codeVerifier, [
      "openid", 
      "profile", 
      "email"
    ]);

    // Force Google account selection to prevent being stuck on one account
    authUrl.searchParams.set("prompt", "select_account");

    // Store state and code verifier in secure cookies
    // Use more permissive settings to ensure cookies persist across redirects
    cookies.set("google_oauth_state", state, {
      httpOnly: true,
      maxAge: 60 * 15, // 15 minutes (longer expiry)
      secure: import.meta.env.PROD, // Only secure in production
      path: "/",
      sameSite: "none"
    });
    
    cookies.set("google_code_verifier", codeVerifier, {
      httpOnly: true,
      maxAge: 60 * 15, // 15 minutes (longer expiry)
      secure: import.meta.env.PROD, // Only secure in production
      path: "/",
      sameSite: "none"
    });

    // Store linking context if this is a linking request
    if (isLinking) {
      cookies.set("google_oauth_linking", "true", {
        httpOnly: true,
        maxAge: 60 * 15, // 15 minutes (longer expiry)
        secure: import.meta.env.PROD, // Only secure in production
        path: "/",
        sameSite: "none"
      });
    }

    console.log(`🔗 Google OAuth initiated: ${isLinking ? 'linking' : 'login'} flow`);
    console.log(`🍪 Setting OAuth cookies with domain: ${url.hostname}, secure: ${import.meta.env.PROD}`);

    // Redirect to Google for authorization
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString()
      }
    });

  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    
    // If credentials are missing, redirect with helpful error
    if (error.message?.includes('Google OAuth credentials not found')) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=oauth_config_missing'
        }
      });
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/manage?error=oauth_callback_error'
      }
    });
  }
}; 