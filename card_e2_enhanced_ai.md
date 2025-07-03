# Card E2: Enhanced AI Processing with Document Content ⏱️ *1.5 hours*

**Objective:** Create enhanced AI processing that uses actual document content for superior summaries.

## Files to Create:

### 1. `src/lib/ai/gemini-enhanced.js`

```javascript
// Enhanced Gemini AI Processing with Document Content
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate enhanced AI summary using document content + filing metadata
 * @param {Object} filing - Filing with enhanced metadata
 * @param {Array} documentTexts - Array of extracted document texts
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Enhanced AI summary with structured output
 */
export async function generateEnhancedSummary(filing, documentTexts = [], env) {
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Build enhanced prompt with document content
    const prompt = buildEnhancedPrompt(filing, documentTexts);
    
    console.log(`🤖 Generating enhanced AI summary for filing ${filing.id}`);
    console.log(`📄 Processing ${documentTexts.length} documents`);
    
    const result = await model.generateContent(prompt);
    const summaryText = result.response.text();
    
    // Parse structured output
    const structuredSummary = parseStructuredSummary(summaryText);
    
    return {
      summary: structuredSummary.summary,
      key_points: structuredSummary.key_points,
      stakeholders: structuredSummary.stakeholders,
      regulatory_impact: structuredSummary.regulatory_impact,
      document_analysis: structuredSummary.document_analysis,
      ai_confidence: structuredSummary.confidence,
      processing_notes: {
        documents_processed: documentTexts.length,
        total_text_length: documentTexts.reduce((sum, text) => sum + text.length, 0),
        enhanced_processing: true,
        generated_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced AI processing failed:', error);
    throw error;
  }
}

/**
 * Build enhanced prompt that leverages document content
 */
function buildEnhancedPrompt(filing, documentTexts) {
  const hasDocuments = documentTexts.length > 0;
  
  let prompt = `
Analyze this FCC filing and provide a comprehensive regulatory intelligence summary:

FILING METADATA:
- ID: ${filing.id}
- Docket: ${filing.docket_number}
- Title: ${filing.title}
- Author/Filer: ${filing.author}
- Filing Type: ${filing.filing_type}
- Date: ${filing.date_received}
- Organization: ${filing.submitter_info?.organization || 'Not specified'}

`;

  if (hasDocuments) {
    prompt += `
DOCUMENT CONTENT ANALYSIS:
The following document content was extracted and should be analyzed for key insights:

`;
    documentTexts.forEach((text, index) => {
      prompt += `
Document ${index + 1}:
${text.substring(0, 8000)}${text.length > 8000 ? '\n... [truncated]' : ''}

`;
    });
  } else {
    prompt += `
NOTE: No documents were available for content analysis. Base summary on filing metadata only.

`;
  }

  prompt += `
Please provide a structured analysis in the following format:

