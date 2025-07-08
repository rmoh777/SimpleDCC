import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrGetUser, getUserByEmail } from '$lib/users/user-operations';

function isValidEmail(email: string): boolean {
  return !!(email && email.includes('@') && email.includes('.'));
}

function isValidDocketNumber(docket: string): boolean {
  return /^\d{1,3}-\d{1,3}$/.test(docket);
}

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ 
        success: false, 
        message: 'Database not available' 
      }, { status: 500 });
    }

    const { email, docket_number } = await request.json();

    if (!email || !docket_number) {
      return json({ 
        success: false, 
        message: 'Email and docket number are required' 
      }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return json({ 
        success: false, 
        message: 'Invalid email address' 
      }, { status: 400 });
    }

    if (!isValidDocketNumber(docket_number)) {
      return json({ 
        success: false, 
        message: 'Invalid docket number format' 
      }, { status: 400 });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Phase 2 Card 1: Create or get user account
    const user = await createOrGetUser(normalizedEmail, platform.env.DB);

    // Check for existing subscription (enhanced to use user_id)
    const existing = await platform.env.DB
      .prepare('SELECT id FROM subscriptions WHERE user_id = ? AND docket_number = ?')
      .bind(user.id, docket_number)
      .first();

    if (existing) {
      return json({ 
        success: false, 
        message: 'Already subscribed to this docket' 
      }, { status: 409 });
    }

    // Insert new subscription linked to user (maintaining backward compatibility with email column)
    const result = await platform.env.DB
      .prepare('INSERT INTO subscriptions (user_id, email, docket_number, frequency, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, normalizedEmail, docket_number, 'daily', Math.floor(Date.now() / 1000))
      .run();

    if (result.success) {
      // Send welcome email (don't fail subscription if email fails)
      try {
        const { sendWelcomeEmail } = await import('$lib/email');
        const emailResult = await sendWelcomeEmail(email, docket_number, platform.env);
        if (emailResult.success) {
          console.log('Welcome email sent successfully');
        } else {
          console.error('Welcome email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue anyway - don't break subscription if email fails
      }

      return json({ 
        success: true,
        message: `Successfully subscribed to docket ${docket_number}`,
        id: result.meta.last_row_id,
        user_tier: user.user_tier, // Phase 2 Card 1: Include user tier
        show_trial_upsell: user.user_tier === 'free' // Phase 2 Card 1: Signal for pro trial modal
      }, { status: 201 });
    } else {
      return json({ 
        success: false, 
        message: 'Failed to create subscription' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      return json({ 
        success: false, 
        message: 'Already subscribed to this docket' 
      }, { status: 409 });
    }
    return json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database unavailable' }, { status: 500 });
    }

    const email = url.searchParams.get('email');
    
    if (!email) {
      return json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Normalize email to lowercase for lookup
    const normalizedEmail = email.toLowerCase();

    // Phase 2 Card 1: Get user information
    const user = await getUserByEmail(normalizedEmail, platform.env.DB);

    // Get subscriptions with enhanced information (backward compatible)
    const subscriptions = await platform.env.DB
      .prepare(`
        SELECT s.id, s.docket_number, s.frequency, s.created_at, s.last_notified
        FROM subscriptions s
        WHERE s.email = ? 
        ORDER BY s.created_at DESC
      `)
      .bind(normalizedEmail)
      .all();

    return json({ 
      subscriptions: subscriptions.results || [],
      count: subscriptions.results?.length || 0,
      user_tier: user?.user_tier || 'free', // Phase 2 Card 1: Include user tier
      trial_expires_at: user?.trial_expires_at // Phase 2 Card 1: Include trial info
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
};

// Add DELETE method for test compatibility
export const DELETE: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ 
        success: false, 
        message: 'Database not available' 
      }, { status: 500 });
    }

    const { id } = await request.json();

    if (!id) {
      return json({ 
        success: false, 
        message: 'Subscription ID required' 
      }, { status: 400 });
    }

    const result = await platform.env.DB
      .prepare('DELETE FROM subscriptions WHERE id = ?')
      .bind(id)
      .run();

    if (result.success && result.meta.changes > 0) {
      return json({ 
        success: true,
        message: 'Subscription removed successfully' 
      });
    } else {
      return json({ 
        success: false, 
        message: 'Subscription not found' 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Delete subscription error:', error);
    return json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}; 