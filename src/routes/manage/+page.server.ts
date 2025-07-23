import type { PageServerLoad } from './$types';
import { getUserByEmail } from '$lib/users/user-operations';

export const load: PageServerLoad = async ({ url, platform, cookies }) => {
  if (!platform?.env?.DB) {
    return { 
      user: null, 
      isLoggedIn: false, 
      error: 'Database service unavailable' 
    };
  }

  const db = platform.env.DB;
  
  // Check for existing session
  const sessionToken = cookies.get('user_session');
  
  if (sessionToken) {
    try {
      const user = await db.prepare(`
        SELECT * FROM users 
        WHERE session_token = ? 
        AND session_expires > ?
      `).bind(sessionToken, Date.now()).first();

      if (user) {
        // Get user's subscriptions
        const subscriptions = await db.prepare(`
          SELECT * FROM subscriptions 
          WHERE user_id = ? 
          ORDER BY created_at DESC
        `).bind(user.id).all();

        return {
          user: {
            id: user.id,
            email: user.email,
            user_tier: user.user_tier,
            created_at: user.created_at,
            google_id: user.google_id,
            google_email: user.google_email,
            google_linked_at: user.google_linked_at
          },
          subscriptions: subscriptions.results || [],
          isLoggedIn: true
        };
      } else {
        // Clear invalid session cookie
        cookies.delete('user_session', { path: '/' });
      }
    } catch (error) {
      console.error('Session validation error:', error);
      cookies.delete('user_session', { path: '/' });
    }
  }

  // Check for URL parameters (login status, errors)
  const loginStatus = url.searchParams.get('login');
  const errorType = url.searchParams.get('error');
  const googleLinked = url.searchParams.get('google_linked');
  const authMethod = url.searchParams.get('method');

  let statusMessage = '';
  let errorMessage = '';

  if (loginStatus === 'success') {
    if (authMethod === 'google') {
      statusMessage = '✅ Successfully signed in with Google! Welcome to your subscription dashboard.';
    } else {
      statusMessage = '✅ Successfully signed in! Welcome to your subscription dashboard.';
    }
  }

  if (googleLinked === 'success') {
    statusMessage = '✅ Google account successfully linked! You can now sign in with Google.';
  }

  if (errorType) {
    switch (errorType) {
      case 'link_expired':
        errorMessage = 'Your magic link has expired. Please request a new one.';
        break;
      case 'invalid_link':
        errorMessage = 'Invalid or malformed magic link. Please try again.';
        break;
      case 'verification_failed':
        errorMessage = 'Failed to verify your sign-in. Please try again.';
        break;
      case 'service_unavailable':
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        break;
      case 'no_account_found':
        const emailParam = url.searchParams.get('email');
        errorMessage = `No SimpleDCC account found for ${emailParam || 'that Google account'}. Please use magic link to sign in with your original email address.`;
        break;
      case 'oauth_params_missing':
        errorMessage = 'Google OAuth error: Missing authorization parameters. Please try again.';
        break;
      case 'oauth_state_mismatch':
        errorMessage = 'Google OAuth security error. Please try signing in again.';
        break;
      case 'oauth_token_exchange_failed':
        errorMessage = 'Failed to verify Google account. Please try again.';
        break;
      case 'oauth_user_data_missing':
        errorMessage = 'Could not retrieve account information from Google. Please try again.';
        break;
      case 'google_account_already_linked':
        errorMessage = 'This Google account is already linked to another user.';
        break;
      case 'linking_failed':
        errorMessage = 'Failed to link Google account. Please try again.';
        break;
      case 'auto_linking_failed':
        errorMessage = 'Failed to link your Google account automatically. Please try magic link instead.';
        break;
      case 'session_creation_failed':
        errorMessage = 'Failed to create login session. Please try again.';
        break;
      case 'oauth_callback_error':
        errorMessage = 'Google OAuth process failed. Please try again.';
        break;
      case 'oauth_config_missing':
        errorMessage = 'Google OAuth is not configured on this server. Please contact support.';
        break;
      default:
        errorMessage = 'An error occurred during sign-in. Please try again.';
    }
  }

  return {
    user: null,
    subscriptions: [],
    isLoggedIn: false,
    statusMessage,
    errorMessage
  };
}; 