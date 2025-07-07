export async function POST({ platform, cookies }) {
  // Check authentication
  const session = cookies.get('admin_session');
  if (session !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    console.log('🚀 Enhanced manual check triggered by admin');
    const startTime = Date.now();
    
    // Log the manual trigger
    await platform?.env?.DB.prepare(
      'INSERT INTO system_logs (level, message, component) VALUES (?, ?, ?)'
    ).bind('info', 'Enhanced manual check triggered by admin', 'admin-trigger').run();
    
    // Get active dockets for processing
    const { getActiveDockets } = await import('$lib/database/db-operations.js');
    const activeDockets = await getActiveDockets(platform.env.DB);
    const docketNumbers = activeDockets.map(d => d.docket_number);
    
    if (docketNumbers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active dockets to check',
        enhanced: true,
        duration_ms: Date.now() - startTime
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced processing pipeline
    const { processAllDockets } = await import('$lib/fcc/ecfs-client.js');
    const result = await processAllDockets(docketNumbers, platform.env, platform.env.DB, {
      lookbackHours: 2 // Standard 2-hour lookback
    });
    
    // Log successful operation
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    await logSystemEvent(platform.env.DB, 'info', 'Enhanced manual check completed', 'admin-trigger', {
      dockets_checked: docketNumbers.length,
      new_filings: result.newFilings,
      ai_processed: result.aiProcessed,
      documents_processed: result.documentsProcessed,
      duration_ms: Date.now() - startTime,
      enhanced: true
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Enhanced manual check completed successfully',
      enhanced: true,
      ...result,
      duration_ms: Date.now() - startTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Enhanced manual check failed:', error);
    
    // Log error
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'error', 'Enhanced manual check failed', 'admin-trigger', {
        error: error.message,
        stack: error.stack,
        enhanced: true
      });
    } catch (logError) {
      console.error('Failed to log manual check error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      enhanced: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 