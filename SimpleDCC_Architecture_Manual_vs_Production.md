# SimpleDCC Architecture Document: Manual Trigger vs Production Cron System

## Overview

SimpleDCC operates a dual-service architecture with a **SvelteKit main app** for UI/admin and a **Cloudflare Worker** for cron processing. This document details the two main processing flows: **Manual Trigger** (for testing/debugging) and **Production Cron** (automated scheduled processing).

## System Architecture

### Core Components

- **Main App**: SvelteKit app with admin interface at `https://simpledcc.pages.dev`
- **Cron Worker**: Cloudflare Worker at `https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev`
- **Database**: Cloudflare D1 database (`simple-docketcc-db`)
- **Cron Schedule**: Every 30 minutes (`*/30 * * * *`)

### Key Services

- **FCC ECFS Client**: Fetches latest filings from FCC API
- **AI Processing**: Gemini Enhanced processing with document analysis
- **Storage System**: Enhanced filing storage with deduplication
- **Email System**: Tiered email templates (free/pro/trial)
- **Notification Queue**: Async email processing system

---

## 1. Manual Trigger System

### Purpose
Testing and debugging specific dockets without waiting for scheduled cron runs.

### Access Method
```bash
curl -X POST "https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev/manual-trigger" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_SECRET" \
  -d '{"docket":"25-143","filingLimit":5}'
```

### Configuration Parameters
- **docket**: Target docket number (e.g., "25-143", "02-10")
- **filingLimit**: Number of filings to process (default: 2)
- **Authentication**: `X-Admin-Secret` header required

### Flow Execution

#### Step 1: Request Validation
```typescript
// Security check
if (!adminSecret || adminSecret !== env.CRON_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}

// Parameter extraction
const targetDocket = requestBody.docket || null;
const filingLimit = requestBody.filingLimit || null;
```

#### Step 2: Database Schema Check
```typescript
// CRITICAL: Only runs on manual triggers
if (isManualTrigger) {
  const schemaCheck = await checkDatabaseSchema(env.DB);
  if (!schemaCheck.isValid) {
    return { success: false, error: 'Schema validation failed' };
  }
}
```

#### Step 3: Docket Selection Logic
```typescript
// Manual trigger: Configurable docket selection
if (isManualTrigger && targetDocket) {
  // Format validation (XX-XX pattern)
  if (!/^\d{1,3}-\d{1,3}$/.test(targetDocket)) {
    throw new Error('Invalid docket format');
  }
  
  // NO active_dockets requirement for manual triggers
  testDockets = [{ docket_number: targetDocket }];
} else {
  // Default to 02-10 if no target specified
  testDockets = activeDockets.filter(d => d.docket_number === '02-10').slice(0, 1);
}
```

#### Step 4: FCC Filing Fetch
```typescript
// Configurable filing limit
const filingLimit = isManualTrigger ? (filingLimit || 2) : 50;
const filings = await fetchLatestFilings(docket, filingLimit, env);
```

#### Step 5: AI Processing & Storage
```typescript
// Same pipeline as production
const storageResults = await storeFilingsEnhanced(allFilings, env.DB, env);
```

### Response Format
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "test_mode": "manual_trigger",
  "docket_tested": "25-143",
  "pipeline_results": {
    "dockets_processed": 1,
    "filings_fetched": 5,
    "storage_results": { /* detailed results */ }
  },
  "processing_stats": {
    "total_duration_ms": 45000,
    "ecfs_duration_ms": 12000,
    "storage_duration_ms": 33000
  },
  "logs": [/* detailed execution logs */]
}
```

---

## 2. Production Cron System

### Purpose
Automated monitoring of all subscribed dockets every 30 minutes.

### Trigger Method
- **Scheduled**: Cloudflare Cron Triggers (`*/30 * * * *`)
- **Time-based Logic**: Processes based on ET timezone
- **No Authentication**: Internal Cloudflare scheduling

### Flow Execution

#### Step 1: Time-Based Processing Strategy
```typescript
const { etHour } = getETTimeInfo();
const processingStrategy = getProcessingStrategy();

if (!processingStrategy.shouldProcess) {
  console.log("😴 Skipping processing during quiet hours.");
  return;
}
```

#### Step 2: Seed Subscription Processing
```typescript
// UNIQUE TO PRODUCTION: Welcome emails for new users
const seedResult = await processSeedSubscriptions(env);
```

#### Step 3: Active Dockets Retrieval
```typescript
// Production: Gets ALL active dockets with subscribers
const activeDockets = await getActiveDockets(env.DB);
// SQL: SELECT DISTINCT docket_number FROM subscriptions WHERE active = 1
```

#### Step 4: Batch Processing
```typescript
// Production: Processes ALL active dockets
// No configurable limits - uses default 50 filings per docket
const pipelineResult = await runDataPipeline(env, ctx, false);
```

#### Step 5: Health Logging
```typescript
// Production: Comprehensive health logging
const logEntry = {
  service_name: 'cron-worker',
  status: status,
  run_timestamp: Math.floor(startTime / 1000),
  duration_ms: durationMs,
  metrics: JSON.stringify({}),
  error_message: errorMessage,
  error_stack: errorStack
};

