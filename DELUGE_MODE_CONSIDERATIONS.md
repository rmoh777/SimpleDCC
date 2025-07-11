# Deluge Mode Considerations for SimpleDCC

## Overview
This document captures detailed considerations for implementing "Deluge Mode" - a system to handle dockets with unusually high filing activity (7+ new filings per hour).

## Current Cron Job Logic (As of July 2025)
- **Frequency**: Every hour at minute 0 (`0 * * * *`)
- **Process**: Fetches last 10 filings per docket, processes all through AI pipeline
- **Issue**: Processes 30 filings/hour to find 0 new (inefficient)
- **Seed Processing**: Currently disabled to prevent subrequest limit issues

## Proposed Smart Detection Strategy
### Phase 1: Peek Detection
1. Fetch latest 1-2 filings per docket
2. Check against filing fingerprint cache for instant deduplication
3. If new filings detected → proceed to Phase 2

### Phase 2: Targeted Fetch
1. Fetch latest 7 filings from same docket
2. If original 1-2 filings appear in the 7 → we have complete set
3. If all 7 are new → potential deluge situation

## Deluge Mode Specifications

### Trigger Conditions
- **Threshold**: 7+ new filings detected in single hourly check
- **Alternative thresholds considered**: 5-6 filings might also warrant special handling

### Deluge Mode Behavior
1. **Immediate Actions**:
   - Set `deluge_mode_until` timestamp in `active_dockets` table
   - Halt hourly processing for affected docket
   - Queue docket for off-peak batch processing

2. **Batch Processing Strategy**:
   - **Timing**: Off-peak hours (2 AM ET suggested)
   - **Batching**: Break large filing sets into manageable chunks (4 runs of 7 filings each)
   - **Resource Management**: Stay under 50 subrequest limit per batch
   - **Rate Limiting**: Extended delays between batches

3. **User Communication**:
   - **Notification Timing**: Evening digest (6-8 PM)
   - **Content**: Consolidated summary of all deluge day filings
   - **Format**: Special "high activity" email template

### Recovery and Reset Logic
1. **Daily Reset**: Deluge mode flag lifted at morning processing start
2. **Failure Handling**: Retry logic for failed batch processing
3. **Monitoring**: Track deluge frequency per docket for pattern analysis

## Technical Implementation Considerations

### Database Schema Changes
```sql
-- Add to active_dockets table
ALTER TABLE active_dockets ADD COLUMN deluge_mode_until INTEGER DEFAULT 0;
ALTER TABLE active_dockets ADD COLUMN deluge_count INTEGER DEFAULT 0;
```

### Filing Fingerprint Cache
```sql
CREATE TABLE filing_fingerprints (
  filing_id TEXT PRIMARY KEY,
  docket_number TEXT NOT NULL,
  date_added INTEGER DEFAULT (unixepoch()),
  INDEX(docket_number, date_added)
);
```

### Batch Processing Queue
```sql
CREATE TABLE deluge_processing_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  docket_number TEXT NOT NULL,
  filing_batch TEXT NOT NULL, -- JSON array of filing IDs
  status TEXT DEFAULT 'pending',
  scheduled_for INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

## Performance Benefits
- **Normal conditions**: 30 API calls/hour → 6-12 API calls/hour (60-80% reduction)
- **Deluge conditions**: Controlled batch processing prevents system overload
- **User experience**: Consistent service during high-activity periods

## Risks and Mitigation
1. **Complexity**: Additional state management and processing modes
2. **Timing dependencies**: Off-peak processing windows
3. **User expectations**: Delayed notifications during deluge periods

## Integration with Current System
- **Cron worker**: Add deluge detection logic to existing pipeline
- **Email templates**: Create special high-activity digest templates
- **Admin interface**: Monitor deluge events and processing status
- **Database**: Extend existing schema with deluge tracking

## Future Enhancements
- **Adaptive thresholds**: Learn optimal deluge triggers per docket
- **Predictive scheduling**: Anticipate high-activity periods
- **User preferences**: Allow users to opt for immediate vs. batched notifications

## Status
**DEFERRED**: Not included in initial launch. Implement after core system stabilization.

---
*Document created: July 2025*
*Last updated: July 2025* 