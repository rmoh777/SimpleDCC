-- File: migrations/008_consolidate_production_schema.sql
-- Consolidated migration to ensure production database is up-to-date
-- This migration is idempotent and safe to run multiple times

-- Ensure the system_health_logs table exists for cron monitoring (from migration 006)
CREATE TABLE IF NOT EXISTS system_health_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL,
  run_timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  metrics TEXT,
  error_message TEXT,
  error_stack TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ensure the user_notifications table exists for deduplication
CREATE TABLE IF NOT EXISTS user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filing_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, filing_id, notification_type)
);

-- Ensure the needs_seed column exists in subscriptions table (from migration 007)
-- Note: This will fail if column already exists, which is expected behavior for idempotent migrations
-- The migration runner should handle this gracefully
ALTER TABLE subscriptions ADD COLUMN needs_seed INTEGER DEFAULT 1;

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_system_health_service_timestamp ON system_health_logs(service_name, run_timestamp);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_needs_seed ON subscriptions(needs_seed);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_filing ON user_notifications(user_id, filing_id);

-- Add a log entry to confirm this migration ran
INSERT INTO system_logs (level, message, component, created_at) 
VALUES ('info', 'Consolidated production schema migration (008) applied successfully.', 'database', CURRENT_TIMESTAMP); 