import { json } from '@sveltejs/kit';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication using existing pattern
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = platform.env.DB;
    
    // Get last 10 cron job runs
    const healthLogs = await db.prepare(
      'SELECT * FROM system_health_logs WHERE service_name = ? ORDER BY run_timestamp DESC LIMIT 10'
    ).bind('cron-worker').all();

    // Get status of the notification queue
    const queueStats = await db.prepare(
      "SELECT status, COUNT(*) as count FROM notification_queue GROUP BY status"
    ).all();

    // Get recent system logs for additional context
    const recentLogs = await db.prepare(
      'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 5'
    ).all();

    return json({
      health_logs: healthLogs.results || [],
      queue_stats: queueStats.results || [],
      recent_logs: recentLogs.results || [],
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('System health endpoint failed:', error);
    return json({ 
      error: 'Failed to fetch system health data',
      details: error.message 
    }, { status: 500 });
  }
} 