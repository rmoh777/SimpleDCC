// Database operations for ECFS integration schema

/**
 * Initialize active dockets table from existing subscriptions
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} Result of the operation
 */
export async function initializeActiveDockets(db) {
  try {
    const result = await db.prepare(`
      INSERT OR IGNORE INTO active_dockets (docket_number, subscribers_count, created_at, updated_at)
      SELECT 
        docket_number, 
        COUNT(*) as count,
        unixepoch() as created_at,
        unixepoch() as updated_at
      FROM subscriptions 
      GROUP BY docket_number
    `).run();
    
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Failed to initialize active dockets:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all active dockets for monitoring
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} Array of active dockets
 */
export async function getActiveDockets(db) {
  try {
    const result = await db.prepare(`
      SELECT * FROM active_dockets 
      WHERE status = 'active' 
      ORDER BY subscribers_count DESC, last_checked ASC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get active dockets:', error);
    return [];
  }
}

/**
 * Get active dockets that have current subscribers (BAU optimization)
 * This prevents processing dockets with no active subscribers
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} Array of active dockets with current subscribers
 */
export async function getActiveDocketsWithSubscribers(db) {
  try {
    const result = await db.prepare(`
      SELECT ad.* FROM active_dockets ad
      WHERE ad.status = 'active' 
      AND EXISTS (
        SELECT 1 FROM subscriptions s 
        WHERE s.docket_number = ad.docket_number
      )
      ORDER BY ad.subscribers_count DESC, ad.last_checked ASC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get active dockets with subscribers:', error);
    return [];
  }
}

/**
 * Update docket statistics after checking for new filings
 * @param {Object} db - Database connection
 * @param {string} docketNumber - Docket number to update
 * @param {Object} stats - Stats object with lastChecked, totalFilings, etc.
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateDocketStats(db, docketNumber, stats) {
  try {
    const result = await db.prepare(`
      UPDATE active_dockets 
      SET 
        last_checked = ?, 
        total_filings = ?, 
        updated_at = ?,
        error_count = CASE WHEN ? THEN error_count + 1 ELSE 0 END,
        status = CASE WHEN error_count > 5 THEN 'error' ELSE 'active' END
      WHERE docket_number = ?
    `).bind(
      stats.lastChecked,
      stats.totalFilings,
      Date.now(),
      stats.hasError || false,
      docketNumber
    ).run();
    
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Failed to update docket stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log system events for monitoring
 * @param {Object} db - Database connection
 * @param {string} level - Log level (info, warning, error, debug)
 * @param {string} message - Log message
 * @param {string} component - Component name (ecfs, ai, email, cron)
 * @param {Object} details - Additional details object
 * @param {string} docketNumber - Optional docket context
 * @param {string} filingId - Optional filing context
 * @returns {Promise<Object>} Result of the operation
 */
export async function logSystemEvent(db, level, message, component, details = null, docketNumber = null, filingId = null) {
  try {
    const result = await db.prepare(`
      INSERT INTO system_logs (level, message, component, details, docket_number, filing_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      level, 
      message, 
      component, 
      details ? JSON.stringify(details) : null,
      docketNumber,
      filingId
    ).run();
    
    return { success: true, insertId: result.meta.last_row_id };
  } catch (error) {
    console.error('Failed to log system event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get system logs with optional filtering
 * @param {Object} db - Database connection
 * @param {number} limit - Maximum number of logs to return
 * @param {string} component - Optional component filter
 * @param {string} level - Optional level filter
 * @returns {Promise<Array>} Array of system logs
 */
export async function getSystemLogs(db, limit = 100, component = null, level = null) {
  try {
    let query = `SELECT * FROM system_logs WHERE 1=1`;
    const params = [];
    
    if (component) {
      query += ` AND component = ?`;
      params.push(component);
    }
    
    if (level) {
      query += ` AND level = ?`;
      params.push(level);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
  } catch (error) {
    console.error('Failed to get system logs:', error);
    return [];
  }
}

/**
 * Store new filings in the database
 * @param {Object} db - Database connection
 * @param {Array} filings - Array of filing objects
 * @returns {Promise<Object>} Result with count of new filings stored
 */
export async function storeFilings(db, filings) {
  try {
    let newFilingsCount = 0;
    
    for (const filing of filings) {
      const result = await db.prepare(`
        INSERT OR IGNORE INTO filings (
          id, docket_number, title, author, filing_type, 
          date_received, filing_url, documents, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        filing.id,
        filing.docket_number,
        filing.title,
        filing.author,
        filing.filing_type,
        filing.date_received,
        filing.filing_url,
        filing.documents ? JSON.stringify(filing.documents) : null,
        filing.raw_data ? JSON.stringify(filing.raw_data) : null
      ).run();
      
      if (result.changes > 0) {
        newFilingsCount++;
      }
    }
    
    return { success: true, newFilingsCount };
  } catch (error) {
    console.error('Failed to store filings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get filings by status
 * @param {Object} db - Database connection
 * @param {string} status - Filing status to filter by
 * @param {number} limit - Maximum number of filings to return
 * @returns {Promise<Array>} Array of filings
 */
export async function getFilingsByStatus(db, status, limit = 100) {
  try {
    const result = await db.prepare(`
      SELECT * FROM filings 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(status, limit).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Failed to get filings by status:', error);
    return [];
  }
}

/**
 * Update filing status and AI summary
 * @param {Object} db - Database connection
 * @param {string} filingId - Filing ID to update
 * @param {string} status - New status
 * @param {string} aiSummary - AI-generated summary
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateFilingStatus(db, filingId, status, aiSummary = null) {
  try {
    const result = await db.prepare(`
      UPDATE filings 
      SET status = ?, ai_summary = ?, processed_at = ?
      WHERE id = ?
    `).bind(status, aiSummary, Date.now(), filingId).run();
    
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Failed to update filing status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get monitoring statistics for dashboard
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} Monitoring statistics
 */
export async function getMonitoringStats(db) {
  try {
    // Get basic counts
    const filingsCount = await db.prepare(`SELECT COUNT(*) as count FROM filings`).first();
    const docketsCount = await db.prepare(`SELECT COUNT(*) as count FROM active_dockets WHERE status = 'active'`).first();
    const pendingCount = await db.prepare(`SELECT COUNT(*) as count FROM filings WHERE status = 'pending'`).first();
    const processingCount = await db.prepare(`SELECT COUNT(*) as count FROM filings WHERE status = 'processing'`).first();
    
    // Get recent errors
    const recentErrors = await db.prepare(`
      SELECT COUNT(*) as count FROM system_logs 
      WHERE level = 'error' AND created_at > ?
    `).bind(Date.now() - 86400000).first(); // Last 24 hours
    
    // Get last check time
    const lastCheck = await db.prepare(`
      SELECT MAX(last_checked) as last_check FROM active_dockets
    `).first();
    
    // Get recent logs
    const recentLogs = await getSystemLogs(db, 10);
    
    // Calculate health status
    const errorRate = (recentErrors.count || 0) / Math.max(1, filingsCount.count || 1);
    let systemHealth = 'healthy';
    if (errorRate > 0.1) systemHealth = 'error';
    else if (errorRate > 0.05) systemHealth = 'warning';
    
    return {
      systemHealth,
      activeJobs: processingCount.count || 0,
      lastCheck: lastCheck.last_check || 0,
      totalFilings: filingsCount.count || 0,
      activeDockets: docketsCount.count || 0,
      recentLogs,
      errorRate: Math.round(errorRate * 100) / 100,
      processingQueue: pendingCount.count || 0
    };
  } catch (error) {
    console.error('Failed to get monitoring stats:', error);
    return {
      systemHealth: 'error',
      activeJobs: 0,
      lastCheck: 0,
      totalFilings: 0,
      activeDockets: 0,
      recentLogs: [],
      errorRate: 1,
      processingQueue: 0
    };
  }
}

/**
 * Clean up old logs to prevent database bloat
 * @param {Object} db - Database connection
 * @param {number} daysToKeep - Number of days of logs to keep
 * @returns {Promise<Object>} Result of the cleanup operation
 */
export async function cleanupOldLogs(db, daysToKeep = 30) {
  try {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const result = await db.prepare(`
      DELETE FROM system_logs 
      WHERE created_at < ? AND level != 'error'
    `).bind(cutoffTime).run();
    
    return { success: true, deletedCount: result.changes };
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return { success: false, error: error.message };
  }
}

// ==============================================
// Phase 2 Card 1: User and Notification Functions
// ==============================================

/**
 * Get users who need notifications for new filings
 * Integrates with existing active dockets system
 * @param {Array} docketNumbers - Array of docket numbers with new filings
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} Array of users who need notifications
 */
export async function getUsersForNotification(docketNumbers, db) {
  try {
    if (!docketNumbers || docketNumbers.length === 0) return [];
    
    const placeholders = docketNumbers.map(() => '?').join(',');
    
    const result = await db.prepare(`
      SELECT DISTINCT 
        u.id, u.email, u.user_tier, u.trial_expires_at,
        s.docket_number, s.frequency, s.last_notified
      FROM users u
      JOIN subscriptions s ON u.id = s.user_id
      WHERE s.docket_number IN (${placeholders})
      ORDER BY u.user_tier DESC, s.frequency ASC
    `).bind(...docketNumbers).all();
    
    return result.results || [];
    
  } catch (error) {
    console.error('Error getting users for notification:', error);
    return [];
  }
}

/**
 * Update user last notified timestamp
 * @param {number} userId - User ID
 * @param {string} docketNumber - Docket number
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} Result of the operation
 */
export async function updateUserLastNotified(userId, docketNumber, db) {
  try {
    const result = await db.prepare(`
      UPDATE subscriptions 
      SET last_notified = ? 
      WHERE user_id = ? AND docket_number = ?
    `).bind(Math.floor(Date.now() / 1000), userId, docketNumber).run();
    
    return { success: true, changes: result.changes };
    
  } catch (error) {
    console.error('Error updating last notified:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get notification queue statistics for admin dashboard
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} Notification queue statistics
 */
export async function getNotificationQueueStats(db) {
  try {
    const stats = await db.prepare(`
      SELECT 
        status,
        digest_type,
        COUNT(*) as count
      FROM notification_queue 
      WHERE created_at > ?
      GROUP BY status, digest_type
      ORDER BY status, digest_type
    `).bind(Math.floor(Date.now() / 1000) - 86400).all(); // Last 24 hours
    
    const pendingCount = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM notification_queue 
      WHERE status = 'pending'
    `).first();
    
    return {
      breakdown: stats.results || [],
      pending_total: pendingCount?.count || 0
    };
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { breakdown: [], pending_total: 0 };
  }
}

/**
 * Get user statistics for admin dashboard
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} User statistics by tier
 */
export async function getUserStats(db) {
  try {
    const tierStats = await db.prepare(`
      SELECT 
        user_tier,
        COUNT(*) as count,
        COUNT(CASE WHEN trial_expires_at > ? THEN 1 END) as active_trials
      FROM users
      GROUP BY user_tier
      ORDER BY user_tier
    `).bind(Math.floor(Date.now() / 1000)).all();
    
    const totalUsers = await db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();
    
    const recentSignups = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > ?
    `).bind(Math.floor(Date.now() / 1000) - 86400).first(); // Last 24 hours
    
    return {
      tier_breakdown: tierStats.results || [],
      total_users: totalUsers?.count || 0,
      recent_signups: recentSignups?.count || 0
    };
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { tier_breakdown: [], total_users: 0, recent_signups: 0 };
  }
}

/**
 * Get enhanced monitoring stats including Phase 2 metrics
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} Enhanced monitoring statistics
 */
export async function getEnhancedMonitoringStats(db) {
  try {
    // Get base monitoring stats
    const baseStats = await getMonitoringStats(db);
    
    // Get Phase 2 specific stats
    const userStats = await getUserStats(db);
    const queueStats = await getNotificationQueueStats(db);
    
    return {
      ...baseStats,
      user_metrics: userStats,
      notification_queue: queueStats
    };
    
  } catch (error) {
    console.error('Error getting enhanced monitoring stats:', error);
    return {
      systemHealth: 'error',
      user_metrics: { tier_breakdown: [], total_users: 0, recent_signups: 0 },
      notification_queue: { breakdown: [], pending_total: 0 }
    };
  }
} 