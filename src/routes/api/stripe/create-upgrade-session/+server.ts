import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { updateUserStripeCustomerId } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  if (!platform?.env?.DB) {
    return json({ error: 'Database not available' }, { status: 500 });
  }
  
  const db = platform.env.DB;

  try {
    // 1. Authenticate user via session token
    const sessionToken = cookies.get('user_session');
    if (!sessionToken) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await db.prepare(
      `SELECT * FROM users WHERE session_token = ? AND session_expires > ?`
    ).bind(sessionToken, Date.now()).first();

    if (!user) {
      cookies.delete('user_session', { path: '/' });
      return json({ error: 'Session expired' }, { status: 401 });
    }

    // 2. Check if user is already Pro
    if (user.user_tier === 'pro' || user.user_tier === 'trial') {
      return json({ 
        error: 'User is already a Pro subscriber', 
        current_tier: user.user_tier 
      }, { status: 400 });
    }

    // 3. Validate environment variables
    if (!platform?.env?.STRIPE_SECRET_KEY) {
      return json({ 
        error: 'Stripe configuration missing',
        details: 'STRIPE_SECRET_KEY not found'
      }, { status: 500 });
    }

    if (!platform?.env?.STRIPE_PRO_PRICE_ID) {
      return json({ 
        error: 'Stripe configuration missing', 
        details: 'STRIPE_PRO_PRICE_ID not found'
      }, { status: 500 });
    }

    if (!platform?.env?.PUBLIC_ORIGIN) {
      return json({ 
        error: 'Application configuration missing',
        details: 'PUBLIC_ORIGIN not found'
      }, { status: 500 });
    }

    // 4. Initialize Stripe
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // 5. Handle Stripe Customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      console.log(`[create-upgrade-session] Creating new Stripe customer for user ${user.id}`);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { 
          user_id: user.id.toString(),
          upgrade_type: 'authenticated_user'
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to database
      await updateUserStripeCustomerId(user.id, stripeCustomerId, db);
      console.log(`[create-upgrade-session] Created Stripe customer: ${stripeCustomerId}`);
    } else {
      console.log(`[create-upgrade-session] Using existing Stripe customer: ${stripeCustomerId}`);
    }

    // 6. Create Stripe Checkout Session
    const YOUR_DOMAIN = platform.env.PUBLIC_ORIGIN;
    const priceId = platform.env.STRIPE_PRO_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          user_id: user.id.toString(),  // This is the key addition for the webhook
          upgrade_type: 'authenticated_user'
        },
      },
      customer_update: {
        name: 'auto',
        address: 'auto'
      },
      success_url: `${YOUR_DOMAIN}/manage?upgrade=success`,
      cancel_url: `${YOUR_DOMAIN}/manage?upgrade=cancelled`,
    });

    console.log(`[create-upgrade-session] Created checkout session for user ${user.id}: ${session.id}`);

    if (session.url) {
      return json({ url: session.url });
    } else {
      return json({ error: 'Failed to create checkout session URL.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating upgrade session:', error);
    return json({ 
      error: 'Failed to create upgrade session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 