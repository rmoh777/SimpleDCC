# SimpleDCC Phase 2 - Updated Current Architecture Document

## **Executive Summary**

**Current Status**: Phase 2 implementation has evolved from the original single-app architecture to a **dual-service architecture** with a separate Cloudflare Worker for cron processing. This represents a significant architectural enhancement that improves scalability and separation of concerns.

**Key Architectural Change**: 
- **Original Plan**: Single SvelteKit app with cron triggers
- **Current Implementation**: SvelteKit app + dedicated Cloudflare Worker with separate cron scheduling

---

## **Current Architecture Overview**

### **Service Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                    SimpleDCC Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐  │
│  │   Main SvelteKit    │    │     Cron Worker                 │  │
│  │   Application       │    │   (Scheduled Tasks)             │  │
│  │ ─────────────────── │    │ ─────────────────────────────── │  │
│  │ • User Interface    │    │ • ECFS Data Fetching            │  │
│  │ • API Endpoints     │    │ • AI Processing                 │  │
│  │ • Admin Dashboard   │    │ • Email Generation              │  │
│  │ • Subscription Mgmt │    │ • Notification Queue Processing │  │
│  │ • User Management   │    │ • Database Operations           │  │
│  └─────────────────────┘    └─────────────────────────────────┘  │
│           │                                   │                   │
│           └─────────────┬─────────────────────┘                   │
│                        │                                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Shared D1 Database                             │  │
│  │  • Users & Subscriptions • Filings • Notification Queue    │  │
│  │  • System Logs • Active Dockets • User Notifications       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Deployment Configuration**
```
Main App (simple-docketcc):
├── wrangler.toml (NO cron triggers)
├── Cloudflare Pages deployment
├── SvelteKit SSR with D1 database
└── User interface and API endpoints

Cron Worker (simpledcc-cron-worker):
├── wrangler.toml (WITH cron triggers: "0 */2 * * *")
├── Separate Cloudflare Worker deployment
├── TypeScript-based scheduled functions
└── Background processing and email delivery
```

---

## **Current Implementation Status**

### **✅ Completed Components**

#### **1. User System (Cards 1-2 Complete)**
```typescript
// Already implemented in main app
Database Tables:
├── users (email, user_tier, trial_expires_at)
├── user_notifications (deduplication tracking)
├── subscriptions (linked to users via user_id)

API Endpoints:
├── /api/users (trial activation, tier changes)
├── /api/subscribe (user creation integration)
├── /api/subscriptions/frequency (tier-aware frequency updates)

UI Components:
├── ManageSubscriptions.svelte (frequency controls)
├── SubscribeForm.svelte (trial integration)
├── ProTrialModal.svelte (upgrade prompts)
```

#### **2. Cron Worker Infrastructure (Card 3 Complete)**
```typescript
// Implemented in cron-worker/
Core Functions:
├── processNotificationQueue() - Queue processing
├── getETTimeInfo() - Timezone intelligence
├── getUserByEmail() - User management
├── generateDailyDigest() - Email templates

Schedule Configuration:
├── Cron triggers: Every 2 hours
├── Timezone-aware processing
├── Business hours logic (8 AM - 10 PM ET)
├── Quiet hours skip (10 PM - 8 AM ET)
```

#### **3. Database Schema (Fully Migrated)**
```sql
-- All tables exist and are properly indexed
Current Schema:
├── users (user_tier, trial_expires_at)
├── subscriptions (user_id, frequency)
├── user_notifications (deduplication)
├── notification_queue (pending processing)
├── filings (AI-enhanced columns)
├── active_dockets (monitoring)
├── system_logs (comprehensive logging)
```

---

## **Card 4 Impact Analysis**

### **🎯 Key Architectural Insight**
**The email templates that matter for Card 4 are in the `cron-worker`, not the main app**, because:
- **Email sending happens in the cron worker** during scheduled processing
- **Main app templates** are used for admin previews and testing
- **Cron worker templates** are used for actual user email delivery

### **Card 4 Updated Scope**
```typescript
// Original Card 4 Plan vs Current Reality
Original Plan:
├── Enhance src/lib/email/daily-digest.js (main app)
├── Update ManageSubscriptions.svelte (main app)
├── Integrate with cron system (main app)

Current Reality:
├── Enhance cron-worker/src/lib/email/daily-digest.js (CRON WORKER)
├── Update ManageSubscriptions.svelte (main app) ✅ Done
├── Integrate with cron-worker notification processing (CRON WORKER)
├── Ensure API endpoints support tier-based frequency (main app) ✅ Done
```

