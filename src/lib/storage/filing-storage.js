// Enhanced filing storage with batch processing and optimization
import { logSystemEvent } from '$lib/database/db-operations.js';

/**
 * Store new filings in database with advanced deduplication and batch processing
 * @param {Array} filings - Array of filing objects from ECFS
 * @param {Object} db - Cloudflare D1 database instance
 * @returns {Promise<Object>} Storage result with detailed stats
 */
export async function storeFilings(filings, db) {
  if (!filings || filings.length === 0) {
    return {
      newFilings: 0,
      duplicates: 0,
      errors: 0,
      totalProcessed: 0
    };
  }
  
  const startTime = Date.now();
  let newFilings = 0;
  let duplicates = 0;
  let errors = 0;
  
  try {
    // Get existing filing IDs in batches for performance
    const filingIds = filings.map(f => f.id);
    const existingIds = await getExistingFilingIds(db, filingIds);
    
    // Filter out duplicates
    const newFilingsToStore = filings.filter(filing => !existingIds.has(filing.id));
    duplicates = filings.length - newFilingsToStore.length;
    
    if (newFilingsToStore.length === 0) {
      console.log(`Filing Storage: All ${filings.length} filings are duplicates`);
      return { newFilings: 0, duplicates, errors: 0, totalProcessed: filings.length };
    }
    
    // Store new filings in batches for D1 optimization
    const batchSize = 25; // Optimal for Cloudflare D1
    for (let i = 0; i < newFilingsToStore.length; i += batchSize) {
      const batch = newFilingsToStore.slice(i, i + batchSize);
      const batchResult = await storeBatch(db, batch);
      newFilings += batchResult.stored;
      errors += batchResult.errors;
    }
    
    const duration = Date.now() - startTime;
    
    // Log storage operation
    await logSystemEvent(db, 'info', `Filing storage completed`, 'storage', {
      total_checked: filings.length,
      new_filings: newFilings,
      duplicates,
      errors,
      duration_ms: duration,
      batches: Math.ceil(newFilingsToStore.length / batchSize)
    });
    
    console.log(`Filing Storage: Stored ${newFilings} new filings (${duplicates} duplicates, ${errors} errors) in ${duration}ms`);
    
    return {
      newFilings,
      duplicates,
      errors,
      totalProcessed: filings.length,
      duration
    };
    
  } catch (error) {
    console.error('Critical error in filing storage:', error);
    await logSystemEvent(db, 'error', 'Filing storage system failure', 'storage', {
      error: error.message,
      stack: error.stack,
      filing_count: filings.length
    });
    throw error;
  }
}

/**
 * Get existing filing IDs to prevent duplicates
 */
async function getExistingFilingIds(db, filingIds) {
  if (filingIds.length === 0) return new Set();
  
  try {
    // Split into chunks for large ID lists
    const chunkSize = 100;
    const allExistingIds = new Set();
    
    for (let i = 0; i < filingIds.length; i += chunkSize) {
      const chunk = filingIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      
      const result = await db.prepare(`
        SELECT id FROM filings WHERE id IN (${placeholders})
      `).bind(...chunk).all();
      
      result.results?.forEach(row => allExistingIds.add(row.id));
    }
    
    return allExistingIds;
    
  } catch (error) {
    console.error('Error checking existing filing IDs:', error);
    return new Set(); // Return empty set to allow storage attempt
  }
}

/**
 * Store a batch of filings with individual error handling
 */
