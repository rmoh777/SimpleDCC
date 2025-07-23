import { decodeIdToken } from "arctic";
import { createGoogleClient } from "$lib/server/oauth";
import { getUserByGoogleId, getUserByEmail, linkGoogleAccount, createUserSession } from "$lib/users/user-operations";
import type { RequestHandler } from "./$types";
import type { OAuth2Tokens } from "arctic";

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      console.error('Database not available in callback');
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=service_unavailable'
        }
      });
    }

    // Get authorization parameters
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies.get("google_oauth_state");
    const codeVerifier = cookies.get("google_code_verifier");
    const isLinking = cookies.get("google_oauth_linking") === "true";

    // Validate required parameters
    if (!code || !state || !storedState || !codeVerifier) {
      console.error('Missing OAuth parameters:', { 
        code: !!code, 
        state: !!state, 
        storedState: !!storedState, 
        codeVerifier: !!codeVerifier,
        cookiesReceived: Object.keys(cookies.getAll ? cookies.getAll() : {}),
        userAgent: url.headers?.get?.('user-agent') || 'unknown'
      });
      
      // Clean up any partial cookies
      cookies.delete("google_oauth_state", { path: "/" });
      cookies.delete("google_code_verifier", { path: "/" });
      cookies.delete("google_oauth_linking", { path: "/" });
      
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=oauth_params_missing&retry=true'
        }
      });
    }

    // Validate state to prevent CSRF attacks
    if (state !== storedState) {
      console.error('OAuth state mismatch');
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=oauth_state_mismatch'
        }
      });
    }

    // Clean up OAuth cookies
    cookies.delete("google_oauth_state", { path: "/" });
    cookies.delete("google_code_verifier", { path: "/" });
    cookies.delete("google_oauth_linking", { path: "/" });

    const google = createGoogleClient(platform.env);
    const db = platform.env.DB;

    // Exchange code for tokens
    let tokens: OAuth2Tokens;
    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
      console.error('Token exchange failed:', error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=oauth_token_exchange_failed'
        }
      });
    }

    // Decode and parse user information from ID token
    const claims = decodeIdToken(tokens.idToken());
    const googleId = claims.sub as string;
    const googleEmail = claims.email as string;
    const name = claims.name as string;

    if (!googleId || !googleEmail) {
      console.error('Missing user data from Google:', { googleId: !!googleId, googleEmail: !!googleEmail });
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?error=oauth_user_data_missing'
        }
      });
    }

    console.log(`🔍 Google OAuth callback: ${googleEmail} (linking: ${isLinking})`);

    if (isLinking) {
      // LINKING FLOW: User is already logged in and wants to link Google account
      const currentSessionToken = cookies.get('user_session');
      if (!currentSessionToken) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/manage?error=session_expired'
          }
        });
      }

      // Get current user from session
      const currentUser = await db.prepare(`
        SELECT * FROM users 
        WHERE session_token = ? 
        AND session_expires > ?
      `).bind(currentSessionToken, Date.now()).first();

      if (!currentUser) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/manage?error=session_invalid'
          }
        });
      }

      // Check if this Google account is already linked to another user
      const existingGoogleUser = await getUserByGoogleId(googleId, db);
      if (existingGoogleUser && existingGoogleUser.id !== currentUser.id) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/manage?error=google_account_already_linked'
          }
        });
      }

      // Link Google account to current user
      const linkResult = await linkGoogleAccount(currentUser.id, googleId, googleEmail, db);
      if (!linkResult) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/manage?error=linking_failed'
          }
        });
      }

      // Log successful linking
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'info',
        `Google account linked to user ${currentUser.email}`,
        'auth',
        JSON.stringify({ 
          user_email: currentUser.email,
          google_email: googleEmail,
          google_id: googleId
        }),
        Math.floor(Date.now() / 1000)
      ).run();

      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?google_linked=success'
        }
      });

    } else {
      // LOGIN FLOW: User wants to sign in with Google
      
      // Check if user exists by Google ID
      let user = await getUserByGoogleId(googleId, db);
      
      if (!user) {
        // User doesn't exist with this Google ID, check by email
        user = await getUserByEmail(googleEmail, db);
        
        if (!user) {
          // No account found - redirect with message to use magic link
          console.log(`❌ No account found for Google email: ${googleEmail}`);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `/manage?error=no_account_found&email=${encodeURIComponent(googleEmail)}`
            }
          });
        }
        
        // Account exists with matching email - auto-link Google account
        const linkResult = await linkGoogleAccount(user.id, googleId, googleEmail, db);
        if (!linkResult) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/manage?error=auto_linking_failed'
            }
          });
        }
        
        console.log(`✅ Auto-linked Google account to existing user: ${user.email}`);
      }

      // Create session for the user
      const sessionResult = await createUserSession(user.id, false, db);
      if (!sessionResult) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/manage?error=session_creation_failed'
          }
        });
      }

      // Set session cookie
      cookies.set('user_session', sessionResult.sessionToken, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });

      // Log successful login
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'info',
        `Successful Google OAuth login for ${user.email}`,
        'auth',
        JSON.stringify({ 
          email: user.email,
          google_email: googleEmail,
          user_tier: user.user_tier
        }),
        Math.floor(Date.now() / 1000)
      ).run();

      return new Response(null, {
        status: 302,
        headers: {
          Location: '/manage?login=success&method=google'
        }
      });
    }

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    // Clean up OAuth cookies on error
    cookies.delete("google_oauth_state", { path: "/" });
    cookies.delete("google_code_verifier", { path: "/" });
    cookies.delete("google_oauth_linking", { path: "/" });

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/manage?error=oauth_callback_error'
      }
    });
  }
}; 