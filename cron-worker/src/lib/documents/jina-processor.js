// Jina Document Processing for Enhanced ECFS Integration
// UNIFIED JINA APPROACH: Robust handling of both JSON and plain text responses

/**
 * Extract text from any URL using unified Jina approach with intelligent response handling
 * Handles both direct PDFs and HTML viewer URLs
 * @param {string} url - URL like "https://docs.fcc.gov/public/attachments/file.pdf" or "https://www.fcc.gov/ecfs/document/ID/1"
 * @returns {Promise<Object>} Object with extracted text and debug info
 */
async function extractTextFromHTML(url, env) {
  const jinaApiKey = env?.JINA_API_KEY;
  if (!jinaApiKey) {
    throw new Error('Cannot process with Jina: JINA_API_KEY not found.');
  }

  console.log(`🌐 Unified Jina extraction for: ${url}`);

  let result = null;
  let strategy = 'unknown';
  let error_log = [];

  // STRATEGY 1: Enhanced Streaming Mode (most thorough)
  try {
    console.log(`🚀 STRATEGY 1: Enhanced Streaming Mode`);
    result = await tryEnhancedStreamingMode(url, jinaApiKey);
    if (result && result.text.length > 100) { // Must have meaningful content
      strategy = 'enhanced_streaming';
      console.log(`✅ Enhanced streaming succeeded: ${result.text.length} chars`);
      return { ...result, extraction_strategy: strategy };
    }
    console.log(`⚠️ Enhanced streaming insufficient: ${result?.text?.length || 0} chars`);
  } catch (error) {
    error_log.push(`Enhanced streaming: ${error.message}`);
    console.log(`⚠️ Enhanced streaming failed: ${error.message}`);
  }

  // STRATEGY 2: Simple Reader Mode (reliable fallback)
  try {
    console.log(`🔄 STRATEGY 2: Simple Reader Mode`);
    result = await trySimpleReaderMode(url, jinaApiKey);
    if (result && result.text.length > 50) {
      strategy = 'simple_reader';
      console.log(`✅ Simple reader succeeded: ${result.text.length} chars`);
      return { ...result, extraction_strategy: strategy };
    }
    console.log(`⚠️ Simple reader insufficient: ${result?.text?.length || 0} chars`);
  } catch (error) {
    error_log.push(`Simple reader: ${error.message}`);
    console.log(`⚠️ Simple reader failed: ${error.message}`);
  }

  // STRATEGY 3: Basic POST Mode (last resort)
  try {
    console.log(`🔄 STRATEGY 3: Basic POST Mode (last resort)`);
    result = await tryBasicPostMode(url, jinaApiKey);
    if (result && result.text.length > 20) {
      strategy = 'basic_post';
      console.log(`✅ Basic POST succeeded: ${result.text.length} chars`);
      return { ...result, extraction_strategy: strategy };
    }
    console.log(`⚠️ Basic POST insufficient: ${result?.text?.length || 0} chars`);
  } catch (error) {
    error_log.push(`Basic POST: ${error.message}`);
    console.log(`❌ Basic POST failed: ${error.message}`);
  }

  // All strategies failed
  throw new Error(`All Jina extraction strategies failed for ${url}. Errors: ${error_log.join('; ')}`);
}

/**
 * Strategy 1: Enhanced streaming with robust error handling
 */
