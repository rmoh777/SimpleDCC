import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrGetUser, createUserSession, getUserByEmail, updateUserStripeCustomerId } from '$lib/users/user-operations';
import { createUserSubscription } from '$lib/database/db-operations';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { token, stripeSessionId, stripeSubscriptionId, stripeCustomerId, trialEnd } = await request.json();

    // Validate input
    if (!token || typeof token !== 'number') {
      return json({ error: 'Valid token is required' }, { status: 400 });
    }

    if (!stripeSessionId || !stripeSubscriptionId || !stripeCustomerId) {
      return json({ error: 'Missing Stripe payment details' }, { status: 400 });
    }

    const db = platform.env.DB;
    const now = Date.now();

    try {
      // 1. Look up and validate pending signup
      const pendingRecord = await db.prepare(`
        SELECT id, email, docket_number, status, expires_at
        FROM pending_signups 
        WHERE id = ?
      `).bind(token).first();

      if (!pendingRecord) {
        console.log(`[complete-stripe-signup] Invalid token: ${token}`);
        return json({ error: 'Invalid or expired signup link' }, { status: 404 });
      }

      // Check if expired
      if (pendingRecord.expires_at < now) {
        console.log(`[complete-stripe-signup] Expired token: ${token}`);
        return json({ error: 'This signup link has expired. Please start over.' }, { status: 410 });
      }

      // Check if already completed
      if (pendingRecord.status === 'completed') {
        console.log(`[complete-stripe-signup] Already completed: ${token}`);
        return json({ error: 'This signup has already been completed' }, { status: 409 });
      }

      const email = pendingRecord.email;
      const docketNumber = pendingRecord.docket_number;

      // 2. Check if user already exists
      const existingUser = await getUserByEmail(email, db);
      if (existingUser) {
        console.log(`[complete-stripe-signup] User already exists: ${email}`);
        
        // Mark pending as completed anyway
        await db.prepare(`
          UPDATE pending_signups 
          SET status = 'completed', completed_at = ?
          WHERE id = ?
        `).bind(now, token).run();

        return json({ 
          error: 'An account with this email already exists. Please log in instead.' 
        }, { status: 409 });
      }

      // 3. Create user account with pro tier
      console.log(`[complete-stripe-signup] Creating pro user: ${email}`);
      const newUser = await createOrGetUser(email, db);

      if (!newUser) {
        throw new Error('Failed to create user account');
      }

      // Update user with Stripe customer ID and pro tier
      await updateUserStripeCustomerId(newUser.id, stripeCustomerId, db);
      await db.prepare(`
        UPDATE users 
        SET user_tier = 'pro'
        WHERE id = ?
      `).bind(newUser.id).run();

      // 4. Create pro subscription
      console.log(`[complete-stripe-signup] Creating pro subscription for user ${newUser.id}`);
      await createUserSubscription({
        userId: newUser.id,
        docketNumber,
        tier: 'pro',
        frequency: 'daily',
        isActive: true,
        createdAt: now,
        stripeSubscriptionId: stripeSubscriptionId,
        trialEnd: trialEnd ? trialEnd * 1000 : null // Convert to milliseconds if present
      }, db);

      // 5. Mark pending signup as completed
      await db.prepare(`
        UPDATE pending_signups 
        SET status = 'completed', completed_at = ?, user_id = ?, stripe_session_id = ?
        WHERE id = ?
      `).bind(now, newUser.id, stripeSessionId, token).run();

      // 6. Create session
      console.log(`[complete-stripe-signup] Creating session for user ${newUser.id}`);
      const session = await createUserSession(newUser.id, false, db);
      
      if (!session) {
        throw new Error('Failed to create user session');
      }

      // Set session cookie (matching what /manage expects)
      cookies.set('user_session', session.sessionToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      console.log(`[complete-stripe-signup] Success! Pro user ${newUser.id} created with subscription ${stripeSubscriptionId}`);

      // Return success with session info
      return json({ 
        success: true,
        sessionToken: session.sessionToken,
        userId: newUser.id,
        tier: 'pro'
      });

    } catch (error) {
      console.error('[complete-stripe-signup] Transaction error:', error);
      throw error;
    }

  } catch (error) {
    console.error('[complete-stripe-signup] Error:', error);
    return json({ 
      error: 'Failed to complete pro signup. Please contact support.' 
    }, { status: 500 });
  }
}; 