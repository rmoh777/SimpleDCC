import Stripe from 'stripe';

// Initialize Stripe with environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Product and price IDs - these will be created in Stripe dashboard
  PRO_PRODUCT_ID: process.env.STRIPE_PRO_PRODUCT_ID || 'prod_pro_simpledcc',
  PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  
  // Webhook endpoint secret
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Success and cancel URLs
  SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || 'https://simpledcc.pages.dev/manage?success=true',
  CANCEL_URL: process.env.STRIPE_CANCEL_URL || 'https://simpledcc.pages.dev/pricing?canceled=true',
  
  // Local development URLs
  LOCAL_SUCCESS_URL: 'http://localhost:5175/manage?success=true',
  LOCAL_CANCEL_URL: 'http://localhost:5175/pricing?canceled=true',
};

// Utility function to get the appropriate success/cancel URLs based on environment
export function getStripeUrls(isLocal: boolean = false) {
  if (isLocal) {
    return {
      success_url: STRIPE_CONFIG.LOCAL_SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.LOCAL_CANCEL_URL,
    };
  }
  
  return {
    success_url: STRIPE_CONFIG.SUCCESS_URL,
    cancel_url: STRIPE_CONFIG.CANCEL_URL,
  };
}

// Validate Stripe configuration
export function validateStripeConfig(): boolean {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRO_PRODUCT_ID',
    'STRIPE_PRO_PRICE_ID',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing Stripe environment variables:', missingVars);
    return false;
  }
  
  return true;
} 