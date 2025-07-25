import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { adminSecret } = await request.json();
    
    // Basic admin auth check (you can implement your own admin secret validation)
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    const envCheck = {
      platform_available: !!platform,
      env_available: !!platform?.env,
      db_available: !!platform?.env?.DB,
      
      environment_variables: {
        STRIPE_SECRET_KEY: {
          exists: !!platform.env.STRIPE_SECRET_KEY,
          starts_with: platform.env.STRIPE_SECRET_KEY ? platform.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'NOT SET',
          is_test_key: platform.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
          is_live_key: platform.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') || false
        },
        
        STRIPE_PRO_PRICE_ID: {
          exists: !!platform.env.STRIPE_PRO_PRICE_ID,
          starts_with: platform.env.STRIPE_PRO_PRICE_ID ? platform.env.STRIPE_PRO_PRICE_ID.substring(0, 8) + '...' : 'NOT SET',
          is_test_price: platform.env.STRIPE_PRO_PRICE_ID?.startsWith('price_') || false
        },
        
        STRIPE_WEBHOOK_SECRET: {
          exists: !!platform.env.STRIPE_WEBHOOK_SECRET,
          starts_with: platform.env.STRIPE_WEBHOOK_SECRET ? platform.env.STRIPE_WEBHOOK_SECRET.substring(0, 8) + '...' : 'NOT SET',
          is_webhook_secret: platform.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') || false
        },
        
        VITE_STRIPE_PUBLISHABLE_KEY: {
          exists: !!platform.env.VITE_STRIPE_PUBLISHABLE_KEY,
          starts_with: platform.env.VITE_STRIPE_PUBLISHABLE_KEY ? platform.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + '...' : 'NOT SET',
          is_test_key: platform.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
          is_live_key: platform.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') || false
        },
        
        PUBLIC_ORIGIN: {
          exists: !!platform.env.PUBLIC_ORIGIN,
          value: platform.env.PUBLIC_ORIGIN || 'NOT SET'
        }
      }
    };

    // Validate critical environment variables
    const missingVariables = [];
    if (!platform.env.STRIPE_SECRET_KEY) missingVariables.push('STRIPE_SECRET_KEY');
    if (!platform.env.STRIPE_PRO_PRICE_ID) missingVariables.push('STRIPE_PRO_PRICE_ID');
    if (!platform.env.STRIPE_WEBHOOK_SECRET) missingVariables.push('STRIPE_WEBHOOK_SECRET');
    if (!platform.env.VITE_STRIPE_PUBLISHABLE_KEY) missingVariables.push('VITE_STRIPE_PUBLISHABLE_KEY');

    const keyMismatchWarnings = [];
    if (platform.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') && 
        platform.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
      keyMismatchWarnings.push('Secret key is TEST but publishable key is LIVE');
    }
    if (platform.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && 
        platform.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
      keyMismatchWarnings.push('Secret key is LIVE but publishable key is TEST');
    }

    return json({
      success: true,
      environment_check: envCheck,
      validation: {
        missing_variables: missingVariables,
        key_mismatch_warnings: keyMismatchWarnings,
        ready_for_stripe: missingVariables.length === 0,
        key_types_match: keyMismatchWarnings.length === 0
      },
      recommendations: missingVariables.length > 0 ? [
        'Add missing environment variables to Cloudflare Pages settings',
        'Ensure all Stripe keys are from the same environment (test or live)',
        'Verify webhook secret matches your Stripe dashboard configuration'
      ] : [
        'All environment variables are properly configured',
        'Proceed to next diagnostic step'
      ]
    });

  } catch (error) {
    console.error('Environment check failed:', error);
    return json({
      success: false,
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
