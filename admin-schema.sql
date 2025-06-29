-- Admin schema for SimpleDCC
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Insert default admin user
-- Password: admin123
-- Hash generated using bcryptjs with salt rounds 10 (verified working)
-- NOTE: When updating hash via command line, use SQL file execution instead of --command
-- to avoid truncation issues with special characters in bcrypt hashes
INSERT INTO admin_users (email, password_hash) VALUES (
  'admin@simpledcc.com',
  '$2b$10$fiUjzkr8yvXeHqDTX5bx..wJsJ8mvQ3enq1rG9XwZcX6o3QcaZgfa'
); 