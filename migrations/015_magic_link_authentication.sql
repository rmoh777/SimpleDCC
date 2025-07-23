-- migrations/015_magic_link_authentication.sql
-- Add magic link authentication support to users table

-- Add magic link token and session management columns
ALTER TABLE users ADD COLUMN magic_token TEXT;
ALTER TABLE users ADD COLUMN magic_token_expires INTEGER;
ALTER TABLE users ADD COLUMN session_token TEXT;
ALTER TABLE users ADD COLUMN session_expires INTEGER;
ALTER TABLE users ADD COLUMN last_magic_link_sent INTEGER;
ALTER TABLE users ADD COLUMN magic_link_attempts INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_magic_token ON users(magic_token);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_last_magic_link ON users(last_magic_link_sent);

-- Log the migration completion
INSERT INTO system_logs (level, message, component, details, created_at)
VALUES (
  'info',
  'Magic link authentication migration completed',
  'database',
  json_object(
    'migration', '015_magic_link_authentication',
    'columns_added', json_array('magic_token', 'magic_token_expires', 'session_token', 'session_expires', 'last_magic_link_sent', 'magic_link_attempts'),
    'indexes_created', json_array('idx_users_magic_token', 'idx_users_session_token', 'idx_users_last_magic_link')
  ),
  unixepoch()
); 