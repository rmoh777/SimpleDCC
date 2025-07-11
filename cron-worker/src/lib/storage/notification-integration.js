// QUICK FIX: Enhanced notification integration with safety measures
// Fix 4: Static imports (moved to top)
import { logSystemEvent, getUsersForNotification } from '../database/db-operations.js';
import { queueNotificationForUser } from '../notifications/queue-processor.ts';

/**
 * QUICK FIX: Simplified notification queuing that works with current pipeline
 * Uses filing IDs from the pipeline instead of database queries
 */
export async function queueNotificationsForNewFilings(storageResults, db, allFilings = []) {
  const startTime = Date.now();
  let totalQueued = 0;
  const errors = [];
  
  // QUICK FIX: Reduced safety limits
  const SAFETY_LIMITS = {
    maxNotificationsPerRun: 50,    // Reduced from 100
    maxDocketsPerUser: 5,          // Reduced from 10
    maxFilingsPerNotification: 10  // Reduced from 25
  };
  
  // Fix 3: Comprehensive error handling
  try {
    console.log('📬 QUICK FIX: Starting notification queuing for new filings...');
    
    // QUICK FIX: Simplified logic - if any docket has new filings, process all dockets
    const docketsWithNewFilings = Object.entries(storageResults)
      .filter(([docket, result]) => result.newFilings > 0 || result.totalProcessed > 0)
      .map(([docket, result]) => ({ 
        docket, 
        count: result.newFilings || result.totalProcessed || 1, // Fallback to 1 if no count
        enhanced: result.enhanced || false
      }));
    
    if (docketsWithNewFilings.length === 0) {
      console.log('📬 QUICK FIX: No new filings to queue notifications for');
      return { queued: 0, errors: [], duration_ms: Date.now() - startTime };
    }
    
    console.log(`📬 QUICK FIX: Found ${docketsWithNewFilings.length} dockets with new filings:`, 
                docketsWithNewFilings.map(d => `${d.docket}(${d.count})`).join(', '));
    
    // Get users subscribed to these dockets
    const docketNumbers = docketsWithNewFilings.map(d => d.docket);
    const subscribedUsers = await getUsersForNotification(docketNumbers, db);
    
    if (subscribedUsers.length === 0) {
      console.log('📬 QUICK FIX: No users subscribed to dockets with new filings');
      return { queued: 0, errors: [], duration_ms: Date.now() - startTime };
    }
    
    console.log(`📬 QUICK FIX: Found ${subscribedUsers.length} user subscriptions to process`);
    
    // QUICK FIX: Simplified user grouping
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
    
    console.log(`📬 QUICK FIX: Grouped into ${userGroups.size} unique user notification batches`);
    
    // Queue notifications for each user group
    for (const [key, group] of userGroups) {
      try {
        const docketsToProcess = Array.from(group.dockets).slice(0, SAFETY_LIMITS.maxDocketsPerUser);
        
        for (const docket of docketsToProcess) {
          // Fix 2: QUICK FIX - Get filing IDs from recent database entries (simplified approach)
          const recentFilings = await db.prepare(`
            SELECT id FROM filings 
            WHERE docket_number = ? 
              AND created_at > ?
            ORDER BY created_at DESC
            LIMIT 10
          `).bind(docket, startTime - 3600000).all(); // Last hour instead of 24 hours
          
          const filingIds = recentFilings.results?.map(row => row.id) || [];
          
          if (filingIds.length > 0) {
            const filingsToNotify = filingIds.slice(0, SAFETY_LIMITS.maxFilingsPerNotification);
            
            await queueNotificationForUser(
              group.user.email,
              docket,
              filingsToNotify,
              group.user.frequency,
              db
            );
            totalQueued++;
            
            console.log(`📬 QUICK FIX: Queued ${group.user.frequency} notification for ${group.user.email}: ${filingsToNotify.length} filings from ${docket}`);
          }
        }
        
        if (totalQueued >= SAFETY_LIMITS.maxNotificationsPerRun) {
          console.warn(`⚠️ QUICK FIX: Hit safety limit of ${SAFETY_LIMITS.maxNotificationsPerRun} notifications per run`);
          break;
        }
        
      } catch (error) {
        console.error(`QUICK FIX: Failed to queue notification for ${group.user.email}:`, error);
        errors.push(`${group.user.email}: ${error.message}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Log the operation for monitoring
    await logSystemEvent(db, 'info', 'QUICK FIX: Notification queuing completed', 'notifications', {
      dockets_with_new_filings: docketsWithNewFilings.length,
      total_subscribed_users: subscribedUsers.length,
      unique_user_groups: userGroups.size,
      notifications_queued: totalQueued,
      errors: errors.length,
      duration_ms: duration
    });
    
    console.log(`📬 QUICK FIX: Notification queuing complete: ${totalQueued} queued, ${errors.length} errors in ${duration}ms`);
    
    return { queued: totalQueued, errors, duration_ms: duration };
    
  } catch (error) {
    console.error('❌ QUICK FIX: Notification queuing system failure:', error);
    
    // Fix 3: Better error handling
    try {
      await logSystemEvent(db, 'error', 'QUICK FIX: Notification queuing system failure', 'notifications', {
        error: error.message,
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log notification error:', logError);
    }
    
    return { queued: 0, errors: [error.message], duration_ms: Date.now() - startTime };
  }
}

// QUICK FIX: Removed getRecentFilingIds function - using direct database query instead

/**
 * Get notification integration statistics for monitoring
 */
export async function getNotificationIntegrationStats(db) {
  try {
    // Get recent notification queuing events (including QUICK FIX messages)
    const recentEvents = await db.prepare(`
      SELECT details FROM system_logs 
      WHERE component = 'notifications' 
        AND message LIKE '%Notification queuing completed%'
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