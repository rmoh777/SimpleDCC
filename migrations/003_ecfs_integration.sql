-- ECFS Integration Database Migration
-- Adds tables for filing storage, AI processing, and system monitoring

-- Filing storage and tracking
CREATE TABLE filings (
  id TEXT PRIMARY KEY,           -- FCC filing ID (e.g., "2025010112345")
  docket_number TEXT NOT NULL,   -- Format: "XX-XXX" (e.g., "23-108")
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  filing_type TEXT NOT NULL,     -- "comment", "reply", "ex_parte", etc.
  date_received TEXT NOT NULL,   -- ISO date string from FCC
  filing_url TEXT NOT NULL,      -- FCC ECFS URL
  documents TEXT,                -- JSON array of document metadata
  raw_data TEXT,                 -- Full JSON response from FCC API
  ai_summary TEXT,               -- Generated AI summary
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at INTEGER DEFAULT (unixepoch()),
  processed_at INTEGER
);

-- Docket monitoring optimization
CREATE TABLE active_dockets (
  docket_number TEXT PRIMARY KEY,  -- Format: "XX-XXX"
  last_checked INTEGER DEFAULT 0,  -- Unix timestamp of last ECFS check
  total_filings INTEGER DEFAULT 0, -- Total filings found for this docket
  subscribers_count INTEGER DEFAULT 0, -- Number of active subscribers
  status TEXT DEFAULT 'active',    -- 'active', 'paused', 'error'
  error_count INTEGER DEFAULT 0,   -- Consecutive error count
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Enhanced system logging for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,           -- 'info', 'warning', 'error', 'debug'
  message TEXT NOT NULL,
  component TEXT NOT NULL,       -- 'ecfs', 'ai', 'email', 'cron'
  details TEXT,                  -- JSON with additional context
  docket_number TEXT,            -- Optional docket context
  filing_id TEXT,                -- Optional filing context
  created_at INTEGER DEFAULT (unixepoch())
);

-- Notification tracking
CREATE TABLE notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  filing_ids TEXT NOT NULL,      -- JSON array of filing IDs
  digest_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'immediate'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for INTEGER NOT NULL, -- Unix timestamp
  sent_at INTEGER,
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Add frequency column to existing subscriptions table
ALTER TABLE subscriptions ADD COLUMN frequency TEXT DEFAULT 'daily';
ALTER TABLE subscriptions ADD COLUMN last_notified INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_filings_docket_date ON filings(docket_number, date_received);
CREATE INDEX idx_filings_status ON filings(status);
CREATE INDEX idx_filings_created_at ON filings(created_at);
CREATE INDEX idx_active_dockets_last_checked ON active_dockets(last_checked);
CREATE INDEX idx_active_dockets_status ON active_dockets(status);
CREATE INDEX idx_system_logs_component_level ON system_logs(component, level, created_at);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX idx_notification_queue_user_email ON notification_queue(user_email);

-- Populate active_dockets table from existing subscriptions
INSERT OR IGNORE INTO active_dockets (docket_number, subscribers_count, created_at, updated_at)
SELECT 
  docket_number, 
  COUNT(*) as count,
  unixepoch() as created_at,
  unixepoch() as updated_at
FROM subscriptions 
GROUP BY docket_number; 