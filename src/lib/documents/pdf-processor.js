// PDF Document Processing for Enhanced ECFS Integration
// Using static import with pdfjs-dist legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
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
 * Extracts clean text from a PDF buffer using the server-side legacy build of pdfjs-dist.
 * @param {Buffer|ArrayBuffer} pdfBuffer - The PDF content as a Buffer or ArrayBuffer
 * @returns {Promise<string>} A promise that resolves to the full text content of the PDF
 */
export async function extractTextFromPDF(pdfBuffer) {
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
}

/**
 * Extract text from HTML viewer URLs using r.jina.ai with browser engine
 * @param {string} htmlUrl - URL like "https://www.fcc.gov/ecfs/document/ID/1"
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromHTML(htmlUrl) {
  try {
    console.log(`🔵 Using Route B: Jina API Streaming Mode.`);
    
    const jinaApiKey = env.JINA_API_KEY;
    if (!jinaApiKey) {
      throw new Error('Cannot process with Jina: JINA_API_KEY not found.');
    }
    
    const jinaReaderUrl = `https://r.jina.ai/${htmlUrl}`;
    
    const response = await fetch(jinaReaderUrl, {
      headers: {
        'Authorization': `Bearer ${jinaApiKey}`,
        'Accept': 'text/event-stream', // We must specify we want a stream
      },
    });

    if (!response.ok) {
      throw new Error(`Jina API request failed with status ${response.status}`);
    }

    // =======================================================================
    // THE FIX IS HERE: Correctly parse the Server-Sent Events (SSE) stream
    // =======================================================================
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let done = false;

    console.log('📡 Processing streaming response from Jina...');
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        // SSE streams can contain multiple "data:" lines in a single chunk
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          // We only care about lines that start with "data: "
          if (line.startsWith('data: ')) {
            // Extract the JSON part of the message
            const jsonString = line.substring(6);
            if (jsonString.trim()) {
              try {
                // Parse the JSON and get the content
                const parsed = JSON.parse(jsonString);
                if (parsed.content) {
                  fullText += parsed.content;
                }
              } catch (e) {
                // It's possible to get incomplete JSON in a chunk, so we log and continue
                console.warn('...could not parse a streaming JSON chunk, continuing...');
              }
            }
          }
        }
      }
    }
    // =======================================================================

    if (!fullText) {
      throw new Error('Jina Streaming Mode failed to aggregate meaningful content.');
    }

    console.log(`✅ Streaming complete. Extracted ${fullText.length} characters.`);
    
    // Show detailed debugging output
    if (fullText.length <= 500) {
      console.log(`🔍 FULL EXTRACTED TEXT (${fullText.length} chars):`);
      console.log(`"${fullText}"`);
      console.log(`🔍 END OF EXTRACTED TEXT`);
    } else {
      console.log(`📄 Content preview (first 300 chars): "${fullText.substring(0, 300)}..."`);
    }
    
    return fullText;
    
  } catch (error) {
    console.error(`❌ Jina Streaming processing failed:`, error);
    throw error; // Re-throw the error to be caught by the main try/catch block
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
        
        // Route A: FCC Direct PDFs → Local pdfjs-dist extraction
        if (doc.src.startsWith('https://docs.fcc.gov/public/attachments/')) {
          console.log('🟢 Route A: FCC Direct PDF → Local extraction');
          try {
            console.log(`📄 Processing FCC direct PDF: ${doc.src}`);
            
            const pdfBuffer = await downloadPDF(doc.src);
            const textContent = await extractTextFromPDF(pdfBuffer);
            
            processedDocuments.push({
              ...doc,
              text_content: textContent,
              size: pdfBuffer.byteLength,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'local_pdf_extraction'
            });
            
            processedCount++;
            console.log(`✅ Local PDF processed successfully: ${doc.filename} (${textContent.length} chars)`);
            
          } catch (error) {
            console.error(`❌ Local PDF processing failed for ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'local_pdf_extraction'
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
        
        // Fallback: Other FCC URLs (attempt local processing)
        else if (doc.src.includes('fcc.gov')) {
          console.log('🔵 Fallback: Other FCC URL → Attempt local processing');
          try {
            console.log(`⚠️ Unknown FCC URL pattern: ${doc.src} - attempting local processing`);
            
            const pdfBuffer = await downloadPDF(doc.src);
            const textContent = await extractTextFromPDF(pdfBuffer);
            
            processedDocuments.push({
              ...doc,
              text_content: textContent,
              size: pdfBuffer.byteLength,
              processed_at: Date.now(),
              status: 'processed',
              processing_method: 'fallback_local_extraction'
            });
            
            processedCount++;
            console.log(`✅ Fallback local processing successful: ${doc.filename} (${textContent.length} chars)`);
            
          } catch (error) {
            console.error(`❌ Fallback local processing failed for ${doc.filename}:`, error);
            processedDocuments.push({
              ...doc,
              status: 'failed',
              error: error.message,
              processed_at: Date.now(),
              processing_method: 'fallback_local_extraction'
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