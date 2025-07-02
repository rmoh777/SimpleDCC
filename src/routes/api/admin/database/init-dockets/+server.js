import { json } from '@sveltejs/kit';

export async function POST({ platform, cookies, request }) {
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

    // Check if we have any subscriptions
    const subscriptionsCount = await db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions
    `).first();

    // Check current active_dockets
    const activeDocketsCount = await db.prepare(`
      SELECT COUNT(*) as count FROM active_dockets
    `).first();

    let operations = [];

    // If we have subscriptions, initialize from those
    if (subscriptionsCount.count > 0) {
      const initResult = await db.prepare(`
        INSERT OR IGNORE INTO active_dockets (docket_number, subscribers_count, status, created_at, updated_at)
        SELECT 
          docket_number, 
          COUNT(*) as count,
          'active' as status,
          unixepoch() as created_at,
          unixepoch() as updated_at
        FROM subscriptions 
        GROUP BY docket_number
      `).run();
      
      operations.push(`Initialized ${initResult.changes} active dockets from ${subscriptionsCount.count} subscriptions`);
    } else {
      // No subscriptions exist, add some test dockets for ECFS monitoring
      const testDockets = [
        { docket: '23-108', description: 'Open Internet Rules' },
        { docket: '21-450', description: 'Consumer Broadband Labels' },
        { docket: '18-122', description: 'Restoring Internet Freedom' }
      ];

      for (const { docket, description } of testDockets) {
        const insertResult = await db.prepare(`
          INSERT OR IGNORE INTO active_dockets 
          (docket_number, subscribers_count, status, created_at, updated_at)
          VALUES (?, 0, 'active', unixepoch(), unixepoch())
        `).bind(docket).run();
        
        if (insertResult.changes > 0) {
          operations.push(`Added test docket: ${docket} (${description})`);
        }
      }
    }

    // Log the initialization
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details)
      VALUES (?, ?, ?, ?)
    `).bind(
      'info',
      'Manual active_dockets initialization completed',
      'admin',
      JSON.stringify({ 
        operations,
        subscriptions_found: subscriptionsCount.count,
        previous_active_dockets: activeDocketsCount.count,
        timestamp: Date.now()
      })
    ).run();

    // Get final count
    const finalCount = await db.prepare(`
      SELECT COUNT(*) as count FROM active_dockets
    `).first();

    return json({
      success: true,
      message: 'Active dockets initialization completed',
      operations,
      stats: {
        subscriptions_found: subscriptionsCount.count,
        previous_active_dockets: activeDocketsCount.count,
        final_active_dockets: finalCount.count
      }
    });

  } catch (error) {
    console.error('Active dockets initialization error:', error);
    return json({ 
      error: 'Initialization failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 