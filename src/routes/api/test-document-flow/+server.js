import { json } from '@sveltejs/kit';
import { fetchLatestFilings } from '$lib/fcc/ecfs-enhanced-client.js';
import { generateEnhancedSummary } from '$lib/ai/gemini-enhanced.js';
import { env } from '$env/dynamic/private';

export async function GET({ url, cookies }) {
  // Check admin authentication
  const adminSession = cookies.get('admin_session');
  if (adminSession !== 'authenticated') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docket = url.searchParams.get('docket') || '10-90';
  const startTime = Date.now();
  
  console.log(`🔍 COMPLETE DOCUMENT FLOW TEST: Starting for docket ${docket}`);
  
  try {
    // ==============================================
    // STEP 1: ECFS DATA FETCHING
    // ==============================================
    console.log(`📡 STEP 1: Fetching ECFS data for docket ${docket}`);
    const ecfsStartTime = Date.now();
    
    const filings = await fetchLatestFilings(docket, 5, { 
      ECFS_API_KEY: env.ECFS_API_KEY 
    });
    
    const ecfsEndTime = Date.now();
    
    if (filings.length === 0) {
      throw new Error(`No filings found for docket ${docket}`);
    }
    
    // Find first filing with documents
    const testFiling = filings.find(f => f.documents?.length > 0);
    if (!testFiling) {
      throw new Error(`No filings with documents found for docket ${docket}`);
    }
    
    const testDocument = testFiling.documents[0];
    
    console.log(`✅ ECFS: Found ${filings.length} filings, testing with ${testFiling.id}`);
    
    // ==============================================
    // STEP 2: DOCUMENT PROCESSING WITH FULL DEBUG
    // ==============================================
    console.log(`📄 STEP 2: Processing document ${testDocument.filename}`);
    const jinaStartTime = Date.now();
    
    let jinaResults = null;
    let documentRoute = 'unknown';
    let transformedUrl = testDocument.src;
    
    // Determine route
    if (testDocument.src.startsWith('https://docs.fcc.gov/public/attachments/')) {
      documentRoute = 'Route A: FCC Direct PDF';
    } else if (testDocument.src.startsWith('https://www.fcc.gov/ecfs/document/')) {
      documentRoute = 'Route B: HTML Viewer';
      transformedUrl = testDocument.src.replace('/ecfs/document/', '/ecfs/documents/');
    }
    
    console.log(`🔍 Document route: ${documentRoute}`);
    console.log(`🔍 Original URL: ${testDocument.src}`);
    console.log(`🔍 Transformed URL: ${transformedUrl}`);
    
    // Process based on route - BOTH now use Jina API
    if (documentRoute === 'Route A: FCC Direct PDF') {
      // Route A: Direct PDF processing via Jina API
      console.log(`📄 Processing direct PDF via Route A (Jina API)`);
      
      jinaResults = await processWithJinaFullDebug(testDocument.src);
      
    } else {
      // Route B: HTML Viewer via Jina with full debugging
      console.log(`🌐 Processing HTML viewer via Route B with full debugging`);
      
      jinaResults = await processWithJinaFullDebug(transformedUrl);
    }
    
    const jinaEndTime = Date.now();
    
    // ==============================================
    // STEP 3: GEMINI AI PROCESSING WITH FULL DEBUG
    // ==============================================
    console.log(`🤖 STEP 3: Processing with Gemini AI`);
    const geminiStartTime = Date.now();
    
    // Create enhanced filing object for Gemini
    const enhancedFiling = {
      ...testFiling,
      documents: [{
        ...testDocument,
        text_content: jinaResults.final_text,
        processing_method: jinaResults.strategy
      }]
    };
    
    const documentTexts = [jinaResults.final_text];
    
    // Generate enhanced summary with full debugging
    const geminiResults = await generateEnhancedSummaryWithDebug(
      enhancedFiling, 
      documentTexts, 
      { GEMINI_API_KEY: env.GEMINI_API_KEY }
    );
    
    const geminiEndTime = Date.now();
    
    // ==============================================
    // STEP 4: COMPILE COMPLETE RESULTS
    // ==============================================
    const totalEndTime = Date.now();
    
    console.log(`✅ COMPLETE FLOW: Total time ${totalEndTime - startTime}ms`);
    
    return json({
      success: true,
      docket: docket,
      
      // ECFS Results
      ecfs_results: {
        filings_count: filings.length,
        test_filing_id: testFiling.id,
        documents_count: testFiling.documents?.length || 0,
        test_document: {
          filename: testDocument.filename,
          src: testDocument.src,
          transformed_url: transformedUrl,
          route: documentRoute
        }
      },
      
      // Jina Processing Results
      jina_results: jinaResults,
      
      // Gemini Processing Results
      gemini_results: geminiResults,
      
      // Processing Statistics
      processing_stats: {
        total_time_ms: totalEndTime - startTime,
        ecfs_time_ms: ecfsEndTime - ecfsStartTime,
        jina_time_ms: jinaEndTime - jinaStartTime,
        gemini_time_ms: geminiEndTime - geminiStartTime
      },
      
      // Success Flags
      success_flags: {
        ecfs_success: filings.length > 0,
        jina_success: jinaResults.final_text_length > 0,
        gemini_success: geminiResults.parsed.summary.length > 0,
        overall_success: true
      }
    });
    
  } catch (error) {
    console.error('❌ COMPLETE FLOW ERROR:', error);
    
    return json({
      success: false,
      error: error.message,
      docket: docket,
      processing_stats: {
        total_time_ms: Date.now() - startTime,
        ecfs_time_ms: 0,
        jina_time_ms: 0,
        gemini_time_ms: 0
      },
      success_flags: {
        ecfs_success: false,
        jina_success: false,
        gemini_success: false,
        overall_success: false
      }
    }, { status: 500 });
  }
}

