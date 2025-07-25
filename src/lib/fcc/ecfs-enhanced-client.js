import { env } from '$env/dynamic/private';

// Enhanced ECFS Client - Last 50 Filings Approach with Direct Document Access
// Based on successful API test: https://publicapi.fcc.gov/ecfs/filings?api_key=...

const ECFS_BASE_URL = 'https://publicapi.fcc.gov/ecfs/filings';
const DEFAULT_LIMIT = 50; // Get last 50 filings per docket

/**
 * Enhanced ECFS client with direct document URL access
 * @param {string} docketNumber - FCC docket number (e.g., '07-114')
 * @param {number} limit - Number of recent filings to fetch (default: 50)
 * @param {Object} passedEnv - Environment variables passed from caller (optional)
 * @returns {Promise<Array>} Array of filing objects with direct document URLs
 */
export async function fetchLatestFilings(docketNumber, limit = DEFAULT_LIMIT, passedEnv) {
  try {
    // Use SvelteKit native env with fallback support for backwards compatibility
    const apiKey = env.ECFS_API_KEY || passedEnv?.ECFS_API_KEY || process.env.ECFS_API_KEY;
    if (!apiKey) {
      console.error('🔍 Environment check:', {
        svelteKitEnvHasKey: !!env.ECFS_API_KEY,
        passedEnvKeys: passedEnv ? Object.keys(passedEnv) : 'passedEnv is null',
        processEnvHasKey: !!process.env.ECFS_API_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    // Build the exact URL format that works (confirmed by testing)
    const url = `${ECFS_BASE_URL}?` +
      `api_key=${apiKey}` +
      `&proceedings.name=${docketNumber}` +
      `&limit=${limit}` +
      `&sort=date_submission,DESC`;
    
    console.log(`🔍 Enhanced ECFS: Fetching last ${limit} filings for docket ${docketNumber}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DocketCC/2.0 (Enhanced Regulatory Monitoring Service)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Enhanced ECFS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // 🔍 DEBUG: Log raw API response structure to identify document fields
    console.log(`🔍 RAW FCC API RESPONSE STRUCTURE:`);
    console.log(`📊 Response keys:`, Object.keys(data));
    
    // API returns 'filing' array (confirmed from successful test)
    const filings = data.filing || [];
    console.log(`✅ Enhanced ECFS: Found ${filings.length} filings for docket ${docketNumber}`);
    
    // 🔍 DEBUG: Log first filing structure if available
    if (filings.length > 0) {
      console.log(`🔍 FIRST FILING RAW STRUCTURE:`);
      console.log(`📊 Filing keys:`, Object.keys(filings[0]));
      console.log(`📄 Documents array:`, filings[0].documents);
      console.log(`📄 Documents keys:`, filings[0].documents?.map(doc => Object.keys(doc)));
    }
    
    // Transform to our enhanced format with direct document access
    return filings.map(filing => transformFilingEnhanced(filing, docketNumber));
    
  } catch (/** @type {any} */ error) {
    console.error(`❌ Enhanced ECFS failed for docket ${docketNumber}:`, error);
    throw error;
  }
}

/**
 * Transform raw ECFS filing to enhanced format with direct document URLs
 */
function transformFilingEnhanced(rawFiling, docketNumber) {
  // Parse viewing status for confidential document handling
  const viewingStatus = rawFiling.viewingstatus;
  const isRestricted = isFilingRestricted(viewingStatus);

  return {
    // Use id_submission for perfect deduplication (key improvement!)
    id: rawFiling.id_submission,
    
    // Standard fields - using correct ECFS field structure
    docket_number: docketNumber,
    title: cleanText(
      // Use document filename as title, or delegated authority number for orders
      (rawFiling.documents?.[0]?.filename) ||
      rawFiling.delegated_authority_number ||
      rawFiling.brief_comment_summary || 
      rawFiling.description_of_filing || 
      'Untitled Filing'
    ),
    author: cleanText(
      // Use filers array for author name
      rawFiling.filers?.[0]?.name ||
      rawFiling.authors?.[0]?.name ||
      rawFiling.lawfirms?.[0]?.name ||
      rawFiling.bureaus?.[0]?.name ||
      'Unknown Filer'
    ),
    filing_type: cleanText(
      // Use submissiontype.description for filing type
      rawFiling.submissiontype?.description ||
      rawFiling.submissiontype?.short ||
      rawFiling.type_of_filing ||
      'unknown'
    ),
    date_received: rawFiling.date_submission || rawFiling.date_received || rawFiling.date_disseminated,
    
    // Enhanced URLs
    filing_url: `https://www.fcc.gov/ecfs/filing/${rawFiling.id_submission}`,
    
    // 🔥 GAME CHANGER: Direct document URLs from successful API test
    documents: extractDocumentsEnhanced(rawFiling),
    
    // NEW: Viewing status and confidentiality handling
    viewing_status: viewingStatus,
    is_filing_restricted: isRestricted,
    restriction_reason: isRestricted ? viewingStatus?.description || 'Unknown restriction' : null,
    
    // Enhanced metadata
    submitter_info: {
      name: rawFiling.name_of_filer || rawFiling.filer_name,
      organization: rawFiling.organization_name || rawFiling.lawfirm_name,
      contact: rawFiling.contact_name
    },
    
    // Preserve full raw data for analysis
    raw_data: rawFiling,
    
    // Processing status
    status: 'pending',
    enhanced: true // Mark as enhanced processing
  };
}

/**
 * Helper function to determine if filing has restricted viewing status
 * @param {Object|Array} viewingStatus - Viewing status object or array from ECFS API
 * @returns {boolean} True if filing is restricted/confidential
 */
function isFilingRestricted(viewingStatus) {
  // Handle the case where viewingStatus is null/undefined
  if (!viewingStatus) {
    return false;
  }
  
  // Based on real API data, viewingStatus is a single object, not an array
  // Handle both single object and array cases for robustness
  let statusToCheck;
  
  if (Array.isArray(viewingStatus)) {
    // If it's an array, check the first element
    statusToCheck = viewingStatus[0];
  } else if (typeof viewingStatus === 'object') {
    // If it's a single object (which is the actual API format)
    statusToCheck = viewingStatus;
  } else {
    return false;
  }
  
  // Check if the status object has a description
  if (!statusToCheck || !statusToCheck.description) {
    return false;
  }
  
  const description = statusToCheck.description.toLowerCase();
  
  // Check for positive restriction indicators, but exclude "unrestricted"
  if (description === 'unrestricted' || description === 'public') {
    return false;
  }
  
  return description.includes('confidential') || 
         description.includes('restricted') || 
         description.includes('sealed') ||
         description.includes('private');
}

/**
 * Extract documents with direct download URLs (proven from API test)
 */
function extractDocumentsEnhanced(rawFiling) {
  try {
    const documents = rawFiling.documents || [];
    
    // Check if filing has restricted viewing status using the helper function
    const viewingStatus = rawFiling.viewingstatus;
    const isRestricted = isFilingRestricted(viewingStatus);
    
    // 🔍 DEBUG: Log each document's raw structure  
    documents.forEach((doc, index) => {
      console.log(`🔍 DOCUMENT ${index + 1} RAW STRUCTURE:`);
      console.log(`📄 All document fields:`, Object.keys(doc));
      console.log(`📄 Document object:`, doc);
      console.log(`📄 Filename:`, doc.filename);
      console.log(`📄 Src field:`, doc.src);
      console.log(`📄 URL field:`, doc.url);
      console.log(`📄 Link field:`, doc.link);
      console.log(`📄 Href field:`, doc.href);
      console.log(`📄 File_location:`, doc.file_location);
      console.log(`📄 Download_url:`, doc.download_url);
      console.log(`---`);
    });
    
    return documents.map(doc => ({
      filename: doc.filename,
      src: doc.src, // 🎯 DIRECT PDF URL! (e.g., "https://docs.fcc.gov/public/attachments/DA-25-567A1.pdf")
      description: doc.description || '',
      type: getFileType(doc.filename),
      downloadable: !!doc.src && doc.src.includes('fcc.gov') && !isRestricted,
      
      // NEW: Confidentiality markers
      is_confidential: isRestricted,
      access_restricted: !doc.src || isRestricted,
      restriction_reason: isRestricted ? 
        (viewingStatus?.description || 'Unknown restriction') : 
        (!doc.src ? 'No source URL provided' : null),
      
      size_estimate: estimateFileSize(doc.filename)
    }));
    
  } catch (/** @type {any} */ error) {
    console.warn('Error extracting enhanced documents:', error);
    return [];
  }
}

/**
 * Smart deduplication using id_submission (perfect unique key)
 */
export async function identifyNewFilings(latestFilings, db) {
  try {
    if (latestFilings.length === 0) return [];
    
    // Get all IDs from current batch
    const currentIds = latestFilings.map(f => f.id);
    
    // Check which ones already exist in database
    const placeholders = currentIds.map(() => '?').join(',');
    const existingResult = await db.prepare(`
      SELECT id FROM filings WHERE id IN (${placeholders})
    `).bind(...currentIds).all();
    
    const existingIds = new Set(existingResult.results?.map(row => row.id) || []);
    
    // Return only genuinely new filings
    const newFilings = latestFilings.filter(filing => !existingIds.has(filing.id));
    
    console.log(`🔄 Enhanced Deduplication: ${latestFilings.length} checked → ${newFilings.length} new (${existingIds.size} already processed)`);
    
    return newFilings;
    
  } catch (error) {
    console.error('Enhanced deduplication error:', error);
    // If deduplication fails, return all filings (storage will handle duplicates)
    return latestFilings;
  }
}

/**
 * Process multiple dockets with enhanced approach
 */
export async function fetchMultipleDocketsEnhanced(docketNumbers, env) {
  const results = {
    filings: [],
    stats: {
      totalDockets: docketNumbers.length,
      successfulDockets: 0,
      totalFilings: 0,
      documentsFound: 0
    },
    errors: []
  };
  
  console.log(`🚀 Enhanced ECFS: Processing ${docketNumbers.length} dockets`);
  
  for (const docketNumber of docketNumbers) {
    try {
      const filings = await fetchLatestFilings(docketNumber, DEFAULT_LIMIT, env);
      
      results.filings.push(...filings);
      results.stats.successfulDockets++;
      results.stats.totalFilings += filings.length;
      results.stats.documentsFound += filings.reduce((sum, f) => sum + (f.documents?.length || 0), 0);
      
      console.log(`✅ Enhanced: Docket ${docketNumber}: ${filings.length} filings, ${filings.reduce((sum, f) => sum + (f.documents?.length || 0), 0)} documents`);
      
      // Rate limiting - be respectful to FCC
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Enhanced ECFS failed for docket ${docketNumber}:`, error);
      results.errors.push({
        docket: docketNumber,
        error: error.message
      });
    }
  }
  
  console.log(`🎯 Enhanced Results: ${results.stats.totalFilings} filings, ${results.stats.documentsFound} documents from ${results.stats.successfulDockets}/${results.stats.totalDockets} dockets`);
  
  return results;
}

// Utility functions
function cleanText(text) {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ').substring(0, 500);
}

function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext || 'unknown';
}

function estimateFileSize(filename) {
  // Basic estimation for UI purposes
  if (filename?.toLowerCase().includes('order')) return 'large';
  if (filename?.toLowerCase().includes('notice')) return 'medium';
  return 'small';
} 