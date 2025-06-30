-- System logs schema for SimpleDCC
-- This table was missing from production database causing admin dashboard API failures
-- Created via: wrangler d1 execute simple-docketcc-db --remote --command "..."

CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  details TEXT,
  component TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Sample data for testing
INSERT INTO system_logs (level, message, component) VALUES 
('info', 'System logs table created', 'database-setup'),
('info', 'Admin dashboard APIs now functional', 'admin-api'); 