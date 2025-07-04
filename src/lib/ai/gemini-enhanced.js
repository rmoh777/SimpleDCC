// Enhanced Gemini AI Processing with Document Content
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

/**
 * Generate enhanced AI summary with document content integration
 * @param {Object} filing - Filing object with metadata
 * @param {Array} documentTexts - Array of extracted document texts
 * @param {Object} passedEnv - Environment variables passed from caller (optional)
 * @returns {Promise<Object>} Enhanced AI summary with structured output
 */
export async function generateEnhancedSummary(filing, documentTexts = [], passedEnv) {
  try {
    // Use SvelteKit native env with fallback support for backwards compatibility
    const apiKey = env.GEMINI_API_KEY || passedEnv?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyCx_57Ec-9CIPOqQMvMC06YLmVYThIW4_w';
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
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
    
    if (filing.documents?.some(d => d.src && d.src.includes('fcc.gov'))) {
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