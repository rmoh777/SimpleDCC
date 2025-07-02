// Batch processing utilities for large filing operations

/**
 * Process multiple docket filings in optimized batches
 */
export class FilingBatchProcessor {
  constructor(db, options = {}) {
    this.db = db;
    this.batchSize = options.batchSize || 25;
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delayBetweenBatches = options.delayBetweenBatches || 100; // ms
  }
  
  /**
   * Process filings from multiple dockets efficiently
   */
  async processDocketFilings(docketFilingsMap) {
    const results = {};
    const dockets = Object.keys(docketFilingsMap);
    
    console.log(`Batch Processor: Processing ${dockets.length} dockets`);
    
    // Process dockets in parallel but with concurrency limit
    for (let i = 0; i < dockets.length; i += this.maxConcurrent) {
      const docketBatch = dockets.slice(i, i + this.maxConcurrent);
      
      const batchPromises = docketBatch.map(async (docket) => {
        try {
          const filings = docketFilingsMap[docket];
          const result = await this.processDocketBatch(docket, filings);
          results[docket] = result;
        } catch (error) {
          console.error(`Batch processing failed for docket ${docket}:`, error);
          results[docket] = {
            newFilings: 0,
            duplicates: 0,
            errors: filings?.length || 0,
            error: error.message
          };
        }
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between concurrent batches
      if (i + this.maxConcurrent < dockets.length) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }
    
    return results;
  }
  
  /**
   * Process filings for a single docket
   */
  async processDocketBatch(docketNumber, filings) {
    if (!filings || filings.length === 0) {
      return { newFilings: 0, duplicates: 0, errors: 0 };
    }
    
    try {
      // Import the storage function
      const { storeFilings } = await import('./filing-storage.js');
      
      // Store filings for this docket
      const result = await storeFilings(filings, this.db);
      
      console.log(`Batch Processor: Docket ${docketNumber} - ${result.newFilings} new, ${result.duplicates} duplicates`);
      
      return result;
      
    } catch (error) {
      console.error(`Error processing docket ${docketNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Get processing statistics
   */
  static calculateBatchStats(results) {
    const stats = {
      totalDockets: 0,
      totalFilings: 0,
      totalNewFilings: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      successfulDockets: 0,
      failedDockets: 0
    };
    
    for (const [docket, result] of Object.entries(results)) {
      stats.totalDockets++;
      stats.totalFilings += result.totalProcessed || 0;
      stats.totalNewFilings += result.newFilings || 0;
      stats.totalDuplicates += result.duplicates || 0;
      stats.totalErrors += result.errors || 0;
      
      if (result.errors === 0 && !result.error) {
        stats.successfulDockets++;
      } else {
        stats.failedDockets++;
      }
    }
    
    return stats;
  }
}

/**
 * Create batch processor instance with default configuration
 */
export function createBatchProcessor(db, options = {}) {
  return new FilingBatchProcessor(db, {
    batchSize: 25, // Optimized for Cloudflare D1
    maxConcurrent: 3, // Conservative concurrency
    delayBetweenBatches: 100, // 100ms delay
    ...options
  });
} 