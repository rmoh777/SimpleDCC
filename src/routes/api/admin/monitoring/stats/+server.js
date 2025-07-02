import { json } from '@sveltejs/kit';
import { getFilingStats } from '$lib/storage/filing-storage.js';
import { checkSystemHealth } from '$lib/monitoring/system-health.js';
import { getActiveDockets, getMonitoringStats } from '$lib/database/db-operations.js';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Get comprehensive system statistics
    const [filingStats, systemHealth, activeDockets, monitoringStats] = await Promise.all([
      getFilingStats(db),
      checkSystemHealth(db),
      getActiveDockets(db),
      getMonitoringStats(db)
    ]);
    
    // Calculate additional metrics
    const [jobStats, lastCheckTime] = await Promise.all([
      getActiveJobStats(db),
      getLastCheckTime(db)
    ]);
    
    // Build comprehensive stats response
    const stats = {
      // Core system metrics
      systemHealth: systemHealth.status,
      activeJobs: jobStats.activeCount,
      lastCheck: lastCheckTime,
      totalFilings: filingStats.total,
      activeDockets: activeDockets.length,
      
      // Detailed statistics
      stats: {
        pendingFilings: filingStats.byStatus.pending || 0,
        processedToday: filingStats.recent24h,
        errorRate: monitoringStats.errorRate || 0
      },
      
      // Health check details
      healthChecks: systemHealth.checks,
      
      // Performance metrics
      performance: {
        avgResponseTime: systemHealth.checks?.database?.responseTime || 0,
        apiUptime: calculateUptime(systemHealth.checks?.ecfsAPI),
        dbConnections: jobStats.dbConnections
      }
    };
    
    return json(stats);
    
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    return json({ 
      error: 'Failed to retrieve monitoring statistics',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper functions
async function getActiveJobStats(db) {
  try {
    const result = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as activeCount,
        COUNT(*) as totalJobs
      FROM filings 
      WHERE created_at > ?
    `).bind(Date.now() - 86400000).first(); // Last 24 hours
    
    return {
      activeCount: result?.activeCount || 0,
      totalJobs: result?.totalJobs || 0,
      dbConnections: 1 // Simplified for Cloudflare D1
    };
  } catch (error) {
    console.error('Error getting job stats:', error);
    return { activeCount: 0, totalJobs: 0, dbConnections: 0 };
  }
}

async function getLastCheckTime(db) {
  try {
    const result = await db.prepare(`
      SELECT MAX(last_checked) as lastCheck 
      FROM active_dockets 
      WHERE last_checked > 0
    `).first();
    
    return result?.lastCheck || 0;
  } catch (error) {
    console.error('Error getting last check time:', error);
    return 0;
  }
}

function calculateUptime(apiHealthCheck) {
  // Calculate API uptime based on health status
  if (!apiHealthCheck) return 95; // Default assumption
  
  switch (apiHealthCheck.status) {
    case 'healthy':
      return 99;
    case 'warning':
      return 85;
    case 'error':
      return 10;
    default:
      return 95;
  }
} 