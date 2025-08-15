// Enhanced Gemini AI Processing with Document Content
import { GoogleGenerativeAI } from '@google/generative-ai';

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false,
  threshold: 3, // Open circuit after 3 failures
  timeout: 300000 // 5 minutes
};

/**
 * Error classification for better handling
 */
function classifyError(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('rate limit') || message.includes('quota')) {
    return { type: 'RATE_LIMIT', retryable: true, backoff: 60000 };
  }
  
  if (message.includes('timeout') || message.includes('network')) {
    return { type: 'NETWORK', retryable: true, backoff: 10000 };
  }
  
  if (message.includes('invalid') || message.includes('unauthorized')) {
    return { type: 'AUTH', retryable: false, backoff: 0 };
  }
  
  if (message.includes('content') || message.includes('safety')) {
    return { type: 'CONTENT_POLICY', retryable: false, backoff: 0 };
  }
  
  return { type: 'UNKNOWN', retryable: true, backoff: 30000 };
}

/**
 * Check if circuit breaker should block requests
 */
function shouldBlockRequest() {
  if (!circuitBreaker.isOpen) return false;
  
  const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
  if (timeSinceLastFailure > circuitBreaker.timeout) {
    // Reset circuit breaker
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    console.log('🔄 Circuit breaker reset - attempting Gemini API calls');
    return false;
  }
  
  return true;
}

/**
 * Record API failure and update circuit breaker
 */
function recordFailure(error) {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
  
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.isOpen = true;
    console.warn(`🚨 Circuit breaker OPEN - Gemini API calls blocked for ${circuitBreaker.timeout/1000}s`);
  }
}

/**
 * Record successful API call
 */
function recordSuccess() {
  if (circuitBreaker.failures > 0) {
    circuitBreaker.failures = 0;
    console.log('✅ Circuit breaker reset - Gemini API healthy');
  }
}

/**
 * Generate enhanced AI summary with document content integration and circuit breaker
 * @param {Object} filing - Filing object with metadata
 * @param {string} documentText - Combined document text content
 * @param {Object} env - Environment variables passed from caller
 * @returns {Promise<Object>} Enhanced AI summary with structured output
 */
export async function generateEnhancedSummary(filing, documentText = '', env) {
  try {
    // Check circuit breaker first
    if (shouldBlockRequest()) {
      console.log(`⚠️ Circuit breaker OPEN - skipping AI processing for filing ${filing.id}`);
      throw new Error('Circuit breaker open - AI processing temporarily unavailable');
    }

    // Use env object passed from the worker environment
    const apiKey = env?.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Build enhanced prompt with document content
    const prompt = buildEnhancedPrompt(filing, documentText);
    
    console.log(`🤖 Generating enhanced AI summary for filing ${filing.id}`);
    console.log(`📄 Processing ${documentText.length} characters of document content`);
    
    const result = await model.generateContent(prompt);
    const summaryText = result.response.text();
    
    // Parse structured output
    const structuredSummary = parseStructuredSummary(summaryText);
    
    // Record successful API call
    recordSuccess();
    
    return {
      summary: structuredSummary.summary,
      key_points: structuredSummary.key_points,
      stakeholders: structuredSummary.stakeholders,
      regulatory_impact: structuredSummary.regulatory_impact,
      document_analysis: structuredSummary.document_analysis,
      ai_confidence: structuredSummary.confidence,
      processing_notes: {
        document_length: documentText.length,
        enhanced_processing: true,
        generated_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced AI processing failed:', error);
    recordFailure(error);
    throw error;
  }
}

/**
 * Build enhanced prompt that leverages document content
 */
function buildEnhancedPrompt(filing, documentText) {
  const hasDocuments = documentText && documentText.length > 0;
  
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
    // Use up to 60K characters for comprehensive analysis
    const maxChars = 60000;
    const truncatedText = documentText.length > maxChars 
        ? documentText.substring(0, maxChars) + '\n\n... [Content truncated for length]'
        : documentText;
    
    prompt += `
DOCUMENT CONTENT ANALYSIS:
The following document content was extracted and should be analyzed for key insights:

${truncatedText}

`;
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
      document_analysis: sections.document_analysis || 'Document analysis not available',
      confidence: sections.confidence || 'Confidence not available'
    };
    
  } catch (error) {
    console.error('❌ Failed to parse structured summary:', error);
    return {
      summary: rawSummary, // Return raw summary on parsing failure
      key_points: [],
      stakeholders: 'Parsing failed',
      regulatory_impact: 'Parsing failed',
      document_analysis: 'Parsing failed',
      confidence: 'Low'
    };
  }
}

// Enhanced Filing Storage with AI Processing Integration
import { extractDocumentContent } from '../documents/jina-processor.js';

