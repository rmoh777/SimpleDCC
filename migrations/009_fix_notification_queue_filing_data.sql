-- Fix for seed processing: Add missing filing_data column
-- This column is used by processSeedSubscriptions to store filing data JSON
-- The table currently only has filing_ids which stores an array of IDs

ALTER TABLE notification_queue ADD COLUMN filing_data TEXT;

-- Update existing rows to have empty filing_data if needed
UPDATE notification_queue SET filing_data = '{}' WHERE filing_data IS NULL; 