import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
  if (!platform?.env?.DB) {
    return json({ 
      success: false, 
      error: 'Database not available' 
    }, { status: 500 });
  }

  try {
    console.log('🔍 Fetching recent filings from database...');
    
    // First, let's check what columns actually exist
    const schemaQuery = `PRAGMA table_info(filings)`;
    const schemaResult = await platform.env.DB.prepare(schemaQuery).all();
    console.log('📋 Available columns:', schemaResult.results.map(col => col.name));
    
    // First, let's check what's actually in the database
    const countQuery = `SELECT COUNT(*) as total FROM filings`;
    const countResult = await platform.env.DB.prepare(countQuery).first();
    console.log('📊 Total filings in database:', countResult.total);
    
    // Check how many have AI data
    const aiCountQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ai_summary IS NOT NULL THEN 1 ELSE 0 END) as with_summary,
        SUM(CASE WHEN ai_enhanced = 1 THEN 1 ELSE 0 END) as ai_enhanced_count,
        SUM(CASE WHEN documents_processed > 0 THEN 1 ELSE 0 END) as docs_processed
      FROM filings
    `;
    const aiCountResult = await platform.env.DB.prepare(aiCountQuery).first();
    console.log('📊 AI Stats:', aiCountResult);

    // Query recent filings with ALL AI data for complete pipeline view
    const query = `
      SELECT 
        id,
        docket_number,
        title,
        author,
        filing_type,
        date_received,
        filing_url,
        documents,
        raw_data,
        created_at,
        processed_at,
        documents_processed,
        ai_enhanced,
        ai_summary,
        ai_key_points,
        ai_stakeholders,
        ai_regulatory_impact,
        ai_document_analysis,
        ai_confidence,
        status
      FROM filings 
      ORDER BY created_at DESC 
      LIMIT 15
    `;
    
    const result = await platform.env.DB.prepare(query).all();
    
    console.log(`✅ Found ${result.results.length} filings with AI data`);
    
    // Format the results for display
    const formattedFilings = result.results.map(filing => ({
      ...filing,
      // Parse JSON fields that are stored as strings
      documents: filing.documents ? safeJsonParse(filing.documents, []) : [],
      raw_data: filing.raw_data ? safeJsonParse(filing.raw_data, null) : null,
      // Handle AI fields - they come as strings (markdown or plain text), not JSON
      ai_key_points: filing.ai_key_points || null,
      ai_stakeholders: filing.ai_stakeholders || null,
      ai_regulatory_impact: filing.ai_regulatory_impact || null,
      ai_document_analysis: filing.ai_document_analysis || null,
      ai_confidence: filing.ai_confidence || null
    }));

    function safeJsonParse(jsonString, fallback) {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse JSON field:', error.message);
        return fallback;
      }
    }
    
    return json({
      success: true,
      filings: formattedFilings,
      count: result.results.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching filings:', error);
    
    return json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
} 