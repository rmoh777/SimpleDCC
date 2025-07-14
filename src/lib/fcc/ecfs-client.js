/**
 * Website-side ECFS client for immediate seeding
 * Simplified version for subscription-time operations
 */

const ECFS_BASE_URL = 'https://publicapi.fcc.gov/ecfs/filings';

/**
 * Transform raw ECFS filing to our format
 */
function transformFiling(rawFiling, docketNumber) {
  return {
    id: rawFiling.id_submission,
    docket_number: docketNumber,
    title: cleanText(
      (rawFiling.documents?.[0]?.filename) ||
      rawFiling.delegated_authority_number ||
      rawFiling.brief_comment_summary || 
      rawFiling.description_of_filing || 
      'Untitled Filing'
    ),
    author: cleanText(
      rawFiling.filers?.[0]?.name ||
      rawFiling.authors?.[0]?.name ||
      rawFiling.lawfirms?.[0]?.name ||
      rawFiling.bureaus?.[0]?.name ||
      'Unknown Filer'
    ),
    filing_type: cleanText(
      rawFiling.submissiontype?.description ||
      rawFiling.submissiontype?.short ||
      rawFiling.type_of_filing ||
      'unknown'
    ),
    date_received: rawFiling.date_disseminated || rawFiling.date_submission || rawFiling.date_received,
    filing_url: `https://www.fcc.gov/ecfs/filing/${rawFiling.id_submission}`,
    documents: extractDocuments(rawFiling),
    submitter_info: {
      name: rawFiling.name_of_filer || rawFiling.filer_name,
      organization: rawFiling.organization_name || rawFiling.lawfirm_name,
      contact: rawFiling.contact_name
    },
    raw_data: rawFiling,
    status: 'pending',
    enhanced: true
  };
}

/**
 * Extract documents from raw filing
 */
function extractDocuments(rawFiling) {
  try {
    const documents = rawFiling.documents || [];
    
    return documents.map(doc => ({
      filename: doc.filename,
      src: doc.src,
      description: doc.description || '',
      type: getFileType(doc.filename),
      downloadable: !!doc.src && doc.src.includes('fcc.gov'),
      size_estimate: estimateFileSize(doc.filename)
    }));
    
  } catch (error) {
    console.warn('Error extracting documents:', error);
    return [];
  }
}

/**
 * Fetch single latest filing for immediate seeding
 * @param {string} docketNumber - FCC docket number (e.g., '07-114')
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|null>} Single filing object or null if none found
 */
export async function fetchSingleLatestFiling(docketNumber, env) {
  try {
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
      console.error('🔍 ECFS_API_KEY not found in environment');
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    const url = `${ECFS_BASE_URL}?` +
      `api_key=${apiKey}` +
      `&proceedings.name=${docketNumber}` +
      `&limit=1` +
      `&sort=date_disseminated,DESC`;
    
    console.log(`🎯 Fetching latest filing for docket ${docketNumber}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SimpleDCC/2.0 (Immediate Seeding)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ECFS API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`ECFS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    const filings = data.filing || [];
    
    if (filings.length === 0) {
      console.log(`📭 No filings found for docket ${docketNumber}`);
      return null;
    }
    
    const latestFiling = transformFiling(filings[0], docketNumber);
    console.log(`✅ Latest filing ID ${latestFiling.id} for docket ${docketNumber}`);
    
    return latestFiling;
    
  } catch (error) {
    console.error(`❌ fetchSingleLatestFiling failed for docket ${docketNumber}:`, error);
    return null;
  }
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
  if (filename?.toLowerCase().includes('order')) return 'large';
  if (filename?.toLowerCase().includes('notice')) return 'medium';
  return 'small';
} 