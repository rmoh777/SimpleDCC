-- Simple DocketCC Database Schema
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(email, docket_number)
);

-- Test the schema works
INSERT INTO subscriptions (email, docket_number) VALUES ('test@example.com', '23-108');
SELECT COUNT(*) as test_count FROM subscriptions; 