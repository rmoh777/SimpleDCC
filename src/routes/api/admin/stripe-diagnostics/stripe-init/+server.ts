import type { RequestHandler } from './';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { adminSecret } = await request.json();
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    // Get Stripe secret key from platform.env (Cloudflare Pages environment)
    const secretKey = platform.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      return json({
        success: false,
        error: 'STRIPE_SECRET_KEY not found in environment variables'
      }, { status: 500 });
    }

    // Initialize Stripe with platform environment variables
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
    
    // Test basic Stripe API connectivity
    const account = await stripe.accounts.retrieve();
    
    // Test if we can list a few customers (basic API test)
    const customers = await stripe.customers.list({ limit: 1 });

    return json({
      success: true,
      stripe_initialization: {
        sdk_loaded: true,
        api_version: stripe.getApiField('version'),
        account_id: account.id,
        account_type: account.type,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled
      },
      api_connectivity: {
        customers_accessible: true,
        customer_count_sample: customers.data.length
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'Stripe initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as any)?.type,
      error_code: (error as any)?.code
    }, { status: 500 });
  }
};
