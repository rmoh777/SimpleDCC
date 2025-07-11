# SimpleDCC Database Architecture Overview

## Project Overview

SimpleDCC is a sophisticated FCC docket monitoring service built on a dual-service architecture:
- **SvelteKit Main App**: Handles user interface, subscriptions, and admin management
- **Cloudflare Worker**: Executes automated filing collection, AI processing, and email delivery
- **Shared Database**: Cloudflare D1 database (`simple-docketcc-db`) for centralized data storage

## Database Platform

**Technology**: Cloudflare D1 (SQLite-based)
- **Production Database**: `simple-docketcc-db`
- **Location**: Cloudflare D1 service
- **Access**: Via Cloudflare Workers bindings and SvelteKit API routes

## Core Database Tables

### 1. User Management Tables

#### `users` (Primary user accounts)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_tier TEXT DEFAULT 'free',        -- 'free', 'pro', 'trial'
  trial_expires_at INTEGER,             -- UTC timestamp for trial users
  stripe_customer_id TEXT,              -- For Stripe integration
  grace_period_until INTEGER,           -- For payment grace period
  created_at INTEGER DEFAULT (unixepoch())
);
```

#### `admin_users` (Admin authentication)
```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- bcrypt hash
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### `subscriptions` (User docket subscriptions)
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,                  -- Kept for backward compatibility
  docket_number TEXT NOT NULL,          -- Format: "XX-XXX" (e.g., "23-108")
  frequency TEXT DEFAULT 'daily',      -- 'daily', 'weekly', 'immediate'
  last_notified INTEGER DEFAULT 0,     -- Unix timestamp
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  user_id INTEGER REFERENCES users(id), -- Links to users table
  needs_seed INTEGER DEFAULT 1,        -- Flag for welcome email
  UNIQUE(email, docket_number)
);
```

### 2. Filing Management Tables

#### `filings` (FCC filing storage)
```sql
CREATE TABLE filings (
  id TEXT PRIMARY KEY,                  -- FCC filing ID (e.g., "2025010112345")
  docket_number TEXT NOT NULL,          -- Format: "XX-XXX"
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  filing_type TEXT NOT NULL,            -- "comment", "reply", "ex_parte", etc.
  date_received TEXT NOT NULL,          -- ISO date string from FCC
  filing_url TEXT NOT NULL,             -- FCC ECFS URL
  documents TEXT,                       -- JSON array of document metadata
  raw_data TEXT,                        -- Full JSON response from FCC API
  ai_summary TEXT,                      -- Generated AI summary
  status TEXT DEFAULT 'pending',       -- 'pending', 'processing', 'completed', 'failed'
  created_at INTEGER DEFAULT (unixepoch()),
  processed_at INTEGER,
  -- AI Enhancement Columns
  ai_enhanced INTEGER DEFAULT 0,
  ai_key_points TEXT,
  ai_stakeholders TEXT,
  ai_regulatory_impact TEXT,
  ai_document_analysis TEXT,
  ai_confidence TEXT,
  documents_processed INTEGER DEFAULT 0
);
```

#### `active_dockets` (Docket monitoring optimization)
```sql
CREATE TABLE active_dockets (
  docket_number TEXT PRIMARY KEY,       -- Format: "XX-XXX"
  last_checked INTEGER DEFAULT 0,      -- Unix timestamp of last ECFS check
  total_filings INTEGER DEFAULT 0,     -- Total filings found for this docket
  subscribers_count INTEGER DEFAULT 0, -- Number of active subscribers
  status TEXT DEFAULT 'active',        -- 'active', 'paused', 'error'
  error_count INTEGER DEFAULT 0,       -- Consecutive error count
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  -- Smart Filing Detection Columns
  latest_filing_id TEXT,               -- Last processed filing ID
  deluge_mode INTEGER DEFAULT 0,       -- 0 or 1 flag for high-activity protection
  deluge_date TEXT                     -- Date when deluge mode was activated
);
```

### 3. Notification System Tables

#### `notification_queue` (Email notification queue)
```sql
CREATE TABLE notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,                  -- User email (for backward compatibility)
  docket_number TEXT NOT NULL,
  filing_ids TEXT NOT NULL,             -- JSON array of filing IDs
  digest_type TEXT DEFAULT 'daily',    -- 'daily', 'weekly', 'immediate', 'seed_digest'
  status TEXT DEFAULT 'pending',       -- 'pending', 'sent', 'failed'
  created_at INTEGER DEFAULT (unixepoch()),
  sent_at INTEGER,
  error_message TEXT,
  filing_data TEXT                     -- JSON blob for additional filing data
);
```

#### `user_notifications` (Deduplication tracking)
```sql
CREATE TABLE user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filing_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,     -- 'daily', 'weekly', 'immediate'
  sent_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, filing_id, notification_type)
);
```

### 4. System Monitoring Tables

#### `system_logs` (Application logging)
```sql
CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,                  -- 'info', 'warning', 'error', 'debug'
  message TEXT NOT NULL,
  component TEXT NOT NULL,              -- 'ecfs', 'ai', 'email', 'cron'
  details TEXT,                         -- JSON with additional context
  docket_number TEXT,                   -- Optional docket context
  filing_id TEXT,                       -- Optional filing context
  created_at INTEGER DEFAULT (unixepoch())
);
```

#### `system_health_logs` (Health monitoring)
```sql
CREATE TABLE system_health_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT NOT NULL,           -- e.g., 'cron-worker'
  status TEXT NOT NULL,                 -- 'SUCCESS' or 'FAILURE'
  run_timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  metrics TEXT,                         -- JSON blob for extra data
  error_message TEXT,
  error_stack TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Database Indexes (Performance Optimization)

