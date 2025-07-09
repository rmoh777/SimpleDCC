// Storage utility functions and helpers

/**
 * Validate filing data before storage
 */
export function validateFiling(filing) {
  const errors = [];
  
  // Required fields validation
  const requiredFields = ['id', 'docket_number', 'title', 'author', 'filing_type', 'date_received'];
  
  for (const field of requiredFields) {
    if (!filing[field] || String(filing[field]).trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Format validations
  if (filing.docket_number && !/^\d{1,3}-\d{1,3}$/.test(filing.docket_number)) {
    errors.push('Invalid docket number format');
  }
  
  if (filing.date_received && isNaN(Date.parse(filing.date_received))) {
    errors.push('Invalid date_received format');
  }
  
  // Length validations
  if (filing.title && filing.title.length > 500) {
    errors.push('Title too long (max 500 characters)');
  }
  
  if (filing.author && filing.author.length > 200) {
    errors.push('Author too long (max 200 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize filing data for safe storage
 */
export function sanitizeFiling(filing) {
  return {
    id: String(filing.id || '').trim().substring(0, 50),
    docket_number: String(filing.docket_number || '').trim().toUpperCase(),
    title: String(filing.title || '').trim().substring(0, 500),
    author: String(filing.author || '').trim().substring(0, 200),
    filing_type: String(filing.filing_type || '').trim().toLowerCase(),
    date_received: filing.date_received,
    filing_url: String(filing.filing_url || '').trim(),
    documents: filing.documents || null,
    raw_data: filing.raw_data || filing,
    status: filing.status || 'pending'
  };
}

/**
 * Calculate storage metrics for monitoring
 */
export function calculateStorageMetrics(storageResults) {
  const totalOperations = storageResults.reduce((sum, result) => sum + result.totalProcessed, 0);
  const totalNewFilings = storageResults.reduce((sum, result) => sum + result.newFilings, 0);
  const totalDuplicates = storageResults.reduce((sum, result) => sum + result.duplicates, 0);
  const totalErrors = storageResults.reduce((sum, result) => sum + result.errors, 0);
  
  return {
    totalOperations,
    totalNewFilings,
    totalDuplicates,
    totalErrors,
    successRate: totalOperations > 0 ? ((totalOperations - totalErrors) / totalOperations) * 100 : 100,
    deduplicationRate: totalOperations > 0 ? (totalDuplicates / totalOperations) * 100 : 0
  };
}

/**
 * Create storage operation summary for logging
 */
export function createStorageSummary(docketResults) {
  const summary = {
    totalDockets: Object.keys(docketResults).length,
    totalFilings: 0,
    successfulDockets: 0,
    failedDockets: 0,
    details: {}
  };
  
  for (const [docket, result] of Object.entries(docketResults)) {
    summary.totalFilings += result.totalProcessed || 0;
    
    if (result.errors === 0) {
      summary.successfulDockets++;
    } else {
      summary.failedDockets++;
    }
    
    summary.details[docket] = {
      newFilings: result.newFilings || 0,
      duplicates: result.duplicates || 0,
      errors: result.errors || 0
    };
  }
  
  return summary;
} 