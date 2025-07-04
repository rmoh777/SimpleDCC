import { json } from '@sveltejs/kit';
import { fetchLatestFilings } from '$lib/fcc/ecfs-enhanced-client.js';
import { processFilingDocuments } from '$lib/documents/pdf-processor.js';
import { generateEnhancedSummary } from '$lib/ai/gemini-enhanced.js';

export async function GET({ platform, cookies, url }) {
  try {
    // Test parameters
    const docketNumber = url.searchParams.get('docket') || '07-114';
    const showRawChunks = url.searchParams.get('chunks') === 'true';
    
    console.log(`🔍 FULL DEBUG: Jina Aggregation + Gemini Analysis for docket ${docketNumber}`);
    
    // Get filings
    const filings = await fetchLatestFilings(docketNumber, 5, platform.env);
    
    if (filings.length === 0) {
      return json({ error: 'No filings found' }, { status: 404 });
    }
    
    // Find filing with HTML viewer documents (Route B)
    const testFiling = filings.find(f => 
      f.documents?.some(d => d.src && d.src.includes('/ecfs/document/'))
    ) || filings[0];
    
    console.log(`🎯 DEBUG: Testing filing ${testFiling.id}`);
    
    // Process documents with detailed logging
    const processedFiling = await processFilingDocuments(testFiling);
    
    // Extract all document texts
    const documentTexts = processedFiling.documents
      ?.filter(d => d.text_content)
      ?.map(d => d.text_content) || [];
    
    console.log(`📝 DEBUG: Extracted ${documentTexts.length} document texts`);
    
    // Generate AI analysis
    const aiResponse = await generateEnhancedSummary(
      processedFiling, 
      documentTexts, 
      platform.env
    );
    
    // Prepare debug response
    const debugData = {
      filing_info: {
        id: testFiling.id,
        title: testFiling.title,
        documents_count: testFiling.documents?.length || 0,
        processed_docs: processedFiling.documents_processed || 0
      },
      
      document_processing: {
        documents: processedFiling.documents?.map(doc => ({
          filename: doc.filename,
          src: doc.src,
          processing_method: doc.processing_method || 'unknown',
          status: doc.status,
          content_length: doc.text_content?.length || 0,
          content_preview: doc.text_content?.substring(0, 200) + '...',
          ...(showRawChunks && doc.raw_chunks ? { raw_chunks: doc.raw_chunks } : {})
        })) || []
      },
      
      full_extracted_text: {
        total_documents: documentTexts.length,
        total_characters: documentTexts.reduce((sum, text) => sum + text.length, 0),
        combined_text: documentTexts.join('\n\n--- DOCUMENT SEPARATOR ---\n\n'),
        individual_texts: documentTexts.map((text, index) => ({
          document_index: index,
          character_count: text.length,
          word_count: text.split(/\s+/).length,
          text: text
        }))
      },
      
      ai_processing: {
        input_summary: {
          filing_metadata: {
            id: processedFiling.id,
            title: processedFiling.title,
            author: processedFiling.author,
            filing_type: processedFiling.filing_type
          },
          document_texts_provided: documentTexts.length,
          total_input_length: documentTexts.reduce((sum, text) => sum + text.length, 0)
        },
        
        full_ai_response: {
          summary: aiResponse.summary,
          key_points: aiResponse.key_points,
          stakeholders: aiResponse.stakeholders,
          regulatory_impact: aiResponse.regulatory_impact,
          document_analysis: aiResponse.document_analysis,
          confidence: aiResponse.ai_confidence,
          processing_notes: aiResponse.processing_notes,
          raw_response: aiResponse.raw_response
        }
      },
      
      debug_timestamps: {
        processed_at: new Date().toISOString(),
        filing_date: testFiling.date_received
      }
    };
    
    return json({
      success: true,
      debug_type: 'full_jina_gemini_debug',
      data: debugData
    });
    
  } catch (error) {
    console.error('🚨 Full Debug Failed:', error);
    
    return json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name
      }
    }, { status: 500 });
  }
} 