### Core Performance Indexes
```sql
-- Filings table indexes
CREATE INDEX idx_filings_docket_date ON filings(docket_number, date_received);
CREATE INDEX idx_filings_status ON filings(status);
CREATE INDEX idx_filings_created_at ON filings(created_at);

-- Active dockets indexes
CREATE INDEX idx_active_dockets_last_checked ON active_dockets(last_checked);
CREATE INDEX idx_active_dockets_status ON active_dockets(status);
CREATE INDEX idx_active_dockets_latest_filing_id ON active_dockets(latest_filing_id);
CREATE INDEX idx_active_dockets_deluge_mode ON active_dockets(deluge_mode);

-- System logs indexes
CREATE INDEX idx_system_logs_component_level ON system_logs(component, level, created_at);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Notification queue indexes
CREATE INDEX idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX idx_notification_queue_user_email ON notification_queue(user_email);

-- User system indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(user_tier);
CREATE INDEX idx_users_trial_expires ON users(trial_expires_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_needs_seed ON subscriptions(needs_seed);
CREATE INDEX idx_user_notifications_user_filing ON user_notifications(user_id, filing_id);

-- System health indexes
CREATE INDEX idx_system_health_service_timestamp ON system_health_logs(service_name, run_timestamp);
CREATE INDEX idx_system_health_status ON system_health_logs(status, run_timestamp);
```

## Data Relationships

### Primary Relationships
1. **users.id** ↔ **subscriptions.user_id** (One-to-Many)
2. **users.id** ↔ **user_notifications.user_id** (One-to-Many)
3. **active_dockets.docket_number** ↔ **filings.docket_number** (One-to-Many)
4. **active_dockets.docket_number** ↔ **subscriptions.docket_number** (One-to-Many)

### Key Foreign Key Constraints
- `subscriptions.user_id` references `users.id`
- `user_notifications.user_id` references `users.id`

## Database Migration System

