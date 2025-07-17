// Enhanced ECFS Client - Last 50 Filings Approach with Direct Document Access
// Based on successful API test: https://publicapi.fcc.gov/ecfs/filings?api_key=...

const ECFS_BASE_URL = 'https://publicapi.fcc.gov/ecfs/filings';
const DEFAULT_LIMIT = 50; // Get last 50 filings per docket

/**
 * Enhanced ECFS client with direct document URL access
 * @param {string} docketNumber - FCC docket number (e.g., '07-114')
 * @param {number} limit - Number of recent filings to fetch (default: 50)
 * @param {Object} env - Environment variables passed from caller
 * @returns {Promise<Array>} Array of filing objects with direct document URLs
 */
export async function fetchLatestFilings(docketNumber, limit = DEFAULT_LIMIT, env) {
  try {
    // Use env object passed from the worker environment
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
      console.error('🔍 Environment check:', {
        envHasKey: !!env?.ECFS_API_KEY,
        envKeys: env ? Object.keys(env) : 'env is null'
      });
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    // Build the exact URL format that works (confirmed by testing)
    const url = `${ECFS_BASE_URL}?` +
      `api_key=${apiKey}` +
      `&proceedings.name=${docketNumber}` +
      `&limit=${limit}` +
      `&sort=date_disseminated,DESC`;
    
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
    
  } catch (error) {
    console.error(`❌ Enhanced ECFS failed for docket ${docketNumber}:`, error);
    throw error;
  }
}

/**
 * Transform raw ECFS filing to enhanced format with direct document URLs
 */
