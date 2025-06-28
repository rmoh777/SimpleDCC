import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

    // Check for existing subscription
    const existing = await platform.env.DB
      .prepare('SELECT id FROM subscriptions WHERE email = ? AND docket_number = ?')
      .bind(normalizedEmail, docket_number)
      .first();

    if (existing) {
      return json({ 
        success: false, 
        message: 'Already subscribed to this docket' 
      }, { status: 409 });
    }

    // Insert new subscription
    const result = await platform.env.DB
      .prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind(normalizedEmail, docket_number, Math.floor(Date.now() / 1000))
      .run();

    if (result.success) {
      return json({ 
        success: true,
        message: `Successfully subscribed to docket ${docket_number}`,
        id: result.meta.last_row_id 
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

    const subscriptions = await platform.env.DB
      .prepare('SELECT id, docket_number, created_at FROM subscriptions WHERE email = ? ORDER BY created_at DESC')
      .bind(normalizedEmail)
      .all();

    return json({ 
      subscriptions: subscriptions.results || [],
      count: subscriptions.results?.length || 0
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