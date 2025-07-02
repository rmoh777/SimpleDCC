// Filing storage and deduplication for SimpleDCC
import { logSystemEvent } from '../database/db-operations.js';

/**
 * Store new filings in database with deduplication
 * @param {Array} filings - Array of filing objects
 * @param {Object} db - Cloudflare D1 database instance
 * @returns {Promise<number>} Number of new filings stored
 */
export async function storeFilings(filings, db) {
  if (!filings || filings.length === 0) {
    return 0;
  }
  
  try {
    // Get existing filing IDs to prevent duplicates
    const filingIds = filings.map(f => f.id);
    const placeholders = filingIds.map(() => '?').join(',');
    
    const existingResult = await db.prepare(`
      SELECT id FROM filings WHERE id IN (${placeholders})
    `).bind(...filingIds).all();
    
    const existingIds = new Set(existingResult.results.map(row => row.id));
    
    // Filter out duplicates
    const newFilings = filings.filter(filing => !existingIds.has(filing.id));
    
    if (newFilings.length === 0) {
      console.log('No new filings to store (all duplicates)');
      return 0;
    }
    
    // Store new filings
    let storedCount = 0;
    for (const filing of newFilings) {
      try {
        await db.prepare(`
          INSERT INTO filings (
            id, docket_number, title, author, filing_type, 
            date_received, filing_url, documents, raw_data, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          filing.status
        ).run();
        
        storedCount++;
        
      } catch (error) {
        console.error(`Failed to store filing ${filing.id}:`, error);
        await logSystemEvent(db, 'error', `Failed to store filing ${filing.id}`, 'storage', {
          filing_id: filing.id,
          error: error.message
        });
      }
    }
    
    console.log(`Stored ${storedCount} new filings in database`);
    
    // Log successful storage
    await logSystemEvent(db, 'info', `Stored ${storedCount} new filings`, 'storage', {
      total_checked: filings.length,
      new_filings: storedCount,
      duplicates: filings.length - newFilings.length
    });
    
    return storedCount;
    
  } catch (error) {
    console.error('Error storing filings:', error);
    await logSystemEvent(db, 'error', 'Failed to store filings batch', 'storage', {
      error: error.message,
      filing_count: filings.length
    });
    throw error;
  }
}

/**
 * Get recent filings for a specific docket
 */
export async function getRecentFilings(db, docketNumber, limit = 10) {
  try {
    const result = await db.prepare(`
      SELECT * FROM filings 
      WHERE docket_number = ? 
      ORDER BY date_received DESC, created_at DESC 
      LIMIT ?
    `).bind(docketNumber, limit).all();
    
    return result.results || [];
    
  } catch (error) {
    console.error(`Error getting recent filings for ${docketNumber}:`, error);
    return [];
  }
}

/**
 * Get filing statistics for monitoring dashboard
 */
export async function getFilingStats(db) {
  try {
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total FROM filings
    `).first();
    
    const recentResult = await db.prepare(`
      SELECT COUNT(*) as recent FROM filings 
      WHERE created_at > ?
    `).bind(Date.now() - 86400000).first(); // 24 hours
    
    const statusResult = await db.prepare(`
      SELECT status, COUNT(*) as count FROM filings 
      GROUP BY status
    `).all();
    
    const statusCounts = {};
    statusResult.results?.forEach(row => {
      statusCounts[row.status] = row.count;
    });
    
    return {
      total: totalResult?.total || 0,
      recent24h: recentResult?.recent || 0,
      byStatus: statusCounts
    };
    
  } catch (error) {
    console.error('Error getting filing stats:', error);
    return {
      total: 0,
      recent24h: 0,
      byStatus: {}
    };
  }
}

/**
 * Update filing status (for AI processing pipeline)
 */
export async function updateFilingStatus(db, filingId, status, aiSummary = null) {
  try {
    if (aiSummary) {
      await db.prepare(`
        UPDATE filings 
        SET status = ?, ai_summary = ?, processed_at = ? 
        WHERE id = ?
      `).bind(status, aiSummary, Date.now(), filingId).run();
    } else {
      await db.prepare(`
        UPDATE filings 
        SET status = ? 
        WHERE id = ?
      `).bind(status, filingId).run();
    }
    
  } catch (error) {
    console.error(`Error updating filing ${filingId} status:`, error);
    throw error;
  }
} 