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
    // Get total subscriptions
    const totalResult = await platform?.env?.DB.prepare(
      'SELECT COUNT(*) as count FROM subscriptions'
    ).first();
    
    // Get unique emails
    const uniqueEmailsResult = await platform?.env?.DB.prepare(
      'SELECT COUNT(DISTINCT email) as count FROM subscriptions'
    ).first();
    
    // Get unique dockets
    const uniqueDocketsResult = await platform?.env?.DB.prepare(
      'SELECT COUNT(DISTINCT docket_number) as count FROM subscriptions'
    ).first();
    
    const stats = {
      totalSubscriptions: totalResult?.count || 0,
      uniqueEmails: uniqueEmailsResult?.count || 0,
      uniqueDockets: uniqueDocketsResult?.count || 0
    };
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Subscription stats error:', error);
    
    // Log the error
    try {
      await platform?.env?.DB.prepare(
        'INSERT INTO system_logs (level, message, component) VALUES (?, ?, ?)'
      ).bind('error', `Subscription stats API failed: ${error.message}`, 'admin-api').run();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 