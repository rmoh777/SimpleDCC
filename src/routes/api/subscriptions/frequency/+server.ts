import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = platform?.env?.DB;
    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { email, docket_number, frequency } = body;

    if (!email || !docket_number || !frequency) {
      return json({ error: 'Email, docket number, and frequency are required' }, { status: 400 });
    }

    // Validate frequency values
    const validFrequencies = ['daily', 'weekly', 'immediate'];
    if (!validFrequencies.includes(frequency)) {
      return json({ error: 'Invalid frequency. Must be daily, weekly, or immediate' }, { status: 400 });
    }

    // Get user to check tier
    const user = await getUserByEmail(email, db);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user tier allows this frequency
    if (user.user_tier === 'free' && frequency !== 'daily') {
      return json({ 
        error: 'Pro subscription required for weekly and immediate notifications',
        user_tier: user.user_tier
      }, { status: 403 });
    }

    // Update subscription frequency
    const updateResult = await db.prepare(`
      UPDATE subscriptions 
      SET frequency = ?
      WHERE user_id = ? AND docket_number = ?
    `).bind(frequency, user.id, docket_number).run();

    if (!updateResult.success) {
      return json({ error: 'Failed to update subscription frequency' }, { status: 500 });
    }

    if (updateResult.changes === 0) {
      return json({ error: 'Subscription not found' }, { status: 404 });
    }

    return json({
      success: true,
      message: `Notification frequency updated to ${frequency}`,
      frequency,
      user_tier: user.user_tier
    });

  } catch (error) {
    console.error('Error updating subscription frequency:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 