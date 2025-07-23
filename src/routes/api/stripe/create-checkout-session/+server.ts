import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { createOrGetUser, updateUserStripeCustomerId } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env?.DB) {
    return json({ error: 'Database not available' }, { status: 500 });
  }
  
  const db = platform.env.DB;

  try {
    const { email } = await request.json();

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate environment variables
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

    // Initialize Stripe
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    let user = await createOrGetUser(email, db);
    let stripeCustomerId: string | undefined;

    if (user) {
      if (user.user_tier === 'pro') {
        return json({ error: 'User is already a Pro subscriber.' }, { status: 400 });
      }
      stripeCustomerId = user.stripe_customer_id;
    }

            // If no user or no Stripe Customer ID, create or get user and then potentially a Stripe Customer
        if (!user || !stripeCustomerId) {
          user = await createOrGetUser(email, db); // Ensure user exists in our DB
          if (!user.stripe_customer_id) {
            const stripeForCustomer = new Stripe(platform.env.STRIPE_SECRET_KEY, {
              apiVersion: '2024-06-20',
            });
            const customer = await stripeForCustomer.customers.create({
              email: email,
              metadata: { db_user_id: user.id },
            });
            stripeCustomerId = customer.id;
            await updateUserStripeCustomerId(user.id, stripeCustomerId, db);
          } else {
            stripeCustomerId = user.stripe_customer_id;
          }
        }

    const priceId = platform.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PRO_PRICE_ID is not set in environment variables.');
      return json({ error: 'Server configuration error: Price ID missing.' }, { status: 500 });
    }
    
            const YOUR_DOMAIN = platform.env.PUBLIC_ORIGIN || 'http://localhost:5175';

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
      },
      customer_update: {
        name: 'auto',
        address: 'auto'
      },
      // Stripe Link is enabled automatically - no additional config needed
      success_url: `${YOUR_DOMAIN}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/upgrade?canceled=true`,
    });

    if (session.url) {
      return json({ url: session.url });
    } else {
      return json({ error: 'Failed to create checkout session URL.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 