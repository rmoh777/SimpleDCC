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
            created_at: user.created_at
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

  let statusMessage = '';
  let errorMessage = '';

  if (loginStatus === 'success') {
    statusMessage = '✅ Successfully signed in! Welcome to your subscription dashboard.';
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