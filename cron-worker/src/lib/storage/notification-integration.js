// Enhanced notification integration with safety measures
import { logSystemEvent } from '../database/db-operations.js';

/**
 * Queue notifications for users after new filings are stored
 * This is the missing link between filing storage and notification system
 */
export async function queueNotificationsForNewFilings(storageResults, db) {
  const startTime = Date.now();
  let totalQueued = 0;
  const errors = [];
  
  // Safety limits to prevent notification spam
  const SAFETY_LIMITS = {
    maxNotificationsPerRun: 100,
    maxDocketsPerUser: 10,
    maxFilingsPerNotification: 25
  };
  
  try {
    console.log('📬 Starting notification queuing for new filings...');
    
    // Extract dockets that had new filings
    const docketsWithNewFilings = Object.entries(storageResults)
      .filter(([docket, result]) => result.newFilings > 0)
      .map(([docket, result]) => ({ 
        docket, 
        count: result.newFilings,
        enhanced: result.enhanced || false
      }));
    
    if (docketsWithNewFilings.length === 0) {
      console.log('📬 No new filings to queue notifications for');
      return { queued: 0, errors: [], duration_ms: Date.now() - startTime };
    }
    
    console.log(`📬 Found ${docketsWithNewFilings.length} dockets with new filings:`, 
                docketsWithNewFilings.map(d => `${d.docket}(${d.count})`).join(', '));
    
    // Get users subscribed to these dockets
    const { getUsersForNotification } = await import('../database/db-operations.js');
    const docketNumbers = docketsWithNewFilings.map(d => d.docket);
    const subscribedUsers = await getUsersForNotification(docketNumbers, db);
    
    if (subscribedUsers.length === 0) {
      console.log('📬 No users subscribed to dockets with new filings');
      return { queued: 0, errors: [], duration_ms: Date.now() - startTime };
    }
    
    console.log(`📬 Found ${subscribedUsers.length} user subscriptions to process`);
    
    // Group users by email and frequency to batch notifications efficiently
    const userGroups = new Map();
    for (const user of subscribedUsers) {
      const key = `${user.email}:${user.frequency}`;
      if (!userGroups.has(key)) {
        userGroups.set(key, { 
          user: {
            email: user.email,
            frequency: user.frequency,
            user_tier: user.user_tier,
            id: user.id
          }, 
          dockets: new Set() 
        });
      }
      userGroups.get(key).dockets.add(user.docket_number);
    }
    
    console.log(`📬 Grouped into ${userGroups.size} unique user notification batches`);
    
    // Queue notifications for each user group
    const { queueNotificationForUser } = await import('../notifications/queue-processor.ts');
    
    for (const [key, group] of userGroups) {
      try {
        // Apply safety limit for dockets per user
        const docketsToProcess = Array.from(group.dockets).slice(0, SAFETY_LIMITS.maxDocketsPerUser);
        
        for (const docket of docketsToProcess) {
          // Get recent filing IDs for this docket (last 24 hours)
          const recentFilings = await getRecentFilingIds(db, docket, 24);
          
          if (recentFilings.length > 0) {
            // Apply safety limit for filings per notification
            const filingsToNotify = recentFilings.slice(0, SAFETY_LIMITS.maxFilingsPerNotification);
            
            await queueNotificationForUser(
              group.user.email,
              docket,
              filingsToNotify,
              group.user.frequency, // 'daily', 'weekly', 'immediate'
              db
            );
            totalQueued++;
            
            console.log(`📬 Queued ${group.user.frequency} notification for ${group.user.email}: ${filingsToNotify.length} filings from ${docket}`);
          }
        }
        
        // Apply overall safety limit
        if (totalQueued >= SAFETY_LIMITS.maxNotificationsPerRun) {
          console.warn(`⚠️ Hit safety limit of ${SAFETY_LIMITS.maxNotificationsPerRun} notifications per run`);
          break;
        }
        
      } catch (error) {
        console.error(`Failed to queue notification for ${group.user.email}:`, error);
        errors.push(`${group.user.email}: ${error.message}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Log the operation for monitoring
    await logSystemEvent(db, 'info', 'Notification queuing completed', 'notifications', {
      dockets_with_new_filings: docketsWithNewFilings.length,
      total_subscribed_users: subscribedUsers.length,
      unique_user_groups: userGroups.size,
      notifications_queued: totalQueued,
      errors: errors.length,
      duration_ms: duration,
      safety_limits_applied: totalQueued >= SAFETY_LIMITS.maxNotificationsPerRun
    });
    
    console.log(`📬 Notification queuing complete: ${totalQueued} queued, ${errors.length} errors in ${duration}ms`);
    
    return { queued: totalQueued, errors, duration_ms: duration };
    
  } catch (error) {
    console.error('❌ Notification queuing system failure:', error);
    
    // Log critical error
    await logSystemEvent(db, 'error', 'Notification queuing system failure', 'notifications', {
      error: error.message,
      stack: error.stack,
      storage_results: Object.keys(storageResults).length
    });
    
    return { queued: 0, errors: [error.message], duration_ms: Date.now() - startTime };
  }
}

/**
 * Get recent filing IDs for a specific docket
 */
async function getRecentFilingIds(db, docketNumber, hoursBack) {
  const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
  
  try {
    const result = await db.prepare(`
      SELECT id FROM filings 
      WHERE docket_number = ? 
        AND created_at > ?
        AND status = 'completed'
      ORDER BY date_received DESC
      LIMIT 50
    `).bind(docketNumber, cutoffTime).all();
    
    return result.results?.map(row => row.id) || [];
    
  } catch (error) {
    console.error(`Error getting recent filing IDs for ${docketNumber}:`, error);
    return [];
  }
}

/**
 * Get notification integration statistics for monitoring
 */
export async function getNotificationIntegrationStats(db) {
  try {
    // Get recent notification queuing events
    const recentEvents = await db.prepare(`
      SELECT details FROM system_logs 
      WHERE component = 'notifications' 
        AND message = 'Notification queuing completed'
        AND created_at > ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(Date.now() - 86400000).all(); // Last 24 hours
    
    let totalQueued = 0;
    let totalErrors = 0;
    let avgDuration = 0;
    
    if (recentEvents.results && recentEvents.results.length > 0) {
      for (const event of recentEvents.results) {
        try {
          const details = JSON.parse(event.details);
          totalQueued += details.notifications_queued || 0;
          totalErrors += details.errors || 0;
          avgDuration += details.duration_ms || 0;
        } catch (parseError) {
          console.error('Error parsing notification event details:', parseError);
        }
      }
      avgDuration = Math.round(avgDuration / recentEvents.results.length);
    }
    
    return {
      recent_events: recentEvents.results?.length || 0,
      total_queued_24h: totalQueued,
      total_errors_24h: totalErrors,
      avg_duration_ms: avgDuration,
      last_updated: Date.now()
    };
    
  } catch (error) {
    console.error('Error getting notification integration stats:', error);
    return {
      recent_events: 0,
      total_queued_24h: 0,
      total_errors_24h: 0,
      avg_duration_ms: 0,
      last_updated: Date.now(),
      error: error.message
    };
  }
} 