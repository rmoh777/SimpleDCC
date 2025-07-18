-- migrations/014_stripe_subscription_columns.sql
-- Add missing Stripe subscription tracking columns to users table

-- Add Stripe subscription ID column
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;

-- Add subscription status column  
ALTER TABLE users ADD COLUMN subscription_status TEXT;

-- Create index for efficient Stripe subscription lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Log successful migration
INSERT INTO system_logs (level, message, component, details, created_at)
VALUES (
  'info',
  'Stripe subscription columns migration completed',
  'database',
  json_object(
    'migration', '014_stripe_subscription_columns',
    'columns_added', json_array('stripe_subscription_id', 'subscription_status'),
    'indexes_created', json_array('idx_users_stripe_subscription', 'idx_users_subscription_status')
  ),
  unixepoch()
); 