/**
 * Process document with Jina API using the CORRECT JSON mode approach
 * Get your Jina AI API key for free: https://jina.ai/?sui=apikey
 */
async function processWithJinaFullDebug(htmlUrl) {
  const jinaApiKey = env.JINA_API_KEY;
  if (!jinaApiKey) {
    throw new Error('JINA_API_KEY not configured');
  }
  
  console.log(`🔍 JINA FULL DEBUG: Processing ${htmlUrl} using JSON mode`);
  
  // Use the CORRECT JSON mode approach from Jina docs
  const response = await fetch('https://r.jina.ai/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jinaApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Engine': 'browser',
      'X-Timeout': '30'
    },
    body: JSON.stringify({ url: htmlUrl })
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status}`);
  }

  console.log('📡 JINA DEBUG: Received response, parsing JSON...');
  
  const result = await response.json();
  
  console.log(`🔍 JINA DEBUG: Response structure - keys: ${Object.keys(result).join(', ')}`);
  console.log(`🔍 JINA DEBUG: Response code: ${result.code}`);
  console.log(`🔍 JINA DEBUG: Response status: ${result.status}`);
  
  if (result.data) {
    console.log(`🔍 JINA DEBUG: Data structure - keys: ${Object.keys(result.data).join(', ')}`);
    console.log(`🔍 JINA DEBUG: Content length: ${result.data.content?.length || 0}`);
    console.log(`🔍 JINA DEBUG: Title: ${result.data.title}`);
  }
  
  // Extract content according to Jina docs: response.data.content
  const content = result.data?.content || '';
  
  if (!content) {
    throw new Error('No content returned from Jina API');
  }
  
  console.log(`✅ JINA DEBUG: Successfully extracted ${content.length} characters`);
  console.log(`📄 JINA DEBUG: Content preview: "${content.substring(0, 200)}..."`);
  
  // Sanitize text to remove any artifacts
  const sanitizedText = content.replace(/undefined/g, '');
  const removedChars = content.length - sanitizedText.length;
  
  if (removedChars > 0) {
    console.log(`🧹 JINA DEBUG: Sanitized ${removedChars} "undefined" artifacts`);
  }
  
  return {
    strategy: 'jina_json_mode',
    total_chunks: 1,
    successful_parses: 1,
    final_text_length: content.length,
    sanitized_text_length: sanitizedText.length,
    final_text: sanitizedText,
    chunk_details: [{
      content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      size: content.length,
      success: true
    }],
    jina_response: {
      code: result.code,
      status: result.status,
      title: result.data?.title,
      url: result.data?.url
    }
  };
}

/**
 * Generate enhanced summary with full debugging information
 */
async function generateEnhancedSummaryWithDebug(filing, documentTexts, env) {
  console.log(`🤖 GEMINI DEBUG: Processing filing ${filing.id} with ${documentTexts.length} documents`);
  
  // Build the exact prompt that will be sent
  const prompt = buildPromptWithDebug(filing, documentTexts);
  
  console.log(`💬 GEMINI DEBUG: Prompt length: ${prompt.length} characters`);
  console.log(`💬 GEMINI DEBUG: Document texts total: ${documentTexts.reduce((sum, text) => sum + text.length, 0)} characters`);
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    
    console.log(`📥 GEMINI DEBUG: Raw response length: ${rawResponse.length} characters`);
    
    // Parse the response
    const parsed = parseStructuredSummary(rawResponse);
    
    console.log(`🔍 GEMINI DEBUG: Parsed summary length: ${parsed.summary.length} characters`);
    console.log(`🔍 GEMINI DEBUG: Key points: ${parsed.key_points.length} items`);
    
    return {
      prompt: prompt,
      raw_response: rawResponse,
      parsed: parsed
    };
    
  } catch (error) {
    console.error('❌ GEMINI DEBUG: Error:', error);
    throw error;
  }
}

/**
 * Build enhanced prompt with full debugging
 */
function buildPromptWithDebug(filing, documentTexts) {
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
Document ${index + 1} (${text.length} characters):
${text.substring(0, 8000)}${text.length > 8000 ? '\n... [truncated for length]' : ''}

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
 * Parse structured AI response
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
      confidence: sections.confidence || 'Medium'
    };
    
  } catch (error) {
    console.error('❌ Error parsing structured summary:', error);
    return {
      summary: rawSummary,
      key_points: [],
      stakeholders: 'Parse error',
      regulatory_impact: 'Parse error',
      document_analysis: null,
      confidence: 'Low'
    };
  }
} 