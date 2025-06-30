export async function GET({ platform, cookies }) {
  // Check authentication
  const session = cookies.get('admin_session');
  if (session !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Get subscription count
    const subscriptionCount = await platform?.env?.DB.prepare(
      'SELECT COUNT(*) as count FROM subscriptions'
    ).first();
    
    // Get unique dockets count
    const docketCount = await platform?.env?.DB.prepare(
      'SELECT COUNT(DISTINCT docket_number) as count FROM subscriptions'
    ).first();
    
    // Get recent logs (limit 10)
    const recentLogs = await platform?.env?.DB.prepare(
      'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10'
    ).all();
    
    // Get top dockets by subscriber count
    const topDockets = await platform?.env?.DB.prepare(`
      SELECT docket_number, COUNT(*) as subscriber_count 
      FROM subscriptions 
      GROUP BY docket_number 
      ORDER BY subscriber_count DESC 
      LIMIT 5
    `).all();
    
    const stats = {
      totalSubscriptions: subscriptionCount?.count || 0,
      activeDockets: docketCount?.count || 0,
      recentLogs: recentLogs?.results || [],
      topDockets: topDockets?.results || [],
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    
    // Log the error
    try {
      await platform?.env?.DB.prepare(
        'INSERT INTO system_logs (level, message, component) VALUES (?, ?, ?)'
      ).bind('error', `Stats API failed: ${error.message}`, 'admin-api').run();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 