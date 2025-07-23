import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/stripe/stripe';

const STRIPE_PRICE_ID = 'price_1QQPAkCJaxUnOvgcgRqBJoKG'; // Pro tier price ID

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
      SELECT id, email, docket_number, status, expires_at
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

    console.log(`[create-stripe-session] Creating checkout session for ${email}, token: ${token}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          pending_signup_id: token.toString(),
          docket_number: docketNumber,
        },
      },
      metadata: {
        pending_signup_id: token.toString(),
        docket_number: docketNumber,
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