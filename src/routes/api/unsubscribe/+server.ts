import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { email, docket_number } = await request.json();

    if (!email || !docket_number) {
      return json({ error: 'Email and docket number are required' }, { status: 400 });
    }

    const result = await platform.env.DB
      .prepare('DELETE FROM subscriptions WHERE email = ? AND docket_number = ?')
      .bind(email, docket_number)
      .run();

    if (result.success && result.meta.changes > 0) {
      return json({ message: 'Unsubscribed successfully' });
    } else {
      return json({ error: 'Subscription not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 