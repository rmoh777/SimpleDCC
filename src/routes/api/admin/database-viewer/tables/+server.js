import { json } from '@sveltejs/kit';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Get all tables from sqlite_master
    const tablesResult = await db.prepare(`
      SELECT name, type, sql 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    const tables = [];
    
    for (const table of tablesResult.results || []) {
      try {
        // Get row count for each table
        const countResult = await db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first();
        
        tables.push({
          name: table.name,
          type: table.type,
          row_count: countResult?.count || 0,
          sql: table.sql
        });
      } catch (error) {
        console.error(`Error getting count for table ${table.name}:`, error);
        // Still include the table even if count fails
        tables.push({
          name: table.name,
          type: table.type,
          row_count: 0,
          sql: table.sql,
          error: 'Count failed'
        });
      }
    }
    
    return json({
      success: true,
      tables,
      total: tables.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error loading tables:', error);
    return json({ 
      error: 'Failed to load database tables',
      details: error.message 
    }, { status: 500 });
  }
} 