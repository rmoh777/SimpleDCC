import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const envCheck = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set (starts with: ' + process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...)' : 'NOT SET',
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? 'Set (starts with: ' + process.env.STRIPE_PRO_PRICE_ID.substring(0, 8) + '...)' : 'NOT SET',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Set (starts with: ' + process.env.STRIPE_WEBHOOK_SECRET.substring(0, 8) + '...)' : 'NOT SET',
    VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set (starts with: ' + process.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + '...)' : 'NOT SET'
  };

  return json(envCheck);
}; 