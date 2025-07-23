import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrGetUser, createUserSession, getUserByEmail } from '$lib/users/user-operations';
import { createUserSubscription } from '$lib/database/db-operations';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { token } = await request.json();

    // Validate token input
    if (!token || typeof token !== 'number') {
      return json({ error: 'Valid token is required' }, { status: 400 });
    }

    const db = platform.env.DB;
    const now = Date.now();

    // Begin transaction
    const tx = await db.batch([]);

    try {
      // 1. Look up and validate pending signup
      const pendingRecord = await db.prepare(`
        SELECT id, email, docket_number, status, expires_at
        FROM pending_signups 
        WHERE id = ?
      `).bind(token).first();

      if (!pendingRecord) {
        console.log(`[complete-free-signup] Invalid token: ${token}`);
        return json({ error: 'Invalid or expired signup link' }, { status: 404 });
      }

      // Check if expired
      if (pendingRecord.expires_at < now) {
        console.log(`[complete-free-signup] Expired token: ${token}`);
        return json({ error: 'This signup link has expired. Please start over.' }, { status: 410 });
      }

      // Check if already completed
      if (pendingRecord.status === 'completed') {
        console.log(`[complete-free-signup] Already completed: ${token}`);
        return json({ error: 'This signup has already been completed' }, { status: 409 });
      }

      const email = pendingRecord.email;
      const docketNumber = pendingRecord.docket_number;

      // 2. Check if user already exists
      const existingUser = await getUserByEmail(email, db);
      if (existingUser) {
        console.log(`[complete-free-signup] User already exists: ${email}`);
        
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

      // 3. Create user account
      console.log(`[complete-free-signup] Creating user: ${email}`);
      const newUser = await createOrGetUser(email, db);

      if (!newUser) {
        throw new Error('Failed to create user account');
      }

      // 4. Create free subscription
      console.log(`[complete-free-signup] Creating subscription for user ${newUser.id}`);
      await createUserSubscription({
        userId: newUser.id,
        docketNumber,
        tier: 'free',
        frequency: 'daily',
        isActive: true,
        createdAt: now
      }, db);

      // 5. Mark pending signup as completed
      await db.prepare(`
        UPDATE pending_signups 
        SET status = 'completed', completed_at = ?, user_id = ?
        WHERE id = ?
      `).bind(now, newUser.id, token).run();

      // 6. Create session
      console.log(`[complete-free-signup] Creating session for user ${newUser.id}`);
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

      console.log(`[complete-free-signup] Success! User ${newUser.id} created with free subscription`);

      // Return redirect to manage page
      return json({ 
        success: true,
        redirect: '/manage'
      });

    } catch (error) {
      console.error('[complete-free-signup] Transaction error:', error);
      throw error;
    }

  } catch (error) {
    console.error('[complete-free-signup] Error:', error);
    return json({ 
      error: 'Failed to complete signup. Please try again.' 
    }, { status: 500 });
  }
}; 