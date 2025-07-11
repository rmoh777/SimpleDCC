-- Migration 011: Initialize Smart Detection System
-- Populate latest_filing_id for existing active dockets so smart detection works immediately

-- Update latest_filing_id with the most recent filing for each docket
UPDATE active_dockets 
SET latest_filing_id = (
  SELECT f.id 
  FROM filings f 
  WHERE f.docket_number = active_dockets.docket_number 
  ORDER BY f.date_received DESC, f.created_at DESC 
  LIMIT 1
)
WHERE latest_filing_id IS NULL;

-- Log the initialization
INSERT INTO system_logs (level, message, component, details, created_at) 
VALUES (
  'info', 
  'Smart detection system initialized with existing filing data', 
  'database', 
  json_object(
    'migration', '011_initialize_smart_detection',
    'dockets_updated', (SELECT COUNT(*) FROM active_dockets WHERE latest_filing_id IS NOT NULL)
  ),
  unixepoch()
);

-- Show results for verification
SELECT 
  docket_number, 
  latest_filing_id, 
  deluge_mode,
  (SELECT COUNT(*) FROM filings WHERE docket_number = active_dockets.docket_number) as total_filings
FROM active_dockets 
ORDER BY docket_number; 