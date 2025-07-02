import { json } from '@sveltejs/kit';
import { getFilingStats, getPendingFilingsForProcessing, cleanupOldFilings } from '$lib/storage/filing-storage.js';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Get comprehensive storage statistics
    const [filingStats, pendingFilings] = await Promise.all([
      getFilingStats(db),
      getPendingFilingsForProcessing(db, 10) // Get sample of pending filings
    ]);
    
    const storageInfo = {
      statistics: filingStats,
      pendingCount: pendingFilings.length,
      samplePending: pendingFilings.slice(0, 5).map(f => ({
        id: f.id,
        docket_number: f.docket_number,
        title: f.title.substring(0, 100) + (f.title.length > 100 ? '...' : ''),
        created_at: f.created_at
      })),
      systemHealth: {
        status: filingStats.total > 0 ? 'healthy' : 'warning',
        message: filingStats.total === 0 ? 'No filings in database' : 'Storage system operational'
      }
    };
    
    return json(storageInfo);
    
  } catch (error) {
    console.error('Error getting storage info:', error);
    return json({ 
      error: 'Failed to retrieve storage information',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST({ platform, request, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { action, params = {} } = await request.json();
    const db = platform.env.DB;
    
    switch (action) {
      case 'cleanup':
        const retentionDays = params.retentionDays || 365;
        const cleanupResult = await cleanupOldFilings(db, retentionDays);
        return json({
          success: true,
          action: 'cleanup',
          result: cleanupResult
        });
        
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Storage action failed:', error);
    return json({ 
      error: 'Storage action failed',
      details: error.message 
    }, { status: 500 });
  }
} 