async function tryEnhancedStreamingMode(url, jinaApiKey) {
  const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
      'Authorization': `Bearer ${jinaApiKey}`,
      'Accept': 'text/event-stream',
      'X-Return-Format': 'text',
      'X-Engine': 'browser',
      'X-Timeout': '30'
    },
  });
    
    if (!response.ok) {
    throw new Error(`Enhanced streaming HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let done = false;
  let chunkCount = 0;
  let successfulParses = 0;
  const rawChunks = [];

  console.log('📡 Processing enhanced streaming...');
  
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      chunkCount++;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonString = line.substring(6);
          if (jsonString.trim()) {
            try {
              const parsed = JSON.parse(jsonString);
              if (parsed.text) {
                fullText += parsed.text;
                successfulParses++;
                
                rawChunks.push({
                  chunk_index: chunkCount,
                  raw_data: jsonString,
                  size: parsed.text.length,
                  timestamp: Date.now()
                });
                
                console.log(`📦 Received chunk ${chunkCount}, size: ${parsed.text.length} chars`);
              }
            } catch (e) {
              // Log failed chunks for first few attempts
              if (chunkCount <= 5) {
                console.log(`🔍 Failed to parse chunk ${chunkCount}: ${jsonString.substring(0, 100)}...`);
              }
            }
          }
        }
      }
    }
  }

  console.log(`✅ Streaming complete: ${chunkCount} chunks received, aggregating ${successfulParses} text parts`);
  
  if (successfulParses === 0) {
    throw new Error(`No valid JSON parsed from ${chunkCount} chunks`);
  }

  return {
    text: fullText,
    debug_info: {
      chunks_received: chunkCount,
      successful_parses: successfulParses,
      raw_chunks: rawChunks,
      mode: 'enhanced_streaming'
    }
  };
}

/**
 * Strategy 2: Simple reader with intelligent response handling (FIXED)
 */
async function trySimpleReaderMode(url, jinaApiKey) {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      'Authorization': `Bearer ${jinaApiKey}`,
      'X-Return-Format': 'text',
      'X-Engine': 'browser',
      'X-Timeout': '20'
    },
  });

  if (!response.ok) {
    throw new Error(`Simple reader HTTP ${response.status}`);
  }

  // ✅ THE FIX: Intelligently handle the response based on its Content-Type
  const contentType = response.headers.get('content-type');
  let extractedText;

  if (contentType && contentType.includes('application/json')) {
    // Handles structured JSON responses (from streaming or future Jina features)
    const jsonData = await response.json();
    // Adjust this path based on the actual JSON structure Jina returns
    extractedText = jsonData?.data?.content || jsonData?.content || jsonData?.text || '';
    console.log(`✅ Jina Processor: Extracted text from JSON response (Simple Reader).`);
  } else {
    // Handles plain text responses, which is the current case for reader.jina.ai
    extractedText = await response.text();
    console.log(`✅ Jina Processor: Extracted text from plain text response (Simple Reader).`);
  }

  if (!extractedText) {
    console.warn(`⚠️ Jina Processor: Extracted empty text for ${url}`);
    throw new Error('Simple reader returned empty content');
  }
  
  if (extractedText.includes('You need to enable JavaScript')) {
    throw new Error('Simple reader hit JavaScript requirement');
  }

  return {
    text: extractedText,
    debug_info: {
      mode: 'simple_reader',
      content_type: contentType,
      response_was_json: contentType && contentType.includes('application/json')
    }
  };
}

/**
 * Strategy 3: Basic POST with intelligent response handling (FIXED)
 */
async function tryBasicPostMode(url, jinaApiKey) {
  const response = await fetch('https://r.jina.ai/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jinaApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      url: url,
      options: {
        engine: 'browser',
        timeout: 15
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Basic POST HTTP ${response.status}`);
  }

  // ✅ THE FIX: Intelligently handle the response based on its Content-Type
  const contentType = response.headers.get('content-type');
  let extractedText;

  if (contentType && contentType.includes('application/json')) {
    // Handles structured JSON responses (from streaming or future Jina features)
    const jsonData = await response.json();
    // Adjust this path based on the actual JSON structure Jina returns
    extractedText = jsonData?.data?.content || jsonData?.data?.text || jsonData?.content || jsonData?.text || '';
    console.log(`✅ Jina Processor: Extracted text from JSON response (Basic POST).`);
  } else {
    // Handles plain text responses, which is the current case for reader.jina.ai
    extractedText = await response.text();
    console.log(`✅ Jina Processor: Extracted text from plain text response (Basic POST).`);
  }

  if (!extractedText) {
    console.warn(`⚠️ Jina Processor: Extracted empty text for ${url}`);
    throw new Error('Basic POST returned empty content');
  }

  return {
    text: extractedText,
    debug_info: {
      mode: 'basic_post',
      content_type: contentType,
      response_was_json: contentType && contentType.includes('application/json')
    }
  };
}

/**
 * Main processing router that chooses the correct extraction path based on URL type
 * @param {Object} filing - Filing with documents array
 * @returns {Promise<Object>} Filing with processed documents
 */
