import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function isValidEmail(email: string): boolean {
  return !!(email && email.includes('@') && email.includes('.'));
}

function isValidDocketNumber(docket: string): boolean {
  return /^\d{2}-\d+$/.test(docket);
}

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { email, docket_number } = await request.json();

    if (!email || !docket_number) {
      return json({ error: 'Email and docket number are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!isValidDocketNumber(docket_number)) {
      return json({ error: 'Invalid docket number format. Expected format: XX-XXX' }, { status: 400 });
    }

    // Check for existing subscription
    const existing = await platform.env.DB
      .prepare('SELECT id FROM subscriptions WHERE email = ? AND docket_number = ?')
      .bind(email, docket_number)
      .first();

    if (existing) {
      return json({ error: 'Subscription already exists' }, { status: 409 });
    }

    // Insert new subscription
    const result = await platform.env.DB
      .prepare('INSERT INTO subscriptions (email, docket_number, created_at) VALUES (?, ?, ?)')
      .bind(email, docket_number, Math.floor(Date.now() / 1000))
      .run();

    if (result.success) {
      return json({ 
        message: 'Subscription created successfully',
        id: result.meta.last_row_id 
      }, { status: 201 });
    } else {
      return json({ error: 'Failed to create subscription' }, { status: 500 });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
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

    const subscriptions = await platform.env.DB
      .prepare('SELECT id, docket_number, created_at FROM subscriptions WHERE email = ? ORDER BY created_at DESC')
      .bind(email)
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