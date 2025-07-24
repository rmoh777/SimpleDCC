import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { getUserByStripeCustomerId, updateUserTier, updateUserSubscriptionStatus } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env?.DB) {
    return json({ error: 'Database not available' }, { status: 500 });
  }

  const db = platform.env.DB;
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = platform.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return json({ error: 'Webhook signature missing' }, { status: 400 });
  }

  if (!platform?.env?.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  if (!platform?.env?.STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'Webhook configuration missing' }, { status: 500 });
  }

  let event;

  try {
    // Initialize Stripe
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
              await handlePaymentFailed(event.data.object, db, platform);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object, db, platform);
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
  
  // Step 1: Check for user_id in metadata (authenticated upgrade flow)
  const userId = subscription.metadata?.user_id;
  if (userId) {
    console.log(`🎣 Subscription ${subscription.id} is from authenticated user upgrade ${userId}`);
    
    const subscriptionData = {
      tier: subscription.status === 'trialing' ? 'trial' as const : 'pro' as const,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      trialExpiresAt: subscription.trial_end || null
    };

    await updateUserSubscriptionStatus(parseInt(userId), subscriptionData, db);
    console.log(`✅ User ID ${userId} upgraded to ${subscriptionData.tier} via authenticated flow`);
    return;
  }
  
  // Step 2: Check if this is from a pending signup (new user flow)
  const pendingSignupId = subscription.metadata?.pending_signup_id;
  if (pendingSignupId) {
    console.log(`🎣 Subscription ${subscription.id} is from pending signup ${pendingSignupId}`);
    
    // Check if pending signup was already completed
    const pendingRecord = await db.prepare(`
      SELECT id, status, user_id 
      FROM pending_signups 
      WHERE id = ? AND status = 'completed'
    `).bind(pendingSignupId).first();
    
    if (pendingRecord && pendingRecord.user_id) {
      console.log(`🎣 Pending signup ${pendingSignupId} already completed, updating user ${pendingRecord.user_id}`);
      
      const subscriptionData = {
        tier: subscription.status === 'trialing' ? 'trial' as const : 'pro' as const,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        trialExpiresAt: subscription.trial_end || null
      };

      await updateUserSubscriptionStatus(pendingRecord.user_id, subscriptionData, db);
      console.log(`✅ User ID ${pendingRecord.user_id} updated via pending signup webhook`);
      return;
    } else {
      console.log(`🎣 Pending signup ${pendingSignupId} not yet completed, webhook will be processed later`);
      return;
    }
  }
  
  // Step 3: Fallback - lookup user by Stripe customer ID (existing flow)
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
  console.log(`✅ User ${user.email} upgraded to ${subscriptionData.tier} via customer ID lookup`);
}

async function handleSubscriptionUpdated(subscription: any, db: any) {
  console.log(`🎣 Processing subscription updated: ${subscription.id}`);
  
  // Step 1: Check for user_id in metadata (authenticated upgrade flow)
  const userId = subscription.metadata?.user_id;
  if (userId) {
    console.log(`🎣 Subscription update ${subscription.id} is from authenticated user ${userId}`);
    
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

    await updateUserSubscriptionStatus(parseInt(userId), subscriptionData, db);
    console.log(`✅ User ID ${userId} subscription updated to ${tier} (${subscription.status}) via authenticated flow`);
    return;
  }
  
  // Step 2: Check if this is from a pending signup (new user flow)
  const pendingSignupId = subscription.metadata?.pending_signup_id;
  if (pendingSignupId) {
    console.log(`🎣 Subscription update ${subscription.id} is from pending signup ${pendingSignupId}`);
    
    // Find the user by pending signup
    const pendingRecord = await db.prepare(`
      SELECT user_id 
      FROM pending_signups 
      WHERE id = ? AND status = 'completed' AND user_id IS NOT NULL
    `).bind(pendingSignupId).first();
    
    if (pendingRecord && pendingRecord.user_id) {
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

      await updateUserSubscriptionStatus(pendingRecord.user_id, subscriptionData, db);
      console.log(`✅ User ID ${pendingRecord.user_id} subscription updated to ${tier} (${subscription.status}) via pending signup`);
      return;
    } else {
      console.log(`🎣 Pending signup ${pendingSignupId} not yet completed for subscription update`);
      return;
    }
  }
  
  // Step 3: Fallback - lookup user by Stripe customer ID (existing flow)
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
  console.log(`✅ User ${user.email} subscription updated to ${tier} (${subscription.status}) via customer ID lookup`);
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

async function handlePaymentFailed(invoice: any, db: any, platform: any) {
  console.log(`🎣 Processing payment failed: ${invoice.id}`);
  
  if (invoice.subscription) {
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const user = await getUserByStripeCustomerId(subscription.customer, db);
    
    if (user) {
      console.log(`💳 Payment failed for ${user.email}, subscription: ${subscription.id}`);
      // TODO: Send payment failed email
    }
  }
}

async function handlePaymentSucceeded(invoice: any, db: any, platform: any) {
  console.log(`🎣 Processing payment succeeded: ${invoice.id}`);
  
  if (invoice.subscription) {
    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
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