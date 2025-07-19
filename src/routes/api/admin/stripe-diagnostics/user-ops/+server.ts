import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createOrGetUser, getUserByEmail } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { email, adminSecret } = await request.json();
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const db = platform.env.DB;

    // Test user lookup
    const existingUser = await getUserByEmail(email, db);
    
    // Test user creation/retrieval
    const user = await createOrGetUser(email, db);

    return json({
      success: true,
      operations: {
        lookup: {
          email,
          found: !!existingUser,
          user_id: existingUser?.id,
          user_tier: existingUser?.user_tier,
          stripe_customer_id: existingUser?.stripe_customer_id
        },
        create_or_get: {
          user_id: user.id,
          email: user.email,
          user_tier: user.user_tier,
          created_at: user.created_at,
          stripe_customer_id: user.stripe_customer_id,
          was_created: !existingUser
        }
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'User operations failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 