async function storeBatch(db, filings) {
  let stored = 0;
  let errors = 0;
  
  for (const filing of filings) {
    try {
      await db.prepare(`
        INSERT INTO filings (
          id, docket_number, title, author, filing_type, 
          date_received, filing_url, documents, raw_data, status,
          ai_summary, ai_key_points, ai_stakeholders, ai_regulatory_impact,
          ai_document_analysis, ai_confidence, ai_enhanced, 
          documents_processed, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        filing.id,
        filing.docket_number,
        filing.title,
        filing.author,
        filing.filing_type,
        filing.date_received,
        filing.filing_url,
        filing.documents ? JSON.stringify(filing.documents) : null,
        JSON.stringify(filing.raw_data),
        filing.status || 'pending',
        filing.ai_summary || null,
        filing.ai_key_points ? JSON.stringify(filing.ai_key_points) : null,
        filing.ai_stakeholders || null,
        filing.ai_regulatory_impact || null,
        filing.ai_document_analysis || null,
        filing.ai_confidence || null,
        filing.ai_enhanced ? 1 : 0,
        filing.documents_processed || 0,
        filing.processed_at || null
      ).run();
      
      stored++;
      
    } catch (error) {
      console.error(`Failed to store filing ${filing.id}:`, error);
      errors++;
      
      // Log individual filing errors for debugging
      try {
        await logSystemEvent(db, 'warning', `Failed to store filing ${filing.id}`, 'storage', {
          filing_id: filing.id,
          docket_number: filing.docket_number,
          error: error.message
        });
      } catch (logError) {
        console.error('Failed to log filing storage error:', logError);
      }
    }
  }
  
  return { stored, errors };
}

/**
 * Get recent filings with enhanced filtering and sorting
 */
export async function getRecentFilings(db, options = {}) {
  const {
    docketNumber = null,
    limit = 10,
    status = null,
    hoursBack = 24,
    sortBy = 'date_received',
    sortOrder = 'DESC'
  } = options;
  
  try {
    let query = `
      SELECT id, docket_number, title, author, filing_type, 
             date_received, filing_url, status, ai_summary, created_at
      FROM filings 
      WHERE created_at > ?
    `;
    const params = [Date.now() - (hoursBack * 60 * 60 * 1000)];
    
    if (docketNumber) {
      query += ` AND docket_number = ?`;
      params.push(docketNumber);
    }
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    // Validate sort parameters to prevent SQL injection
    const validSortFields = ['date_received', 'created_at', 'title', 'author'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    } else {
      query += ` ORDER BY date_received DESC`;
    }
    
    query += ` LIMIT ?`;
    params.push(Math.min(limit, 100)); // Cap at 100 for performance
    
    const result = await db.prepare(query).bind(...params).all();
    return result.results || [];
    
  } catch (error) {
    console.error('Error getting recent filings:', error);
    return [];
  }
}

/**
 * Get comprehensive filing statistics for monitoring
 */
export async function getFilingStats(db) {
  try {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM filings',
      recent24h: 'SELECT COUNT(*) as count FROM filings WHERE created_at > ?',
      recent7d: 'SELECT COUNT(*) as count FROM filings WHERE created_at > ?',
      byStatus: 'SELECT status, COUNT(*) as count FROM filings GROUP BY status',
      byDocket: 'SELECT docket_number, COUNT(*) as count FROM filings GROUP BY docket_number ORDER BY count DESC LIMIT 10',
      avgPerDay: `
        SELECT COUNT(*) / 
               (CASE WHEN COUNT(*) > 0 
                THEN MAX((created_at - MIN(created_at)) / 86400000) + 1 
                ELSE 1 END) as avg_per_day
        FROM filings
      `
    };
    
    const now = Date.now();
    const [total, recent24h, recent7d, byStatus, byDocket, avgPerDay] = await Promise.all([
      db.prepare(queries.total).first(),
      db.prepare(queries.recent24h).bind(now - 86400000).first(),
      db.prepare(queries.recent7d).bind(now - 604800000).first(),
      db.prepare(queries.byStatus).all(),
      db.prepare(queries.byDocket).all(),
      db.prepare(queries.avgPerDay).first()
    ]);
    
    // Format status counts
    const statusCounts = {};
    byStatus.results?.forEach(row => {
      statusCounts[row.status] = row.count;
    });
    
    // Format docket counts
    const docketCounts = {};
    byDocket.results?.forEach(row => {
      docketCounts[row.docket_number] = row.count;
    });
    
    return {
      total: total?.count || 0,
      recent24h: recent24h?.count || 0,
      recent7d: recent7d?.count || 0,
      byStatus: statusCounts,
      byDocket: docketCounts,
      avgPerDay: Math.round((avgPerDay?.avg_per_day || 0) * 100) / 100,
      lastUpdated: Date.now()
    };
    
  } catch (error) {
    console.error('Error getting filing stats:', error);
    return {
      total: 0,
      recent24h: 0,
      recent7d: 0,
      byStatus: {},
      byDocket: {},
      avgPerDay: 0,
      lastUpdated: Date.now()
    };
  }
}

/**
 * Update filing status for AI processing pipeline
 */
export async function updateFilingStatus(db, filingId, status, additionalData = {}) {
  try {
    const { aiSummary, processedAt, errorMessage } = additionalData;
    
    let query = 'UPDATE filings SET status = ?';
    const params = [status];
    
    if (aiSummary) {
      query += ', ai_summary = ?';
      params.push(aiSummary);
    }
    
    if (processedAt) {
      query += ', processed_at = ?';
      params.push(processedAt);
    }
    
    query += ' WHERE id = ?';
    params.push(filingId);
    
    const result = await db.prepare(query).bind(...params).run();
    
    if (result.changes === 0) {
      throw new Error(`Filing ${filingId} not found or not updated`);
    }
    
    // Log status change
    await logSystemEvent(db, 'info', `Filing ${filingId} status updated to ${status}`, 'storage', {
      filing_id: filingId,
      old_status: 'unknown', // Would need to query first to get old status
      new_status: status,
      has_ai_summary: !!aiSummary,
      error_message: errorMessage
    });
    
    return { success: true, updated: result.changes };
    
  } catch (error) {
    console.error(`Error updating filing ${filingId} status:`, error);
    
    // Log the error
    await logSystemEvent(db, 'error', `Failed to update filing ${filingId} status`, 'storage', {
      filing_id: filingId,
      target_status: status,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Get filings pending AI processing
 */
export async function getPendingFilingsForProcessing(db, limit = 50) {
  try {
    const result = await db.prepare(`
      SELECT id, docket_number, title, author, filing_type, 
             date_received, filing_url, documents, raw_data
      FROM filings 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT ?
    `).bind(limit).all();
    
    return result.results || [];
    
  } catch (error) {
    console.error('Error getting pending filings:', error);
    return [];
  }
}

/**
 * Get filings for user notifications (by email and dockets)
 */
export async function getFilingsForNotification(db, userEmail, sinceTimestamp) {
  try {
    // Get user's subscribed dockets
    const subscriptionsResult = await db.prepare(`
      SELECT docket_number FROM subscriptions WHERE email = ?
    `).bind(userEmail).all();
    
    const docketNumbers = subscriptionsResult.results?.map(row => row.docket_number) || [];
    
    if (docketNumbers.length === 0) {
      return [];
    }
    
    // Get filings for these dockets since the timestamp
    const placeholders = docketNumbers.map(() => '?').join(',');
    const query = `
      SELECT id, docket_number, title, author, filing_type, 
             date_received, filing_url, ai_summary, status
      FROM filings 
      WHERE docket_number IN (${placeholders}) 
        AND created_at > ? 
        AND status = 'completed'
      ORDER BY date_received DESC
    `;
    
    const result = await db.prepare(query).bind(...docketNumbers, sinceTimestamp).all();
    
    return result.results || [];
    
  } catch (error) {
    console.error(`Error getting filings for notification (${userEmail}):`, error);
    return [];
  }
}

/**
 * Clean up old filings (retention policy)
 */
export async function cleanupOldFilings(db, retentionDays = 365) {
  try {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // Get count of filings to be deleted
    const countResult = await db.prepare(`
      SELECT COUNT(*) as count FROM filings WHERE created_at < ?
    `).bind(cutoffTime).first();
    
    const filingsToDelete = countResult?.count || 0;
    
    if (filingsToDelete === 0) {
      return { deleted: 0, message: 'No old filings to clean up' };
    }
    
    // Delete old filings
    const result = await db.prepare(`
      DELETE FROM filings WHERE created_at < ?
    `).bind(cutoffTime).run();
    
    // Log cleanup operation
    await logSystemEvent(db, 'info', `Cleaned up ${result.changes} old filings`, 'storage', {
      deleted_count: result.changes,
      retention_days: retentionDays,
      cutoff_time: cutoffTime
    });
    
    console.log(`Filing cleanup: Deleted ${result.changes} filings older than ${retentionDays} days`);
    
    return {
      deleted: result.changes,
      message: `Deleted ${result.changes} filings older than ${retentionDays} days`
    };
    
  } catch (error) {
    console.error('Error cleaning up old filings:', error);
    await logSystemEvent(db, 'error', 'Filing cleanup failed', 'storage', {
      error: error.message,
      retention_days: retentionDays
    });
    throw error;
  }
}

/**
 * Batch update docket statistics after filing storage
 */
export async function updateDocketStatistics(db, docketUpdates) {
  try {
    for (const [docketNumber, stats] of Object.entries(docketUpdates)) {
      await db.prepare(`
        UPDATE active_dockets 
        SET total_filings = total_filings + ?, 
            last_checked = ?, 
            updated_at = ?
        WHERE docket_number = ?
      `).bind(
        stats.newFilings || 0,
        stats.lastChecked || Date.now(),
        Date.now(),
        docketNumber
      ).run();
    }
    
    console.log(`Updated statistics for ${Object.keys(docketUpdates).length} dockets`);
    
  } catch (error) {
    console.error('Error updating docket statistics:', error);
    throw error;
  }
} 