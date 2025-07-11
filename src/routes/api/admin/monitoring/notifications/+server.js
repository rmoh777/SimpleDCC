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
    
    // Get notification integration statistics
    const { getNotificationIntegrationStats } = await import('../../../../../cron-worker/src/lib/storage/notification-integration.js');
    const integrationStats = await getNotificationIntegrationStats(db);
    
    // Get queue statistics
    const { getQueueStats } = await import('../../../../../cron-worker/src/lib/notifications/queue-processor.ts');
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