import Stripe from 'stripe';

// Lazy initialization to prevent build-time errors
let stripeInstance: Stripe | null = null;

/**
 * Get Stripe instance (lazy-loaded)
 * Initializes only when first called to prevent build-time env var issues
 */
function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required but not found in environment variables');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
  }
  
  return stripeInstance;
}

export default getStripe; 