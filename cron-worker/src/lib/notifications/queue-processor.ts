import type { NotificationQueueItem, User, Filing } from '../database/schema-types';
import { getUserByEmail } from '../users/user-operations';

/**
 * Process pending notifications in the queue
 * This is the missing "Step 4" from the current cron job
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
    
    if (pendingNotifications.length === 0) {
      console.log('📬 No pending notifications to process');
      return { processed: 0, sent: 0, failed: 0, errors: [] };
    }
    
    console.log(`📬 Found ${pendingNotifications.length} pending notifications`);
    
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
          failed += notifications.size;
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
        const userNotificationCount = Array.from(notifications.values()).reduce((sum, items) => sum + items.length, 0);
        failed += userNotificationCount;
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
  let filings: Filing[] = [];
  
  if (digestType === 'seed_digest') {
    // For seed digest, get filing IDs from stored data but fetch fresh data from database
    const seedData = queueItems.find(item => item.filing_data);
    if (seedData) {
      try {
        const parsedData = JSON.parse(seedData.filing_data);
        const storedFilings = parsedData.filings || [];
        const filingIds = storedFilings.map(f => f.id);
        
        // Fetch fresh data from database (includes latest AI processing)
        if (filingIds.length > 0) {
          filings = await getFilingsForNotification(filingIds, db);
          console.log(`📧 Fetched ${filings.length} fresh filings for seed digest (${user.email})`);
        }
        
        // Fallback to stored data if database fetch fails or returns no results
        if (filings.length === 0) {
          filings = storedFilings;
          console.log(`📧 Using fallback stored data for seed digest (${user.email})`);
        }
      } catch (error) {
        console.error(`Failed to process seed digest data for ${user.email}:`, error);
        return;
      }
    }
  } else {
    // For other digest types, get filing IDs from the queue items
    const allFilingIds = queueItems.flatMap(item => {
      try {
        return JSON.parse(item.filing_ids);
      } catch {
        return [item.filing_ids]; // Handle non-JSON filing IDs
      }
    });
    
    // Get filing details from database
    filings = await getFilingsForNotification(allFilingIds, db);
  }
  
  if (filings.length === 0) {
    console.log(`No filings found for ${user.email} ${digestType} notification`);
    return;
  }
  
  // Generate and send email based on digest type and user tier
  await generateAndSendNotificationEmail(user, digestType, filings, env);
  
  // Mark user as notified for these filings (skip for seed digest as it's a one-time welcome)
  if (digestType !== 'seed_digest') {
    await markUserNotifiedForFilings(user.id, filings, digestType, db);
  }
  
  console.log(`📧 Processed ${digestType} notification for ${user.email}: ${filings.length} filings (${user.user_tier} tier)`);
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
  try {
    // Import NEW email generation functions (redesigned templates)
    const { generateDailyDigest, generateFilingAlert, generateSeedDigest } = await import('../email/docketcc-templates.js');
    const { sendEmail } = await import('../email');
    
    let emailContent;
    
    if (digestType === 'immediate') {
      // Generate immediate filing alert
      emailContent = generateFilingAlert(user.email, filings[0], {
        user_tier: user.user_tier,
        unsubscribeBaseUrl: env.APP_URL || 'https://simpledcc.pages.dev'
      });
    } else if (digestType === 'seed_digest') {
      // Generate seed digest (welcome experience) - using first filing
      emailContent = generateSeedDigest(user.email, filings[0], {
        user_tier: user.user_tier,
        unsubscribeBaseUrl: env.APP_URL || 'https://simpledcc.pages.dev'
      });
    } else {
      // Generate daily/weekly digest
      emailContent = generateDailyDigest(user.email, filings, {
        user_tier: user.user_tier,
        digest_type: digestType,
        unsubscribeBaseUrl: env.APP_URL || 'https://simpledcc.pages.dev'
      });
    }
    
    // Send email using existing Resend integration
    await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text, env);
    
    console.log(`📧 Sent ${digestType} notification to ${user.email}: ${filings.length} filings (${user.user_tier} tier)`);
    
  } catch (error) {
    console.error(`Failed to generate/send email for ${user.email}:`, error);
    throw error;
  }
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
  if (filings.length === 0) return;
  
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
  if (queueItemIds.length === 0) return;
  
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
  if (queueItemIds.length === 0) return;
  
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
      // Schedule for 1 PM ET today (or next day if past 1 PM)
      const now = new Date();
      const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      
      let scheduledDate = new Date(etTime);
      scheduledDate.setHours(13, 0, 0, 0); // 1 PM ET
      
      // If it's already past 1 PM ET today, schedule for 1 PM ET tomorrow
      if (etTime.getHours() >= 13) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      
      scheduledFor = Math.floor(scheduledDate.getTime() / 1000);
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
    
    console.log(`📬 Queued ${digestType} notification for ${userEmail}: ${filingIds.length} filings`);
    
  } catch (error) {
    console.error('Error queuing notification:', error);
  }
}

/**
 * Get queue statistics for admin dashboard
 */
export async function getQueueStats(db: any) {
  try {
    const stats = await db.prepare(`
      SELECT 
        status,
        digest_type,
        COUNT(*) as count
      FROM notification_queue 
      WHERE created_at > ?
      GROUP BY status, digest_type
      ORDER BY status, digest_type
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