import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import { getUserByEmail, updateUserSubscriptionStatus } from '$lib/users/user-operations';

export const load: PageServerLoad = async ({ url, platform, cookies }) => {
  if (!platform?.env?.DB) {
    return { 
      user: null, 
      isLoggedIn: false, 
      error: 'Database service unavailable' 
    };
  }

  const db = platform.env.DB;

  // ====================================================================
  // START: DIRECT UPDATE LOGIC - Fix for race condition
  // This handles successful Stripe upgrades immediately before page render
  // ====================================================================
  const upgradeStatus = url.searchParams.get('upgrade');
  const stripeSessionId = url.searchParams.get('session_id');

  if (upgradeStatus === 'success' && stripeSessionId) {
    try {
      console.log(`[Direct Update] Detected successful upgrade. Verifying Stripe session: ${stripeSessionId}`);
      
      // Validate Stripe configuration
      if (!platform?.env?.STRIPE_SECRET_KEY) {
        console.error('[Direct Update] STRIPE_SECRET_KEY not available');
        throw new Error('Stripe configuration missing');
      }

      const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
      
      // 1. Retrieve the session from Stripe to get customer and subscription details
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      
      if (session.payment_status === 'paid' && session.customer && session.subscription) {
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        // 2. Find our user by their Stripe Customer ID
        const user = await db.prepare(`SELECT * FROM users WHERE stripe_customer_id = ?`).bind(stripeCustomerId).first();
        
        if (user) {
          console.log(`[Direct Update] Found user ${user.id} for customer ${stripeCustomerId}. Forcing tier update.`);
          
          // 3. Retrieve the full subscription object to get trial end date
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

          // 4. Force the database update immediately
          const subscriptionData = {
            tier: subscription.status === 'trialing' ? 'trial' as const : 'pro' as const,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            trialExpiresAt: subscription.trial_end || null
          };
          
          await updateUserSubscriptionStatus(user.id, subscriptionData, db);

          console.log(`[Direct Update] ✅ SUCCESS: User ${user.id} tier updated to '${subscriptionData.tier}'.`);

          // Clear the URL parameters to prevent re-triggering and redirect to a clean URL
          throw redirect(302, '/manage?upgrade_status=complete');
        } else {
           console.error(`[Direct Update] CRITICAL: Could not find user for Stripe customer ID ${stripeCustomerId}`);
        }
      } else {
        console.error(`[Direct Update] Stripe session ${stripeSessionId} not paid or missing data.`);
      }
    } catch (error) {
      // If it's a redirect, re-throw it
      if (error?.status === 302) {
        throw error;
      }
      
      console.error('[Direct Update] Error during synchronous upgrade process:', error);
      // Fall through to normal page load, webhook will hopefully catch it later.
    }
  }
  // ====================================================================
  // END: DIRECT UPDATE LOGIC
  // ====================================================================
  
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
  const upgradeStatusParam = url.searchParams.get('upgrade_status');

  // Clear any lingering OAuth cookies to ensure fresh attempts
  // This helps prevent issues with stuck authentication states
  if (errorType === 'oauth_params_missing' || errorType === 'no_account_found') {
    cookies.delete("google_oauth_state", { path: "/" });
    cookies.delete("google_code_verifier", { path: "/" });
    cookies.delete("google_oauth_linking", { path: "/" });
  }

  let statusMessage = '';
  let errorMessage = '';

  // Handle direct upgrade completion
  if (upgradeStatusParam === 'complete') {
    statusMessage = '✅ Upgrade successful! Welcome to your Pro plan.';
  }

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
        const retryParam = url.searchParams.get('retry');
        if (retryParam === 'true') {
          errorMessage = 'Google OAuth failed on first attempt. This is common - please try "Sign in with Google" again.';
        } else {
          errorMessage = 'Google OAuth error: Missing authorization parameters. Please try again.';
        }
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