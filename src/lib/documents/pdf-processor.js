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