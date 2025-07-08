# Phase 2: User Tiers & Enhanced Notification System - Architecture Document

## **Executive Summary**

**Objective**: Enhance SimpleDCC's existing sophisticated email-based subscription system with user tiers (free/pro/trial), intelligent notification processing, and production-ready cron scheduling. This phase builds upon the existing notification_queue system, enhanced ECFS pipeline, and email infrastructure.

**Timeline**: 4 implementation cards, approximately 2 hours total
**Platform**: Cloudflare Pages with D1 database
**Status**: Enhancement of existing system, not ground-up build

---

## **Current State Analysis**

### **Existing Strengths ✅**
```
Database Schema:
├── subscriptions (with frequency column)
├── notification_queue (sophisticated queuing system)
├── active_dockets (monitoring infrastructure)
├── system_logs (comprehensive logging)
└── filings (enhanced with AI fields)

Processing Pipeline:
├── ecfs-enhanced-client.js (proven ECFS fetching)
├── gemini-enhanced.js (AI processing working)
├── filing-storage-enhanced.js (deduplication + storage)
└── email templates (Resend integration ready)

UI Components:
├── SubscribeForm.svelte (working subscription flow)
├── ManageSubscriptions.svelte (email-based management)
└── Admin dashboard (comprehensive oversight)
```

### **Critical Gaps to Address ❌**
```
Missing Implementation:
├── Cron scheduling (wrangler.toml has no triggers)
├── Notification queue processing (table exists, no logic)
├── Daily digest Step 4 (placeholder in cron)
├── User tier system (schema ready, needs logic)
└── Frequency UI controls (options in DB, not exposed)

Missing Configuration:
├── CRON_SECRET, RESEND_API_KEY in wrangler.toml
├── FROM_EMAIL, FROM_NAME environment variables
└── Production cron triggers
```

---

## **Target Architecture**

### **Enhanced User System**
```sql
-- Add user tiers to existing email-based system
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'trial'
  trial_expires_at INTEGER,
  stripe_customer_id TEXT, -- For Phase 2.5
  created_at INTEGER DEFAULT (unixepoch())
);

-- Link existing subscriptions to users
ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id);
-- frequency column already exists: 'daily', 'weekly', 'immediate'
-- last_notified column already exists
```

### **Enhanced Notification Flow**
```
Current Cron (daily-check) → Enhanced Processing Pipeline:

1. ECFS Data Fetching (✅ Working)
   └── ecfs-enhanced-client.js

2. AI Processing (✅ Working)  
   └── gemini-enhanced.js + Jina integration

3. Enhanced Storage (✅ Working)
   └── filing-storage-enhanced.js

4. Notification Queue Processing (🔧 NEW - Fill the gap)
   └── Process notification_queue table
   └── Generate tier-appropriate emails
   └── Update last_notified timestamps

5. Email Delivery (✅ Infrastructure exists)
   └── Existing Resend integration
   └── Enhanced with tier-based templates
```

---

## **User Tier System Design**

### **Free Tier Users**
- **Content**: Basic filing metadata only
- **Frequency**: Daily digests only  
- **Templates**: Metadata + compelling upgrade prompts
- **Features**: Links to full filings, basic information

### **Pro Tier Users**
- **Content**: Full AI summaries with document analysis
- **Frequency**: Daily, weekly, OR immediate notifications
- **Templates**: Rich AI content, stakeholder analysis, impact assessment
- **Features**: Document content analysis, priority processing

### **Trial Tier Users**  
- **Content**: Full pro features for 30 days
- **Frequency**: All pro options available
- **Templates**: Pro templates + trial reminder
- **Features**: Complete pro experience during trial period

---

## **Implementation Strategy**

### **Phase 2 Card Breakdown**

#### **Card 1: User Accounts + Notification Queue Processing** (45 min)
**Objective**: Add user tier system and implement notification queue processing

**Key Tasks**:
- Create users table and link to existing subscriptions
- Implement notification queue processing logic (table exists, needs functions)
- Build user account management functions
- Create tier upgrade/downgrade functionality

**Files to Enhance**:
- `src/lib/database/schema-types.ts` - Add user interfaces
- `src/lib/database/db-operations.js` - Add user management functions  
- `migrations/004_user_system.sql` - New migration for user tables
- Create `src/lib/users/user-operations.ts` - User management logic

