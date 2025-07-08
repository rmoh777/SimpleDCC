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
    console.log('🚀 Manual enhanced trigger started...');
    const startTime = Date.now();
    
    // Get active dockets
    const { getActiveDockets } = await import('$lib/database/db-operations.js');
    const activeDockets = await getActiveDockets(platform.env.DB);
    const docketNumbers = activeDockets.map(d => d.docket_number);
    
    if (docketNumbers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active dockets to check',
        enhanced: true,
        manual_trigger: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced processing pipeline
    const { processAllDockets } = await import('$lib/fcc/ecfs-client.js');
    const result = await processAllDockets(docketNumbers, platform.env, platform.env.DB, {
      lookbackHours: 2 // Standard lookback for manual triggers
    });
    
    // Log the manual trigger with enhanced results
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    await logSystemEvent(platform.env.DB, 'info', 'Manual enhanced check completed by admin', 'admin-trigger', {
      dockets_checked: docketNumbers.length,
      new_filings: result.newFilings,
      ai_processed: result.aiProcessed,
      documents_processed: result.documentsProcessed,
      duration_ms: Date.now() - startTime,
      enhanced: true,
      manual_trigger: true
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Enhanced manual check completed successfully',
      enhanced: true,
      manual_trigger: true,
      dockets_checked: docketNumbers.length,
      new_filings: result.newFilings,
      ai_processed: result.aiProcessed || 0,
      documents_processed: result.documentsProcessed || 0,
      duration_ms: Date.now() - startTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Manual enhanced trigger error:', error);
    
    // Log error
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'error', 'Manual enhanced check failed', 'admin-trigger', {
        error: error.message,
        stack: error.stack,
        enhanced: true,
        manual_trigger: true
      });
    } catch (logError) {
      console.error('Failed to log manual trigger error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Enhanced manual check failed',
      enhanced: true,
      manual_trigger: true,
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 