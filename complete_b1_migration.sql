-- migrations/003_ecfs_integration.sql
-- Complete B1 ECFS Integration Schema
-- This recreates what should have been in your B1 migration

-- Active dockets tracking
CREATE TABLE IF NOT EXISTS active_dockets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  docket_number TEXT NOT NULL UNIQUE,
  title TEXT,
  bureau TEXT,
  status TEXT DEFAULT 'active', -- active, paused, error
  last_checked INTEGER DEFAULT 0,
  total_filings INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Individual filings storage
CREATE TABLE IF NOT EXISTS filings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  docket_number TEXT NOT NULL,
  filing_id TEXT NOT NULL,
  title TEXT,
  filer_name TEXT,
  filing_type TEXT,
  date_received INTEGER,
  date_posted INTEGER,
  status TEXT DEFAULT 'pending', -- pending, processed, notified, error
  ai_summary TEXT,
  processed_at INTEGER,
  notified_at INTEGER,
  raw_data TEXT, -- JSON blob of original ECFS data
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(docket_number, filing_id)
);

-- System logs for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL, -- info, warning, error
  message TEXT NOT NULL,
  component TEXT NOT NULL, -- ecfs, ai, email, admin
  details TEXT, -- JSON blob for structured data
  docket_number TEXT,
  filing_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Email notification tracking
CREATE TABLE IF NOT EXISTS email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  filing_id INTEGER NOT NULL,
  email_sent_at INTEGER,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (filing_id) REFERENCES filings(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_filings_docket ON filings(docket_number);
CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
CREATE INDEX IF NOT EXISTS idx_filings_date_received ON filings(date_received);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_active_dockets_status ON active_dockets(status);

-- Insert some initial data for testing
INSERT OR IGNORE INTO active_dockets (docket_number, title, bureau, last_checked) VALUES 
('23-108', 'Open Internet Rules', 'WCB', unixepoch()),
('21-450', 'Consumer Broadband Labels', 'WCB', unixepoch()),
('18-122', 'Restoring Internet Freedom', 'WCB', unixepoch());

-- Insert some sample system logs
INSERT OR IGNORE INTO system_logs (level, message, component, created_at) VALUES 
('info', 'System initialized', 'admin', unixepoch()),
('info', 'ECFS client configured', 'ecfs', unixepoch()),
('info', 'Database migration completed', 'admin', unixepoch());