# Smart Filing Detection Architecture

## Overview
This document outlines the architecture and implementation plan for transforming SimpleDCC's cron worker from an inefficient "always fetch 10 filings" approach to an intelligent two-phase detection system that dramatically reduces API calls while adding deluge protection.

## Current State Analysis

### Problems with Current System
- **Inefficient API Usage**: Fetches 30 filings/hour (10 per docket × 3 dockets) to find 0 new
- **100% Waste Rate**: Same filings processed every hour with 0 new results
- **No Overload Protection**: System vulnerable to high-activity dockets
- **Wrong Sort Field**: Uses `date_submission` instead of `date_disseminated`
- **No State Tracking**: No memory of what was previously processed

### Current Flow
```
Cron runs hourly → Fetch 10 filings per docket → Process 30 filings → 
Database deduplication → Result: "30 checked → 0 new" → 100% waste
```

## New Architecture: Smart Two-Phase Detection

### Core Concept
1. **Phase 1**: Quick ID check (1 API call per docket)
2. **Phase 2**: Targeted fetch only when new filings detected (7 filings max)
3. **Deluge Protection**: Automatic suspension when overwhelmed
4. **Clean Recovery**: Date-filtered resume after deluge

### New Flow
```
Cron runs hourly → Quick ID check per docket → 
If new: Fetch 7 recent → Process only new → 
If deluge: Suspend & notify → Resume next day with date filter
```

### Expected Performance
- **Normal hours**: 3 API calls (90% reduction)
- **Active hours**: 5-9 API calls (70-80% reduction)
- **Deluge hours**: 3 API calls + suspension (protection activated)

## Database Schema Changes

### New Columns in `active_dockets` Table
```sql
ALTER TABLE active_dockets ADD COLUMN latest_filing_id TEXT;
ALTER TABLE active_dockets ADD COLUMN deluge_mode INTEGER DEFAULT 0;
ALTER TABLE active_dockets ADD COLUMN deluge_date TEXT;
```

### Purpose
- `latest_filing_id`: Store last processed filing ID for instant comparison
- `deluge_mode`: Flag to indicate docket is in deluge state (0=normal, 1=deluged)
- `deluge_date`: Track which date deluge occurred for recovery logic

## API Architecture Changes

### FCC ECFS API Modifications
1. **Sort Field Change**: `date_submission,DESC` → `date_disseminated,DESC`
2. **New Quick Check**: `limit=1` for ID comparison
3. **Targeted Fetch**: `limit=7` when new filings detected
4. **Date Filtering**: `date_disseminated_min` for post-deluge recovery

### New API Functions
```javascript
// Quick check function
fetchSingleLatestFiling(docketNumber, env) → single filing object

// Enhanced existing function  
fetchLatestFilings(docketNumber, limit, env) → array of transformed filings
```

## Smart Detection Logic

### Phase 1: Quick ID Check
```javascript
1. Fetch latest filing ID from ECFS (1 API call)
2. Compare with stored latest_filing_id in database
3. If match: Skip processing (no new filings)
4. If different: Proceed to Phase 2
```

### Phase 2: Targeted Processing
```javascript
1. Fetch 7 recent filings from ECFS
2. Run through existing deduplication logic
3. If all 7 are new: Trigger deluge mode
4. If 1-6 are new: Process normally
5. Update stored latest_filing_id
```

### Deluge Mode Logic
```javascript
1. Mark docket as deluged in database
2. Send immediate notification to users with FCC link
3. Skip all processing for remainder of day
4. Resume next morning with date filter
```

## Integration Points & Dependencies

### Downstream Components (Unchanged)
- **Jina Document Processing**: Receives same filing objects
- **Gemini AI Analysis**: Gets same filing structure
- **Email Templates**: Same filing data format
- **Database Storage**: Identical filing schema
- **Notification Queue**: Same notification structure

### Modified Components
- **ECFS Client**: New functions + sort field change
- **Cron Pipeline**: Smart detection integration
- **Database Schema**: New tracking columns
- **Email System**: New deluge notification template

