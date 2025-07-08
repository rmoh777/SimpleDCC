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
    const availableColumns = schemaResult.results.map(col => col.name);
    console.log('📋 Available columns:', availableColumns);
    
    // Define expected columns and their fallback values
    const expectedColumns = {
      // Core columns (should always exist)
      id: { required: true, fallback: null },
      docket_number: { required: true, fallback: null },
      title: { required: true, fallback: null },
      author: { required: true, fallback: null },
      filing_type: { required: true, fallback: null },
      date_received: { required: true, fallback: null },
      filing_url: { required: true, fallback: null },
      documents: { required: true, fallback: '[]' },
      raw_data: { required: true, fallback: null },
      created_at: { required: true, fallback: null },
      processed_at: { required: false, fallback: null },
      status: { required: false, fallback: 'pending' },
      
      // AI columns (may be missing in production)
      ai_enhanced: { required: false, fallback: 0 },
      ai_summary: { required: false, fallback: null },
      ai_key_points: { required: false, fallback: null },
      ai_stakeholders: { required: false, fallback: null },
      ai_regulatory_impact: { required: false, fallback: null },
      ai_document_analysis: { required: false, fallback: null },
      ai_confidence: { required: false, fallback: null },
      documents_processed: { required: false, fallback: 0 }
    };
    
    // Build SELECT statement with only available columns
    const selectColumns = [];
    const missingColumns = [];
    
    for (const [colName, colInfo] of Object.entries(expectedColumns)) {
      if (availableColumns.includes(colName)) {
        selectColumns.push(colName);
      } else {
        missingColumns.push(colName);
        if (colInfo.required) {
          throw new Error(`Required column '${colName}' is missing from database schema`);
        }
      }
    }
    
    console.log(`📊 Will query ${selectColumns.length} available columns`);
    if (missingColumns.length > 0) {
      console.log(`⚠️ Missing columns (will use fallback values): ${missingColumns.join(', ')}`);
    }
    
    // First, let's check what's actually in the database
    const countQuery = `SELECT COUNT(*) as total FROM filings`;
    const countResult = await platform.env.DB.prepare(countQuery).first();
    console.log('📊 Total filings in database:', countResult.total);
    
    // Check how many have AI data (only if columns exist)
    let aiCountResult = { total: countResult.total, with_summary: 0, ai_enhanced_count: 0, docs_processed: 0 };
    
    try {
      const aiCountColumns = [];
      if (availableColumns.includes('ai_summary')) {
        aiCountColumns.push('SUM(CASE WHEN ai_summary IS NOT NULL THEN 1 ELSE 0 END) as with_summary');
      }
      if (availableColumns.includes('ai_enhanced')) {
        aiCountColumns.push('SUM(CASE WHEN ai_enhanced = 1 THEN 1 ELSE 0 END) as ai_enhanced_count');
      }
      if (availableColumns.includes('documents_processed')) {
        aiCountColumns.push('SUM(CASE WHEN documents_processed > 0 THEN 1 ELSE 0 END) as docs_processed');
      }
      
      if (aiCountColumns.length > 0) {
        const aiCountQuery = `
          SELECT 
            COUNT(*) as total,
            ${aiCountColumns.join(',\n            ')}
          FROM filings
        `;
        aiCountResult = await platform.env.DB.prepare(aiCountQuery).first();
      }
    } catch (aiCountError) {
      console.warn('⚠️ Could not get AI statistics:', aiCountError.message);
    }
    
    console.log('📊 AI Stats:', aiCountResult);

    // Query recent filings with available columns
    const query = `
      SELECT ${selectColumns.join(', ')}
      FROM filings 
      ORDER BY created_at DESC 
      LIMIT 15
    `;
    
    const result = await platform.env.DB.prepare(query).all();
    
    console.log(`✅ Found ${result.results.length} filings`);
    
    // Format the results for display, adding missing columns with fallback values
    const formattedFilings = result.results.map(filing => {
      const formatted = { ...filing };
      
      // Add missing columns with fallback values
      for (const [colName, colInfo] of Object.entries(expectedColumns)) {
        if (!availableColumns.includes(colName)) {
          formatted[colName] = colInfo.fallback;
        }
      }
      
      // Parse JSON fields that are stored as strings
      formatted.documents = filing.documents ? safeJsonParse(filing.documents, []) : [];
      formatted.raw_data = filing.raw_data ? safeJsonParse(filing.raw_data, null) : null;
      
      // Handle AI fields - they come as strings (markdown or plain text), not JSON
      // Only process if the columns exist
      if (availableColumns.includes('ai_key_points')) {
        formatted.ai_key_points = filing.ai_key_points || null;
      }
      if (availableColumns.includes('ai_stakeholders')) {
        formatted.ai_stakeholders = filing.ai_stakeholders || null;
      }
      if (availableColumns.includes('ai_regulatory_impact')) {
        formatted.ai_regulatory_impact = filing.ai_regulatory_impact || null;
      }
      if (availableColumns.includes('ai_document_analysis')) {
        formatted.ai_document_analysis = filing.ai_document_analysis || null;
      }
      if (availableColumns.includes('ai_confidence')) {
        formatted.ai_confidence = filing.ai_confidence || null;
      }
      
      return formatted;
    });

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
      count: result.results.length,
      schema_info: {
        available_columns: availableColumns,
        missing_columns: missingColumns,
        ai_columns_present: missingColumns.filter(col => col.startsWith('ai_')).length === 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching filings:', error);
    
    // Check if this is a schema-related error
    const isSchemaError = error.message.includes('no such column') || 
                          error.message.includes('Required column') ||
                          error.message.includes('SQLITE_ERROR');
    
    return json({
      success: false,
      error: error.message,
      details: error.stack,
      is_schema_error: isSchemaError,
      suggested_fix: isSchemaError ? 'Use the admin schema fix tool at /admin/database/fix-ai-columns' : null
    }, { status: 500 });
  }
} 