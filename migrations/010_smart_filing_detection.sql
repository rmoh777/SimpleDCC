-- Migration 010: Smart Filing Detection Schema
-- Add tracking columns to active_dockets table for intelligent filing detection

-- Add new columns for smart filing detection
ALTER TABLE active_dockets ADD COLUMN latest_filing_id TEXT;
ALTER TABLE active_dockets ADD COLUMN deluge_mode INTEGER DEFAULT 0;
ALTER TABLE active_dockets ADD COLUMN deluge_date TEXT;

-- Create index for performance on latest_filing_id lookups
CREATE INDEX IF NOT EXISTS idx_active_dockets_latest_filing_id ON active_dockets(latest_filing_id);

-- Create index for deluge mode queries
CREATE INDEX IF NOT EXISTS idx_active_dockets_deluge_mode ON active_dockets(deluge_mode);

-- Add comments for documentation
PRAGMA table_info(active_dockets);

-- Verify the migration
SELECT name FROM sqlite_master WHERE type='table' AND name='active_dockets'; 