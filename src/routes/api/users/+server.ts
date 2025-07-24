import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail, updateUserTier, getUserById } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = platform?.env?.DB;
    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { action, email, userId } = body;

    if (!action) {
      return json({ error: 'Action is required' }, { status: 400 });
    }

    // Handle trial activation
    if (action === 'start_trial') {
      if (!email && !userId) {
        return json({ error: 'Email or userId is required for trial activation' }, { status: 400 });
      }

      let user;
      if (email) {
        user = await getUserByEmail(email, db);
      } else if (userId) {
        user = await getUserById(userId, db);
      }

      if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user is already on trial or pro
      if (user.user_tier === 'trial' || user.user_tier === 'pro') {
        return json({ 
          error: 'User already has pro access',
          user_tier: user.user_tier 
        }, { status: 400 });
      }

      // Set trial expiration to 30 days from now
      const trialExpiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

      // Update user to trial tier
      const updatedUser = await updateUserTier(user.id, 'trial', trialExpiresAt, db);

      return json({
        success: true,
        message: 'Trial activated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          user_tier: updatedUser.user_tier,
          trial_expires_at: updatedUser.trial_expires_at
        }
      });
    }

    // Handle tier changes (for future use)
    if (action === 'change_tier') {
      if (!userId) {
        return json({ error: 'User ID is required for tier changes' }, { status: 400 });
      }

      const { new_tier } = body;
      if (!new_tier || !['free', 'pro', 'trial'].includes(new_tier)) {
        return json({ error: 'Valid tier is required (free, pro, trial)' }, { status: 400 });
      }

      const user = await getUserById(userId, db);
      if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      const trialExpiresAt = new_tier === 'trial' ? 
        Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) : null;

      const updatedUser = await updateUserTier(user.id, new_tier, trialExpiresAt, db);

      return json({
        success: true,
        message: `User tier updated to ${new_tier}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          user_tier: updatedUser.user_tier,
          trial_expires_at: updatedUser.trial_expires_at
        }
      });
    }

    return json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Error in /api/users endpoint:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ platform, cookies }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ 
        user: null, 
        isLoggedIn: false, 
        error: 'Database service unavailable' 
      }, { status: 500 });
    }

    const db = platform.env.DB;
    
    // Check for existing session using the EXACT same pattern as manage page
    const sessionToken = cookies.get('user_session');
    
    if (sessionToken) {
      try {
        const user = await db.prepare(`
          SELECT * FROM users 
          WHERE session_token = ? 
          AND session_expires > ?
        `).bind(sessionToken, Date.now()).first();

        if (user) {
          return json({
            user: {
              id: user.id,
              email: user.email,
              user_tier: user.user_tier,
              created_at: user.created_at,
              google_id: user.google_id,
              google_email: user.google_email,
              google_linked_at: user.google_linked_at
            },
            isLoggedIn: true
          });
        } else {
          // Clear invalid session cookie
          cookies.delete('user_session', { path: '/' });
        }
      } catch (error) {
        console.error('Session validation error:', error);
        cookies.delete('user_session', { path: '/' });
      }
    }

    return json({
      user: null,
      isLoggedIn: false
    });

  } catch (error) {
    console.error('Error in /api/users GET endpoint:', error);
    return json({ 
      user: null,
      isLoggedIn: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}; 