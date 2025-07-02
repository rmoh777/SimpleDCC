// System health monitoring utilities

/**
 * Check overall system health
 * @param {Object} db - Database instance
 * @returns {Promise<Object>} Health status object
 */
export async function checkSystemHealth(db) {
  try {
    const checks = await Promise.allSettled([
      checkDatabaseHealth(db),
      checkECFSAPIHealth(),
      checkRecentActivity(db)
    ]);
    
    const [dbHealth, apiHealth, activityHealth] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'error', message: result.reason?.message }
    );
    
    // Determine overall health
    const allHealthy = [dbHealth, apiHealth, activityHealth].every(check => check.status === 'healthy');
    const hasWarnings = [dbHealth, apiHealth, activityHealth].some(check => check.status === 'warning');
    
    let overallStatus = 'healthy';
    if (!allHealthy) {
      overallStatus = hasWarnings ? 'warning' : 'error';
    }
    
    return {
      status: overallStatus,
      checks: {
        database: dbHealth,
        ecfsAPI: apiHealth,
        recentActivity: activityHealth
      },
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      status: 'error',
      message: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(db) {
  try {
    const start = Date.now();
    await db.prepare('SELECT 1').first();
    const responseTime = Date.now() - start;
    
    if (responseTime > 5000) {
      return { status: 'warning', message: `Slow database response: ${responseTime}ms` };
    }
    
    return { status: 'healthy', responseTime };
    
  } catch (error) {
    return { status: 'error', message: `Database connection failed: ${error.message}` };
  }
}

/**
 * Check ECFS API availability
 */
async function checkECFSAPIHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://publicapi.fcc.gov/ecfs/filings', {
      signal: controller.signal,
      method: 'HEAD'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { status: 'healthy', message: 'ECFS API responding' };
    } else {
      return { status: 'warning', message: `ECFS API returned ${response.status}` };
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: 'error', message: 'ECFS API timeout' };
    }
    return { status: 'error', message: `ECFS API error: ${error.message}` };
  }
}

/**
 * Check for recent system activity
 */
async function checkRecentActivity(db) {
  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM system_logs 
      WHERE created_at > ? AND level IN ('info', 'warning', 'error')
    `).bind(Date.now() - 3600000).first(); // Last hour
    
    const activityCount = result?.count || 0;
    
    if (activityCount === 0) {
      return { status: 'warning', message: 'No recent system activity detected' };
    }
    
    return { status: 'healthy', activityCount };
    
  } catch (error) {
    return { status: 'error', message: `Activity check failed: ${error.message}` };
  }
} 