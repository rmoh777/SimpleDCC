import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
// This runs on the server-side only
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export default stripe; 