import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import getStripe from '$lib/stripe/stripe';
import { createOrGetUser, getUserByEmail, updateUserStripeCustomerId } from '$lib/users/user-operations';

export const POST: RequestHandler = async ({ request, platform }) => {
  const testLog = [];
  let currentStep = '';
  
  function logStep(step: string, data?: any) {
    currentStep = step;
    testLog.push({
      step,
      timestamp: new Date().toISOString(),
      data: data || 'Step started'
    });
    console.log(`[Stripe Checkout Test] ${step}`, data || '');
  }

  try {
    const { email, adminSecret } = await request.json();
    
    logStep('Request received', { email, hasAdminSecret: !!adminSecret });

    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    if (!email) {
      return json({ error: 'Email is required for checkout session test' }, { status: 400 });
    }

    // Step 1: Check platform and database
    logStep('Platform and database check');
    if (!platform?.env?.DB) {
      logStep('Database check failed', 'Database not available');
      return json({ 
        error: 'Database not available',
        test_log: testLog 
      }, { status: 500 });
    }
    logStep('Platform and database check passed', { platformAvailable: true, dbAvailable: true });

    const db = platform.env.DB;

    // Step 2: Environment variables validation
    logStep('Environment variables validation');
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRO_PRICE_ID;
    const publicOrigin = process.env.PUBLIC_ORIGIN;

    const envValidation = {
      STRIPE_SECRET_KEY: !!stripeSecretKey,
      STRIPE_PRO_PRICE_ID: !!stripePriceId,
      PUBLIC_ORIGIN: !!publicOrigin,
      secret_key_type: stripeSecretKey?.startsWith('sk_test_') ? 'test' : 
                      stripeSecretKey?.startsWith('sk_live_') ? 'live' : 'unknown',
      price_id_format: stripePriceId?.startsWith('price_') ? 'valid' : 'invalid'
    };

    logStep('Environment variables checked', envValidation);

    if (!stripeSecretKey) {
      return json({
        error: 'STRIPE_SECRET_KEY not found in environment',
        test_log: testLog,
        env_validation: envValidation
      }, { status: 500 });
    }

    if (!stripePriceId) {
      return json({
        error: 'STRIPE_PRO_PRICE_ID not found in environment',
        test_log: testLog,
        env_validation: envValidation
      }, { status: 500 });
    }

    // Step 3: User database operations
    logStep('User database operations - lookup');
    let user = await getUserByEmail(email, db);
    logStep('User lookup completed', { userExists: !!user, userId: user?.id });

    let stripeCustomerId: string | undefined;

    if (user) {
      logStep('Existing user found', { 
        userId: user.id, 
        userTier: user.user_tier,
        hasStripeCustomerId: !!user.stripe_customer_id 
      });
      
      if (user.user_tier === 'pro') {
        return json({
          error: 'User is already a Pro subscriber - cannot test checkout',
          test_log: testLog,
          user_info: { tier: user.user_tier, email: user.email }
        }, { status: 400 });
      }
      
      stripeCustomerId = user.stripe_customer_id;
    }

    // Step 4: Stripe SDK initialization
    logStep('Stripe SDK initialization');
    let stripe;
    try {
      stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
      logStep('Stripe SDK initialized successfully');
    } catch (error) {
      logStep('Stripe SDK initialization failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return json({
        error: 'Stripe SDK initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        test_log: testLog
      }, { status: 500 });
    }

    // Step 5: User creation if needed
    if (!user || !stripeCustomerId) {
      logStep('Creating or getting user');
      user = await createOrGetUser(email, db);
      logStep('User created/retrieved', { userId: user.id });

      if (!user.stripe_customer_id) {
        logStep('Creating Stripe customer');
        try {
          const customer = await stripe.customers.create({
            email: email,
            metadata: { 
              db_user_id: user.id,
              source: 'stripe_diagnostics_test'
            },
          });
          
          stripeCustomerId = customer.id;
          logStep('Stripe customer created', { customerId: stripeCustomerId });
          
          await updateUserStripeCustomerId(user.id, stripeCustomerId, db);
          logStep('User updated with Stripe customer ID');
          
        } catch (error) {
          logStep('Stripe customer creation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
          return json({
            error: 'Failed to create Stripe customer',
            details: error instanceof Error ? error.message : 'Unknown error',
            test_log: testLog
          }, { status: 500 });
        }
      } else {
        stripeCustomerId = user.stripe_customer_id;
        logStep('Using existing Stripe customer ID', { customerId: stripeCustomerId });
      }
    }

    // Step 6: Validate Stripe price
    logStep('Validating Stripe price ID');
    try {
      const price = await stripe.prices.retrieve(stripePriceId);
      logStep('Price validation successful', {
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring
      });
    } catch (error) {
      logStep('Price validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return json({
        error: 'Invalid Stripe price ID',
        details: error instanceof Error ? error.message : 'Unknown error',
        test_log: testLog
      }, { status: 500 });
    }

    // Step 7: Create checkout session
    logStep('Creating checkout session');
    const YOUR_DOMAIN = publicOrigin || 'http://localhost:5173';
    
    const sessionConfig = {
      customer: stripeCustomerId,
      mode: 'subscription' as const,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
      },
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session' as const
        }
      },
      customer_update: {
        name: 'auto' as const,
        address: 'auto' as const
      },
      success_url: `${YOUR_DOMAIN}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}&test=diagnostics`,
      cancel_url: `${YOUR_DOMAIN}/upgrade?canceled=true&test=diagnostics`,
    };

    logStep('Checkout session configuration prepared', sessionConfig);

    try {
      const session = await stripe.checkout.sessions.create(sessionConfig);
      
      logStep('Checkout session created successfully', {
        sessionId: session.id,
        url: session.url,
        customerId: session.customer,
        mode: session.mode,
        status: session.status
      });

      // Step 8: Cleanup test customer (optional, comment out if you want to keep for further testing)
      if (user && stripeCustomerId && email.includes('test')) {
        logStep('Cleaning up test customer');
        try {
          await stripe.customers.del(stripeCustomerId);
          logStep('Test customer cleaned up');
        } catch (cleanupError) {
          logStep('Cleanup warning', { message: 'Could not delete test customer', error: cleanupError });
        }
      }

      return json({
        success: true,
        message: 'Checkout session created successfully!',
        checkout_session: {
          id: session.id,
          url: session.url,
          customer_id: session.customer,
          mode: session.mode,
          status: session.status,
          payment_status: session.payment_status,
          subscription: session.subscription
        },
        test_details: {
          email,
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          price_id: stripePriceId,
          domain: YOUR_DOMAIN
        },
        test_log: testLog,
        next_steps: [
          'Checkout session creation successful',
          'In real usage, user would be redirected to session.url',
          'After payment, webhook would update user status',
          'Test completed - integration is working correctly'
        ]
      });

    } catch (sessionError) {
      logStep('Checkout session creation failed', { 
        error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        code: (sessionError as any)?.code,
        type: (sessionError as any)?.type
      });
      
      return json({
        error: 'Failed to create checkout session',
        details: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        stripe_error_code: (sessionError as any)?.code,
        stripe_error_type: (sessionError as any)?.type,
        test_log: testLog,
        troubleshooting: [
          'Check if Stripe keys are valid and active',
          'Verify price ID exists in your Stripe account',
          'Ensure customer ID is valid',
          'Check Stripe account permissions'
        ]
      }, { status: 500 });
    }

  } catch (error) {
    logStep('Critical error occurred', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return json({
      error: 'Critical error in checkout session test',
      details: error instanceof Error ? error.message : 'Unknown error',
      failed_at_step: currentStep,
      test_log: testLog
    }, { status: 500 });
  }
}; 