#### **Card 2: Pro Trial Integration + UI Enhancement** (30 min)
**Objective**: Add pro trial upsell and expose notification frequency controls

**Key Tasks**:
- Enhance existing `SubscribeForm.svelte` with pro trial modal
- Add frequency controls to `ManageSubscriptions.svelte`
- Create tier status display and upgrade prompts
- Integrate with existing subscription API endpoints

**Files to Enhance**:
- `src/lib/components/SubscribeForm.svelte` - Add pro trial flow
- `src/lib/components/ManageSubscriptions.svelte` - Add frequency controls
- `src/routes/api/subscribe/+server.ts` - Add trial user creation
- Create `src/lib/components/ProTrialModal.svelte` - Trial upsell component

#### **Card 3: Production Cron + Intelligent Processing** (45 min)  
**Objective**: Configure production cron and enhance daily-check with user tiers

**Key Tasks**:
- Add cron triggers to `wrangler.toml` (completely missing!)
- Enhance `daily-check/+server.js` with notification queue processing
- Implement timezone awareness and intelligent scheduling
- Complete the "Step 4" digest processing placeholder

**Files to Enhance**:
- `wrangler.toml` - Add cron triggers and missing environment variables
- `src/routes/api/cron/daily-check/+server.js` - Implement Step 4
- Create `src/lib/notifications/queue-processor.ts` - Queue processing logic
- Create `src/lib/utils/timezone.ts` - Timezone utilities

#### **Card 4: Tier-Based Email Templates + Complete Integration** (30 min)
**Objective**: Enhance email templates for user tiers and complete end-to-end flow

**Key Tasks**:
- Enhance existing email templates with tier-based content
- Complete notification queue → email delivery integration  
- Add upgrade prompts to free tier emails
- Wire together complete user experience

**Files to Enhance**:
- `src/lib/email/daily-digest.js` - Add tier-based templates
- `src/lib/email.ts` - Enhance with tier routing
- Complete notification queue processing integration
- Test end-to-end user experience

---

## **Database Schema Enhancements**

### **New Tables**
```sql
-- migrations/004_user_system.sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_tier TEXT DEFAULT 'free',
  trial_expires_at INTEGER,
  stripe_customer_id TEXT, -- Phase 2.5 preparation
  grace_period_until INTEGER, -- Phase 2.5 preparation
  created_at INTEGER DEFAULT (unixepoch())
);

-- Link existing subscriptions to users
ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Ensure notification preferences are properly typed
UPDATE subscriptions SET frequency = 'daily' WHERE frequency IS NULL;

-- User notification tracking for per-user deduplication
CREATE TABLE user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filing_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'daily', 'weekly', 'immediate'
  sent_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, filing_id, notification_type)
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(user_tier);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_user_notifications_user_filing ON user_notifications(user_id, filing_id);
```

### **Data Migration Strategy**
```sql
-- Migrate existing email subscriptions to user accounts
INSERT INTO users (email, user_tier, created_at)
SELECT DISTINCT email, 'free', MIN(created_at)
FROM subscriptions
GROUP BY email;

-- Link existing subscriptions to users
UPDATE subscriptions 
SET user_id = (
  SELECT id FROM users WHERE users.email = subscriptions.email
)
WHERE user_id IS NULL;

-- Mark existing subscriptions as notified to prevent spam
INSERT INTO user_notifications (user_id, filing_id, notification_type, sent_at)
SELECT DISTINCT s.user_id, f.id, 'daily', s.last_notified
FROM subscriptions s
JOIN filings f ON f.docket_number = s.docket_number
WHERE s.user_id IS NOT NULL AND s.last_notified > 0;
```

---

## **Notification Queue Processing Logic**

### **Enhanced Queue Processing**
```typescript
// src/lib/notifications/queue-processor.ts
interface QueueProcessingFlow {
  1: "Scan notification_queue for pending items"
  2: "Group by user_email and digest_type"  
  3: "Generate appropriate email template based on user_tier"
  4: "Send via existing Resend integration"
  5: "Update queue status and user last_notified"
  6: "Handle failures with retry logic"
}

interface UserNotificationPreferences {
  user_tier: 'free' | 'pro' | 'trial'
  frequency: 'daily' | 'weekly' | 'immediate'
  last_notified: number
  subscribed_dockets: string[]
}
```

