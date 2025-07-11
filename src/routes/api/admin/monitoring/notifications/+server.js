import { json } from '@sveltejs/kit';
import { authenticateAdmin } from '$lib/api/auth.js';

export async function GET({ request, platform }) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdmin(request, platform);
    if (!authResult.success) {
      return json({ error: authResult.error }, { status: 401 });
    }

    const db = platform.env.DB;
    
    // Get notification integration statistics (direct database queries)
    const integrationStats = await getNotificationIntegrationStats(db);
    
    // Get queue statistics (direct database queries)
    const queueStats = await getQueueStats(db);
    
    // Get recent system logs for notifications
    const recentLogs = await db.prepare(`
      SELECT level, message, details, created_at
      FROM system_logs 
      WHERE component = 'notifications'
      ORDER BY created_at DESC
      LIMIT 20
    `).all();
    
    // Get notification queue breakdown by status and type
    const queueBreakdown = await db.prepare(`
      SELECT 
        status,
        digest_type,
        COUNT(*) as count,
        MIN(created_at) as oldest_created,
        MAX(created_at) as newest_created
      FROM notification_queue 
      WHERE created_at > ?
      GROUP BY status, digest_type
      ORDER BY status, digest_type
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    // Get user subscription statistics for context
    const subscriptionStats = await db.prepare(`
      SELECT 
        frequency,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY frequency
      ORDER BY frequency
    `).all();
    
    // Get recent successful notifications
    const recentSuccessful = await db.prepare(`
      SELECT 
        user_email,
        docket_number,
        digest_type,
        sent_at,
        created_at
      FROM notification_queue
      WHERE status = 'sent'
        AND sent_at > ?
      ORDER BY sent_at DESC
      LIMIT 10
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    // Get failed notifications for debugging
    const recentFailed = await db.prepare(`
      SELECT 
        user_email,
        docket_number,
        digest_type,
        error_message,
        created_at
      FROM notification_queue
      WHERE status = 'failed'
        AND created_at > ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    return json({
      integration_stats: integrationStats,
      queue_stats: queueStats,
      queue_breakdown: queueBreakdown.results || [],
      subscription_stats: subscriptionStats.results || [],
      recent_successful: recentSuccessful.results || [],
      recent_failed: recentFailed.results || [],
      recent_logs: recentLogs.results || [],
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error getting notification monitoring data:', error);
    return json({ 
      error: 'Failed to get notification monitoring data',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get notification integration statistics using direct database queries
 * Replaces the cross-service import that was causing build failures
 */
async function getNotificationIntegrationStats(db) {
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

/**
 * Get queue statistics using direct database queries
 * Replaces the cross-service import that was causing build failures
 */
async function getQueueStats(db) {
  try {
    // Get total counts by status
    const statusCounts = await db.prepare(`
      SELECT status, COUNT(*) as count
      FROM notification_queue
      GROUP BY status
    `).all();
    
    // Get pending notifications (ready to process)
    const pendingCount = await db.prepare(`
      SELECT COUNT(*) as count
      FROM notification_queue
      WHERE status = 'pending'
    `).all();
    
    // Get processing statistics for last 24 hours
    const last24hStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_processed,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_queue
      WHERE created_at > ?
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    // Get oldest pending notification
    const oldestPending = await db.prepare(`
      SELECT created_at
      FROM notification_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `).all();
    
    return {
      status_counts: statusCounts.results || [],
      pending_count: pendingCount.results?.[0]?.count || 0,
      last_24h: last24hStats.results?.[0] || { total_processed: 0, successful: 0, failed: 0 },
      oldest_pending_timestamp: oldestPending.results?.[0]?.created_at || null,
      last_updated: Date.now()
    };
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      status_counts: [],
      pending_count: 0,
      last_24h: { total_processed: 0, successful: 0, failed: 0 },
      oldest_pending_timestamp: null,
      last_updated: Date.now(),
      error: error.message
    };
  }
} 