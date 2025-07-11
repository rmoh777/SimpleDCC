import { json } from '@sveltejs/kit';

export async function GET({ params, platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    const tableName = params.table;
    
    // Validate table name (security check)
    const validTables = ['users', 'admin_users', 'subscriptions', 'filings', 'active_dockets', 
                        'notification_queue', 'user_notifications', 'system_logs', 'system_health_logs', 'sqlite_sequence'];
    
    if (!validTables.includes(tableName)) {
      return json({ error: 'Invalid table name' }, { status: 400 });
    }
    
    // Get table schema
    const schemaResult = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const schema = schemaResult.results || [];
    
    if (schema.length === 0) {
      return json({ error: 'Table not found or has no columns' }, { status: 404 });
    }
    
    // Get additional table info
    const tableInfoResult = await db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name = ?
    `).bind(tableName).first();
    
    // Get indexes for this table
    const indexesResult = await db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='index' AND tbl_name = ? AND name NOT LIKE 'sqlite_%'
    `).bind(tableName).all();
    
    return json({
      success: true,
      tableName,
      schema: schema.map(col => ({
        name: col.name,
        type: col.type,
        nullable: !col.notnull,
        defaultValue: col.dflt_value,
        primaryKey: !!col.pk
      })),
      createSql: tableInfoResult?.sql || null,
      indexes: (indexesResult.results || []).map(idx => ({
        name: idx.name,
        sql: idx.sql
      })),
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error loading table schema:', error);
    return json({ 
      error: 'Failed to load table schema',
      details: error.message 
    }, { status: 500 });
  }
} 