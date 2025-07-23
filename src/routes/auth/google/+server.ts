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

    // Store state and code verifier in secure cookies
    cookies.set("google_oauth_state", state, {
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      secure: true,
      path: "/",
      sameSite: "lax"
    });
    
    cookies.set("google_code_verifier", codeVerifier, {
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      secure: true,
      path: "/",
      sameSite: "lax"
    });

    // Store linking context if this is a linking request
    if (isLinking) {
      cookies.set("google_oauth_linking", "true", {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: true,
        path: "/",
        sameSite: "lax"
      });
    }

    console.log(`🔗 Google OAuth initiated: ${isLinking ? 'linking' : 'login'} flow`);

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