-- Migration 013: Fix System Health Logs Schema
-- Add missing columns that cron worker expects

-- Add the missing columns that the cron worker is trying to use
ALTER TABLE system_health_logs ADD COLUMN service_name TEXT;
ALTER TABLE system_health_logs ADD COLUMN status TEXT;
ALTER TABLE system_health_logs ADD COLUMN run_timestamp INTEGER;
ALTER TABLE system_health_logs ADD COLUMN duration_ms INTEGER;
ALTER TABLE system_health_logs ADD COLUMN metrics TEXT;
ALTER TABLE system_health_logs ADD COLUMN error_message TEXT;
ALTER TABLE system_health_logs ADD COLUMN error_stack TEXT;

-- Create indexes for the new columns for performance
CREATE INDEX IF NOT EXISTS idx_system_health_logs_service_name ON system_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_run_timestamp ON system_health_logs(run_timestamp);

-- Log the migration completion
INSERT INTO system_logs (level, message, component, details, created_at)
VALUES ('info', 'Migration 013: Added missing columns to system_health_logs table', 'migration', 
        '{"columns_added": ["service_name", "status", "run_timestamp", "duration_ms", "metrics", "error_message", "error_stack"]}', 
        unixepoch()); 