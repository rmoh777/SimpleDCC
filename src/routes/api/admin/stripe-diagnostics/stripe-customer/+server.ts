import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { email, adminSecret } = await request.json();
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    const stripe = new Stripe(platform.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    
    // Test customer creation
    const customer = await stripe.customers.create({
      email: email,
      metadata: { 
        source: 'stripe_diagnostics_test',
        test_timestamp: new Date().toISOString()
      },
    });

    // Test customer retrieval
    const retrievedCustomer = await stripe.customers.retrieve(customer.id);

    // Test customer update
    const updatedCustomer = await stripe.customers.update(customer.id, {
      metadata: { 
        ...customer.metadata,
        test_updated: 'true'
      }
    });

    // Clean up test customer
    await stripe.customers.del(customer.id);

    return json({
      success: true,
      customer_operations: {
        creation: {
          success: true,
          customer_id: customer.id,
          email: customer.email,
          created: customer.created
        },
        retrieval: {
          success: true,
          matches_created: retrievedCustomer.id === customer.id,
          email_matches: retrievedCustomer.email === customer.email
        },
        update: {
          success: true,
          metadata_updated: !!updatedCustomer.metadata?.test_updated
        },
        deletion: {
          success: true,
          message: 'Test customer cleaned up successfully'
        }
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'Stripe customer operations failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as any)?.type,
      error_code: (error as any)?.code
    }, { status: 500 });
  }
}; 
