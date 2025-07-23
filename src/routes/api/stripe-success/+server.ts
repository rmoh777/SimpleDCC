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

    console.log(`[stripe-success] Payment successful. Subscription: ${subscriptionId}, Customer: ${customerId}`);

    // Call our completion API
    const completionResponse = await fetch(`${url.origin}/api/complete-stripe-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: parseInt(token),
        stripeSessionId: sessionId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        trialEnd: subscription.trial_end
      })
    });

    if (!completionResponse.ok) {
      const error = await completionResponse.json();
      console.error('[stripe-success] Completion API failed:', error);
      throw redirect(302, `/upgrade?token=${token}&error=completion_failed`);
    }

    const completionData = await completionResponse.json();
    
    // Set the session cookie from the completion response
    if (completionData.sessionToken) {
      // Note: We can't set cookies in a GET redirect handler
      // The completion API should have already set the cookie via its own response
      console.log('[stripe-success] Session created successfully');
    }

    console.log(`[stripe-success] Signup completed successfully for token ${token}`);

    // Redirect to manage page with success indicator
    throw redirect(302, '/manage?signup=success&method=stripe');

  } catch (error) {
    if (error.status === 302) {
      // This is a redirect, re-throw it
      throw error;
    }
    
    console.error('[stripe-success] Unexpected error:', error);
    throw redirect(302, '/upgrade?error=unexpected_error');
  }
}; 