### Migration Files (Applied in Order)
1. **003_ecfs_integration.sql** - Core ECFS tables and indexes
2. **004_ai_enhanced_columns.sql** - AI processing columns
3. **005_user_system.sql** - User accounts and notification deduplication
4. **006_system_health.sql** - Health monitoring tables
5. **007_add_seed_flag.sql** - Welcome email tracking
6. **008_consolidate_production_schema.sql** - Production schema consolidation
7. **009_fix_notification_queue_filing_data.sql** - Notification queue enhancements
8. **010_smart_filing_detection.sql** - Smart detection columns
9. **011_initialize_smart_detection.sql** - Smart detection initialization
10. **012_system_health_logs.sql** - System health logging fixes

### Auto-Migration System
- **Location**: `src/lib/database/auto-migration.js`
- **Function**: Automatically validates and creates missing tables/columns
- **Safety**: Idempotent operations with comprehensive error handling

## Key Database Operations

### User Management
- `createOrGetUser()` - Create or retrieve user accounts
- `getUserByEmail()` - User lookup by email
- `updateUserTier()` - Manage user subscription tiers
- `handleTrialExpirations()` - Automatic trial downgrades

### Filing Management
- `storeFilings()` - Batch filing storage with deduplication
- `getFilingsByStatus()` - Status-based filing queries
- `updateFilingStatus()` - Status updates with AI summaries

### Notification System
- `queueNotificationForUser()` - Add notifications to queue
- `processNotificationQueue()` - Process and send email notifications
- `getUsersForNotification()` - Get subscribers for docket notifications

### Monitoring & Analytics
- `getMonitoringStats()` - Real-time system statistics
- `logSystemEvent()` - Structured application logging
- `getSystemLogs()` - Log retrieval with filtering

## Data Volume & Performance

### Expected Data Volumes
- **Users**: ~1,000-10,000 users
- **Subscriptions**: ~5,000-50,000 subscriptions
- **Filings**: ~10,000-100,000 filings (growing daily)
- **System Logs**: ~100,000+ entries (with cleanup)

### Performance Considerations
- **Batch Processing**: Filings processed in batches to reduce API calls
- **Smart Detection**: 60-80% reduction in unnecessary API calls
- **Indexed Queries**: All frequent queries are indexed
- **Log Cleanup**: Automatic cleanup of old logs to manage database size

## Security & Access Control

### Admin Access
- **Authentication**: bcrypt password hashing
- **Session Management**: Server-side session handling
- **API Protection**: Admin endpoints require authentication

### User Data Protection
- **Email Validation**: Server-side email validation
- **Unsubscribe Security**: Secure unsubscribe tokens
- **Data Isolation**: User data properly isolated by user_id

## Backup & Disaster Recovery

### Current State
- **Platform**: Cloudflare D1 handles automated backups
- **Migration Scripts**: All schema changes version-controlled
- **Data Export**: Admin endpoints for data export/monitoring

### Recommended Enhancements
- **Regular Exports**: Automated data exports for additional backup
- **Schema Versioning**: Version tracking in database
- **Recovery Testing**: Regular disaster recovery testing

## API Integration Points

### SvelteKit API Routes
- `/api/subscribe` - User subscription management
- `/api/admin/*` - Admin dashboard endpoints
- `/api/debug/*` - Development debugging endpoints

### Cloudflare Worker Integration
- **Database Binding**: Direct D1 database access
- **Cron Jobs**: Automated data processing
- **Manual Triggers**: Admin-triggered processing

## Development & Testing

### Local Development
- **Database**: SQLite file for local development
- **Migrations**: Same migration scripts for consistency
- **Testing**: Mock database for unit tests

### Production Deployment
- **Environment**: Cloudflare D1 production database
- **Monitoring**: Real-time health monitoring
- **Logging**: Comprehensive application logging

---

**Database Viewer Requirements:**
- **Tables**: All 8 core tables with relationships
- **Indexes**: Performance optimization visibility
- **Real-time Data**: Live data viewing and filtering
- **Query Interface**: Custom query execution
- **Export Functions**: Data export capabilities
- **Monitoring Dashboard**: System health and performance metrics