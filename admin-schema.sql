-- Admin extension to existing SimpleDCC database
-- Run this AFTER your existing schema is already deployed

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- System logs for monitoring  
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  details TEXT, -- JSON details
  component TEXT, -- which part of system logged this
  created_at INTEGER DEFAULT (unixepoch())
);

-- Insert default admin user (password: 'admin123') - only if not exists
INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES 
('admin@simpledcc.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.j1Ug/TpLd9OhKYOELbHHQhkOqU9E3.'); 