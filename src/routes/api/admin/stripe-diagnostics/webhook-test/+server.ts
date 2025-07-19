import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { adminSecret } = await request.json();
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const publicOrigin = process.env.PUBLIC_ORIGIN;
    
    // Test webhook endpoint accessibility
    const webhookUrl = `${publicOrigin || 'https://your-domain.com'}/api/stripe/webhook`;
    
    let webhookAccessible = false;
    let webhookResponse = null;
    
    try {
      // Try to access the webhook endpoint with a GET request
      const response = await fetch(webhookUrl, { method: 'GET' });
      webhookAccessible = true;
      webhookResponse = {
        status: response.status,
        accessible: true,
        expected_method: 'POST (GET should return method not allowed)'
      };
    } catch (error) {
      webhookResponse = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return json({
      success: true,
      webhook_test: {
        webhook_secret_configured: !!webhookSecret,
        webhook_secret_format: webhookSecret?.startsWith('whsec_') ? 'valid' : 'invalid',
        webhook_url: webhookUrl,
        webhook_accessibility: webhookResponse,
        public_origin_configured: !!publicOrigin,
        
        configuration_check: {
          has_webhook_secret: !!webhookSecret,
          has_public_origin: !!publicOrigin,
          webhook_url_format: webhookUrl.startsWith('https://') ? 'secure' : 'insecure',
          ready_for_webhooks: !!webhookSecret && !!publicOrigin
        },
        
        recommendations: [
          ...(webhookSecret ? [] : ['Configure STRIPE_WEBHOOK_SECRET in environment variables']),
          ...(publicOrigin ? [] : ['Configure PUBLIC_ORIGIN in environment variables']),
          'Test webhook endpoint with Stripe CLI: stripe listen --forward-to ' + webhookUrl,
          'Verify webhook endpoint is publicly accessible',
          'Check Stripe dashboard webhook configuration'
        ]
      }
    });

  } catch (error) {
    return json({
      success: false,
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 