import { json } from '@sveltejs/kit';
import { fetchLatestFilings, fetchMultipleDockets, identifyNewFilings } from '$lib/fcc/ecfs-client.js';
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
        enhanced: f.enhanced,
        // 🔥 SHOW THE ACTUAL DOCUMENT URLS!
        documents: f.documents?.map(doc => ({
          filename: doc.filename,
          src: doc.src,
          downloadable: doc.downloadable,
          type: doc.type
        })) || []
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
    
    const result = await fetchMultipleDockets(dockets, 2, platform.env);
    
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