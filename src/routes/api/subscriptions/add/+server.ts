import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById } from '$lib/users/user-operations';

function isValidDocketNumber(docket: string): boolean {
  return /^\d{2,4}-\d{1,4}$/.test(docket.trim());
}

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ success: false, error: 'Database not available' }, { status: 500 });
    }

    const db = platform.env.DB;

    // 1. Authenticate user via session token
    const sessionToken = cookies.get('user_session');
    if (!sessionToken) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = await db.prepare(
      `SELECT * FROM users WHERE session_token = ? AND session_expires > ?`
    ).bind(sessionToken, Date.now()).first();

    if (!user) {
      cookies.delete('user_session', { path: '/' });
      return json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const { docket_number, frequency } = await request.json();
    if (!docket_number || !/^\d{2,4}-\d{1,4}$/.test(docket_number.trim())) {
      return json({ success: false, error: 'Invalid docket number format. Use XX-XXX.' }, { status: 400 });
    }
    
    const selectedFrequency = frequency && ['daily', 'immediate'].includes(frequency) ? frequency : 'daily';
    if (user.user_tier === 'free' && selectedFrequency !== 'daily') {
        return json({ success: false, error: 'Pro plan required for immediate notifications.' }, { status: 403 });
    }

    // 3. Prevent duplicate subscriptions
    const existing = await db.prepare(
      `SELECT id FROM subscriptions WHERE user_id = ? AND docket_number = ?`
    ).bind(user.id, docket_number).first();

    if (existing) {
      return json({ success: false, error: 'You are already subscribed to this docket.' }, { status: 409 });
    }

    // 4. Implement tier-based logic with safe transactions
    if (user.user_tier === 'free') {
      // Insert new subscription FIRST
      const insertResult = await db.prepare(
        `INSERT INTO subscriptions (user_id, email, docket_number, frequency, created_at, needs_seed) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(user.id, user.email.toLowerCase(), docket_number, 'daily', Math.floor(Date.now() / 1000), 1).run();

      if (!insertResult.success) {
        return json({ success: false, error: 'Failed to add subscription.' }, { status: 500 });
      }

      // Only AFTER success, delete all OTHER subscriptions for the free user
      await db.prepare(
        `DELETE FROM subscriptions WHERE user_id = ? AND docket_number != ?`
      ).bind(user.id, docket_number).run();

      return json({
        success: true,
        message: `Successfully subscribed to ${docket_number}. Your previous subscription was replaced.`,
        subscription: { id: insertResult.meta.last_row_id, docket_number, frequency: 'daily', user_tier: user.user_tier }
      }, { status: 201 });

    } else {
      // Pro/Trial Users: Just insert the new subscription
      const result = await db.prepare(
        `INSERT INTO subscriptions (user_id, email, docket_number, frequency, created_at, needs_seed) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(user.id, user.email.toLowerCase(), docket_number, selectedFrequency, Math.floor(Date.now() / 1000), 1).run();

      if (!result.success) {
        return json({ success: false, error: 'Failed to create subscription.' }, { status: 500 });
      }
      
      return json({
        success: true,
        message: `Successfully added subscription for ${docket_number}.`,
        subscription: { id: result.meta.last_row_id, docket_number, frequency: selectedFrequency, user_tier: user.user_tier }
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Add subscription API error:', error);
    return json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}; 