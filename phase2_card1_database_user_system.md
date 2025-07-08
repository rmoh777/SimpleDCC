# Phase 2 Card 1: User Accounts + Notification Queue Processing ⏱️ *45 minutes*

## **Card Objective**
Add user tier system to existing email-based architecture and implement notification queue processing logic. This card builds upon your existing sophisticated database schema by adding user accounts while preserving all existing functionality.

---

## **What Cursor Should Implement**

You are enhancing an existing sophisticated subscription system by adding user tiers (free/pro/trial) and implementing the notification queue processing that is currently missing. The notification_queue table already exists but has no processing logic.

### **Key Requirements:**
1. **Add user tier system** while preserving existing email-based subscriptions
2. **Implement notification queue processing** (table exists, needs logic)
3. **Create user account management functions** in TypeScript
4. **Migrate existing subscriptions** to link with new user accounts
5. **Maintain backward compatibility** with existing subscription flows

### **Critical Context:**
- Your system already has `notification_queue`, `subscriptions`, and `active_dockets` tables
- Current system is purely email-based with no user accounts
- Frequency options (`daily`, `weekly`, `immediate`) exist in DB but aren't fully used
- TypeScript is used throughout the project

---

## **Database Schema Enhancements**

### **1. Create User System Migration**
Create: `migrations/004_user_system.sql`

```sql
-- Add user accounts table to existing schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  user_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'trial'
  trial_expires_at INTEGER, -- UTC timestamp for trial users
  stripe_customer_id TEXT, -- For Phase 2.5 Stripe integration
  grace_period_until INTEGER, -- For Phase 2.5 payment grace period
  created_at INTEGER DEFAULT (unixepoch())
);

-- Link existing subscriptions to users
ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id);

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
CREATE INDEX idx_users_trial_expires ON users(trial_expires_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_user_notifications_user_filing ON user_notifications(user_id, filing_id);

-- Ensure frequency column has proper defaults
UPDATE subscriptions SET frequency = 'daily' WHERE frequency IS NULL;

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

-- Mark existing notifications to prevent duplicate emails during migration
INSERT INTO user_notifications (user_id, filing_id, notification_type, sent_at)
SELECT DISTINCT s.user_id, f.id, s.frequency, COALESCE(s.last_notified, s.created_at)
FROM subscriptions s
JOIN filings f ON f.docket_number = s.docket_number
WHERE s.user_id IS NOT NULL 
  AND s.last_notified > 0
  AND f.created_at <= s.last_notified;
```

### **2. Enhanced TypeScript Interfaces**
Update: `src/lib/database/schema-types.ts`

```typescript
// Add to existing schema types
export interface User {
  id: number;
  email: string;
  user_tier: 'free' | 'pro' | 'trial';
  trial_expires_at?: number;
  stripe_customer_id?: string;
  grace_period_until?: number;
  created_at: number;
}

export interface UserNotification {
  id: number;
  user_id: number;
  filing_id: string;
  notification_type: 'daily' | 'weekly' | 'immediate';
  sent_at: number;
}

// Enhance existing EnhancedSubscription interface
export interface EnhancedSubscription {
  id: number;
  email: string;
  docket_number: string;
  frequency: 'daily' | 'weekly' | 'immediate';
  last_notified: number;
  created_at: number;
  user_id?: number; // New field linking to users table
}

// Enhanced notification queue processing interface
export interface NotificationQueueItem extends NotificationQueue {
  user?: User; // Join with user data for processing
  filings?: Filing[]; // Related filings for this notification
}
```

---

## **User Account Management System**

### **1. Create User Operations Module**
Create: `src/lib/users/user-operations.ts`