### **Intelligent Cron Enhancement**
```typescript
// Enhanced daily-check processing
interface EnhancedCronFlow {
  "Step 1": "ECFS Data Fetching (existing - working)"
  "Step 2": "AI Processing (existing - working)"  
  "Step 3": "Enhanced Storage (existing - working)"
  "Step 4": "NEW - Notification Queue Processing"
  "Step 5": "NEW - Tier-based Email Generation"
  "Step 6": "NEW - User Preference Respect"
}
```

---

## **Email Template Enhancement Strategy**

### **Template Routing Logic**
```typescript
function getEmailTemplate(user: User, filings: Filing[], digestType: string) {
  const baseTemplate = getBaseTemplate(digestType);
  
  if (user.user_tier === 'free') {
    return enhanceWithUpgradePrompts(baseTemplate, filings);
  } else if (user.user_tier === 'pro' || user.user_tier === 'trial') {
    return enhanceWithAIContent(baseTemplate, filings, user);
  }
}
```

### **Content Differentiation**
```typescript
// Free tier email content
interface FreeEmailContent {
  filing_metadata: "Title, author, date, type, docket"
  ai_content: "None - upgrade prompts instead"
  upgrade_banner: "Prominent, value-focused"
  call_to_action: "Start 30-day trial"
}

// Pro tier email content  
interface ProEmailContent {
  filing_metadata: "Complete information"
  ai_content: "Full summaries, stakeholder analysis, impact assessment"
  document_analysis: "Text extraction and key insights"
  upgrade_banner: "None"
}
```

---

## **Configuration Requirements**

### **Enhanced wrangler.toml**
```toml
name = "simple-docketcc"
compatibility_date = "2024-03-08"
pages_build_output_dir = ".svelte-kit/cloudflare"
compatibility_flags = ["nodejs_compat"]

# NEW: Cron triggers (currently missing!)
[triggers]
crons = ["0 9 * * *"]  # Daily at 9 AM UTC (4 AM ET / 5 AM ET with DST)

# Enhanced environment variables
[env.production.vars]
# Existing API keys
ECFS_API_KEY = "production_ecfs_key"
GEMINI_API_KEY = "production_gemini_key"  
JINA_API_KEY = "production_jina_key"

# NEW: Missing email and cron configuration
CRON_SECRET = "production_cron_secret"
RESEND_API_KEY = "production_resend_key"
FROM_EMAIL = "notifications@simpledcc.pages.dev"
FROM_NAME = "SimpleDCC"
APP_URL = "https://simpledcc.pages.dev"

[env.development.vars]
# Same variables for development testing
ECFS_API_KEY = "development_ecfs_key"
GEMINI_API_KEY = "development_gemini_key"
JINA_API_KEY = "development_jina_key"
CRON_SECRET = "development_cron_secret"
RESEND_API_KEY = "development_resend_key"
FROM_EMAIL = "dev@simpledcc.pages.dev"
FROM_NAME = "SimpleDCC Dev"
APP_URL = "http://localhost:5173"

[[d1_databases]]
binding = "DB"
database_name = "simple-docketcc-db"
database_id = "e5bfcb56-11ad-4288-a74c-3749f2ddfd1b"
```

---

## **API Architecture Enhancements**

### **Enhanced Subscription API**
```typescript
// src/routes/api/subscribe/+server.ts enhancements
POST /api/subscribe {
  1: "Create or get user account"
  2: "Create subscription linked to user"  
  3: "Return trial upsell opportunity"
  4: "Send welcome email via existing system"
}

// NEW endpoints
POST /api/users/trial/start {
  "Create trial user"
  "Set 30-day expiration"
  "Enable pro features"
}

POST /api/subscriptions/frequency {
  "Update notification frequency"
  "Validate tier permissions"
  "Update subscription preferences"
}
```

