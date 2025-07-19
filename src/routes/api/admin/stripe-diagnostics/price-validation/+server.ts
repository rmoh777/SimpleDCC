import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import getStripe from '$lib/stripe/stripe';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { adminSecret } = await request.json();
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    const stripePriceId = platform.env.STRIPE_PRO_PRICE_ID;
    
    if (!stripePriceId) {
      return json({
        success: false,
        error: 'STRIPE_PRO_PRICE_ID not configured',
        recommendations: ['Set STRIPE_PRO_PRICE_ID in environment variables']
      }, { status: 500 });
    }

    const stripe = getStripe();
    
    // Test price retrieval
    const price = await stripe.prices.retrieve(stripePriceId);
    
    // Test product retrieval
    const product = await stripe.products.retrieve(price.product as string);

    return json({
      success: true,
      price_validation: {
        price_id: price.id,
        price_details: {
          amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          active: price.active,
          created: price.created,
          type: price.type
        },
        product_details: {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          created: product.created
        },
        validation_checks: {
          is_subscription: price.type === 'recurring',
          is_active: price.active,
          has_recurring_data: !!price.recurring,
          product_is_active: product.active,
          currency_supported: ['usd', 'eur', 'gbp'].includes(price.currency),
          amount_reasonable: price.unit_amount && price.unit_amount > 0 && price.unit_amount < 10000
        }
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'Price validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      error_type: (error as any)?.type,
      error_code: (error as any)?.code,
      troubleshooting: [
        'Verify STRIPE_PRO_PRICE_ID exists in your Stripe account',
        'Check if price is active and properly configured',
        'Ensure you\'re using the correct Stripe account (test vs live)'
      ]
    }, { status: 500 });
  }
}; 
