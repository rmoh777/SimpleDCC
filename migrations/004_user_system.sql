-- migrations/004_user_system.sql
-- Phase 2 Card 1: User Accounts + Notification Queue Processing
-- Production-safe migration that preserves existing data and maintains backward compatibility

-- Add user accounts table to existing schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'trial'
  trial_expires_at INTEGER, -- UTC timestamp for trial users
  stripe_customer_id TEXT, -- For Phase 2.5 Stripe integration
  grace_period_until INTEGER, -- For Phase 2.5 payment grace period
  created_at INTEGER DEFAULT (unixepoch())
);

-- Link existing subscriptions to users (NON-DESTRUCTIVE: keeps email column)
ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id);

-- User notification tracking for per-user deduplication
CREATE TABLE user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filing_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'daily', 'weekly', 'immediate'
  sent_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, filing_id, notification_type)
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(user_tier);
CREATE INDEX idx_users_trial_expires ON users(trial_expires_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_user_notifications_user_filing ON user_notifications(user_id, filing_id);

-- Ensure frequency column has proper defaults (backward compatibility)
UPDATE subscriptions SET frequency = 'daily' WHERE frequency IS NULL;

-- DATA MIGRATION: Create users from existing email subscriptions
INSERT INTO users (email, user_tier, created_at)
SELECT DISTINCT email, 'free', MIN(created_at)
FROM subscriptions
GROUP BY email;

-- Link existing subscriptions to users
UPDATE subscriptions 
SET user_id = (
  SELECT id FROM users WHERE users.email = subscriptions.email
)
WHERE user_id IS NULL;

-- Mark existing notifications to prevent duplicate emails during migration
-- This prevents spam during the transition period
INSERT INTO user_notifications (user_id, filing_id, notification_type, sent_at)
SELECT DISTINCT s.user_id, f.id, s.frequency, COALESCE(s.last_notified, s.created_at)
FROM subscriptions s
JOIN filings f ON f.docket_number = s.docket_number
WHERE s.user_id IS NOT NULL 
  AND s.last_notified > 0
  AND f.created_at <= s.last_notified;

-- Notification_queue table already has proper structure from migration 003
-- Just ensure indexes exist for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_email ON notification_queue(user_email);

-- Add logging for successful migration
INSERT INTO system_logs (level, message, component, details, created_at)
VALUES (
  'info',
  'Phase 2 Card 1 migration completed successfully',
  'database',
  json_object(
    'migration', '004_user_system',
    'users_created', (SELECT COUNT(*) FROM users),
    'subscriptions_linked', (SELECT COUNT(*) FROM subscriptions WHERE user_id IS NOT NULL),
    'notifications_marked', (SELECT COUNT(*) FROM user_notifications)
  ),
  unixepoch()
); 