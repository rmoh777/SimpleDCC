import { json } from '@sveltejs/kit';

export async function POST({ platform, cookies }) {
  try {
    // Verify admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = platform.env.DB;
    console.log('🔧 Starting manual AI columns fix...');

    // List of AI columns that need to be added
    const missingColumns = [
      { name: 'ai_enhanced', type: 'BOOLEAN', default: '0' },
      { name: 'ai_key_points', type: 'TEXT', default: 'NULL' },
      { name: 'ai_stakeholders', type: 'TEXT', default: 'NULL' },
      { name: 'ai_regulatory_impact', type: 'TEXT', default: 'NULL' },
      { name: 'ai_document_analysis', type: 'TEXT', default: 'NULL' },
      { name: 'ai_confidence', type: 'REAL', default: 'NULL' },
      { name: 'documents_processed', type: 'INTEGER', default: '0' }
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Check current schema first
    console.log('📋 Checking current filings table schema...');
    const schemaCheck = await db.prepare(`PRAGMA table_info(filings)`).all();
    const existingColumns = schemaCheck.results.map(col => col.name);
    
    console.log('🔍 Existing columns:', existingColumns);

    // Add each missing column
    for (const column of missingColumns) {
      try {
        // Check if column already exists
        if (existingColumns.includes(column.name)) {
          console.log(`✅ Column ${column.name} already exists, skipping`);
          results.push({
            column: column.name,
            status: 'already_exists',
            message: 'Column already exists'
          });
          continue;
        }

        // Add the column
        const alterSQL = `ALTER TABLE filings ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
        console.log(`➕ Adding column: ${alterSQL}`);
        
        await db.prepare(alterSQL).run();
        
        successCount++;
        results.push({
          column: column.name,
          status: 'added',
          message: `Successfully added ${column.name} column`
        });
        
        console.log(`✅ Successfully added column: ${column.name}`);
        
      } catch (error) {
        errorCount++;
        const errorMessage = error.message || String(error);
        
        results.push({
          column: column.name,
          status: 'error',
          message: errorMessage
        });
        
        console.error(`❌ Failed to add column ${column.name}:`, errorMessage);
      }
    }

    // Verify the fix by checking schema again
    console.log('🔍 Verifying updated schema...');
    const updatedSchemaCheck = await db.prepare(`PRAGMA table_info(filings)`).all();
    const updatedColumns = updatedSchemaCheck.results.map(col => col.name);
    
    // Check if all required AI columns now exist
    const requiredAIColumns = missingColumns.map(col => col.name);
    const missingAfterFix = requiredAIColumns.filter(col => !updatedColumns.includes(col));

    // Test a simple query to make sure the schema works
    let testQueryResult = null;
    try {
      const testQuery = await db.prepare(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN ai_enhanced = 1 THEN 1 END) as ai_enhanced_count,
               COUNT(CASE WHEN documents_processed > 0 THEN 1 END) as docs_processed_count
        FROM filings
      `).first();
      
      testQueryResult = testQuery;
      console.log('✅ Schema test query successful:', testQuery);
      
    } catch (testError) {
      console.error('❌ Schema test query failed:', testError);
      testQueryResult = { error: testError.message };
    }

    // Log the operation
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(db, 'info', 'Manual AI columns fix completed', 'admin-schema-fix', {
        columns_processed: missingColumns.length,
        columns_added: successCount,
        columns_failed: errorCount,
        missing_after_fix: missingAfterFix.length,
        updated_columns_count: updatedColumns.length
      });
    } catch (logError) {
      console.error('Failed to log schema fix:', logError);
    }

    const response = {
      success: errorCount === 0 && missingAfterFix.length === 0,
      message: `AI columns fix completed: ${successCount} added, ${errorCount} failed`,
      summary: {
        columns_processed: missingColumns.length,
        columns_added: successCount,
        columns_failed: errorCount,
        columns_already_existed: results.filter(r => r.status === 'already_exists').length
      },
      detailed_results: results,
      schema_verification: {
        total_columns_after_fix: updatedColumns.length,
        missing_columns_remaining: missingAfterFix,
        all_ai_columns_present: missingAfterFix.length === 0
      },
      test_query_result: testQueryResult,
      next_steps: missingAfterFix.length === 0 
        ? ['✅ Schema fix complete! Database viewer should now work.', '✅ Test the /test-database-view endpoint']
        : ['❌ Some columns still missing. Check error details and retry.']
    };

    return json(response);

  } catch (error) {
    console.error('❌ Manual AI columns fix failed:', error);
    
    // Log the failure
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'error', 'Manual AI columns fix failed', 'admin-schema-fix', {
        error: error.message,
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log schema fix error:', logError);
    }

    return json({ 
      success: false,
      error: 'Manual AI columns fix failed',
      details: error.message,
      message: 'Schema fix encountered an error. Check server logs for details.'
    }, { status: 500 });
  }
} 