## Error Handling & Fallback

### Graceful Degradation
- If smart detection fails → Fall back to existing 10-filing logic
- If database columns missing → Skip smart features, use existing flow
- If ECFS API changes → Existing transformation logic still works

### Monitoring & Logging
- Track API call reduction metrics
- Log deluge events and recovery
- Monitor fallback usage
- Alert on repeated failures

---

# Implementation Cards

## Card 1: Database Schema Migration
**Duration**: 10 minutes  
**Priority**: High (Required for all other cards)

### Scope
Add new tracking columns to `active_dockets` table for smart detection.

### Tasks
1. Create migration SQL file
2. Add `latest_filing_id TEXT` column
3. Add `deluge_mode INTEGER DEFAULT 0` column  
4. Add `deluge_date TEXT` column
5. Test migration on development database
6. Apply to production database

### Acceptance Criteria
- [ ] New columns exist in `active_dockets` table
- [ ] Existing data preserved
- [ ] No breaking changes to existing queries
- [ ] Migration reversible if needed

### Files Modified
- `migrations/010_smart_filing_detection.sql` (new)

---

## Card 2: Enhanced ECFS Client Functions
**Duration**: 15 minutes  
**Priority**: High (Core functionality)

### Scope
Add new ECFS API functions and improve existing ones for smart detection.

### Tasks
1. Create `fetchSingleLatestFiling()` function for quick ID checks
2. Modify existing `fetchLatestFilings()` to use `date_disseminated` sort
3. Add error handling and fallback logic
4. Update function documentation
5. Test with real ECFS API calls

### Acceptance Criteria
- [ ] `fetchSingleLatestFiling()` returns single filing object
- [ ] Sort field changed to `date_disseminated,DESC`
- [ ] Existing functionality preserved
- [ ] Error handling includes graceful fallback
- [ ] API calls work with real FCC endpoints

### Files Modified
- `cron-worker/src/lib/fcc/ecfs-enhanced-client.js`

### Code Snippets
```javascript
// New function to add
export async function fetchSingleLatestFiling(docketNumber, env) {
  const url = `${ECFS_BASE_URL}?api_key=${env.ECFS_API_KEY}&proceedings.name=${docketNumber}&limit=1&sort=date_disseminated,DESC`;
  const response = await fetch(url);
  const data = await response.json();
  return data.filing[0];
}

// Modify existing function - change sort parameter
// FROM: &sort=date_submission,DESC
// TO:   &sort=date_disseminated,DESC
```

---

## Card 3: Smart Detection Core Logic
**Duration**: 20 minutes  
**Priority**: High (Core algorithm)

### Scope
Implement the two-phase smart detection algorithm with deluge protection.

### Tasks
1. Create `smartFilingDetection()` function
2. Implement Phase 1: Quick ID comparison logic
3. Implement Phase 2: Targeted fetch and deluge detection
4. Add database operations for tracking latest IDs
5. Add comprehensive error handling with fallback
6. Add detailed logging for monitoring

### Acceptance Criteria
- [ ] Quick ID check works (Phase 1)
- [ ] Targeted fetch triggers correctly (Phase 2)
- [ ] Deluge detection activates at 7+ new filings
- [ ] Database tracking updates correctly
- [ ] Fallback to existing logic on errors
- [ ] Comprehensive logging for debugging

### Files Modified
- `cron-worker/src/lib/fcc/ecfs-enhanced-client.js` (add new function)