function transformFilingEnhanced(rawFiling, docketNumber) {
  // Validate raw filing structure
  if (!rawFiling.id_submission) {
    console.warn('⚠️ Filing missing id_submission:', rawFiling);
  }

  // Parse viewing status for confidential document handling
  const viewingStatus = rawFiling.viewingstatus;
  const isRestricted = isFilingRestricted(viewingStatus);

  const filing = {
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
    date_received: rawFiling.date_disseminated || rawFiling.date_submission || rawFiling.date_received,
    
    // Enhanced URLs - VALIDATE this is a proper URL
    filing_url: `https://www.fcc.gov/ecfs/filing/${rawFiling.id_submission}`,
    
    // 🔥 GAME CHANGER: Direct document URLs from successful API test
    documents: extractDocumentsEnhanced(rawFiling),
    
    // NEW: Viewing status and confidentiality handling
    viewing_status: viewingStatus,
    is_filing_restricted: isRestricted,
    restriction_reason: isRestricted ? viewingStatus.description || 'Unknown restriction' : null,
    
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

  // Validate critical fields
  if (!filing.filing_url || !filing.filing_url.startsWith('https://')) {
    console.error('❌ Invalid filing_url generated:', filing.filing_url);
    filing.filing_url = `https://www.fcc.gov/ecfs/filing/${filing.id}`;
  }

  if (!Array.isArray(filing.documents)) {
    console.error('❌ Documents is not an array:', filing.documents);
    filing.documents = [];
  }

  return filing;
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
    
    // Document structure logging removed for production efficiency
    
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
    
  } catch (error) {
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
 * Mark a docket as being in deluge mode and notify users
 * @param {string} docketNumber - The docket number
 * @param {Object} env - Environment object with DB and email
 */
async function markDocketAsDeluged(docketNumber, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Mark docket as deluged
    await env.DB.prepare(`
      UPDATE active_dockets SET deluge_mode = 1, deluge_date = ? WHERE docket_number = ?
    `).bind(today, docketNumber).run();
    
    console.log(`🚨 Docket ${docketNumber} marked as deluged for date ${today}`);
    
    // Get all users subscribed to this docket
    const users = await env.DB.prepare(`
      SELECT DISTINCT u.email FROM subscriptions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.docket_number = ? AND s.status = 'active'
    `).bind(docketNumber).all();
    
    // Send notifications to all subscribers
    for (const user of users.results || []) {
      await sendDelugeNotification(user.email, docketNumber, env);
    }
    
    console.log(`📧 Deluge notifications sent to ${users.results?.length || 0} users for docket ${docketNumber}`);
    
  } catch (error) {
    console.error(`❌ Error marking docket ${docketNumber} as deluged:`, error);
  }
}

/**
 * Send deluge notification email to user
 * @param {string} email - User's email address
 * @param {string} docketNumber - The docket number
 * @param {Object} env - Environment object
 */
async function sendDelugeNotification(email, docketNumber, env) {
  try {
    const subject = `High Activity Alert - Docket ${docketNumber}`;
    const fccUrl = `https://www.fcc.gov/ecfs/search/search-filings/results?q=(proceedings.name:(%22${docketNumber}%22))`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">⚠️ High Activity Alert</h2>
        <p>Hi there,</p>
        <p>We've detected unusually high filing activity for docket <strong>${docketNumber}</strong> that you're subscribed to.</p>
        <p>To prevent system overload, we've temporarily paused automated monitoring for this docket. You can still view all filings directly on the FCC website:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${fccUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View ${docketNumber} on FCC Website
          </a>
        </p>
        <p>Normal automated monitoring will resume tomorrow morning.</p>
        <p>Thanks for your understanding!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated notification from SimpleDCC. 
          <a href="https://simpledcc.com/manage">Manage your subscriptions</a>
        </p>
      </div>
    `;
    
    const text = `
High Activity Alert - Docket ${docketNumber}

Hi there,

We've detected unusually high filing activity for docket ${docketNumber} that you're subscribed to.

To prevent system overload, we've temporarily paused automated monitoring for this docket. You can still view all filings directly at: ${fccUrl}

Normal automated monitoring will resume tomorrow morning.

Thanks for your understanding!

---
This is an automated notification from SimpleDCC.
Manage your subscriptions: https://simpledcc.com/manage
    `;
    
    // Import and use the sendEmail function
    const { sendEmail } = await import('../email.ts');
    await sendEmail(email, subject, html, text, env);
    
    console.log(`📧 Deluge notification sent to ${email} for docket ${docketNumber}`);
    
  } catch (error) {
    console.error(`❌ Error sending deluge notification to ${email}:`, error);
  }
}

/**
 * Smart filing detection with two-phase approach and deluge protection
 * @param {string} docketNumber - The docket number
 * @param {Object} env - Environment object with DB and API keys
 * @returns {Promise<Object>} Result object with status and newFilings
 */
export async function smartFilingDetection(docketNumber, env) {
  try {
    console.log(`🎯 Smart detection for docket ${docketNumber}...`);
    
    // Phase 1: Quick ID check
    const latestFiling = await fetchSingleLatestFiling(docketNumber, env);
    if (!latestFiling) {
      console.log(`📭 ${docketNumber}: No filings found in ECFS`);
      return { status: 'no_filings', newFilings: [] };
    }
    
    // Get stored data for this docket
    const storedData = await env.DB.prepare(`
      SELECT latest_filing_id, deluge_mode FROM active_dockets WHERE docket_number = ?
    `).bind(docketNumber).first();
    
    // Skip if in deluge mode
    if (storedData?.deluge_mode === 1) {
      console.log(`🚨 Docket ${docketNumber} is in deluge mode - skipping`);
      return { status: 'deluge_active', newFilings: [] };
    }
    
    // Skip if no new filings (ID match)
    if (latestFiling.id === storedData?.latest_filing_id) {
      console.log(`✅ ${docketNumber}: No new filings (ID match: ${latestFiling.id})`);
      return { status: 'no_new', newFilings: [] };
    }
    
    console.log(`🔄 ${docketNumber}: New filings detected (latest: ${latestFiling.id}), fetching recent filings...`);
    
    // Phase 2: Targeted fetch
    const recentFilings = await fetchLatestFilings(docketNumber, 7, env);
    if (!recentFilings || recentFilings.length === 0) {
      console.log(`📭 ${docketNumber}: No filings returned from targeted fetch`);
      return { status: 'no_filings', newFilings: [] };
    }
    
    // Identify truly new filings
    const newFilings = await identifyNewFilings(recentFilings, env.DB);
    console.log(`📊 ${docketNumber}: Found ${newFilings.length} new filings out of ${recentFilings.length} checked`);
    
    // Deluge detection - if all 7 are new, we're in deluge territory
    if (newFilings.length >= 7) {
      console.log(`🚨 DELUGE DETECTED for ${docketNumber}: ${newFilings.length} new filings`);
      await markDocketAsDeluged(docketNumber, env);
      return { status: 'deluge', newFilings: [] };
    }
    
    // Update tracking for next run
    if (newFilings.length > 0) {
      await env.DB.prepare(`
        UPDATE active_dockets SET latest_filing_id = ? WHERE docket_number = ?
      `).bind(latestFiling.id, docketNumber).run();
      
      console.log(`📝 Updated latest_filing_id for ${docketNumber}: ${latestFiling.id}`);
    }
    
    console.log(`✅ ${docketNumber}: Smart detection complete - ${newFilings.length} new filings`);
    return { status: 'new_found', newFilings };
    
  } catch (error) {
    console.warn(`⚠️ Smart detection failed for ${docketNumber}, using fallback:`, error);
    
    // Fallback to existing logic
    try {
      const filings = await fetchLatestFilings(docketNumber, 10, env);
      const newFilings = await identifyNewFilings(filings || [], env.DB);
      console.log(`🔄 Fallback processing for ${docketNumber}: ${newFilings.length} new filings`);
      return { status: 'fallback', newFilings };
    } catch (fallbackError) {
      console.error(`❌ Fallback also failed for ${docketNumber}:`, fallbackError);
      return { status: 'error', newFilings: [] };
    }
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

/**
 * Fetch single latest filing for quick ID comparison (Smart Detection Phase 1)
 * @param {string} docketNumber - FCC docket number (e.g., '07-114')
 * @param {Object} env - Environment variables passed from caller
 * @returns {Promise<Object|null>} Single filing object or null if none found
 */
export async function fetchSingleLatestFiling(docketNumber, env) {
  try {
    // Use env object passed from the worker environment
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
      console.error('🔍 fetchSingleLatestFiling - Environment check:', {
        envHasKey: !!env?.ECFS_API_KEY,
        envKeys: env ? Object.keys(env) : 'env is null'
      });
      throw new Error('ECFS_API_KEY environment variable is not set');
    }
    
    // Build URL for single latest filing (limit=1)
    const url = `${ECFS_BASE_URL}?` +
      `api_key=${apiKey}` +
      `&proceedings.name=${docketNumber}` +
      `&limit=1` +
      `&sort=date_disseminated,DESC`;
    
    console.log(`🎯 Smart Detection: Quick ID check for docket ${docketNumber}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DocketCC/2.0 (Smart Filing Detection)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ fetchSingleLatestFiling API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`ECFS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    const filings = data.filing || [];
    
    if (filings.length === 0) {
      console.log(`📭 Smart Detection: No filings found for docket ${docketNumber}`);
      return null;
    }
    
    // Transform the single filing to our enhanced format
    const latestFiling = transformFilingEnhanced(filings[0], docketNumber);
    
    console.log(`✅ Smart Detection: Latest filing ID ${latestFiling.id} for docket ${docketNumber}`);
    
    return latestFiling;
    
  } catch (error) {
    console.error(`❌ fetchSingleLatestFiling failed for docket ${docketNumber}:`, error);
    
    // For smart detection, we want to gracefully handle errors
    // Return null so the system can fall back to regular processing
    console.warn(`⚠️ Smart Detection fallback: Will use regular processing for docket ${docketNumber}`);
    return null;
  }
}

/**
 * Lift all deluge flags (called each morning)
 * @param {Object} env - Environment object with DB
 */
export async function liftDelugeFlags(env) {
  try {
    const result = await env.DB.prepare(`
      UPDATE active_dockets SET deluge_mode = 0 WHERE deluge_mode = 1
    `).run();
    
    if (result.changes > 0) {
      console.log(`🌅 Morning reset: Lifted deluge flags for ${result.changes} dockets`);
    } else {
      console.log(`🌅 Morning reset: No deluge flags to lift`);
    }
    
  } catch (error) {
    console.error('❌ Error lifting deluge flags:', error);
  }
} 