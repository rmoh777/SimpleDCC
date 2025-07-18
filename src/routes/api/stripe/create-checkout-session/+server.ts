import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import getStripe from '$lib/stripe/stripe';
import { createOrGetUser, getUserByEmail, updateUserStripeCustomerId } from '$lib/users/user-operations';

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

    let user = await getUserByEmail(email, db);
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
            const stripe = getStripe();
            const customer = await stripe.customers.create({
              email: email,
              metadata: { db_user_id: user.id },
            });
            stripeCustomerId = customer.id;
            await updateUserStripeCustomerId(user.id, stripeCustomerId, db);
          } else {
            stripeCustomerId = user.stripe_customer_id;
          }
        }

    // Ensure STRIPE_PRO_PRICE_ID is set in environment variables
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PRO_PRICE_ID is not set in environment variables.');
      return json({ error: 'Server configuration error: Price ID missing.' }, { status: 500 });
    }
    
            const YOUR_DOMAIN = process.env.PUBLIC_ORIGIN || 'http://localhost:5175';

        const stripe = getStripe();
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
      // Enhanced checkout features
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session' // Save card for future use
        }
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