SUMMARY:
[2-3 sentence executive summary of the filing's purpose and key message]

KEY_POINTS:
- [Most important regulatory point]
- [Second most important point]  
- [Third most important point]
${hasDocuments ? '- [Additional points from document analysis]' : ''}

STAKEHOLDERS:
- Primary: [Who filed this and why]
- Affected: [Who this impacts]
- Opposing: [Any opposing viewpoints mentioned]

REGULATORY_IMPACT:
- Scope: [Broad/narrow impact]
- Timeline: [Immediate/future implications]
- Precedent: [Sets new precedent or follows existing]

${hasDocuments ? `
DOCUMENT_ANALYSIS:
- Content Type: [Technical/legal/policy analysis]
- Key Arguments: [Main arguments presented]
- Supporting Data: [Statistics or evidence provided]
- Attachments: [Technical reports, studies, etc.]
` : ''}

CONFIDENCE: [High/Medium/Low - based on available information]

Focus on regulatory implications, policy impacts, and strategic insights that would be valuable to telecommunications attorneys, policy analysts, and business strategists.
`;

  return prompt;
}

/**
 * Parse structured AI response into organized components
 */
function parseStructuredSummary(rawSummary) {
  try {
    const sections = {};
    
    // Extract sections using markers
    const sectionPatterns = {
      summary: /SUMMARY:\s*(.*?)(?=KEY_POINTS:|$)/s,
      key_points: /KEY_POINTS:\s*(.*?)(?=STAKEHOLDERS:|$)/s,
      stakeholders: /STAKEHOLDERS:\s*(.*?)(?=REGULATORY_IMPACT:|$)/s,
      regulatory_impact: /REGULATORY_IMPACT:\s*(.*?)(?=DOCUMENT_ANALYSIS:|CONFIDENCE:|$)/s,
      document_analysis: /DOCUMENT_ANALYSIS:\s*(.*?)(?=CONFIDENCE:|$)/s,
      confidence: /CONFIDENCE:\s*(.*?)$/s
    };
    
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      const match = rawSummary.match(pattern);
      if (match) {
        sections[section] = match[1].trim();
      }
    }
    
    // Parse key points into array
    if (sections.key_points) {
      sections.key_points = sections.key_points
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);
    }
    
    return {
      summary: sections.summary || 'Summary not available',
      key_points: sections.key_points || [],
      stakeholders: sections.stakeholders || 'Stakeholder analysis not available',
      regulatory_impact: sections.regulatory_impact || 'Impact analysis not available', 
      document_analysis: sections.document_analysis || null,
      confidence: sections.confidence || 'Medium',
      raw_response: rawSummary
    };
    
  } catch (error) {
    console.error('❌ Error parsing structured summary:', error);
    return {
      summary: rawSummary,
      key_points: [],
      stakeholders: 'Parse error',
      regulatory_impact: 'Parse error',
      document_analysis: null,
      confidence: 'Low',
      raw_response: rawSummary
    };
  }
}

/**
 * Process complete filing with enhanced AI pipeline
 * @param {Object} filing - Filing from enhanced ECFS client
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Filing with enhanced AI summary
 */
export async function processFilingEnhanced(filing, env) {
  try {
    console.log(`🔄 Enhanced processing for filing ${filing.id}`);
    
    // Step 1: Process documents if available
    let documentTexts = [];
    let processedFiling = filing;
    
    if (filing.documents?.some(d => d.downloadable)) {
      const { processFilingDocuments } = await import('$lib/documents/pdf-processor.js');
      processedFiling = await processFilingDocuments(filing);
      
      // Extract text content from processed documents
      documentTexts = processedFiling.documents
        ?.filter(d => d.text_content)
        ?.map(d => d.text_content) || [];
    }
    
    // Step 2: Generate enhanced AI summary
    const enhancedSummary = await generateEnhancedSummary(processedFiling, documentTexts, env);
    
    // Step 3: Return enhanced filing
    return {
      ...processedFiling,
      ai_summary: enhancedSummary.summary,
      ai_key_points: enhancedSummary.key_points,
      ai_stakeholders: enhancedSummary.stakeholders,
      ai_regulatory_impact: enhancedSummary.regulatory_impact,
      ai_document_analysis: enhancedSummary.document_analysis,
      ai_confidence: enhancedSummary.confidence,
      ai_enhanced: true,
      status: 'completed_enhanced',
      processed_at: Date.now()
    };
    
  } catch (error) {
    console.error(`❌ Enhanced processing failed for filing ${filing.id}:`, error);
    
    // Fallback to basic processing
    return {
      ...filing,
      ai_summary: `Enhanced processing failed: ${error.message}. Filing processed with basic metadata only.`,
      ai_enhanced: false,
      status: 'completed_basic',
      processed_at: Date.now(),
      processing_error: error.message
    };
  }
}

/**
 * Batch process multiple filings with enhanced AI
 */
export async function processFilingBatchEnhanced(filings, env, options = {}) {
  const { maxConcurrent = 2, delayBetween = 1000 } = options;
  const results = [];
  
  console.log(`🚀 Enhanced batch processing: ${filings.length} filings`);
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < filings.length; i += maxConcurrent) {
    const batch = filings.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(filing => 
      processFilingEnhanced(filing, env).catch(error => ({
        ...filing,
        status: 'failed',
        error: error.message,
        processed_at: Date.now()
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`✅ Enhanced batch ${Math.floor(i/maxConcurrent) + 1}: ${batchResults.length} filings processed`);
    
    // Delay between batches
    if (i + maxConcurrent < filings.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetween));
    }
  }
  
  const successful = results.filter(r => r.status?.includes('completed')).length;
  console.log(`🎯 Enhanced batch complete: ${successful}/${results.length} successful`);
  
  return results;
}
```

### 2. `src/lib/storage/filing-storage-enhanced.js`

```javascript
// Enhanced Filing Storage with AI Processing Integration
import { storeFilings as storeFilingsOriginal } from './filing-storage.js';
import { processFilingBatchEnhanced } from '$lib/ai/gemini-enhanced.js';
import { identifyNewFilings } from '$lib/fcc/ecfs-enhanced-client.js';

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
            const { processFilingEnhanced } = await import('$lib/ai/gemini-enhanced.js');
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
    const { logSystemEvent } = await import('$lib/database/db-operations.js');
    
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
```

### 3. `src/routes/api/admin/test-ai-enhanced/+server.js`

```javascript
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
    
    if (!platform.env.GEMINI_API_KEY) {
      return json({
        error: 'GEMINI_API_KEY not configured',
        suggestion: 'Add GEMINI_API_KEY to environment variables'
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
      const enhancedFiling = await processFilingEnhanced(testFiling, platform.env);
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
        ai_summary_preview: enhancedFiling.ai_summary?.substring(0, 200) + '...'
      };
      
    } else {
      // Test just AI summary generation
      const startTime = Date.now();
      const mockDocumentTexts = ['Sample document text for AI processing test'];
      const enhancedSummary = await generateEnhancedSummary(testFiling, mockDocumentTexts, platform.env);
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
        summary_preview: enhancedSummary.summary?.substring(0, 300) + '...'
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
        summary_preview: f.ai_summary?.substring(0, 150) + '...'
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
```

## Testing Plan for Card E2:
1. **Test AI processing only**: `GET /api/admin/test-ai-enhanced?docket=11-42`
2. **Test full pipeline**: `GET /api/admin/test-ai-enhanced?docket=11-42&full=true`
3. **Test batch processing**: `POST /api/admin/test-ai-enhanced` with body `{"max_filings": 2}`

## Success Criteria:
- ✅ Enhanced AI summaries with structured output
- ✅ Document content properly integrated into prompts
- ✅ Fallback handling when documents unavailable
- ✅ Batch processing works efficiently
- ✅ Rich metadata extraction (stakeholders, impact, etc.)