/**
 * Enhanced filing processing with circuit breaker and graceful degradation
 */
export async function processFilingEnhanced(filing, env) {
  const startTime = Date.now();
  
  try {
    // Check circuit breaker
    if (shouldBlockRequest()) {
      console.log(`⚠️ Circuit breaker OPEN - skipping AI processing for filing ${filing.id}`);
      return {
        ...filing,
        status: 'completed_degraded',
        ai_summary: 'AI processing temporarily unavailable due to service issues',
        ai_enhanced: false,
        processing_mode: 'circuit_breaker_open',
        processed_at: Date.now()
      };
    }

    // Early detection: Handle confidential/restricted filings
    if (filing.is_filing_restricted) {
      console.log(`🔒 Filing ${filing.id} marked as restricted (${filing.restriction_reason}) - providing confidential filing response`);
      
      return {
        ...filing,
        ai_enhanced: true,
        ai_summary: `This filing (${filing.title}) contains confidential documents that are not publicly accessible.`,
        ai_key_points: [
          `Filing marked as: ${filing.restriction_reason}`,
          "Document content not available for public analysis",
          "Filing details may only be viewable by authorized parties"
        ],
        ai_stakeholders: "Cannot determine - confidential filing restrictions apply",
        ai_regulatory_impact: "Cannot assess - document content restricted from public access",
        ai_document_analysis: "Document analysis not possible due to confidentiality restrictions",
        ai_confidence: `This filing is marked as "${filing.restriction_reason}" in the FCC ECFS system, making document content inaccessible for AI analysis. Filing metadata and basic information remain publicly viewable.`,
        documents_processed: 0,
        status: 'completed_restricted',
        processing_mode: 'confidential_handling',
        processed_at: Date.now()
      };
    }

    console.log(`🤖 Enhanced processing filing: ${filing.id} - ${filing.title}`);
    
    // Process documents if available
    let documentText = '';
    let documentsProcessed = 0;
    
    if (filing.documents && Array.isArray(filing.documents) && filing.documents.length > 0) {
      console.log(`📄 Processing ${filing.documents.length} documents for filing ${filing.id}`);
      
      for (const doc of filing.documents) {
        if (doc.src && doc.type === 'pdf') {
          try {
            const content = await extractDocumentContent(doc.src, env);
            if (content && content.length > 100) {
              documentText += `\n\n[Document: ${doc.filename}]\n${content}`;
              documentsProcessed++;
            }
          } catch (docError) {
            console.warn(`⚠️ Document processing failed for ${doc.filename}:`, docError.message);
          }
        }
      }
      
      console.log(`✅ Processed ${documentsProcessed}/${filing.documents.length} documents`);
    }
    
    // Generate AI summary with filing object and document text
    const aiResult = await generateEnhancedSummary(filing, documentText, env);

    return {
      ...filing,
      ai_enhanced: true,
      ai_summary: aiResult.summary,
      ai_key_points: aiResult.key_points,
      ai_stakeholders: aiResult.stakeholders,
      ai_regulatory_impact: aiResult.regulatory_impact,
      ai_document_analysis: aiResult.document_analysis,
      ai_confidence: aiResult.ai_confidence,
      documents_processed: documentsProcessed,
      status: 'completed_enhanced',
      processing_notes: aiResult.processing_notes
    };
    
  } catch (error) {
    console.error(`❌ AI processing failed for filing ${filing.id}:`, error.message);
    
    return {
      ...filing,
      status: 'failed_ai_processing',
      ai_summary: `AI processing failed: ${error.message}`,
      ai_enhanced: false,
      processed_at: Date.now()
    };
  }
}

/**
 * Batch process filings with concurrency and delay
 * @param {Array} filings - Array of filings to process
 * @param {Object} env - Environment variables
 * @param {Object} options - Batch processing options
 * @returns {Promise<Array>} Array of processed filings
 */
export async function processFilingBatchEnhanced(filings, env, options = {}) {
  const { maxConcurrent = 2, delayBetween = 1000 } = options;
  const results = [];
  const queue = [...filings];
  
  async function processNext() {
    if (queue.length === 0) return;
    
    const filing = queue.shift();
    if (filing) {
      try {
        const processed = await processFilingEnhanced(filing, env);
        results.push(processed);
      } catch (error) {
        console.error(`❌ Batch processing failed for filing ${filing.id}:`, error);
        results.push({ ...filing, status: 'failed_batch' });
      } finally {
        if (delayBetween > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }
        await processNext();
      }
    }
  }
  
  const workers = Array(maxConcurrent).fill(null).map(processNext);
  await Promise.all(workers);
  
  return results;
} 