### **Enhanced Admin API**
```typescript
// Extend existing admin functionality
GET /api/admin/users {
  "User tier distribution"
  "Trial conversion metrics"  
  "Notification queue status"
}

POST /api/admin/users/tier {
  "Manual tier upgrades/downgrades"
  "Trial extensions"
  "Bulk user management"
}
```

---

## **Testing Strategy**

### **Component Testing**
```bash
# Test user account creation from existing emails
curl -X POST "/api/subscribe" -d '{"email":"test@example.com","docket":"11-42"}'

# Test trial activation  
curl -X POST "/api/users/trial/start" -d '{"email":"test@example.com"}'

# Test notification queue processing
curl -X POST "/api/cron/daily-check" -H "X-Cron-Secret: secret"

# Test tier-based email generation
curl -X POST "/api/admin/test-email-generation" -d '{"user_tier":"free","filings":3}'
```

### **Integration Testing**
```bash
# End-to-end user flow
1. Subscribe to docket (creates user account)
2. Trigger pro trial upsell
3. Accept trial (upgrades user tier)
4. Run cron job (processes notifications)
5. Verify pro-tier email received
6. Test frequency change in UI
7. Verify notification respects new frequency
```

---

## **Performance & Monitoring**

### **Enhanced Monitoring**
```typescript
// Extended system health tracking
interface EnhancedMonitoring {
  user_metrics: {
    total_users: number
    free_users: number
    pro_users: number
    trial_users: number
    trial_conversion_rate: number
  }
  
  notification_metrics: {
    queue_length: number
    daily_emails_sent: number
    email_delivery_rate: number
    processing_time_avg: number
  }
  
  business_metrics: {
    trial_signups_today: number
    upgrades_today: number
    churn_rate: number
    engagement_rate: number
  }
}
```

### **Performance Targets**
- **Cron execution**: <5 minutes total (well within 10-minute Cloudflare limit)
- **Notification queue processing**: <30 seconds for 100 users
- **Email generation**: <2 seconds per tier-appropriate template
- **Database queries**: <100ms average with proper indexing

---

## **Security & Privacy**

### **Data Protection**
- **Email normalization**: All emails stored lowercase for consistency
- **User tier validation**: Server-side verification of tier permissions
- **Notification deduplication**: Per-user tracking prevents spam
- **API authentication**: Existing admin session system maintained

### **Privacy Compliance**
- **Minimal data collection**: Only email and subscription preferences
- **Clear unsubscribe**: Enhanced with tier-aware messaging
- **Data retention**: Automatic cleanup of expired trial data
- **Audit trail**: All tier changes logged in system_logs

---

## **Phase 2.5 Preparation**

### **Stripe Integration Readiness**
```sql
-- Database already prepared for Stripe
-- stripe_customer_id column ready in users table
-- grace_period_until column ready for payment failures
-- Trial expiration tracking already implemented
```

### **Business Logic Hooks**
```typescript
// User tier management functions ready for payment integration
interface StripeReadyFunctions {
  createTrialUser: "Ready for payment method capture"
  upgradeToProUser: "Ready for subscription creation"
  handleTrialExpiration: "Ready for payment processing"
  downgradeUser: "Ready for failed payment handling"
}
```

---

## **Success Criteria**

### **Technical Success**
- ✅ User tier system works with existing email-based subscriptions
- ✅ Notification queue processes efficiently and reliably
- ✅ Cron job runs on schedule with proper timezone handling
- ✅ Email templates deliver appropriate content by tier
- ✅ Admin dashboard shows enhanced user and system metrics

### **Business Success**
- ✅ Clear value differentiation drives trial signups
- ✅ Free users understand upgrade benefits through email experience
- ✅ Pro users receive superior AI-enhanced content
- ✅ System scales efficiently with growing user base
- ✅ Foundation ready for monetization via Stripe in Phase 2.5

### **User Experience Success**
- ✅ Existing subscription flow enhanced without disruption
- ✅ Notification preferences are user-controlled and respected
- ✅ Email content matches user expectations for their tier
- ✅ Upgrade path is clear and compelling
- ✅ Pro features deliver meaningful value over free tier

---

**Document Version**: 2.0 (Revised for existing system enhancement)
**Implementation Approach**: Build on existing strengths, fill critical gaps
**Next Phase**: Stripe payment processing and automated trial management