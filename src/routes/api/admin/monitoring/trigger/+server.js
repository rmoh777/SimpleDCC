import { json } from '@sveltejs/kit';
import { fetchMultipleDockets } from '$lib/fcc/ecfs-client.js';
import { storeFilings } from '$lib/storage/filing-storage.js';
import { getActiveDockets, logSystemEvent, updateDocketStats } from '$lib/database/db-operations.js';

export async function POST({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Log the manual trigger
    await logSystemEvent(db, 'info', 'Manual ECFS check triggered by admin', 'admin', {
      triggered_at: Date.now(),
      source: 'admin_dashboard'
    });
    
    // Get active dockets to check
    const activeDockets = await getActiveDockets(db);
    const docketNumbers = activeDockets.map(d => d.docket_number);
    
    if (docketNumbers.length === 0) {
      return json({
        success: true,
        message: 'No active dockets to check',
        newFilings: 0,
        checkedDockets: 0,
        warnings: ['No active dockets found']
      });
    }
    
    // Perform ECFS check across all dockets
    const startTime = Date.now();
    const ecfsResult = await fetchMultipleDockets(docketNumbers, 2); // 2 hour lookback
    const endTime = Date.now();
    
    // Store new filings
    const newFilingsCount = await storeFilings(ecfsResult.filings, db);
    
    // Update docket statistics
    for (const docket of activeDockets) {
      const docketFilings = ecfsResult.filings.filter(f => f.docket_number === docket.docket_number);
      await updateDocketStats(db, docket.docket_number, {
        lastChecked: Date.now(),
        totalFilings: docket.total_filings + docketFilings.length,
        hasError: false
      });
    }
    
    // Log completion
    await logSystemEvent(db, 'info', `Manual ECFS check completed`, 'admin', {
      duration_ms: endTime - startTime,
      dockets_checked: ecfsResult.stats.successfulDockets,
      new_filings: newFilingsCount,
      errors: ecfsResult.errors.length
    });
    
    const response = {
      success: true,
      message: `Manual check completed successfully`,
      newFilings: newFilingsCount,
      checkedDockets: ecfsResult.stats.successfulDockets,
      totalDockets: docketNumbers.length,
      duration: endTime - startTime,
      stats: ecfsResult.stats
    };
    
    // Include warnings if there were any errors
    if (ecfsResult.errors.length > 0) {
      response.warnings = ecfsResult.errors.map(err => 
        `Failed to check docket ${err.docket}: ${err.error}`
      );
    }
    
    return json(response);
    
  } catch (error) {
    console.error('Manual ECFS check failed:', error);
    
    // Log the failure
    try {
      await logSystemEvent(platform.env.DB, 'error', 'Manual ECFS check failed', 'admin', {
        error: error.message,
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return json({ 
      success: false,
      error: 'Manual check failed',
      details: error.message 
    }, { status: 500 });
  }
} 