### **Card 4 Files to Modify**
```
Primary Implementation (Cron Worker):
├── cron-worker/src/lib/email/daily-digest.js - Add tier-based templates
├── cron-worker/src/lib/notifications/queue-processor.ts - Enhance with tier logic
├── cron-worker/src/lib/users/user-operations.ts - User tier validation

Secondary Updates (Main App):
├── src/routes/api/subscriptions/frequency/+server.ts - Tier validation
├── src/lib/components/ManageSubscriptions.svelte - UI enhancements
├── src/lib/email/daily-digest.js - Keep in sync for admin previews
```

---

## **Data Flow Architecture**

### **User Subscription Flow**
```
1. User subscribes via main app UI
   └── Creates user account (if needed)
   └── Creates subscription record
   └── Links subscription to user

2. Cron worker processes filings
   └── Fetches ECFS data
   └── Processes with AI
   └── Stores in database
   └── Queues notifications

3. Cron worker processes notification queue
   └── Gets user tier from database
   └── Generates appropriate email template
   └── Sends via Resend API
   └── Marks as sent in database
```

### **Tier-Based Email Generation**
```typescript
// Current implementation in cron-worker
Email Generation Flow:
├── processNotificationQueue() calls getUserByEmail()
├── getUserByEmail() returns user with user_tier
├── generateDailyDigest() receives user_tier parameter
├── Template routing based on tier:
   ├── 'free' → Basic metadata + upgrade prompts
   ├── 'trial' → Full AI content + trial reminder
   └── 'pro' → Full AI content + pro features
```

---

## **Environment Configuration**

### **Main App Configuration**
```toml
# wrangler.toml (Main App)
name = "simple-docketcc"
compatibility_date = "2024-03-08"
pages_build_output_dir = ".svelte-kit/cloudflare"
compatibility_flags = ["nodejs_compat"]

# NO cron triggers - handled by worker
[[d1_databases]]
binding = "DB"
database_name = "simple-docketcc-db"
database_id = "e5bfcb56-11ad-4288-a74c-3749f2ddfd1b"
```

### **Cron Worker Configuration**
```toml
# cron-worker/wrangler.toml
name = "simpledcc-cron-worker"
main = "src/index.ts"
compatibility_date = "2024-03-08"

[triggers]
crons = ["0 */2 * * *"]  # Every 2 hours

# Full environment variables for processing
[vars]
GEMINI_API_KEY = "placeholder"
JINA_API_KEY = "placeholder"
ECFS_API_KEY = "placeholder"
RESEND_API_KEY = "placeholder"
CRON_SECRET = "dev_cron_secret_change_in_production"
APP_URL = "https://simpledcc.pages.dev"
FROM_EMAIL = "notifications@simpledcc.pages.dev"
FROM_NAME = "SimpleDCC"
```

---

## **Card 4 Implementation Strategy**

### **Phase 1: Cron Worker Email Enhancement** (Primary)
```typescript
// cron-worker/src/lib/email/daily-digest.js
Key Changes Needed:
├── Add user_tier parameter to generateDailyDigest()
├── Create tier-specific template functions:
   ├── generateFreeUserDigest() - Metadata + upgrade prompts
   ├── generateProUserDigest() - Full AI content
   └── generateTrialUserDigest() - Pro content + trial reminder
├── Enhance generateFilingAlert() with tier logic
├── Add upgrade prompts and call-to-action buttons
```

### **Phase 2: Queue Processing Enhancement** (Secondary)
```typescript
// cron-worker/src/lib/notifications/queue-processor.ts
Key Changes Needed:
├── Pass user_tier to email generation functions
├── Add tier validation for immediate notifications
├── Enhance error handling for tier-related failures
├── Add logging for tier-specific email generation
```

### **Phase 3: API Consistency** (Tertiary)
```typescript
// Main app API endpoints
Key Changes Needed:
├── Ensure /api/subscriptions/frequency validates tier permissions
├── Update /api/subscribe to return tier information
├── Sync main app email templates for admin previews
├── Add tier-aware admin controls
```

---

## **Testing Strategy for Card 4**

