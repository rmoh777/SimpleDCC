import { json } from '@sveltejs/kit';

export async function GET({ platform, cookies, request }) {
  try {
    // Check admin authentication (both cookie and header)
    const adminSession = cookies.get('admin_session');
    const adminKeyHeader = request.headers.get('x-admin-key');
    const expectedAdminKey = platform?.env?.ADMIN_SECRET_KEY;
    
    const isAuthenticated = adminSession === 'authenticated' || 
                          (adminKeyHeader && expectedAdminKey && adminKeyHeader === expectedAdminKey);
    
    if (!isAuthenticated) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = platform?.env?.DB;
    if (!db) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    // Check subscriptions table
    const subscriptionsResult = await db.prepare(`
      SELECT COUNT(*) as total_subscriptions, 
             COUNT(DISTINCT docket_number) as unique_dockets
      FROM subscriptions
    `).first();

    const sampleSubscriptions = await db.prepare(`
      SELECT email, docket_number, created_at 
      FROM subscriptions 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Check active_dockets table
    const activeDocketsResult = await db.prepare(`
      SELECT COUNT(*) as total_active_dockets
      FROM active_dockets
    `).first();

    const sampleActiveDockets = await db.prepare(`
      SELECT docket_number, subscribers_count, status, last_checked, created_at
      FROM active_dockets 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    // Check if tables exist
    const tablesResult = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    // Get recent migration logs
    const migrationLogs = await db.prepare(`
      SELECT * FROM system_logs 
      WHERE component = 'auto-migration' 
      ORDER BY created_at DESC 
      LIMIT 3
    `).all();

    // Get system logs related to dockets
    const docketLogs = await db.prepare(`
      SELECT * FROM system_logs 
      WHERE message LIKE '%docket%' OR component = 'ecfs'
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    return json({
      timestamp: new Date().toISOString(),
      database_tables: tablesResult.results?.map(t => t.name) || [],
      subscriptions: {
        total: subscriptionsResult?.total_subscriptions || 0,
        unique_dockets: subscriptionsResult?.unique_dockets || 0,
        sample: sampleSubscriptions.results || []
      },
      active_dockets: {
        total: activeDocketsResult?.total_active_dockets || 0,
        sample: sampleActiveDockets.results || []
      },
      migration_logs: migrationLogs.results || [],
      docket_logs: docketLogs.results || [],
      diagnosis: {
        problem: activeDocketsResult?.total_active_dockets === 0 ? 'active_dockets table is empty' : 'unknown',
        likely_cause: subscriptionsResult?.total_subscriptions === 0 ? 
          'No subscriptions exist to populate active_dockets from' : 
          'active_dockets initialization may have failed'
      }
    });

  } catch (error) {
    console.error('Database debug error:', error);
    return json({ 
      error: 'Database debug failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 