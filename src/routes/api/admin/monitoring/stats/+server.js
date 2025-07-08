import { json } from '@sveltejs/kit';
import { getMonitoringStats, getActiveDockets } from '$lib/database/db-operations.js';
import { getFilingStats, getRecentFilings } from '$lib/storage/filing-storage.js';
import { getEnhancedProcessingStats } from '$lib/storage/filing-storage-enhanced.js';
import { ensureDatabaseSchema } from '$lib/database/auto-migration.js';
import { checkSystemHealth } from '$lib/monitoring/system-health.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
};

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    
    const db = platform.env.DB;
    
    // STEP 1: Auto-migration check (ensures database schema is valid)
    console.log('🔧 Running auto-migration check...');
    const migrationResult = await ensureDatabaseSchema(db);
    
    if (!migrationResult.success) {
      console.error('Auto-migration failed:', migrationResult.message);
      return json({ 
        error: 'Database schema issue',
        details: migrationResult.message,
        migrationRequired: true
      }, { status: 500, headers: corsHeaders });
    }

    if (migrationResult.migrationRan) {
      console.log('✅ Auto-migration completed:', migrationResult.message);
    }

    // STEP 2: Gather all monitoring statistics (now safe with valid schema)
    const [
      filingStats,
      lastCheckTime, 
      activeDockets,
      monitoringStats,
      jobStats,
      activityLogs
    ] = await Promise.all([
      getFilingStats(db).catch(err => ({ error: err.message })),
      getLastCheckTime(db).catch(err => ({ error: err.message })),
      getActiveDockets(db).catch(err => []),
      getMonitoringStats(db).catch(err => ({ error: err.message })),
      getActiveJobStats(db).catch(err => ({ error: err.message })),
      getRecentFilings(db, 10).catch(err => ({ error: err.message }))
    ]);

    // Build response with migration info
    const response = {
      migration: {
        checked: true,
        migrationRan: migrationResult.migrationRan || false,
        message: migrationResult.message
      },
      system: {
        health: determineSystemHealth([filingStats, monitoringStats, jobStats]),
        lastUpdated: Date.now()
      },
      filings: filingStats,
      lastCheck: lastCheckTime,
      dockets: {
        active: activeDockets.length,
        list: activeDockets
      },
      monitoring: monitoringStats,
      jobs: jobStats,
      recentActivity: activityLogs
    };

    return json(response, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Failed to get monitoring stats:', error);
    return json({ 
      error: 'Failed to retrieve monitoring stats',
      details: error.message 
    }, { status: 500, headers: corsHeaders });
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

function determineSystemHealth(stats) {
  // Implement the logic to determine system health based on the provided stats
  // This is a placeholder and should be replaced with the actual implementation
  return 'healthy';
} 