await env.DB.prepare('INSERT INTO system_health_logs ...').run();
```

---

## 3. Shared Pipeline Components

### FCC ECFS Client (`fetchLatestFilings`)
```typescript
// Shared URL format
const url = `${ECFS_BASE_URL}?` +
  `api_key=${apiKey}` +
  `&proceedings.name=${docketNumber}` +
  `&limit=${limit}` +
  `&sort=date_submission,DESC`;

// Document extraction with direct URLs
documents: extractDocumentsEnhanced(rawFiling)
```

### AI Processing (`processFilingBatchEnhanced`)
```typescript
// Shared Gemini processing
const processedFilings = await processFilingBatchEnhanced(filings, env, {
  maxConcurrent: 2,
  delayBetween: 1000
});
```

### Storage System (`storeFilingsEnhanced`)
```typescript
// Shared deduplication logic
const newFilings = await identifyNewFilings(latestFilings, db);
// Uses id_submission for perfect deduplication
```

---

## 4. Email Handoff Architecture

### Notification Queue System

#### Queue Structure
```sql
CREATE TABLE notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  digest_type TEXT NOT NULL, -- 'daily', 'weekly', 'immediate', 'seed_digest'
  filing_data TEXT,          -- JSON data for seed digests
  filing_ids TEXT,           -- JSON array of filing IDs
  status TEXT DEFAULT 'pending',
  scheduled_for INTEGER,
  created_at INTEGER,
  sent_at INTEGER,
  error_message TEXT
);
```

#### Queue Processing Flow
```typescript
// Called by both manual and cron triggers
export async function processNotificationQueue(db, env) {
  // 1. Get pending notifications
  const pendingNotifications = await getPendingNotifications(db);
  
  // 2. Group by user and digest type
  const notificationGroups = groupNotificationsByUser(pendingNotifications);
  
  // 3. Process each user's notifications
  for (const [userEmail, notifications] of notificationGroups) {
    const user = await getUserByEmail(userEmail, db);
    
    // 4. Generate tier-specific emails
    await processUserNotificationBatch(user, digestType, queueItems, db, env);
    
    // 5. Mark as sent
    await markQueueItemsAsSent(queueItemIds, db);
  }
}
```

### Email Template System

#### Tier-Based Templates
```typescript
// generateDailyDigest supports all tiers
export function generateDailyDigest(userEmail, filings, options = {}) {
  const { user_tier = 'free', digest_type = 'daily' } = options;
  
  return {
    subject: `${brandName}: ${totalFilings} new filings`,
    html: generateHTMLTemplate(userEmail, filingsByDocket, { user_tier }),
    text: generateTextTemplate(userEmail, filingsByDocket, { user_tier })
  };
}
```

#### Email Types
1. **Daily Digest**: Regular filing updates
2. **Seed Digest**: Welcome email for new subscribers
3. **Filing Alert**: Immediate notifications (pro tier)
4. **Welcome Email**: Subscription confirmation

### Email Sending Integration

#### Cloudflare Email Workers
```typescript
// Email sending through Cloudflare
const emailResult = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/email/routing/addresses/{address}/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: userEmail }] }],
    from: { email: 'notifications@simpledcc.com' },
    subject: emailData.subject,
    content: [
      { type: 'text/html', value: emailData.html },
      { type: 'text/plain', value: emailData.text }
    ]
  })
});
```

---

## 5. Critical Differences Analysis

### ✅ Aligned Components (No Mismatches)

1. **FCC API Client**: Identical `fetchLatestFilings` implementation
2. **AI Processing**: Same `processFilingBatchEnhanced` function
3. **Storage System**: Identical `storeFilingsEnhanced` logic
4. **Email Templates**: Same template generation functions
5. **Notification Queue**: Shared queue processing system

### ⚠️ Expected Differences (By Design)

| Component | Manual Trigger | Production Cron | Reason |
|-----------|---------------|-----------------|---------|
| **Authentication** | X-Admin-Secret header | None (internal) | Security model |
| **Docket Selection** | Configurable target | All active dockets | Testing vs. production |
| **Filing Limit** | Configurable (default 2) | Fixed 50 per docket | Testing vs. throughput |
| **Schema Check** | Always runs | Never runs | Debugging vs. performance |
| **Seed Processing** | Skipped | Always runs | Testing vs. user experience |
| **Health Logging** | Skip | Comprehensive | Debug vs. monitoring |
| **Response Format** | Detailed JSON | Silent success | Debug vs. production |

### 🔴 Potential Mismatches (Needs Monitoring)

#### 1. Docket Validation Logic
```typescript
// Manual: Bypasses active_dockets check
if (isManualTrigger && targetDocket) {
  testDockets = [{ docket_number: targetDocket }];
}