### Code Snippets
```javascript
async function smartFilingDetection(docketNumber, env) {
  try {
    // Phase 1: Quick check
    const latestFiling = await fetchSingleLatestFiling(docketNumber, env);
    const storedData = await env.DB.prepare(`
      SELECT latest_filing_id, deluge_mode FROM active_dockets WHERE docket_number = ?
    `).bind(docketNumber).first();
    
    // Skip if in deluge mode or no new filings
    if (storedData?.deluge_mode === 1) return { status: 'deluge_active', newFilings: [] };
    if (latestFiling.id_submission === storedData?.latest_filing_id) return { status: 'no_new', newFilings: [] };
    
    // Phase 2: Targeted fetch
    const recentFilings = await fetchLatestFilings(docketNumber, 7, env);
    const newFilings = await identifyNewFilings(recentFilings, env.DB);
    
    // Deluge detection
    if (newFilings.length >= 7) {
      await markDocketAsDeluged(docketNumber, env);
      return { status: 'deluge', newFilings: [] };
    }
    
    // Update tracking
    await env.DB.prepare(`UPDATE active_dockets SET latest_filing_id = ? WHERE docket_number = ?`)
      .bind(latestFiling.id_submission, docketNumber).run();
    
    return { status: 'new_found', newFilings };
  } catch (error) {
    console.warn(`Smart detection failed for ${docketNumber}, using fallback`);
    const filings = await fetchLatestFilings(docketNumber, 10, env);
    return { status: 'fallback', newFilings: filings };
  }
}
```

---

## Card 4: Deluge Mode System
**Duration**: 15 minutes  
**Priority**: Medium (Protection feature)

### Scope
Implement deluge mode detection, user notification, and recovery system.

### Tasks
1. Create `markDocketAsDeluged()` function
2. Create `sendDelugeNotification()` email function
3. Create `liftDelugeFlags()` morning reset function
4. Add deluge notification email template
5. Test deluge workflow end-to-end

### Acceptance Criteria
- [ ] Dockets marked as deluged when 7+ new filings detected
- [ ] Users receive immediate notification with FCC link
- [ ] Deluge flags lifted each morning
- [ ] Email template professional and informative
- [ ] Database state management works correctly

### Files Modified
- `cron-worker/src/lib/fcc/ecfs-enhanced-client.js` (add deluge functions)
- `cron-worker/src/lib/email/daily-digest.js` (add deluge template)

### Code Snippets
```javascript
async function markDocketAsDeluged(docketNumber, env) {
  await env.DB.prepare(`
    UPDATE active_dockets SET deluge_mode = 1, deluge_date = ? WHERE docket_number = ?
  `).bind(new Date().toISOString().split('T')[0], docketNumber).run();
  
  const users = await env.DB.prepare(`
    SELECT DISTINCT u.email FROM subscriptions s 
    JOIN users u ON s.user_id = u.id WHERE s.docket_number = ?
  `).bind(docketNumber).all();
  
  for (const user of users.results || []) {
    await sendDelugeNotification(user.email, docketNumber, env);
  }
}

async function sendDelugeNotification(email, docketNumber, env) {
  const subject = `High Activity Alert - Docket ${docketNumber}`;
  const html = `
    <p>Due to unusually high filing activity, monitoring for docket ${docketNumber} has been temporarily paused.</p>
    <p><a href="https://www.fcc.gov/ecfs/search/search-filings/results?q=(proceedings.name:(%22${docketNumber}%22))">View filings directly on FCC website</a></p>
    <p>Normal monitoring will resume tomorrow.</p>
  `;
  await sendEmail(email, subject, html, html, env);
}

async function liftDelugeFlags(env) {
  await env.DB.prepare(`UPDATE active_dockets SET deluge_mode = 0 WHERE deluge_mode = 1`).run();
  console.log('🌅 Morning reset: All deluge flags lifted');
}
```

---

## Card 5: Cron Pipeline Integration
**Duration**: 15 minutes  
**Priority**: High (System integration)

### Scope
Integrate smart detection into the existing cron pipeline without breaking current functionality.

### Tasks
1. Modify `runDataPipeline()` to use smart detection
2. Add morning deluge flag reset to `scheduled()` function
3. Preserve existing rate limiting and logging
4. Maintain compatibility with manual triggers
5. Add performance metrics logging