```typescript
import type { User } from '$lib/database/schema-types';

/**
 * Create or retrieve user account by email
 * Integrates with existing email-based subscription system
 */
export async function createOrGetUser(email: string, db: any): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user already exists
  const existingUser = await getUserByEmail(normalizedEmail, db);
  if (existingUser) {
    return existingUser;
  }
  
  // Create new user account
  const result = await db.prepare(`
    INSERT INTO users (email, user_tier, created_at)
    VALUES (?, 'free', ?)
  `).bind(normalizedEmail, Math.floor(Date.now() / 1000)).run();
  
  if (!result.success) {
    throw new Error('Failed to create user account');
  }
  
  return await getUserById(result.meta.last_row_id, db);
}

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string, db: any): Promise<User | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(normalizedEmail).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number, db: any): Promise<User | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first();
    
    return result || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user tier (free → trial → pro)
 */
export async function updateUserTier(
  userId: number, 
  newTier: 'free' | 'pro' | 'trial', 
  trialExpiresAt?: number,
  db: any
): Promise<User> {
  try {
    await db.prepare(`
      UPDATE users 
      SET user_tier = ?, 
          trial_expires_at = ?,
          grace_period_until = NULL
      WHERE id = ?
    `).bind(newTier, trialExpiresAt || null, userId).run();
    
    const updatedUser = await getUserById(userId, db);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user tier:', error);
    throw new Error('Failed to update user tier');
  }
}

/**
 * Get user's subscription preferences
 */
export async function getUserSubscriptions(userId: number, db: any) {
  try {
    const result = await db.prepare(`
      SELECT s.*, u.user_tier, u.trial_expires_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).bind(userId).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
}

/**
 * Check if user has been notified about a specific filing
 */
export async function hasUserBeenNotified(
  userId: number, 
  filingId: string, 
  notificationType: string,
  db: any
): Promise<boolean> {
  try {
    const result = await db.prepare(`
      SELECT id FROM user_notifications 
      WHERE user_id = ? AND filing_id = ? AND notification_type = ?
    `).bind(userId, filingId, notificationType).first();
    
    return !!result;
  } catch (error) {
    console.error('Error checking user notification:', error);
    return false;
  }
}

/**
 * Mark user as notified for a filing
 */
export async function markUserNotified(
  userId: number,
  filingId: string, 
  notificationType: string,
  db: any
): Promise<void> {
  try {
    await db.prepare(`
      INSERT OR IGNORE INTO user_notifications (user_id, filing_id, notification_type, sent_at)
      VALUES (?, ?, ?, ?)
    `).bind(userId, filingId, notificationType, Math.floor(Date.now() / 1000)).run();
  } catch (error) {
    console.error('Error marking user notified:', error);
  }
}
```

---

## **Notification Queue Processing System**

### **1. Create Queue Processor Module**
Create: `src/lib/notifications/queue-processor.ts`

```typescript
import type { NotificationQueueItem, User, Filing } from '$lib/database/schema-types';

/**
 * Process pending notifications in the queue
 * This is the missing "Step 4" from your current cron job
 */
export async function processNotificationQueue(db: any, env: any): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}> {
  console.log('📬 Processing notification queue...');
  
  try {
    // Get pending notifications grouped by user and digest type
    const pendingNotifications = await getPendingNotifications(db);
    
    let processed = 0;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Group notifications by user email and digest type for batch processing
    const notificationGroups = groupNotificationsByUser(pendingNotifications);
    
    for (const [userEmail, notifications] of notificationGroups) {
      try {
        const user = await getUserByEmail(userEmail, db);
        if (!user) {
          console.error(`User not found for email: ${userEmail}`);
          failed += notifications.length;
          continue;
        }
        
        // Process each digest type for this user
        for (const [digestType, queueItems] of notifications) {
          try {
            await processUserNotificationBatch(user, digestType, queueItems, db, env);
            
            // Mark queue items as sent
            await markQueueItemsAsSent(queueItems.map(item => item.id), db);
            sent += queueItems.length;
            
          } catch (batchError) {
            console.error(`Failed to process ${digestType} for ${userEmail}:`, batchError);
            await markQueueItemsAsFailed(queueItems.map(item => item.id), batchError.message, db);
            failed += queueItems.length;
            errors.push(`${userEmail} ${digestType}: ${batchError.message}`);
          }
          
          processed += queueItems.length;
        }
        
      } catch (userError) {
        console.error(`Failed to process notifications for ${userEmail}:`, userError);
        failed += notifications.size;
        errors.push(`${userEmail}: ${userError.message}`);
      }
    }
    
    console.log(`📬 Queue processing complete: ${sent} sent, ${failed} failed, ${processed} total`);
    
    return { processed, sent, failed, errors };
    
  } catch (error) {
    console.error('❌ Notification queue processing failed:', error);
    throw error;
  }
}

