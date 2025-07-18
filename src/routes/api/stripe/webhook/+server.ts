import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import getStripe from '$lib/stripe/stripe';
import { 
  getUserByStripeCustomerId, 
  updateUserSubscriptionStatus 
} from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env?.DB) {
    return json({ error: 'Database not available' }, { status: 500 });
  }

  const db = platform.env.DB;
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return json({ error: 'Webhook signature missing' }, { status: 400 });
  }

  let event;

  try {
    const body = await request.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`🎣 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, db);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, db);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, db);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, db);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, db);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, db);
        break;

      default:
        console.log(`🎣 Unhandled webhook event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

async function handleSubscriptionCreated(subscription: any, db: any) {
  console.log(`🎣 Processing subscription created: ${subscription.id}`);
  
  const user = await getUserByStripeCustomerId(subscription.customer, db);
  if (!user) {
    console.error('User not found for Stripe customer:', subscription.customer);
    return;
  }

  const subscriptionData = {
    tier: subscription.status === 'trialing' ? 'trial' as const : 'pro' as const,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    trialExpiresAt: subscription.trial_end || null
  };

  await updateUserSubscriptionStatus(user.id, subscriptionData, db);
  console.log(`✅ User ${user.email} upgraded to ${subscriptionData.tier}`);
}

async function handleSubscriptionUpdated(subscription: any, db: any) {
  console.log(`🎣 Processing subscription updated: ${subscription.id}`);
  
  const user = await getUserByStripeCustomerId(subscription.customer, db);
  if (!user) {
    console.error('User not found for Stripe customer:', subscription.customer);
    return;
  }

  let tier: 'free' | 'pro' | 'trial';
  
  if (subscription.status === 'trialing') {
    tier = 'trial';
  } else if (subscription.status === 'active') {
    tier = 'pro';
  } else {
    tier = 'free'; // canceled, past_due, etc.
  }

  const subscriptionData = {
    tier,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    trialExpiresAt: subscription.trial_end || null
  };

  await updateUserSubscriptionStatus(user.id, subscriptionData, db);
  console.log(`✅ User ${user.email} subscription updated to ${tier} (${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription: any, db: any) {
  console.log(`🎣 Processing subscription deleted: ${subscription.id}`);
  
  const user = await getUserByStripeCustomerId(subscription.customer, db);
  if (!user) {
    console.error('User not found for Stripe customer:', subscription.customer);
    return;
  }

  const subscriptionData = {
    tier: 'free' as const,
    stripeSubscriptionId: null,
    subscriptionStatus: 'canceled',
    trialExpiresAt: null
  };

  await updateUserSubscriptionStatus(user.id, subscriptionData, db);
  console.log(`✅ User ${user.email} downgraded to free (subscription canceled)`);
}

async function handleTrialWillEnd(subscription: any, db: any) {
  console.log(`🎣 Processing trial will end: ${subscription.id}`);
  
  const user = await getUserByStripeCustomerId(subscription.customer, db);
  if (!user) {
    console.error('User not found for Stripe customer:', subscription.customer);
    return;
  }

  // TODO: Send trial ending reminder email
  console.log(`📧 Should send trial ending reminder to ${user.email}`);
}

async function handlePaymentFailed(invoice: any, db: any) {
  console.log(`🎣 Processing payment failed: ${invoice.id}`);
  
  if (invoice.subscription) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const user = await getUserByStripeCustomerId(subscription.customer, db);
    
    if (user) {
      console.log(`💳 Payment failed for ${user.email}, subscription: ${subscription.id}`);
      // TODO: Send payment failed email
    }
  }
}

async function handlePaymentSucceeded(invoice: any, db: any) {
  console.log(`🎣 Processing payment succeeded: ${invoice.id}`);
  
  if (invoice.subscription) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const user = await getUserByStripeCustomerId(subscription.customer, db);
    
    if (user) {
      console.log(`✅ Payment succeeded for ${user.email}, subscription: ${subscription.id}`);
      
      // Ensure user is marked as pro (in case they were past_due)
      if (subscription.status === 'active') {
        const subscriptionData = {
          tier: 'pro' as const,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          trialExpiresAt: null
        };
        
        await updateUserSubscriptionStatus(user.id, subscriptionData, db);
      }
    }
  }
} 