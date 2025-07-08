import { json } from '@sveltejs/kit';

export async function POST({ platform, cookies, request }) {
  try {
    // Check authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sql, operation } = await request.json();
    
    if (!sql || !operation) {
      return json({ 
        error: 'Missing parameters',
        details: 'sql and operation are required' 
      }, { status: 400 });
    }

    const db = platform.env.DB;
    
    console.log(`Executing manual SQL: ${sql.substring(0, 50)}...`);
    
    try {
      const result = await db.prepare(sql).run();
      
      return json({
        success: true,
        message: 'SQL executed successfully',
        details: {
          sql: sql.substring(0, 100) + '...',
          changes: result.meta?.changes || 0,
          lastRowId: result.meta?.last_row_id
        }
      });
      
    } catch (dbError) {
      console.error('SQL execution error:', dbError);
      
      // Check for specific error types
      if (dbError.message.includes('table users already exists')) {
        return json({
          success: true,
          message: 'Table already exists - skipping',
          details: {
            sql: sql.substring(0, 100) + '...',
            skipped: true
          }
        });
      }
      
      if (dbError.message.includes('duplicate column name')) {
        return json({
          success: true,
          message: 'Column already exists - skipping',
          details: {
            sql: sql.substring(0, 100) + '...',
            skipped: true
          }
        });
      }
      
      return json({
        success: false,
        error: 'SQL execution failed',
        details: {
          sql: sql.substring(0, 100) + '...',
          error: dbError.message
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Manual migration error:', error);
    return json({ 
      error: 'Migration execution failed',
      details: error.message 
    }, { status: 500 });
  }
} 