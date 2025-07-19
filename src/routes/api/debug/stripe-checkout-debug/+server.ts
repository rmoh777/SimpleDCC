import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
  const debug = {
    platform_available: !!platform,
    env_available: !!platform?.env,
    db_available: !!platform?.env?.DB,
    environment_variables: {
      stripe_secret_key: !!process.env.STRIPE_SECRET_KEY,
      stripe_pro_price_id: !!process.env.STRIPE_PRO_PRICE_ID,
      public_origin: process.env.PUBLIC_ORIGIN || 'not set',
    }
  };

  // Test Stripe initialization
  let stripe_init_error = null;
  try {
    const getStripe = (await import('$lib/stripe/stripe')).default;
    const stripe = getStripe();
    debug.stripe_init_success = true;
  } catch (error) {
    stripe_init_error = error instanceof Error ? error.message : 'Unknown Stripe error';
    debug.stripe_init_success = false;
    debug.stripe_init_error = stripe_init_error;
  }

  // Test database connection
  let db_test_error = null;
  try {
    if (platform?.env?.DB) {
      const result = await platform.env.DB.prepare('SELECT 1 as test').first();
      debug.db_connection_success = !!result;
    } else {
      debug.db_connection_success = false;
      db_test_error = 'DB not available from platform.env';
    }
  } catch (error) {
    db_test_error = error instanceof Error ? error.message : 'Unknown DB error';
    debug.db_connection_success = false;
    debug.db_test_error = db_test_error;
  }

  return json({
    debug,
    timestamp: new Date().toISOString(),
    ready_for_checkout: debug.stripe_init_success && debug.db_connection_success && 
                       debug.environment_variables.stripe_secret_key && 
                       debug.environment_variables.stripe_pro_price_id
  });
};

export const POST: RequestHandler = async ({ request, platform }) => {
  const debug = {
    request_received: true,
    platform_available: !!platform,
    env_available: !!platform?.env,
    db_available: !!platform?.env?.DB,
  };

  try {
    const { email } = await request.json();
    debug.email_received = !!email;
    debug.email_value = email || 'none';

    if (!platform?.env?.DB) {
      return json({ 
        error: 'Database not available',
        debug 
      }, { status: 500 });
    }

    const db = platform.env.DB;

    // Test environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRO_PRICE_ID;

    debug.stripe_secret_available = !!stripeSecretKey;
    debug.stripe_price_id_available = !!stripePriceId;
    debug.stripe_price_id_value = stripePriceId || 'not set';

    if (!stripeSecretKey) {
      return json({
        error: 'STRIPE_SECRET_KEY not available',
        debug
      }, { status: 500 });
    }

    if (!stripePriceId) {
      return json({
        error: 'STRIPE_PRO_PRICE_ID not available',
        debug
      }, { status: 500 });
    }

    // Test Stripe initialization
    let stripe;
    try {
      const getStripe = (await import('$lib/stripe/stripe')).default;
      stripe = getStripe();
      debug.stripe_init_success = true;
    } catch (error) {
      debug.stripe_init_error = error instanceof Error ? error.message : 'Unknown error';
      return json({
        error: 'Stripe initialization failed',
        debug
      }, { status: 500 });
    }

    // Test basic Stripe API call
    try {
      const customer = await stripe.customers.create({
        email: 'test@example.com'
      });
      debug.stripe_api_test_success = true;
      debug.test_customer_id = customer.id;
      
      // Clean up test customer
      await stripe.customers.del(customer.id);
    } catch (error) {
      debug.stripe_api_error = error instanceof Error ? error.message : 'Unknown API error';
      return json({
        error: 'Stripe API test failed',
        debug
      }, { status: 500 });
    }

    return json({
      success: true,
      message: 'All checks passed',
      debug
    });

  } catch (error) {
    debug.catch_error = error instanceof Error ? error.message : 'Unknown error';
    return json({
      error: 'Debug endpoint error',
      debug
    }, { status: 500 });
  }
}; 