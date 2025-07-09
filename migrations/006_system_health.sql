-- migrations/006_system_health.sql
-- System Health Monitoring Table
-- This table captures cron worker execution status and error details
-- to provide visibility into previously "black box" failures

CREATE TABLE system_health_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL, -- e.g., 'cron-worker'
  status TEXT NOT NULL, -- 'SUCCESS' or 'FAILURE'
  run_timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  metrics TEXT, -- JSON blob for extra data like { "filings_processed": 5 }
  error_message TEXT,
  error_stack TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying by service and timestamp
CREATE INDEX idx_system_health_service_timestamp ON system_health_logs(service_name, run_timestamp);

-- Index for status-based queries (finding failures)
CREATE INDEX idx_system_health_status ON system_health_logs(status, run_timestamp); 