// Production: Only processes subscribed dockets
const activeDockets = await getActiveDockets(env.DB);
```

**Risk**: Manual trigger can test any docket, production only processes subscribed ones.

#### 2. Error Handling Differences
```typescript
// Manual: Returns detailed error info
return new Response(JSON.stringify({
  success: false,
  error: error.message,
  logs: logEntries
}), { status: 500 });

// Production: Logs to system_health_logs table
await env.DB.prepare('INSERT INTO system_health_logs ...').run();
```

**Risk**: Error visibility differs between systems.

#### 3. Time-Based Processing
```typescript
// Manual: Always processes regardless of time
// Production: Respects quiet hours
if (!processingStrategy.shouldProcess) {
  return; // Skip during quiet hours
}
```

**Risk**: Manual trigger might test during times when production wouldn't run.

---

## 6. Email Handoff Validation

### Queue-Based Architecture Benefits

1. **Decoupling**: Filing processing and email sending are separate
2. **Reliability**: Failed emails don't break filing processing
3. **Scalability**: Can batch process notifications
4. **Retry Logic**: Failed emails remain in queue for retry

### Handoff Points

#### 1. Storage → Queue
```typescript
// In storeFilingsEnhanced
for (const user of subscribers) {
  await queueNotificationForUser(
    user.email,
    docketNumber,
    newFilingIds,
    user.notification_frequency,
    db
  );
}
```

#### 2. Queue → Email Generation
```typescript
// In processNotificationQueue
const emailData = await generateAndSendNotificationEmail(
  user,
  digestType,
  filings,
  env
);
```

#### 3. Email Generation → Delivery
```typescript
// In email sending function
const emailResult = await sendEmailViaSES(emailData, env);
await markQueueItemsAsSent(queueItemIds, db);
```

### Validation Checkpoints

1. **Queue Population**: Verify notifications are queued after filing storage
2. **Queue Processing**: Confirm notifications are processed by scheduled runs
3. **Email Generation**: Validate tier-specific content generation
4. **Delivery Tracking**: Monitor sent/failed email metrics
5. **Error Handling**: Test retry logic for failed emails

---

## 7. Operational Monitoring

### Health Metrics

#### Manual Trigger Metrics
- Success/failure rates
- Processing duration
- Docket coverage
- Error patterns

#### Production Cron Metrics
- System health logs
- Processing duration trends
- Email delivery rates
- Queue backlog size

### Monitoring Queries

```sql
-- Manual trigger success rate
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_runs
FROM system_health_logs 
WHERE service_name = 'manual-trigger';

-- Email queue backlog
SELECT 
  digest_type,
  COUNT(*) as pending_count,
  MIN(created_at) as oldest_pending
FROM notification_queue 
WHERE status = 'pending'
GROUP BY digest_type;

-- Production cron performance
SELECT 
  DATE(run_timestamp) as date,
  AVG(duration_ms) as avg_duration,
  COUNT(*) as runs_per_day
FROM system_health_logs 
WHERE service_name = 'cron-worker'
GROUP BY DATE(run_timestamp);
```

---

## 8. Recommendations

### Immediate Actions

1. **Add Manual Trigger Health Logging**: Include basic health metrics for manual triggers
2. **Standardize Error Formats**: Align error response formats between systems
3. **Monitor Queue Processing**: Add metrics for notification queue health
4. **Document Time-Based Logic**: Clarify when production processing occurs

### Long-Term Improvements

1. **Unified Configuration**: Consider shared configuration for common settings
2. **Advanced Retry Logic**: Implement exponential backoff for failed emails
3. **Performance Monitoring**: Add detailed performance metrics
4. **Automated Testing**: Create integration tests for both flows

### Database Optimization

1. **Active Dockets Cleanup**: Implement the unsubscribe cleanup logic we discussed
2. **Queue Maintenance**: Add periodic cleanup of old sent/failed notifications
3. **Performance Indexes**: Optimize queries for large datasets

---

## Conclusion

The manual trigger and production cron systems share core processing logic while maintaining appropriate differences for their respective purposes. The email handoff architecture through the notification queue provides reliable, scalable email delivery. Key areas for monitoring are queue processing health, email delivery rates, and the alignment of processing behavior between manual and automated systems.

---

## Implementation Notes

### Current Status
- Manual trigger system: ✅ Working with configurable docket selection
- Production cron system: ✅ Running every 30 minutes
- Email queue system: ✅ Processing notifications asynchronously
- Database schema: ✅ Fully migrated and validated

### Recent Enhancements
- Added configurable docket parameter for manual triggers
- Bypassed active_dockets requirement for manual testing
- Enhanced error logging and response formats
- Implemented tier-based email templates

### Next Steps
1. Monitor queue processing efficiency
2. Implement active_dockets cleanup on unsubscribe
3. Add comprehensive performance metrics
4. Create automated integration tests 