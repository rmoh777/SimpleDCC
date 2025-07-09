-- Migration 007: Add seed flag for welcome experience
-- This column tracks which subscriptions need the initial "seed" digest email

ALTER TABLE subscriptions ADD COLUMN needs_seed INTEGER DEFAULT 1;

-- Update existing subscriptions to need seeding (since they didn't get the welcome experience)
UPDATE subscriptions SET needs_seed = 1 WHERE needs_seed IS NULL;

-- Add index for efficient seeding queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_needs_seed ON subscriptions(needs_seed) WHERE needs_seed = 1; 