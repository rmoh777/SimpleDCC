import { json } from '@sveltejs/kit';
import { generateEnhancedSummary, processFilingEnhanced } from '$lib/ai/gemini-enhanced.js';
import { fetchLatestFilings } from '$lib/fcc/ecfs-enhanced-client.js';

export async function GET({ platform, cookies, url }) {
  try {
    // Check admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test parameters
    const docketNumber = url.searchParams.get('docket') || '11-42';
    const testFullPipeline = url.searchParams.get('full') === 'true';
    
    console.log(`🧪 Testing Enhanced AI Processing - Docket: ${docketNumber}, Full Pipeline: ${testFullPipeline}`);
    
    // TEMPORARY: Hardcode API key to bypass environment variable issues
    const apiKey = platform.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyCx_57Ec-9CIPOqQMvMC06YLmVYThIW4_w';
    if (!apiKey) {
      return json({
        error: 'GEMINI_API_KEY not configured',
        suggestion: 'Add GEMINI_API_KEY to environment variables',
        debug: {
          platform_keys: Object.keys(platform.env || {}),
          process_env_exists: !!process.env.GEMINI_API_KEY
        }
      }, { status: 400 });
    }
    
    // Get a sample filing for testing
    const filings = await fetchLatestFilings(docketNumber, 5, platform.env);
    
    if (filings.length === 0) {
      return json({
        error: 'No filings found for testing',
        docket: docketNumber
      }, { status: 404 });
    }
    
    // Find filing with documents for better testing
    const testFiling = filings.find(f => f.documents?.length > 0) || filings[0];
    
    console.log(`🎯 Testing with filing ${testFiling.id}: ${testFiling.documents?.length || 0} documents`);
    
    let testResults = {};
    
    if (testFullPipeline) {
      // Test full enhanced processing pipeline
      const startTime = Date.now();
      const enhancedFiling = await processFilingEnhanced(testFiling, {
        GEMINI_API_KEY: apiKey
      });
      const processingDuration = Date.now() - startTime;
      
      testResults = {
        test_type: 'full_pipeline',
        filing_id: testFiling.id,
        original_filing: {
          title: testFiling.title,
          author: testFiling.author,
          documents_count: testFiling.documents?.length || 0,
          downloadable_docs: testFiling.documents?.filter(d => d.downloadable)?.length || 0
        },
        enhanced_result: {
          ai_enhanced: enhancedFiling.ai_enhanced,
          ai_confidence: enhancedFiling.ai_confidence,
          key_points_count: enhancedFiling.ai_key_points?.length || 0,
          has_document_analysis: !!enhancedFiling.ai_document_analysis,
          documents_processed: enhancedFiling.documents_processed || 0,
          status: enhancedFiling.status
        },
        processing_duration_ms: processingDuration,
        // FULL AI RESPONSE - No truncation
        full_ai_response: {
          summary: enhancedFiling.ai_summary,
          key_points: enhancedFiling.ai_key_points,
          stakeholders: enhancedFiling.ai_stakeholders,
          regulatory_impact: enhancedFiling.ai_regulatory_impact,
          document_analysis: enhancedFiling.ai_document_analysis,
          confidence: enhancedFiling.ai_confidence
        }
      };
      
    } else {
      // Test just AI summary generation
      const startTime = Date.now();
      const mockDocumentTexts = ['Sample document text for AI processing test'];
      const enhancedSummary = await generateEnhancedSummary(testFiling, mockDocumentTexts, {
        GEMINI_API_KEY: apiKey
      });
      const aiDuration = Date.now() - startTime;
      
      testResults = {
        test_type: 'ai_only',
        filing_id: testFiling.id,
        ai_result: {
          summary_length: enhancedSummary.summary?.length || 0,
          key_points: enhancedSummary.key_points,
          confidence: enhancedSummary.ai_confidence,
          has_stakeholder_analysis: !!enhancedSummary.stakeholders,
          has_regulatory_impact: !!enhancedSummary.regulatory_impact,
          documents_analyzed: enhancedSummary.processing_notes?.documents_processed || 0
        },
        processing_duration_ms: aiDuration,
        // FULL AI RESPONSE - No truncation
        full_ai_response: {
          summary: enhancedSummary.summary,
          key_points: enhancedSummary.key_points,
          stakeholders: enhancedSummary.stakeholders,
          regulatory_impact: enhancedSummary.regulatory_impact,
          document_analysis: enhancedSummary.document_analysis,
          confidence: enhancedSummary.confidence,
          processing_notes: enhancedSummary.processing_notes
        }
      };
    }
    
    return json({
      success: true,
      test_results: testResults,
      configuration: {
        gemini_configured: !!platform.env.GEMINI_API_KEY,
        ecfs_configured: !!platform.env.ECFS_API_KEY,
        database_available: !!platform.env.DB
      }
    });
    
  } catch (error) {
    console.error('🚨 Enhanced AI Test Failed:', error);
    
    return json({
      success: false,
      error: {
        message: error.message,
        type: error.name || 'AIEnhancedError'
      },
      configuration: {
        gemini_configured: !!platform.env?.GEMINI_API_KEY,
        ecfs_configured: !!platform.env?.ECFS_API_KEY,
        database_available: !!platform.env?.DB
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

    const { test_type = 'batch', dockets = ['11-42'], max_filings = 3 } = await request.json();
    
    console.log(`🧪 Enhanced AI Batch Test: ${dockets.join(', ')}, Max: ${max_filings}`);
    
    const { fetchMultipleDocketsEnhanced } = await import('$lib/fcc/ecfs-enhanced-client.js');
    const { processFilingBatchEnhanced } = await import('$lib/ai/gemini-enhanced.js');
    
    // Get sample filings
    const ecfsResult = await fetchMultipleDocketsEnhanced(dockets, platform.env);
    const sampleFilings = ecfsResult.filings.slice(0, max_filings);
    
    if (sampleFilings.length === 0) {
      return json({
        success: false,
        error: 'No filings found for batch testing'
      }, { status: 404 });
    }
    
    // Test batch processing
    const startTime = Date.now();
    const processedFilings = await processFilingBatchEnhanced(sampleFilings, platform.env, {
      maxConcurrent: 1, // Conservative for testing
      delayBetween: 500
    });
    const batchDuration = Date.now() - startTime;
    
    // Analyze results
    const successful = processedFilings.filter(f => f.ai_enhanced).length;
    const failed = processedFilings.filter(f => f.status === 'failed').length;
    
    return json({
      success: true,
      test_type: 'batch_processing',
      results: {
        total_processed: processedFilings.length,
        ai_enhanced: successful,
        failed: failed,
        success_rate: `${successful}/${processedFilings.length}`,
        processing_duration_ms: batchDuration,
        avg_duration_per_filing: Math.round(batchDuration / processedFilings.length)
      },
      sample_results: processedFilings.map(f => ({
        id: f.id,
        ai_enhanced: f.ai_enhanced,
        status: f.status,
        key_points_count: f.ai_key_points?.length || 0,
        documents_processed: f.documents_processed || 0,
        // FULL AI RESPONSE - No truncation
        full_ai_response: {
          summary: f.ai_summary,
          key_points: f.ai_key_points,
          stakeholders: f.ai_stakeholders,
          regulatory_impact: f.ai_regulatory_impact,
          document_analysis: f.ai_document_analysis,
          confidence: f.ai_confidence
        }
      }))
    });
    
  } catch (error) {
    console.error('🚨 Enhanced AI Batch Test Failed:', error);
    return json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 