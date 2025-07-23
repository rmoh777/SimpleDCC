import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';

export const GET: RequestHandler = async ({ url, platform }) => {
  try {
    if (!platform?.env?.DB) {
      console.error('[stripe-success] Database not available');
      throw redirect(302, '/upgrade?error=service_unavailable');
    }

    const sessionId = url.searchParams.get('session_id');
    const token = url.searchParams.get('token');

    if (!sessionId || !token) {
      console.error('[stripe-success] Missing session_id or token parameters');
      throw redirect(302, '/upgrade?error=invalid_params');
    }

    console.log(`[stripe-success] Processing session ${sessionId} for token ${token}`);

    // Validate Stripe configuration
    if (!platform?.env?.STRIPE_SECRET_KEY) {
      console.error('[stripe-success] STRIPE_SECRET_KEY not found');
      throw redirect(302, '/upgrade?error=stripe_config_missing');
    }

    // Initialize Stripe with platform.env (Cloudflare Workers pattern)
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      console.error(`[stripe-success] Stripe session not found: ${sessionId}`);
      throw redirect(302, `/upgrade?token=${token}&error=session_not_found`);
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log(`[stripe-success] Payment not completed: ${session.payment_status}`);
      throw redirect(302, `/upgrade?token=${token}&error=payment_incomplete`);
    }

    // Get the subscription from the session
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error(`[stripe-success] No subscription found in session: ${sessionId}`);
      throw redirect(302, `/upgrade?token=${token}&error=no_subscription`);
    }

    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const customerId = session.customer as string;
    const db = platform.env.DB;

    console.log(`[stripe-success] Payment successful. Subscription: ${subscriptionId}, Customer: ${customerId}`);

    // Store the Stripe data in the database for the completion handler to use
    await db.prepare(`
      UPDATE pending_signups 
      SET stripe_session_id = ?,
          stripe_customer_id = ?,
          stripe_subscription_id = ?
      WHERE id = ?
    `).bind(sessionId, customerId, subscriptionId, parseInt(token)).run();

    console.log(`[stripe-success] Stored Stripe data for token ${token}`);

    // Build URL with all necessary parameters for completion
    const completionUrl = new URL(`${url.origin}/api/complete-stripe-payment`);
    completionUrl.searchParams.set('token', token);
    completionUrl.searchParams.set('session_id', sessionId);
    completionUrl.searchParams.set('subscription_id', subscriptionId as string);
    completionUrl.searchParams.set('customer_id', customerId);
    completionUrl.searchParams.set('trial_end', subscription.trial_end?.toString() || '');

    console.log(`[stripe-success] Redirecting to completion handler`);

    // Redirect user to completion endpoint which will set cookie and redirect to /manage
    throw redirect(302, completionUrl.toString());

  } catch (error) {
    if (error.status === 302) {
      // This is a redirect, re-throw it
      throw error;
    }
    
    console.error('[stripe-success] Unexpected error:', error);
    throw redirect(302, '/upgrade?error=unexpected_error');
  }
}; 