/**
 * Get pending notifications from queue
 */
async function getPendingNotifications(db: any): Promise<NotificationQueueItem[]> {
  const result = await db.prepare(`
    SELECT nq.*, u.user_tier, u.trial_expires_at
    FROM notification_queue nq
    LEFT JOIN users u ON u.email = nq.user_email
    WHERE nq.status = 'pending' 
      AND nq.scheduled_for <= ?
    ORDER BY nq.scheduled_for ASC, nq.created_at ASC
    LIMIT 100
  `).bind(Math.floor(Date.now() / 1000)).all();
  
  return result.results || [];
}

/**
 * Group notifications by user email and digest type
 */
function groupNotificationsByUser(notifications: NotificationQueueItem[]): Map<string, Map<string, NotificationQueueItem[]>> {
  const userGroups = new Map<string, Map<string, NotificationQueueItem[]>>();
  
  for (const notification of notifications) {
    if (!userGroups.has(notification.user_email)) {
      userGroups.set(notification.user_email, new Map());
    }
    
    const digestGroups = userGroups.get(notification.user_email)!;
    if (!digestGroups.has(notification.digest_type)) {
      digestGroups.set(notification.digest_type, []);
    }
    
    digestGroups.get(notification.digest_type)!.push(notification);
  }
  
  return userGroups;
}

/**
 * Process a batch of notifications for a specific user and digest type
 */
async function processUserNotificationBatch(
  user: User,
  digestType: string,
  queueItems: NotificationQueueItem[],
  db: any,
  env: any
): Promise<void> {
  // Get all filing IDs from the queue items
  const allFilingIds = queueItems.flatMap(item => {
    try {
      return JSON.parse(item.filing_ids);
    } catch {
      return [item.filing_ids]; // Handle non-JSON filing IDs
    }
  });
  
  // Get filing details
  const filings = await getFilingsForNotification(allFilingIds, db);
  
  if (filings.length === 0) {
    console.log(`No filings found for ${user.email} ${digestType} notification`);
    return;
  }
  
  // Generate and send email based on digest type and user tier
  await generateAndSendNotificationEmail(user, digestType, filings, env);
  
  // Mark user as notified for these filings
  await markUserNotifiedForFilings(user.id, filings, digestType, db);
}

/**
 * Get filing details for notification
 */
async function getFilingsForNotification(filingIds: string[], db: any): Promise<Filing[]> {
  if (filingIds.length === 0) return [];
  
  const placeholders = filingIds.map(() => '?').join(',');
  const result = await db.prepare(`
    SELECT * FROM filings 
    WHERE id IN (${placeholders})
    ORDER BY date_received DESC
  `).bind(...filingIds).all();
  
  return result.results || [];
}

/**
 * Generate and send notification email
 */
async function generateAndSendNotificationEmail(
  user: User,
  digestType: string,
  filings: Filing[],
  env: any
): Promise<void> {
  // Import your existing email generation functions
  const { generateDailyDigest, generateFilingAlert } = await import('$lib/email/daily-digest.js');
  const { sendEmail } = await import('$lib/email.ts');
  
  let emailContent;
  
  if (digestType === 'immediate') {
    // Generate immediate filing alert
    emailContent = generateFilingAlert(user.email, filings[0], {
      user_tier: user.user_tier,
      unsubscribe_url: `${env.APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`
    });
  } else {
    // Generate daily/weekly digest
    emailContent = generateDailyDigest(user.email, filings, {
      user_tier: user.user_tier,
      digest_type: digestType,
      unsubscribe_url: `${env.APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`
    });
  }
  
  // Send email using your existing Resend integration
  await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text, env);
  
  console.log(`📧 Sent ${digestType} notification to ${user.email}: ${filings.length} filings (${user.user_tier})`);
}