### **1. Cron Worker Email Testing**
```bash
# Test tier-based email generation in cron worker
curl -X POST "cron-worker-url/test-email" \
  -H "Content-Type: application/json" \
  -d '{
    "user_tier": "free",
    "email": "test@example.com",
    "filings": [{"id": "test", "title": "Test Filing"}]
  }'
```

### **2. Integration Testing**
```bash
# Test complete user flow
1. Create free user subscription (main app)
2. Trigger cron worker manually
3. Verify free tier email received
4. Upgrade user to trial (main app)
5. Trigger cron worker again
6. Verify pro tier email received
```

### **3. Frequency Control Testing**
```bash
# Test tier-based frequency restrictions
curl -X POST "main-app-url/api/subscriptions/frequency" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "free@example.com",
    "docket_number": "23-108",
    "frequency": "immediate"
  }'
# Should return upgrade_required error for free users
```

---

## **Performance & Scalability**

### **Benefits of Current Architecture**
```
Advantages:
├── Separation of concerns (UI vs background processing)
├── Independent scaling of cron worker
├── Reduced main app complexity
├── Specialized environments for different tasks
├── Better resource utilization
├── Easier debugging and monitoring
```

### **Considerations for Card 4**
```
Important Notes:
├── Email templates must be maintained in both places
├── User tier logic must be consistent between services
├── Database schema shared between both services
├── API endpoints must support both services
├── Testing requires both services to be deployed
```

---

## **Security & Data Flow**

### **Inter-Service Communication**
```typescript
// Current Pattern
Data Flow:
├── Main app: User actions → Database writes
├── Cron worker: Database reads → Email processing
├── Shared database: Single source of truth
├── No direct API calls between services
├── Event-driven via database state changes
```

### **Authentication & Authorization**
```typescript
Security Model:
├── Main app: Session-based admin authentication
├── Cron worker: Environment-based API keys
├── Database: Shared D1 with proper indexing
├── Email: Resend API with validated sender
├── User tier: Database-driven authorization
```

---

## **Deployment Considerations**

### **Current Deployment Pattern**
```bash
# Two separate deployments required
Main App Deployment:
├── wrangler pages deploy
├── Environment variables in Pages settings
├── Database migrations via Pages functions

Cron Worker Deployment:
├── wrangler deploy (from cron-worker directory)
├── Environment variables in Worker settings
├── Scheduled triggers automatically configured
```

### **Card 4 Deployment Impact**
```
Deployment Requirements:
├── Update cron worker email templates
├── Deploy cron worker changes
├── Update main app API endpoints (if needed)
├── Deploy main app changes
├── Test integration between both services
├── Monitor email delivery from cron worker
```

---

## **Success Criteria for Card 4**

### **✅ Technical Success Metrics**
- **Cron worker generates tier-appropriate email content**
- **Free users receive upgrade prompts and basic metadata**
- **Pro/trial users receive full AI-enhanced content**
- **Main app frequency controls respect tier limitations**
- **Email templates are consistent between services**
- **Database operations maintain data integrity**

### **✅ Business Success Metrics**
- **Clear value differentiation drives trial conversions**
- **Upgrade prompts are compelling but not intrusive**
- **Pro features demonstrate clear value over free tier**
- **User experience is seamless across tier transitions**
- **System scales efficiently with user growth**

### **✅ Integration Success Metrics**
- **Main app and cron worker operate independently**
- **Shared database maintains consistency**
- **Email delivery is reliable and timely**
- **User tier changes are reflected in email content**
- **Admin tools work across both services**

---

## **Conclusion**

The current architecture represents a significant improvement over the original single-app plan. The separation of concerns between user interface (main app) and background processing (cron worker) creates a more scalable and maintainable system.

**Card 4 Implementation Focus**: The primary work for Card 4 will be enhancing the email templates in the **cron worker**, with secondary updates to the main app for UI consistency. This dual-service architecture requires careful coordination but provides better separation of concerns and improved performance.

**Key Insight**: The cron worker is where email delivery happens, making it the critical component for tier-based email differentiation. The main app provides the user interface and API endpoints that support this functionality.

---

**Document Version**: 3.0 (Updated for dual-service architecture)
**Last Updated**: Based on current codebase analysis  
**Next Phase**: Card 4 implementation with focus on cron worker email enhancement 