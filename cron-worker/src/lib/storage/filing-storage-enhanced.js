// Enhanced Filing Storage with AI Processing Integration
import { storeFilings as storeFilingsOriginal } from './filing-storage.js';
import { processFilingBatchEnhanced } from '../ai/gemini-enhanced.js';
import { identifyNewFilings } from '../fcc/ecfs-enhanced-client.js';

/**
 * Store filings with enhanced AI processing
 * @param {Array} filings - Filings from enhanced ECFS client
 * @param {Object} db - Database connection
 * @param {Object} env - Environment variables
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Enhanced storage results
 */
export async function storeFilingsEnhanced(filings, db, env, options = {}) {
  try {
    const { enableAIProcessing = true, aiProcessingMode = 'batch' } = options;
    
    console.log(`💾 Enhanced filing storage: ${filings.length} filings`);
    
    // Step 1: Identify truly new filings using enhanced deduplication
    const newFilings = await identifyNewFilings(filings, db);
    
    if (newFilings.length === 0) {
      console.log(`✅ No new filings to process`);
      return {
        newFilings: 0,
        duplicates: filings.length,
        aiProcessed: 0,
        errors: 0,
        totalProcessed: filings.length,
        enhanced: true
      };
    }
    
    console.log(`🔍 Found ${newFilings.length} new filings for enhanced processing`);
    
    // Step 2: Enhanced AI Processing (if enabled)
    let processedFilings = newFilings;
    let aiProcessedCount = 0;
    
    if (enableAIProcessing && env.GEMINI_API_KEY) {
      console.log(`🤖 Starting enhanced AI processing for ${newFilings.length} filings`);
      
      try {
        if (aiProcessingMode === 'batch') {
          // Batch process all filings
          processedFilings = await processFilingBatchEnhanced(newFilings, env, {
            maxConcurrent: 2,
            delayBetween: 1000
          });
        } else {
          // Process individually
          processedFilings = [];
          for (const filing of newFilings) {
            const { processFilingEnhanced } = await import('../ai/gemini-enhanced.js');
            const processed = await processFilingEnhanced(filing, env);
            processedFilings.push(processed);
            
            // Small delay between individual processing
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        aiProcessedCount = processedFilings.filter(f => f.ai_enhanced).length;
        console.log(`✅ Enhanced AI processing complete: ${aiProcessedCount}/${newFilings.length} successfully enhanced`);
        
      } catch (aiError) {
        console.error('❌ Enhanced AI processing failed, storing with basic processing:', aiError);
        // Continue with original filings if AI fails
        processedFilings = newFilings.map(f => ({
          ...f,
          ai_summary: `AI processing failed: ${aiError.message}`,
          ai_enhanced: false,
          status: 'completed_basic'
        }));
      }
    } else {
      console.log(`ℹ️ AI processing disabled or API key missing`);
      processedFilings = newFilings.map(f => ({
        ...f,
        status: 'completed_basic',
        ai_enhanced: false
      }));
    }
    
    // Step 3: Store processed filings using original storage system
    const storageResult = await storeFilingsOriginal(processedFilings, db);
    
    // Step 4: Log enhanced processing metrics
    await logEnhancedProcessingMetrics(db, {
      totalFilings: filings.length,
      newFilings: newFilings.length,
      aiProcessed: aiProcessedCount,
      storageResult: storageResult,
      enhanced: true
    });
    
    return {
      ...storageResult,
      aiProcessed: aiProcessedCount,
      enhanced: true,
      enhancementRate: newFilings.length > 0 ? (aiProcessedCount / newFilings.length) * 100 : 0
    };
    
  } catch (error) {
    console.error('❌ Enhanced filing storage failed:', error);
    
    // Fallback to original storage system
    console.log(`🔄 Falling back to original storage system`);
    const fallbackResult = await storeFilingsOriginal(filings, db);
    
    return {
      ...fallbackResult,
      aiProcessed: 0,
      enhanced: false,
      fallback: true,
      error: error.message
    };
  }
}

/**
 * Log enhanced processing metrics for monitoring
 */
async function logEnhancedProcessingMetrics(db, metrics) {
  try {
    const { logSystemEvent } = await import('../database/db-operations.js');
    
    await logSystemEvent(db, 'info', 'Enhanced filing processing completed', 'ai-enhanced', {
      total_filings: metrics.totalFilings,
      new_filings: metrics.newFilings,
      ai_processed: metrics.aiProcessed,
      storage_new: metrics.storageResult.newFilings,
      storage_duplicates: metrics.storageResult.duplicates,
      enhancement_rate: metrics.newFilings > 0 ? (metrics.aiProcessed / metrics.newFilings) * 100 : 0,
      enhanced: metrics.enhanced,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Failed to log enhanced metrics:', error);
  }
}

/**
 * Get enhanced processing statistics
 */
export async function getEnhancedProcessingStats(db) {
  try {
    // Get AI enhancement statistics
    const enhancedFilings = await db.prepare(`
      SELECT 
        COUNT(*) as total_enhanced,
        COUNT(CASE WHEN ai_enhanced = 1 THEN 1 END) as ai_enhanced_count,
        AVG(CASE WHEN ai_enhanced = 1 THEN 1 ELSE 0 END) as enhancement_rate
      FROM filings 
      WHERE created_at > ?
    `).bind(Date.now() - 86400000).first(); // Last 24 hours
    
    // Get document processing statistics
    const documentStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_with_docs,
        AVG(documents_processed) as avg_docs_processed
      FROM filings 
      WHERE documents_processed > 0 
        AND created_at > ?
    `).bind(Date.now() - 86400000).first();
    
    return {
      enhanced_filings: enhancedFilings?.ai_enhanced_count || 0,
      total_recent: enhancedFilings?.total_enhanced || 0,
      enhancement_rate: Math.round((enhancedFilings?.enhancement_rate || 0) * 100),
      documents_processed: documentStats?.total_with_docs || 0,
      avg_docs_per_filing: Math.round(documentStats?.avg_docs_processed || 0),
      last_updated: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Error getting enhanced processing stats:', error);
    return {
      enhanced_filings: 0,
      total_recent: 0,
      enhancement_rate: 0,
      documents_processed: 0,
      avg_docs_per_filing: 0,
      last_updated: Date.now(),
      error: error.message
    };
  }
} 