import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { getUserById, getUserByStripeCustomerId, updateUserTier, updateUserSubscriptionStatus } from '$lib/users/user-operations';

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
  console.log(`[Webhook] Processing 'customer.subscription.created': ${subscription.id}`);
  
  const metadata = subscription.metadata || {};
  let user = null;

  // --- Robust User Identification Logic ---
  // Priority 1: Check for user_id in subscription metadata (authenticated upgrade flow)
  if (metadata.user_id) {
    console.log(`[Webhook] Found user_id in metadata: ${metadata.user_id}`);
    // FIX: Explicitly parse the user_id from metadata string to a number
    const userId = parseInt(metadata.user_id, 10);
    if (!isNaN(userId)) {
      console.log(`[Webhook] Parsed user_id as number: ${userId}`);
      user = await getUserById(userId, db);
      if (!user) {
        console.error(`[Webhook] ERROR: User not found for user_id ${userId} from metadata.`);
      } else {
        console.log(`[Webhook] Successfully found user ${user.email} by user_id ${userId}`);
      }
    } else {
      console.error(`[Webhook] ERROR: Invalid user_id in metadata: ${metadata.user_id}`);
    }
  }

  // Priority 2: Check for pending_signup_id (new user flow)
  if (!user && metadata.pending_signup_id) {
    console.log(`[Webhook] Found pending_signup_id in metadata: ${metadata.pending_signup_id}`);
    const pendingSignupId = metadata.pending_signup_id;
    
    // Check if pending signup was already completed
    const pendingRecord = await db.prepare(`
      SELECT id, status, user_id 
      FROM pending_signups 
      WHERE id = ? AND status = 'completed'
    `).bind(pendingSignupId).first();
    
    if (pendingRecord && pendingRecord.user_id) {
      console.log(`[Webhook] Pending signup ${pendingSignupId} already completed, user_id: ${pendingRecord.user_id}`);
      user = await getUserById(pendingRecord.user_id, db);
      if (!user) {
        console.error(`[Webhook] ERROR: User not found for completed pending signup user_id ${pendingRecord.user_id}`);
      }
    } else {
      console.log(`[Webhook] Pending signup ${pendingSignupId} not yet completed, webhook will be processed later`);
      return;
    }
  }

  // Priority 3: Fallback - lookup user by Stripe customer ID
  if (!user && subscription.customer) {
    console.log(`[Webhook] Falling back to customer ID lookup: ${subscription.customer}`);
    user = await getUserByStripeCustomerId(subscription.customer, db);
    if (!user) {
      console.error(`[Webhook] ERROR: User not found for Stripe customer ${subscription.customer}`);
    } else {
      console.log(`[Webhook] Found user ${user.email} by Stripe customer ID`);
    }
  }

  // Critical failure if no user found
  if (!user) {
    console.error(`[Webhook] CRITICAL FAILURE: Could not identify a user for subscription ${subscription.id}. Metadata: ${JSON.stringify(metadata)}`);
    return;
  }

  console.log(`[Webhook] Identified user ${user.id} (${user.email}) for subscription ${subscription.id}`);

  const subscriptionData = {
    tier: subscription.status === 'trialing' ? 'trial' as const : 'pro' as const,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    trialExpiresAt: subscription.trial_end || null
  };

  try {
    await updateUserSubscriptionStatus(user.id, subscriptionData, db);
    console.log(`[Webhook] ✅ SUCCESS: User ${user.email} (ID: ${user.id}) tier updated to '${subscriptionData.tier}'`);
  } catch (dbError) {
    console.error(`[Webhook] CRITICAL DATABASE FAILURE: Failed to update user ${user.id}`, dbError);
  }
}

async function handleSubscriptionUpdated(subscription: any, db: any) {
  console.log(`[Webhook] Processing 'customer.subscription.updated': ${subscription.id}`);
  
  const metadata = subscription.metadata || {};
  let user = null;

  // --- Robust User Identification Logic ---
  // Priority 1: Check for user_id in subscription metadata (authenticated upgrade flow)
  if (metadata.user_id) {
    console.log(`[Webhook] Found user_id in metadata: ${metadata.user_id}`);
    // FIX: Explicitly parse the user_id from metadata string to a number
    const userId = parseInt(metadata.user_id, 10);
    if (!isNaN(userId)) {
      console.log(`[Webhook] Parsed user_id as number: ${userId}`);
      user = await getUserById(userId, db);
      if (!user) {
        console.error(`[Webhook] ERROR: User not found for user_id ${userId} from metadata.`);
      } else {
        console.log(`[Webhook] Successfully found user ${user.email} by user_id ${userId}`);
      }
    } else {
      console.error(`[Webhook] ERROR: Invalid user_id in metadata: ${metadata.user_id}`);
    }
  }

  // Priority 2: Check for pending_signup_id (new user flow)
  if (!user && metadata.pending_signup_id) {
    console.log(`[Webhook] Found pending_signup_id in metadata: ${metadata.pending_signup_id}`);
    const pendingSignupId = metadata.pending_signup_id;
    
    // Find the user by pending signup
    const pendingRecord = await db.prepare(`
      SELECT user_id 
      FROM pending_signups 
      WHERE id = ? AND status = 'completed' AND user_id IS NOT NULL
    `).bind(pendingSignupId).first();
    
    if (pendingRecord && pendingRecord.user_id) {
      console.log(`[Webhook] Found user_id ${pendingRecord.user_id} from pending signup`);
      user = await getUserById(pendingRecord.user_id, db);
      if (!user) {
        console.error(`[Webhook] ERROR: User not found for pending signup user_id ${pendingRecord.user_id}`);
      }
    } else {
      console.log(`[Webhook] Pending signup ${pendingSignupId} not found or not completed`);
    }
  }

  // Priority 3: Fallback - lookup user by Stripe customer ID
  if (!user && subscription.customer) {
    console.log(`[Webhook] Falling back to customer ID lookup: ${subscription.customer}`);
    user = await getUserByStripeCustomerId(subscription.customer, db);
    if (!user) {
      console.error(`[Webhook] ERROR: User not found for Stripe customer ${subscription.customer}`);
    } else {
      console.log(`[Webhook] Found user ${user.email} by Stripe customer ID`);
    }
  }

  // Critical failure if no user found
  if (!user) {
    console.error(`[Webhook] CRITICAL FAILURE: Could not identify a user for subscription ${subscription.id}. Metadata: ${JSON.stringify(metadata)}`);
    return;
  }

  console.log(`[Webhook] Identified user ${user.id} (${user.email}) for subscription ${subscription.id}`);

  // Determine tier based on subscription status
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

  try {
    await updateUserSubscriptionStatus(user.id, subscriptionData, db);
    console.log(`[Webhook] ✅ SUCCESS: User ${user.email} (ID: ${user.id}) subscription updated to ${tier} (${subscription.status})`);
  } catch (dbError) {
    console.error(`[Webhook] CRITICAL DATABASE FAILURE: Failed to update user ${user.id}`, dbError);
  }
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