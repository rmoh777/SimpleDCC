import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrGetUser, createUserSession, getUserByEmail, updateUserStripeCustomerId } from '$lib/users/user-operations';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      console.error('[complete-stripe-payment] Database not available');
      throw redirect(302, '/upgrade?error=service_unavailable');
    }

    // Get parameters from URL
    const token = url.searchParams.get('token');
    const sessionId = url.searchParams.get('session_id');
    const subscriptionId = url.searchParams.get('subscription_id');
    const customerId = url.searchParams.get('customer_id');
    const trialEnd = url.searchParams.get('trial_end');

    if (!token || !sessionId || !subscriptionId || !customerId) {
      console.error('[complete-stripe-payment] Missing required parameters');
      throw redirect(302, '/upgrade?error=invalid_params');
    }

    const db = platform.env.DB;
    const now = Date.now();

    try {
      // Look up pending signup
      const pendingRecord = await db.prepare(`
        SELECT id, email, docket_number, status, expires_at
        FROM pending_signups 
        WHERE id = ?
      `).bind(parseInt(token)).first();

      if (!pendingRecord) {
        console.log(`[complete-stripe-payment] Invalid token: ${token}`);
        throw redirect(302, '/upgrade?error=invalid_token');
      }

      // Check if already completed
      if (pendingRecord.status === 'completed') {
        console.log(`[complete-stripe-payment] Already completed: ${token}`);
        // Try to log them in if user exists
        const existingUser = await getUserByEmail(pendingRecord.email, db);
        if (existingUser) {
          const session = await createUserSession(existingUser.id, false, db);
          if (session) {
            cookies.set('user_session', session.sessionToken, {
              path: '/',
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30 // 30 days
            });
          }
        }
        throw redirect(302, '/manage?signup=already_completed');
      }

      const email = pendingRecord.email;
      const docketNumber = pendingRecord.docket_number;

      // Check if user already exists
      const existingUser = await getUserByEmail(email, db);
      if (existingUser) {
        console.log(`[complete-stripe-payment] User already exists: ${email}`);
        
        // Update their Stripe info and log them in
        await updateUserStripeCustomerId(existingUser.id, customerId, db);
        
        const session = await createUserSession(existingUser.id, false, db);
        if (session) {
          cookies.set('user_session', session.sessionToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          });
        }
        
        // Mark pending as completed
        await db.prepare(`
          UPDATE pending_signups 
          SET status = 'completed', completed_at = ?
          WHERE id = ?
        `).bind(now, parseInt(token)).run();
        
        throw redirect(302, '/manage?signup=existing_user_upgraded');
      }

      // Create new user
      console.log(`[complete-stripe-payment] Creating pro user: ${email}`);
      const newUser = await createOrGetUser(email, db);

      if (!newUser) {
        throw new Error('Failed to create user account');
      }

      // Update user with Stripe info
      await updateUserStripeCustomerId(newUser.id, customerId, db);
      
      // Set user tier based on trial status
      const userTier = trialEnd && trialEnd !== '' ? 'trial' : 'pro';
      const trialExpiresAt = trialEnd && trialEnd !== '' ? parseInt(trialEnd) : null;
      
      await db.prepare(`
        UPDATE users 
        SET user_tier = ?,
            stripe_subscription_id = ?,
            trial_expires_at = ?
        WHERE id = ?
      `).bind(userTier, subscriptionId, trialExpiresAt, newUser.id).run();

      // Create subscription record
      console.log(`[complete-stripe-payment] Creating subscription for user ${newUser.id}`);
      const subResult = await db.prepare(`
        INSERT INTO subscriptions (user_id, email, docket_number, frequency, created_at, needs_seed) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        newUser.id, 
        email.toLowerCase(), 
        docketNumber, 
        'daily', 
        Math.floor(now / 1000), 
        1  // Pro users need seeding for their first notifications
      ).run();
      
      if (!subResult.success) {
        throw new Error('Failed to create subscription');
      }

      // Mark pending signup as completed
      await db.prepare(`
        UPDATE pending_signups 
        SET status = 'completed', 
            completed_at = ?, 
            user_id = ?, 
            stripe_session_id = ?,
            stripe_subscription_id = ?
        WHERE id = ?
      `).bind(now, newUser.id, sessionId, subscriptionId, parseInt(token)).run();

      // Create session and set cookie
      console.log(`[complete-stripe-payment] Creating session for user ${newUser.id}`);
      const session = await createUserSession(newUser.id, false, db);
      
      if (!session) {
        throw new Error('Failed to create user session');
      }

      // Set session cookie - THIS is the key part that was missing
      cookies.set('user_session', session.sessionToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      console.log(`[complete-stripe-payment] Success! User ${newUser.id} logged in and redirecting to manage`);

      // TODO: Send welcome email here
      // TODO: Trigger initial seeding for their docket

      // Redirect to manage page as a logged-in user
      throw redirect(302, '/manage?signup=success&method=stripe');

    } catch (error) {
      // Re-throw redirects
      if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
        throw error;
      }
      console.error('[complete-stripe-payment] Error:', error);
      throw redirect(302, '/upgrade?error=completion_failed');
    }

  } catch (error) {
    // Re-throw redirects
    if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
      throw error;
    }
    
    console.error('[complete-stripe-payment] Unexpected error:', error);
    throw redirect(302, '/upgrade?error=unexpected_error');
  }
}; 