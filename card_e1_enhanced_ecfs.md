# Card E1: Enhanced ECFS Client with Direct Document Access ⏱️ *2 hours*

**Objective:** Create new ECFS client using "last 50 filings" approach with direct PDF document access, alongside existing system.

## Files to Create:

### 1. `src/lib/fcc/ecfs-enhanced-client.js`

```javascript
// Enhanced ECFS Client - Last 50 Filings Approach with Direct Document Access
// Based on successful API test: https://publicapi.fcc.gov/ecfs/filings?api_key=...

const ECFS_BASE_URL = 'https://publicapi.fcc.gov/ecfs/filings';
const DEFAULT_LIMIT = 50; // Get last 50 filings per docket

/**
 * Fetch latest filings for a docket using the proven working API approach
 * @param {string} docketNumber - Format: "XX-XXX" (e.g., "11-42")
 * @param {number} limit - Number of recent filings to fetch (default: 50)
 * @param {Object} env - Environment variables with API key
 * @returns {Promise<Array>} Array of filing objects with direct document URLs
 */
export async function fetchLatestFilings(docketNumber, limit = DEFAULT_LIMIT, env) {
  try {
    const apiKey = env?.ECFS_API_KEY;
    if (!apiKey) {
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
    
    // API returns 'filing' array (confirmed from successful test)
    const filings = data.filing || [];
    console.log(`✅ Enhanced ECFS: Found ${filings.length} filings for docket ${docketNumber}`);
    
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
  return {
    // Use id_submission for perfect deduplication (key improvement!)
    id: rawFiling.id_submission,
    
    // Standard fields
    docket_number: docketNumber,
    title: cleanText(rawFiling.brief_comment_summary || rawFiling.description_of_filing || 'Untitled Filing'),
    author: cleanText(rawFiling.name_of_filer || rawFiling.contact_name || 'Unknown Filer'),
    filing_type: cleanText(rawFiling.type_of_filing || 'unknown'),
    date_received: rawFiling.date_submission || rawFiling.date_received,
    
    // Enhanced URLs
    filing_url: `https://www.fcc.gov/ecfs/filing/${rawFiling.id_submission}`,
    
    // 🔥 GAME CHANGER: Direct document URLs from successful API test
    documents: extractDocumentsEnhanced(rawFiling),
    
    // Enhanced metadata
    submitter_info: {
      name: rawFiling.name_of_filer,
      organization: rawFiling.organization_name,
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
 * Extract documents with direct download URLs (proven from API test)
 */
function extractDocumentsEnhanced(rawFiling) {
  try {
    const documents = rawFiling.documents || [];
    
    return documents.map(doc => ({
      filename: doc.filename,
      src: doc.src, // 🎯 DIRECT PDF URL! (e.g., "https://docs.fcc.gov/public/attachments/DA-25-567A1.pdf")
      description: doc.description || '',
      type: getFileType(doc.filename),
      downloadable: !!doc.src && doc.src.startsWith('https://docs.fcc.gov/'),
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
```

### 2. `src/lib/documents/pdf-processor.js`

```javascript
// PDF Document Processing for Enhanced ECFS Integration

/**
 * Download PDF from direct FCC URL (from enhanced ECFS response)
 * @param {string} pdfUrl - Direct URL like "https://docs.fcc.gov/public/attachments/DA-25-567A1.pdf"
 * @param {Object} options - Download options
 * @returns {Promise<ArrayBuffer>} PDF content
 */
export async function downloadPDF(pdfUrl, options = {}) {
  try {
    const { timeout = 30000, maxSize = 50 * 1024 * 1024 } = options; // 50MB max
    
    console.log(`📄 Downloading PDF: ${pdfUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DocketCC/2.0 (Document Processing Service)',
        'Accept': 'application/pdf'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.status} ${response.statusText}`);
    }
    
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`PDF too large: ${contentLength} bytes (max: ${maxSize})`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    console.log(`✅ Downloaded PDF: ${pdfBuffer.byteLength} bytes`);
    
    return pdfBuffer;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`PDF download timeout: ${pdfUrl}`);
    }
    console.error(`❌ PDF download failed: ${pdfUrl}`, error);
    throw error;
  }
}

/**
 * Extract text from PDF buffer (placeholder for PDF parsing library)
 * @param {ArrayBuffer} pdfBuffer - PDF content
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(pdfBuffer) {
  try {
    // For now, return placeholder - in production, use pdf-parse or similar
    console.log(`📖 Extracting text from PDF (${pdfBuffer.byteLength} bytes)`);
    
    // TODO: Implement actual PDF text extraction
    // const pdf = await import('pdf-parse');
    // const data = await pdf(pdfBuffer);
    // return data.text;
    
    // Placeholder implementation
    return `[PDF content extracted - ${pdfBuffer.byteLength} bytes]\nThis is where the actual PDF text would appear after implementing pdf-parse library.`;
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    throw error;
  }
}

/**
 * Process all documents for a filing
 * @param {Object} filing - Filing with documents array
 * @returns {Promise<Object>} Filing with processed documents
 */
export async function processFilingDocuments(filing) {
  try {
    const processedDocuments = [];
    
    for (const doc of filing.documents || []) {
      if (doc.downloadable && doc.type === 'pdf') {
        try {
          // Download PDF
          const pdfBuffer = await downloadPDF(doc.src);
          
          // Extract text
          const textContent = await extractTextFromPDF(pdfBuffer);
          
          processedDocuments.push({
            ...doc,
            text_content: textContent,
            size: pdfBuffer.byteLength,
            processed_at: Date.now(),
            status: 'processed'
          });
          
        } catch (error) {
          console.error(`❌ Failed to process document ${doc.filename}:`, error);
          processedDocuments.push({
            ...doc,
            status: 'failed',
            error: error.message,
            processed_at: Date.now()
          });
        }
      } else {
        // Non-PDF or non-downloadable documents
        processedDocuments.push({
          ...doc,
          status: 'skipped',
          reason: 'Not a downloadable PDF'
        });
      }
    }
    
    return {
      ...filing,
      documents: processedDocuments,
      documents_processed: processedDocuments.filter(d => d.status === 'processed').length,
      processing_completed_at: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Filing document processing failed:', error);
    return {
      ...filing,
      documents_processed: 0,
      processing_error: error.message,
      processing_completed_at: Date.now()
    };
  }
}
```

### 3. `src/routes/api/admin/test-ecfs-enhanced/+server.js`

```javascript
import { json } from '@sveltejs/kit';
import { fetchLatestFilings, fetchMultipleDocketsEnhanced, identifyNewFilings } from '$lib/fcc/ecfs-enhanced-client.js';
import { processFilingDocuments } from '$lib/documents/pdf-processor.js';

export async function GET({ platform, cookies, url }) {
  try {
    // Check admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test parameters
    const docketNumber = url.searchParams.get('docket') || '11-42';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const testDocuments = url.searchParams.get('docs') === 'true';
    
    console.log(`🧪 Testing Enhanced ECFS - Docket: ${docketNumber}, Limit: ${limit}, Docs: ${testDocuments}`);
    
    const startTime = Date.now();
    
    // Test enhanced ECFS client
    const filings = await fetchLatestFilings(docketNumber, limit, platform.env);
    const fetchDuration = Date.now() - startTime;
    
    // Test deduplication
    const dedupeStartTime = Date.now();
    const newFilings = await identifyNewFilings(filings, platform.env.DB);
    const dedupeDuration = Date.now() - dedupeStartTime;
    
    // Optionally test document processing
    let documentTestResults = null;
    if (testDocuments && filings.length > 0) {
      const testFiling = filings.find(f => f.documents?.length > 0);
      if (testFiling) {
        const docStartTime = Date.now();
        try {
          documentTestResults = await processFilingDocuments(testFiling);
          documentTestResults.processing_duration = Date.now() - docStartTime;
        } catch (error) {
          documentTestResults = { error: error.message };
        }
      }
    }
    
    return json({
      success: true,
      test_parameters: {
        docket_number: docketNumber,
        limit: limit,
        test_documents: testDocuments
      },
      results: {
        filings_found: filings.length,
        new_filings: newFilings.length,
        fetch_duration_ms: fetchDuration,
        dedupe_duration_ms: dedupeDuration,
        total_documents: filings.reduce((sum, f) => sum + (f.documents?.length || 0), 0),
        downloadable_documents: filings.reduce((sum, f) => sum + (f.documents?.filter(d => d.downloadable)?.length || 0), 0)
      },
      sample_filings: filings.slice(0, 3).map(f => ({
        id: f.id,
        title: f.title.substring(0, 100),
        author: f.author,
        filing_type: f.filing_type,
        date_received: f.date_received,
        documents_count: f.documents?.length || 0,
        downloadable_docs: f.documents?.filter(d => d.downloadable)?.length || 0,
        enhanced: f.enhanced
      })),
      document_test: documentTestResults,
      debug_info: {
        api_key_configured: !!platform.env?.ECFS_API_KEY,
        database_available: !!platform.env?.DB,
        enhancement_active: true
      }
    });
    
  } catch (error) {
    console.error('🚨 Enhanced ECFS Test Failed:', error);
    
    return json({
      success: false,
      error: {
        message: error.message,
        type: error.name || 'ECFSEnhancedError'
      },
      debug_info: {
        api_key_configured: !!platform.env?.ECFS_API_KEY,
        database_available: !!platform.env?.DB,
        enhancement_active: true,
        full_error: error.toString()
      }
    }, { status: 500 });
  }
}

export async function POST({ platform, request, cookies }) {
  try {
    // Check admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dockets = ['11-42'], test_documents = false } = await request.json();
    
    console.log(`🧪 Enhanced ECFS Multi-Docket Test: ${dockets.join(', ')}`);
    
    const result = await fetchMultipleDocketsEnhanced(dockets, platform.env);
    
    return json({
      success: true,
      test_type: 'multi_docket_enhanced',
      results: result,
      enhancement_summary: {
        total_filings: result.stats.totalFilings,
        total_documents: result.stats.documentsFound,
        success_rate: `${result.stats.successfulDockets}/${result.stats.totalDockets}`,
        errors: result.errors.length
      }
    });
    
  } catch (error) {
    console.error('🚨 Enhanced Multi-Docket Test Failed:', error);
    return json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

## Testing Plan for Card E1:
1. **Test new ECFS client**: `GET /api/admin/test-ecfs-enhanced?docket=11-42&limit=5`
2. **Test document access**: `GET /api/admin/test-ecfs-enhanced?docket=11-42&limit=3&docs=true`
3. **Test multi-docket**: `POST /api/admin/test-ecfs-enhanced` with body `{"dockets": ["11-42", "21-450"]}`

## Success Criteria:
- ✅ New client fetches filings with `id_submission` IDs
- ✅ Direct document URLs are populated and accessible  
- ✅ Perfect deduplication using `id_submission`
- ✅ PDF download and text extraction works
- ✅ Existing system continues unchanged