/**
 * Mark user as notified for filings
 */
async function markUserNotifiedForFilings(
  userId: number,
  filings: Filing[],
  notificationType: string,
  db: any
): Promise<void> {
  const notifications = filings.map(filing => [userId, filing.id, notificationType, Math.floor(Date.now() / 1000)]);
  
  const insertPromises = notifications.map(([userId, filingId, type, timestamp]) =>
    db.prepare(`
      INSERT OR IGNORE INTO user_notifications (user_id, filing_id, notification_type, sent_at)
      VALUES (?, ?, ?, ?)
    `).bind(userId, filingId, type, timestamp)
  );
  
  await db.batch(insertPromises);
}

/**
 * Mark queue items as successfully sent
 */
async function markQueueItemsAsSent(queueItemIds: number[], db: any): Promise<void> {
  const updatePromises = queueItemIds.map(id =>
    db.prepare(`
      UPDATE notification_queue 
      SET status = 'sent', sent_at = ? 
      WHERE id = ?
    `).bind(Math.floor(Date.now() / 1000), id)
  );
  
  await db.batch(updatePromises);
}

/**
 * Mark queue items as failed
 */
async function markQueueItemsAsFailed(queueItemIds: number[], errorMessage: string, db: any): Promise<void> {
  const updatePromises = queueItemIds.map(id =>
    db.prepare(`
      UPDATE notification_queue 
      SET status = 'failed', error_message = ? 
      WHERE id = ?
    `).bind(errorMessage, id)
  );
  
  await db.batch(updatePromises);
}

/**
 * Add notification to queue for processing
 * This function can be called when new filings are stored
 */
