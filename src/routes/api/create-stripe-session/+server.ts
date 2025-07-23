import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform, url }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { token } = await request.json();

    // Validate token input
    if (!token || typeof token !== 'number') {
      return json({ error: 'Valid token is required' }, { status: 400 });
    }

    const db = platform.env.DB;
    const now = Date.now();

    // Look up and validate pending signup
    const pendingRecord = await db.prepare(`
      SELECT id, email, docket_number, status, expires_at, stripe_customer_id
      FROM pending_signups 
      WHERE id = ?
    `).bind(token).first();

    if (!pendingRecord) {
      console.log(`[create-stripe-session] Invalid token: ${token}`);
      return json({ error: 'Invalid or expired signup link' }, { status: 404 });
    }

    // Check if expired
    if (pendingRecord.expires_at < now) {
      console.log(`[create-stripe-session] Expired token: ${token}`);
      return json({ error: 'This signup link has expired. Please start over.' }, { status: 410 });
    }

    // Check if already completed
    if (pendingRecord.status === 'completed') {
      console.log(`[create-stripe-session] Already completed: ${token}`);
      return json({ error: 'This signup has already been completed' }, { status: 409 });
    }

    const email = pendingRecord.email;
    const docketNumber = pendingRecord.docket_number;

    // Validate Stripe configuration
    if (!platform?.env?.STRIPE_SECRET_KEY) {
      console.error('[create-stripe-session] STRIPE_SECRET_KEY not found');
      return json({ 
        error: 'Stripe configuration missing',
        details: 'STRIPE_SECRET_KEY not found'
      }, { status: 500 });
    }

    if (!platform?.env?.STRIPE_PRO_PRICE_ID) {
      console.error('[create-stripe-session] STRIPE_PRO_PRICE_ID not found');
      return json({ 
        error: 'Stripe configuration missing',
        details: 'STRIPE_PRO_PRICE_ID not found'
      }, { status: 500 });
    }

    console.log(`[create-stripe-session] Creating checkout session for ${email}, token: ${token}`);

    // Initialize Stripe with platform.env (Cloudflare Workers pattern)
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Create or retrieve Stripe customer
    let stripeCustomerId = pendingRecord.stripe_customer_id;
    
    if (!stripeCustomerId) {
      console.log(`[create-stripe-session] Creating new Stripe customer for ${email}`);
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          pending_signup_id: token.toString(),
          docket_number: docketNumber,
        },
      });
      stripeCustomerId = customer.id;

      // Update pending signup with Stripe customer ID
      await db.prepare(`
        UPDATE pending_signups 
        SET stripe_customer_id = ?
        WHERE id = ?
      `).bind(stripeCustomerId, token).run();
      
      console.log(`[create-stripe-session] Created Stripe customer: ${stripeCustomerId}`);
    } else {
      console.log(`[create-stripe-session] Using existing Stripe customer: ${stripeCustomerId}`);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: platform.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          pending_signup_id: token.toString(),
          docket_number: docketNumber,
        },
      },
      metadata: {
        pending_signup_id: token.toString(),
        docket_number: docketNumber,
      },
      customer_update: {
        name: 'auto',
        address: 'auto'
      },
      success_url: `${url.origin}/api/stripe-success?session_id={CHECKOUT_SESSION_ID}&token=${token}`,
      cancel_url: `${url.origin}/upgrade?token=${token}&cancelled=true`,
    });

    console.log(`[create-stripe-session] Checkout session created: ${session.id}`);

    // Return the checkout URL
    return json({ 
      success: true,
      url: session.url 
    });

  } catch (error) {
    console.error('[create-stripe-session] Error:', error);
    return json({ 
      error: 'Failed to create checkout session. Please try again.' 
    }, { status: 500 });
  }
}; 