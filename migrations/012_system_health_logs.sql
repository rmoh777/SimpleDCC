-- Migration 012: System Health Logs Table
-- Fix missing system_health_logs table error

-- Create system_health_logs table
CREATE TABLE IF NOT EXISTS system_health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    details TEXT,
    docket_number TEXT,
    filing_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_logs_timestamp ON system_health_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_level ON system_health_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_category ON system_health_logs(category);

-- Verify the migration
SELECT name FROM sqlite_master WHERE type='table' AND name='system_health_logs'; 