export async function queueNotificationForUser(
  userEmail: string,
  docketNumber: string,
  filingIds: string[],
  digestType: 'daily' | 'weekly' | 'immediate',
  db: any
): Promise<void> {
  try {
    // Calculate when to send the notification
    let scheduledFor = Math.floor(Date.now() / 1000);
    
    if (digestType === 'daily') {
      // Schedule for next 9 AM (adjust for your timezone preference)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      scheduledFor = Math.floor(tomorrow.getTime() / 1000);
    } else if (digestType === 'weekly') {
      // Schedule for next Monday 9 AM
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7);
      nextMonday.setHours(9, 0, 0, 0);
      scheduledFor = Math.floor(nextMonday.getTime() / 1000);
    }
    // immediate notifications use current timestamp
    
    await db.prepare(`
      INSERT INTO notification_queue (
        user_email, docket_number, filing_ids, digest_type, 
        status, scheduled_for, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      userEmail.toLowerCase(),
      docketNumber,
      JSON.stringify(filingIds),
      digestType,
      scheduledFor,
      Math.floor(Date.now() / 1000)
    ).run();
    
  } catch (error) {
    console.error('Error queuing notification:', error);
  }
}
```

---

## **Enhanced Database Operations**

### **1. Update Existing Database Operations**
Update: `src/lib/database/db-operations.js`

Add these functions to your existing db-operations file:

```javascript
/**
 * Get users who need notifications for new filings
 * Integrates with existing active dockets system
 */
export async function getUsersForNotification(docketNumbers, db) {
  try {
    if (!docketNumbers || docketNumbers.length === 0) return [];
    
    const placeholders = docketNumbers.map(() => '?').join(',');
    
    const result = await db.prepare(`
      SELECT DISTINCT 
        u.id, u.email, u.user_tier, u.trial_expires_at,
        s.docket_number, s.frequency, s.last_notified
      FROM users u
      JOIN subscriptions s ON u.id = s.user_id
      WHERE s.docket_number IN (${placeholders})
      ORDER BY u.user_tier DESC, s.frequency ASC
    `).bind(...docketNumbers).all();
    
    return result.results || [];
    
  } catch (error) {
    console.error('Error getting users for notification:', error);
    return [];
  }
}

/**
 * Update user last notified timestamp
 */
export async function updateUserLastNotified(userId, docketNumber, db) {
  try {
    await db.prepare(`
      UPDATE subscriptions 
      SET last_notified = ? 
      WHERE user_id = ? AND docket_number = ?
    `).bind(Math.floor(Date.now() / 1000), userId, docketNumber).run();
    
  } catch (error) {
    console.error('Error updating last notified:', error);
  }
}

/**
 * Get notification queue statistics for admin dashboard
 */
export async function getNotificationQueueStats(db) {
  try {
    const stats = await db.prepare(`
      SELECT 
        status,
        digest_type,
        COUNT(*) as count
      FROM notification_queue 
      WHERE created_at > ?
      GROUP BY status, digest_type
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    const pendingCount = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM notification_queue 
      WHERE status = 'pending'
    `).first();
    
    return {
      breakdown: stats.results || [],
      pending_total: pendingCount?.count || 0
    };
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { breakdown: [], pending_total: 0 };
  }
}
```

---

## **API Integration**

### **1. Enhanced Subscription API**
Update: `src/routes/api/subscribe/+server.ts`

Enhance your existing subscription endpoint:

```typescript
// Add to imports at top of file
import { createOrGetUser } from '$lib/users/user-operations';

// Enhance your existing POST handler
export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const { email, docket_number } = await request.json();
    
    // Your existing validation logic stays the same
    if (!email || !docket_number) {
      return json({ success: false, message: 'Email and docket number are required' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase();
    
    // NEW: Create or get user account
    const user = await createOrGetUser(normalizedEmail, platform.env.DB);
    
    // Check for existing subscription (enhanced to use user_id)
    const existing = await platform.env.DB
      .prepare('SELECT id FROM subscriptions WHERE user_id = ? AND docket_number = ?')
      .bind(user.id, docket_number)
      .first();
      
    if (existing) {
      return json({ success: false, message: 'Already subscribed to this docket' }, { status: 409 });
    }
    
    // Insert new subscription linked to user
    const result = await platform.env.DB
      .prepare('INSERT INTO subscriptions (user_id, email, docket_number, frequency, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, normalizedEmail, docket_number, 'daily', Math.floor(Date.now() / 1000))
      .run();
    
    if (result.success) {
      // Send welcome email (existing logic)
      try {
        const { sendWelcomeEmail } = await import('$lib/email');
        await sendWelcomeEmail(email, docket_number, platform.env);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      return json({ 
        success: true,
        message: `Successfully subscribed to docket ${docket_number}`,
        id: result.meta.last_row_id,
        user_tier: user.user_tier, // NEW: Include user tier
        show_trial_upsell: user.user_tier === 'free' // NEW: Signal for pro trial modal
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Subscription error:', error);
    return json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
};

// Enhance your existing GET handler to include user tier information
export const GET: RequestHandler = async ({ url, platform }) => {
  const email = url.searchParams.get('email');
  if (!email) {
    return json({ error: 'Email parameter required' }, { status: 400 });
  }
  
  const normalizedEmail = email.toLowerCase();
  
  // Get user information
  const user = await getUserByEmail(normalizedEmail, platform.env.DB);
  
  // Get subscriptions with enhanced information
  const subscriptions = await platform.env.DB
    .prepare(`
      SELECT s.id, s.docket_number, s.frequency, s.created_at, s.last_notified
      FROM subscriptions s
      WHERE s.email = ? 
      ORDER BY s.created_at DESC
    `)
    .bind(normalizedEmail)
    .all();
  
  return json({ 
    subscriptions: subscriptions.results || [],
    count: subscriptions.results?.length || 0,
    user_tier: user?.user_tier || 'free', // NEW: Include user tier
    trial_expires_at: user?.trial_expires_at // NEW: Include trial info
  });
};
```

---

## **Testing Requirements**

### **1. Database Migration Tests**
```bash
# Test migration creates user accounts correctly
# Run migration and verify:
# - Users table created with proper schema
# - Existing subscriptions linked to users
# - No data loss during migration

# SQL to verify migration success:
SELECT COUNT(*) FROM users; -- Should match unique emails from subscriptions
SELECT COUNT(*) FROM subscriptions WHERE user_id IS NOT NULL; -- Should be 100%
```

### **2. User Account Functions Tests**
```bash
# Test user account creation
curl -X POST "/api/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","docket_number":"11-42"}'

# Should create user account and subscription
# Verify in database that user_id is populated in subscriptions table

# Test duplicate subscription with user system
curl -X POST "/api/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","docket_number":"14-58"}'

# Should create new subscription for existing user, not duplicate user
```

### **3. Notification Queue Processing Tests**
```bash
# Test queue processing (you'll need to add test data to notification_queue)
# Add test notification to queue
INSERT INTO notification_queue (user_email, docket_number, filing_ids, digest_type, status, scheduled_for) 
VALUES ('test@example.com', '11-42', '["test_filing_id"]', 'daily', 'pending', unixepoch());

# Then test processing function
# This will be tested more thoroughly in Card 3 when integrated with cron
```

---

## **Git Workflow Instructions**

### **Branch Management**
```bash
# Create new branch for Phase 2 Card 1
git checkout -b phase2-card1-user-system

# Commit migrations first
git add migrations/004_user_system.sql
git commit -m "Add user system database schema and migration"

# Commit TypeScript interfaces
git add src/lib/database/schema-types.ts
git commit -m "Add user and notification interfaces to schema types"

# Commit user operations
git add src/lib/users/
git commit -m "Add user account management system"

# Commit notification queue processing
git add src/lib/notifications/
git commit -m "Implement notification queue processing logic"

# Commit database operations enhancements
git add src/lib/database/db-operations.js
git commit -m "Enhance database operations with user and notification functions"

# Commit API enhancements
git add src/routes/api/subscribe/+server.ts
git commit -m "Enhance subscription API with user account integration"

# DO NOT PUSH TO GITHUB YET
# Test all functionality before pushing
```

### **Testing Before Push**
1. **Run database migration** and verify schema changes
2. **Test user account creation** through subscription API
3. **Verify existing subscriptions** still work correctly
4. **Test notification queue functions** (basic functionality)
5. **Check TypeScript compilation** with new interfaces
6. **Verify no regressions** in existing admin dashboard
7. **Report test results** before pushing to GitHub

---

## **Success Criteria for Card 1**

### **Database Success**
- ✅ Users table created with proper indexes and constraints
- ✅ Existing subscriptions successfully migrated to user system
- ✅ user_notifications table ready for deduplication tracking
- ✅ No data loss during migration process
- ✅ Foreign key relationships working correctly

### **User System Success**
- ✅ User accounts created automatically during subscription
- ✅ User tier management functions work correctly
- ✅ Existing email-based lookup still functions
- ✅ TypeScript interfaces properly defined
- ✅ Backward compatibility maintained

### **Notification Queue Success**
- ✅ Queue processing logic implemented and tested
- ✅ User tier-aware notification generation
- ✅ Integration with existing email system working
- ✅ Deduplication prevents spam notifications
- ✅ Error handling for queue processing failures

### **Ready for Card 2**
- ✅ User account foundation stable and tested
- ✅ Database schema supports pro trial functionality
- ✅ Notification system ready for tier-based processing
- ✅ API endpoints enhanced with user information
- ✅ Foundation ready for pro trial UI integration

---

## **Cursor Implementation Notes**

- **Work with existing TypeScript patterns**: Match your current coding style and interface definitions
- **Preserve existing functionality**: Ensure current subscription and admin flows continue working
- **Use your existing database connection patterns**: Follow the same DB operation patterns you use elsewhere
- **Handle migration carefully**: Test the SQL migration thoroughly before applying
- **Error handling**: Follow your existing error handling and logging patterns
- **Performance**: Ensure new queries use proper indexes and perform well

**Card 1 Complete When**: User tier system is functional, notification queue processing works, and existing subscription system is enhanced without any regressions.