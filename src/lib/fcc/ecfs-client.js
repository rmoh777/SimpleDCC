// ECFS API Client - Extracted from proven patterns
// Adapted for multi-user, multi-docket SimpleDCC system

const ECFS_BASE_URL = 'https://publicapi.fcc.gov/ecfs/filings';
const DEFAULT_LOOKBACK_HOURS = 2;
const MAX_FILINGS_PER_REQUEST = 20;

/**
 * Fetch recent filings for a specific docket
 * @param {string} docketNumber - Format: "XX-XXX" (e.g., "23-108")
 * @param {number} lookbackHours - Hours to look back for new filings
 * @param {Object} env - Cloudflare environment variables (platform.env)
 * @returns {Promise<Array>} Array of filing objects
 */
export async function fetchECFSFilings(docketNumber, lookbackHours = DEFAULT_LOOKBACK_HOURS, env) {
  try {
    // Validate API key is available
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    // Calculate lookback date for API query (single date, not range)
    const sinceDate = new Date(Date.now() - (lookbackHours * 60 * 60 * 1000));
    
    // Format date for FCC API (YYYY-MM-DD) - EXACT format from ECFS rules
    const sinceDateStr = sinceDate.toISOString().split('T')[0];
    
    // Build API URL with parameters - EXACT pattern from ECFS rules
    const params = new URLSearchParams({
      'api_key': apiKey,
      'proceedings.name': docketNumber,
      'received_from': sinceDateStr,
      'sort': 'date_disseminated,DESC',
      'per_page': '20'
    });
    
    const url = `${ECFS_BASE_URL}?${params.toString()}`;
    
    // 🐛 DEBUG: Comprehensive logging for 400 errors
    console.log('=== ECFS API DEBUG START ===');
    console.log(`🎯 Docket: ${docketNumber}`);
    console.log(`📅 Received From: ${sinceDateStr} (${lookbackHours}h lookback)`);
    console.log(`🔗 Base URL: ${ECFS_BASE_URL}`);
    console.log('📋 Query Parameters:');
    for (const [key, value] of params.entries()) {
      if (key === 'api_key') {
        console.log(`  ${key}: [API_KEY_HIDDEN]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    console.log(`🌐 Full URL: ${url.replace(apiKey, '[API_KEY]')}`);
    
    const headers = {
      'User-Agent': 'SimpleDCC/1.0 (Regulatory Monitoring Service)',
      'Accept': 'application/json'
    };
    console.log('📤 Headers:', headers);
    
    // Make API request with timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // Get the full error response body for debugging
      let errorBody = 'Unable to read error response';
      try {
        errorBody = await response.text();
        console.log('❌ Error Response Body:', errorBody);
      } catch (e) {
        console.log('❌ Could not read error response body:', e.message);
      }
      
      console.log('=== ECFS API DEBUG END (ERROR) ===');
      throw new Error(`ECFS API error: ${response.status} ${response.statusText} - Body: ${errorBody}`);
    }
    
    console.log('✅ Request successful, parsing response...');
    
    const data = await response.json();
    
    // 🔍 DEBUG: Log actual response structure to identify the correct property
    console.log('📊 Response structure keys:', Object.keys(data));
    console.log('📊 Response data sample:', {
      hasFilings: 'filings' in data,
      hasFiling: 'filing' in data,
      filingsLength: data.filings?.length || 'N/A',
      filingLength: data.filing?.length || 'N/A'
    });
    
    console.log('=== ECFS API DEBUG END (SUCCESS) ===');
    
    // 🚨 CRITICAL FIX: API returns 'filing' (singular) not 'filings' (plural)
    const filings = data.filing || data.filings || [];
    const parsedFilings = filings
      .slice(0, MAX_FILINGS_PER_REQUEST) // Limit results
      .map(filing => parseECFSFiling(filing, docketNumber))
      .filter(filing => filing !== null); // Remove invalid filings
    
    console.log(`ECFS: Found ${parsedFilings.length} filings for docket ${docketNumber}`);
    return parsedFilings;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`ECFS API timeout for docket ${docketNumber}`);
    }
    
    console.error(`ECFS API error for docket ${docketNumber}:`, error);
    throw new Error(`Failed to fetch ECFS filings: ${error.message}`);
  }
}

/**
 * Parse and validate a single ECFS filing
 * Defensive programming against API inconsistencies
 */
export function parseECFSFiling(rawFiling, docketNumber) {
  try {
    // Validate required fields
    if (!rawFiling || typeof rawFiling !== 'object') {
      console.warn('Invalid filing object:', rawFiling);
      return null;
    }
    
    const requiredFields = ['id_submission', 'date_received', 'type_of_filing'];
    for (const field of requiredFields) {
      if (!rawFiling[field]) {
        console.warn(`Missing required field ${field} in filing:`, rawFiling);
        return null;
      }
    }
    
    // Extract and clean filing data
    const filing = {
      id: String(rawFiling.id_submission || '').trim(),
      docket_number: docketNumber,
      title: cleanString(rawFiling.brief_comment_summary || rawFiling.description_of_filing || 'Untitled Filing'),
      author: cleanString(rawFiling.name_of_filer || rawFiling.contact_name || 'Unknown Filer'),
      filing_type: cleanString(rawFiling.type_of_filing || 'unknown'),
      date_received: cleanString(rawFiling.date_received || ''),
      filing_url: `https://www.fcc.gov/ecfs/filing/${rawFiling.id_submission}`,
      documents: extractDocuments(rawFiling),
      raw_data: rawFiling,
      status: 'pending'
    };
    
    // Validate final filing object
    if (!filing.id || !filing.date_received) {
      console.warn('Filing missing critical data after parsing:', filing);
      return null;
    }
    
    return filing;
    
  } catch (error) {
    console.error('Error parsing ECFS filing:', error, rawFiling);
    return null;
  }
}

/**
 * Extract document information from filing
 * Note: Document URL structure still needs investigation
 */
function extractDocuments(rawFiling) {
  try {
    const documents = [];
    
    // Try multiple possible document field patterns
    const documentSources = [
      rawFiling.documents,
      rawFiling.attachments,
      rawFiling.text_data,
      rawFiling.express_comment_text
    ];
    
    for (const source of documentSources) {
      if (source && Array.isArray(source)) {
        documents.push(...source);
      } else if (source && typeof source === 'string' && source.trim()) {
        documents.push({ text_content: source.trim() });
      }
    }
    
    return documents.length > 0 ? documents : null;
    
  } catch (error) {
    console.warn('Error extracting documents:', error);
    return null;
  }
}

/**
 * Clean and validate string data from ECFS API
 */
function cleanString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ').substring(0, 500); // Limit length
}

/**
 * Fetch filings for multiple dockets (main function for SimpleDCC)
 * @param {Array<string>} docketNumbers - Array of docket numbers
 * @param {number} lookbackHours - Hours to look back
 * @param {Object} env - Cloudflare environment variables (platform.env)
 * @returns {Promise<Array>} Combined array of all filings
 */
export async function fetchMultipleDockets(docketNumbers, lookbackHours = DEFAULT_LOOKBACK_HOURS, env) {
  const allFilings = [];
  const errors = [];
  
  console.log(`ECFS: Checking ${docketNumbers.length} dockets for new filings`);
  console.log(`🎯 Dockets to check: ${docketNumbers.join(', ')}`);
  
  // Process dockets sequentially to avoid rate limiting
  for (let i = 0; i < docketNumbers.length; i++) {
    const docketNumber = docketNumbers[i];
    console.log(`\n🔄 Processing docket ${i + 1}/${docketNumbers.length}: ${docketNumber}`);
    
    try {
      const filings = await fetchECFSFilings(docketNumber, lookbackHours, env);
      allFilings.push(...filings);
      console.log(`✅ Docket ${docketNumber}: Found ${filings.length} filings`);
      
      // Small delay between requests to be respectful to FCC API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to fetch docket ${docketNumber}:`, error.message);
      console.error(`   Full error:`, error);
      errors.push({ docket: docketNumber, error: error.message });
    }
  }
  
  console.log(`ECFS: Retrieved ${allFilings.length} total filings across all dockets`);
  
  if (errors.length > 0) {
    console.warn(`ECFS: ${errors.length} dockets had errors:`, errors);
  }
  
  return {
    filings: allFilings,
    errors: errors,
    stats: {
      totalDockets: docketNumbers.length,
      successfulDockets: docketNumbers.length - errors.length,
      totalFilings: allFilings.length
    }
  };
}

/**
 * Validate docket number format
 */
export function isValidDocketNumber(docketNumber) {
  if (!docketNumber || typeof docketNumber !== 'string') return false;
  return /^\d{1,3}-\d{1,3}$/.test(docketNumber.trim());
}

/**
 * Get rate limiting delay based on API response
 */
export function getRateLimitDelay(response) {
  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
  const rateLimitReset = response.headers.get('X-RateLimit-Reset');
  
  if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
    // If close to rate limit, add extra delay
    return 5000; // 5 seconds
  }
  
  return 1000; // Default 1 second delay
} 