### Acceptance Criteria
- [ ] Smart detection integrated into main pipeline
- [ ] Existing manual trigger functionality preserved
- [ ] Rate limiting between dockets maintained
- [ ] Comprehensive logging shows efficiency gains
- [ ] Fallback to existing logic on smart detection failure
- [ ] Morning reset runs before daily processing

### Files Modified
- `cron-worker/src/index.ts`

### Code Snippets
```javascript
// Add to scheduled() function at beginning
async scheduled(controller, env, ctx) {
  await liftDelugeFlags(env); // Reset deluge flags each morning
  // ... existing logic ...
}

// Modify runDataPipeline() main loop
for (const docket of testDockets) {
  const docketNumber = docket.docket_number;
  addLog('info', `🎯 Processing docket ${docketNumber}...`);
  
  // NEW: Use smart detection
  const smartResult = await smartFilingDetection(docketNumber, env);
  
  if (smartResult.status === 'no_new') {
    addLog('info', `✅ ${docketNumber}: No new filings`);
    continue; // HUGE efficiency gain!
  }
  
  if (smartResult.status === 'deluge_active' || smartResult.status === 'deluge') {
    addLog('info', `🚨 ${docketNumber}: Deluge mode - skipping`);
    continue;
  }
  
  // Process new filings (existing logic)
  allFilings.push(...smartResult.newFilings);
  
  // Existing rate limiting preserved
  if (testDockets.length > 1 && testDockets.indexOf(docket) < testDockets.length - 1) {
    addLog('info', '⏱️ Rate limiting: 5 second delay...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

---

## Card 6: Testing & Validation
**Duration**: 20 minutes  
**Priority**: High (Quality assurance)

### Scope
Comprehensive testing of the smart detection system and performance validation.

### Tasks
1. Test normal operation (no new filings)
2. Test new filing detection (1-6 new filings)
3. Test deluge mode activation (7+ new filings)
4. Test morning recovery after deluge
5. Test fallback behavior on errors
6. Validate API call reduction metrics
7. Test with real production dockets

### Acceptance Criteria
- [ ] Normal hours: 3 API calls instead of 30
- [ ] Active hours: Appropriate API calls for actual new filings
- [ ] Deluge mode: Proper suspension and user notification
- [ ] Recovery: Clean resume with date filtering
- [ ] Fallback: Graceful degradation on errors
- [ ] No breaking changes to existing functionality
- [ ] Performance metrics show expected improvements

### Files Modified
- `src/routes/admin/test-smart-detection/+page.svelte` (new test page)
- Update existing admin test pages to validate new behavior

### Test Scenarios
```javascript
// Test Case 1: No new filings (most common)
// Expected: 3 API calls, 0 filings processed

// Test Case 2: 2 new filings on one docket  
// Expected: 5 API calls, 2 filings processed

// Test Case 3: Deluge detection
// Expected: 5 API calls, deluge mode activated, users notified

// Test Case 4: Morning recovery
// Expected: Deluge flags lifted, date filtering applied
```

---

## Deployment Strategy

### Phase 1: Development Testing
1. Deploy to development environment
2. Run comprehensive tests
3. Validate API call reductions
4. Test deluge scenarios

### Phase 2: Production Deployment
1. Apply database migration
2. Deploy cron worker updates
3. Monitor first few hourly runs
4. Validate efficiency improvements

### Phase 3: Monitoring & Optimization
1. Track API call metrics
2. Monitor deluge events
3. Optimize thresholds if needed
4. Document performance improvements

## Rollback Plan

### If Issues Occur
1. **Database**: Migration is additive, can be safely reverted
2. **Code**: Smart detection has fallback to existing logic
3. **API**: Uses same ECFS endpoints, just different parameters
4. **Emergency**: Can disable smart detection via feature flag

### Monitoring Alerts
- Excessive fallback usage
- Repeated deluge activations
- API call patterns outside expected ranges
- User complaints about missing notifications

---

*Document created: July 2025*  
*Last updated: July 2025*  
*Version: 1.0* 