// PDF Document Processing for Enhanced ECFS Integration
// TEMPORARILY DISABLED: pdfjs-dist causes Node.js module issues in Cloudflare Workers
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { env } from '$env/dynamic/private';

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
        'Accept': '*/*'
      }
    });
    
    // NEW DEBUG: Log HTTP status & headers
    console.log(`🔍 PDF response status: ${response.status} ${response.statusText}`);
    console.log(`🔍 PDF response content-type: ${response.headers.get('content-type')}`);
    
    // NEW: Retry logic for FCC API NOT_ACCEPTABLE error
    if (response.status === 500) {
      try {
        const errPreview = await response.clone().text();
        if (errPreview.includes('APIKIT:NOT_ACCEPTAB')) {
          console.warn('⚠️ PDF server returned NOT_ACCEPTABLE – retrying without Accept header');
          const retryResp = await fetch(pdfUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'DocketCC/2.0 (Document Processing Service)'
            }
          });
          response.body = retryResp.body;
        }
      } catch (e) {
        console.error('Error during retry inspection:', e);
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // NEW DEBUG: Peek at first 120 chars of body when failure occurs
      let preview = '';
      try {
        const clone = response.clone();
        preview = await clone.text();
        preview = preview.substring(0, 120);
      } catch (e) {
        preview = '<<unable to read body preview>>';
      }
      console.error(`❌ PDF download error preview: ${preview}`);
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
 * TEMPORARILY DISABLED: PDF text extraction using pdfjs-dist
 * This causes Node.js module issues in Cloudflare Workers
 * For now, we'll use Jina API for all PDF processing
 */
export async function extractTextFromPDF(pdfBuffer) {
  // DISABLED for Cloudflare Workers compatibility
  throw new Error('Local PDF processing disabled - use Jina API instead');
  
  /* ORIGINAL CODE - DISABLED FOR CLOUDFLARE WORKERS
  try {
    console.log(`📖 Extracting text from PDF (${(pdfBuffer.byteLength / 1024).toFixed(2)} KB)`);

    // Load the PDF document from the buffer.
    // The legacy build doesn't need a worker.
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer), // pdf.js expects a Uint8Array
      // Disable font loading for faster server-side processing
      useSystemFonts: true, 
    }).promise;

    console.log(`📄 PDF has ${pdf.numPages} pages.`);
    let fullText = '';

    // Iterate through each page of the PDF
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // The text content is an array of items. Join them together.
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n'; // Add newlines between pages for readability
    }

    console.log(`✅ Successfully extracted ${fullText.length} characters from PDF.`);
    
    // Show detailed content analysis for debugging
    if (fullText.length <= 500) {
      console.log(`🔍 FULL EXTRACTED TEXT (${fullText.length} chars):`);
      console.log(`"${fullText}"`);
      console.log(`🔍 END OF EXTRACTED TEXT`);
    } else {
      console.log(`📄 Content preview (first 300 chars): "${fullText.substring(0, 300)}..."`);
    }
    
    const trimmed = fullText.trim();
    const lines = fullText.split('\n').length;
    const words = fullText.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`📊 Text Analysis: ${trimmed.length} chars (trimmed), ${lines} lines, ${words} words`);
    
    return fullText;

  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    // Re-throw the error so the calling function knows something went wrong.
    throw new Error('Failed to extract text from PDF.', { cause: error });
  }
  */
}

/**
 * Extract text from HTML viewer URLs using r.jina.ai with browser engine
 * @param {string} htmlUrl - URL like "https://www.fcc.gov/ecfs/document/ID/1"
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromHTML(htmlUrl) {
  try {
    console.log(`🌐 Extracting text from HTML viewer using Streaming Mode: ${htmlUrl}`);
    
    const jinaApiKey = env.JINA_API_KEY;
    if (!jinaApiKey) {
      throw new Error('JINA_API_KEY not configured');
    }
    
    console.log(`🚀 Using Jina Streaming Mode with Readability Bypass for: ${htmlUrl}`);
    
    const response = await fetch('https://r.jina.ai/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jinaApiKey}`,
        'Content-Type': 'application/json',
        // 🔑 KEY: Request streaming response for patience with slow-loading content
        'Accept': 'text/event-stream', 
        // 🔑 KEY: Bypass readability filtering for brute-force text extraction
        'x-respond-with': 'text',
      },
      body: JSON.stringify({ url: htmlUrl }),
      // Give streaming mode plenty of time to work
      signal: AbortSignal.timeout(90000) // 90 seconds
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Jina Streaming API failed with status ${response.status}: ${errorBody}`);
    }

    console.log(`📡 Processing streaming response from Jina...`);
    
    // 🔄 Handle the Streaming Response - AGGREGATE ALL CHUNKS (FIX!)
    const allTextChunks = []; // 1. Initialize an array to store all text parts
    let chunkCount = 0;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunkCount++;
        const chunkStr = decoder.decode(value, { stream: true });
        
        // Parse event-stream format: "data: { ... }\n\n"
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunkData = line.substring(6); // Get content after "data: "
            
            // 2. Extract and accumulate text content from each chunk
            try {
              // Try to parse as JSON first (common format)
              const parsedContent = JSON.parse(chunkData);
              if (parsedContent.content) {
                allTextChunks.push(parsedContent.content);
              } else if (parsedContent.text) {
                allTextChunks.push(parsedContent.text);
              } else if (parsedContent.data) {
                allTextChunks.push(parsedContent.data);
              }
            } catch {
              // If not JSON, treat as plain text and add it
              if (chunkData.trim()) {
                allTextChunks.push(chunkData);
              }
            }
            
            console.log(`📦 Received chunk ${chunkCount}, size: ${chunkData.length} chars`);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    console.log(`✅ Streaming complete: ${chunkCount} chunks received, aggregating ${allTextChunks.length} text parts`);
    
    // 3. Join all collected text chunks into one single string
    const textContent = allTextChunks.join('');

    if (!textContent || textContent.includes('You need to enable JavaScript')) {
      console.error(`❌ Streaming Mode failed. Aggregated ${allTextChunks.length} chunks but got no meaningful content.`);
      throw new Error('Jina Streaming Mode failed to extract meaningful content.');
    }
    
    console.log(`✅ Jina Streaming Mode aggregated ${allTextChunks.length} chunks into ${textContent.length} characters from HTML viewer`);
    
    // Show FULL content for debugging when short, or preview when long
    if (textContent.length <= 500) {
      console.log(`🔍 FULL EXTRACTED TEXT (${textContent.length} chars):`);
      console.log(`"${textContent}"`);
      console.log(`🔍 END OF EXTRACTED TEXT`);
    } else {
      console.log(`📄 Content preview (first 300 chars): "${textContent.substring(0, 300)}..."`);
    }
    
    // Show character analysis
    const trimmed = textContent.trim();
    const lines = textContent.split('\n').length;
    const words = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`📊 Text Analysis: ${trimmed.length} chars (trimmed), ${lines} lines, ${words} words`);
    
    if (textContent.length < 200) {
      console.warn(`⚠️ Warning: Very short content may indicate extraction failure`);
    }
    
    return textContent;
    
  } catch (error) {
    console.error('❌ HTML text extraction failed:', error);
    throw error;
  }
}

/**
 * Main processing router that chooses the correct extraction path based on URL type
 * @param {Object} filing - Filing with documents array
 * @returns {Promise<Object>} Filing with processed documents
 */
export async function processFilingDocuments(filing) {
  try {
    const processedDocuments = [];
    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    console.log(`🔄 Processing ${filing.documents?.length || 0} documents for filing ${filing.id}`);
    
    for (const doc of filing.documents || []) {
      console.log(`🔍 Evaluating doc URL: ${doc.src}`);
      
      if (doc.src && doc.type === 'pdf') {
        
        // Route A: FCC Direct PDFs → Jina API extraction (was local, now using Jina for Cloudflare compatibility)
        if (doc.src.startsWith('https://docs.fcc.gov/public/attachments/')) {
          console.log('🟢 Route A: FCC Direct PDF → Jina API extraction');
          try {
            console.log(`📄 Processing FCC direct PDF via Jina API: ${doc.src}`);
            
            const textContent = await extractTextFromHTML(doc.src);
            
            processedDocuments.push({
              ...doc,
              text_content: textContent,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'jina_pdf_extraction'
            });
            
            processedCount++;
            console.log(`✅ Jina PDF processed successfully: ${doc.filename} (${textContent.length} chars)`);
            
          } catch (error) {
            console.error(`❌ Jina PDF processing failed for ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'jina_pdf_extraction'
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
            
            const textContent = await extractTextFromHTML(transformedUrl);
            
            processedDocuments.push({
              ...doc,
              text_content: textContent,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'jina_html_extraction'
            });
            
            processedCount++;
            console.log(`✅ Jina API processed successfully: ${doc.filename} (${textContent.length} chars)`);
            
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
        
        // Fallback: Other FCC URLs (attempt Jina API processing)
        else if (doc.src.includes('fcc.gov')) {
          console.log('🔵 Fallback: Other FCC URL → Attempt Jina API processing');
          try {
            console.log(`⚠️ Unknown FCC URL pattern: ${doc.src} - attempting Jina API processing`);
            
            const textContent = await extractTextFromHTML(doc.src);
            
            processedDocuments.push({
              ...doc,
              text_content: textContent,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'fallback_jina_extraction'
            });
            
            processedCount++;
            console.log(`✅ Fallback Jina processing successful: ${doc.filename} (${textContent.length} chars)`);
            
          } catch (error) {
            console.error(`❌ Fallback Jina processing failed for ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'fallback_jina_extraction'
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
                          doc.type !== 'pdf' ? `Not a PDF (type: ${doc.type})` : 
                          'Unknown reason';
        
        processedDocuments.push({
          ...doc,
          status: 'skipped',
          reason: skipReason,
          processed_at: Date.now(),
          processing_method: 'not_applicable'
        });
        
        skippedCount++;
        console.log(`⏭️ Skipped document: ${doc.filename} - ${skipReason}`);
      }
    }
    
    console.log(`📊 Document processing complete: ${processedCount} processed, ${skippedCount} skipped, ${failedCount} failed`);
    
    // Show summary of what was actually extracted for debugging
    if (processedCount > 0) {
      console.log(`🔍 EXTRACTION SUMMARY:`);
      processedDocuments
        .filter(doc => doc.status === 'processed' && doc.text_content)
        .forEach(doc => {
          const textLen = doc.text_content.length;
          const method = doc.processing_method || 'unknown';
          console.log(`  📄 ${doc.filename}: ${textLen} chars via ${method}`);
        });
    }
    
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