export async function processFilingDocuments(filing, env) {
  try {
    const processedDocuments = [];
    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    const pdfCount = filing.documents?.filter(doc => doc.type === 'pdf').length || 0;
    const nonPdfCount = (filing.documents?.length || 0) - pdfCount;
    console.log(`🔄 Processing filing ${filing.id}: ${pdfCount} PDFs, ${nonPdfCount} other files`);
    
    for (const doc of filing.documents || []) {
      if (doc.src && doc.type === 'pdf') {
        
        // Route A: FCC Direct PDFs → Jina API extraction (same as Route B)
        if (doc.src.startsWith('https://docs.fcc.gov/public/attachments/')) {
          try {
            console.log(`📄 Processing FCC direct PDF: ${doc.src}`);
            
            // Use Jina API to extract text from direct PDF URL (no transformation needed)
            const extractionResult = await extractTextFromHTML(doc.src, env);
            
            // =======================================================================
            // SANITIZE TEXT: Remove "undefined" artifacts from Jina API response
            // =======================================================================
            const sanitizedText = extractionResult.text.replace(/undefined/g, '');
            console.log(`🧹 Sanitized text: removed ${extractionResult.text.length - sanitizedText.length} characters`);
            
            processedDocuments.push({
              ...doc,
              text_content: sanitizedText,
              raw_chunks: extractionResult.debug_info?.raw_chunks || [],
              jina_debug: extractionResult.debug_info,
              extraction_strategy: extractionResult.extraction_strategy,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'jina_direct_pdf_extraction'
            });
            
            processedCount++;
            console.log(`✅ Jina API processed direct PDF successfully: ${doc.filename} (${sanitizedText.length} chars) via ${extractionResult.extraction_strategy}`);
            
          } catch (error) {
            console.error(`❌ Jina API processing failed for direct PDF ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'jina_direct_pdf_extraction'
            });
            failedCount++;
          }
        }
        
        // Route B: HTML Viewers → Jina API extraction
        else if (doc.src.startsWith('https://www.fcc.gov/ecfs/document/')) {
          console.log('🟡 Route B: HTML Viewer → Jina API extraction');
          try {
            console.log(`🌐 Processing HTML viewer PDF: ${doc.src}`);
            
            // 🔄 TRANSFORM URL: Change /ecfs/document/ to /ecfs/documents/ for better PDF viewer access
            const transformedUrl = doc.src.replace('/ecfs/document/', '/ecfs/documents/');
            console.log(`🔄 URL transformed: ${doc.src} → ${transformedUrl}`);
            
            const extractionResult = await extractTextFromHTML(transformedUrl, env);
            
            // =======================================================================
            // SANITIZE TEXT: Remove "undefined" artifacts from Jina API response
            // =======================================================================
            const sanitizedText = extractionResult.text.replace(/undefined/g, '');
            console.log(`🧹 Sanitized text: removed ${extractionResult.text.length - sanitizedText.length} characters`);
            
            processedDocuments.push({
              ...doc,
              text_content: sanitizedText,
              raw_chunks: extractionResult.debug_info?.raw_chunks || [],
              jina_debug: extractionResult.debug_info,
              extraction_strategy: extractionResult.extraction_strategy,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'jina_html_extraction'
            });
            
            processedCount++;
            console.log(`✅ Jina API processed successfully: ${doc.filename} (${sanitizedText.length} chars) via ${extractionResult.extraction_strategy}`);
            
          } catch (error) {
            console.error(`❌ Jina API processing failed for ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'jina_html_extraction'
            });
            failedCount++;
          }
        }
        
        // Fallback: Other FCC URLs (attempt Jina processing)
        else if (doc.src.includes('fcc.gov')) {
          console.log('🔵 Fallback: Other FCC URL → Attempt Jina processing');
          try {
            console.log(`⚠️ Unknown FCC URL pattern: ${doc.src} - attempting Jina processing`);
            
            const extractionResult = await extractTextFromHTML(doc.src, env);
            
            // =======================================================================
            // SANITIZE TEXT: Remove "undefined" artifacts from Jina API response
            // =======================================================================
            const sanitizedText = extractionResult.text.replace(/undefined/g, '');
            console.log(`🧹 Sanitized text: removed ${extractionResult.text.length - sanitizedText.length} characters`);
          
          processedDocuments.push({
            ...doc,
              text_content: sanitizedText,
              raw_chunks: extractionResult.debug_info?.raw_chunks || [],
              jina_debug: extractionResult.debug_info,
              extraction_strategy: extractionResult.extraction_strategy,
            processed_at: Date.now(),
              status: 'processed',
              processing_method: 'jina_fallback_extraction'
          });
          
          processedCount++;
          console.log(`✅ Fallback Jina processing successful: ${doc.filename} (${sanitizedText.length} chars) via ${extractionResult.extraction_strategy}`);
          
        } catch (error) {
          console.error(`❌ Fallback Jina processing failed for ${doc.filename}:`, error);
          processedDocuments.push({
            ...doc,
            status: 'failed',
            error: error.message,
            processed_at: Date.now(),
            processing_method: 'jina_fallback_extraction'
          });
          failedCount++;
        }
        }
        
        // Unsupported: Non-FCC URLs
        else {
          console.log('🔴 Unsupported: Non-FCC URL → Skip');
          console.log(`🚫 Non-FCC URL detected: ${doc.src} - skipping`);
          processedDocuments.push({
            ...doc,
            status: 'skipped',
            reason: 'Non-FCC URL not supported',
            processed_at: Date.now(),
            processing_method: 'not_supported'
          });
          skippedCount++;
        }
        
      } else {
        // Non-PDF or no source URL
        const skipReason = !doc.src ? 'No source URL' : 
                          doc.type === 'docx' ? 'Word document (not yet supported)' :
                          doc.type === 'xlsx' ? 'Excel file (not yet supported)' :
                          doc.type === 'txt' ? 'Text file (not yet supported)' :
                          doc.type !== 'pdf' ? `File type '${doc.type}' not yet supported` : 
                          'Unknown reason';
        
        processedDocuments.push({
          ...doc,
          status: 'skipped',
          reason: skipReason,
          processed_at: Date.now(),
          processing_method: 'not_applicable'
        });
        
        skippedCount++;
        console.log(`⏭️ Skipped: ${doc.filename} - ${skipReason}`);
      }
    }
    
    console.log(`📊 Filing ${filing.id} complete: ${processedCount} processed, ${skippedCount} skipped, ${failedCount} failed`);
    
    return {
      ...filing,
      documents: processedDocuments,
      documents_processed: processedCount,
      documents_skipped: skippedCount,
      documents_failed: failedCount,
      processing_completed_at: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Filing document processing failed:', error);
    return {
      ...filing,
      documents_processed: 0,
      documents_skipped: 0,
      documents_failed: 0,
      processing_error: error.message,
      processing_completed_at: Date.now()
    };
  }
} 