-- Admin schema for SimpleDCC
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Insert default admin user
-- Password: admin123
-- Hash generated using bcryptjs with salt rounds 10
INSERT INTO admin_users (email, password_hash) VALUES (
  'admin@simpledcc.com',
  '$2a$10$CwTycUXWue0Thq9StjUM0uOLlK1rjMfJr5cMqj6JMeKzqFRKpjsH6'
); 