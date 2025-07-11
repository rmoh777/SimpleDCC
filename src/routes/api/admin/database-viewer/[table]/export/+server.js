import { json } from '@sveltejs/kit';

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

function formatValueForCSV(value, columnName) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle timestamps
  if (columnName.includes('_at') || columnName.includes('timestamp')) {
    if (typeof value === 'number') {
      return new Date(value * 1000).toISOString();
    }
  }
  
  // Handle JSON columns - pretty format them
  if (columnName.includes('details') || columnName.includes('data') || columnName.includes('documents')) {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed);
    } catch {
      return value;
    }
  }
  
  return value;
}

export async function GET({ params, url, platform, cookies }) {
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
    
    // Get query parameters for filtering (same as main endpoint)
    const search = url.searchParams.get('search') || '';
    
    // Get table schema
    const schemaResult = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = schemaResult.results || [];
    
    if (columns.length === 0) {
      return json({ error: 'Table not found or has no columns' }, { status: 404 });
    }
    
    // Build WHERE clause for search and filters (same logic as main endpoint)
    let whereConditions = [];
    let params_array = [];
    
    // Global search across all text columns
    if (search) {
      const textColumns = columns
        .filter(col => col.type === 'TEXT' || col.type === 'VARCHAR')
        .map(col => `${col.name} LIKE ?`)
        .join(' OR ');
      
      if (textColumns) {
        whereConditions.push(`(${textColumns})`);
        const searchParam = `%${search}%`;
        for (let i = 0; i < columns.filter(col => col.type === 'TEXT' || col.type === 'VARCHAR').length; i++) {
          params_array.push(searchParam);
        }
      }
    }
    
    // Column-specific filters
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith('filter_') && value) {
        const columnName = key.replace('filter_', '');
        const column = columns.find(col => col.name === columnName);
        
        if (column) {
          if (column.type === 'INTEGER' || column.type === 'REAL') {
            whereConditions.push(`${columnName} = ?`);
            params_array.push(value);
          } else {
            whereConditions.push(`${columnName} LIKE ?`);
            params_array.push(`%${value}%`);
          }
        }
      }
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get all data (no pagination for export)
    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} ORDER BY rowid`;
    const dataResult = await db.prepare(dataQuery).bind(...params_array).all();
    const rows = dataResult.results || [];
    
    // Generate CSV content
    const columnNames = columns.map(col => col.name);
    const csvHeader = columnNames.map(name => escapeCSV(name)).join(',');
    
    const csvRows = rows.map(row => 
      columnNames.map(colName => 
        escapeCSV(formatValueForCSV(row[colName], colName))
      ).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tableName}_${timestamp}.csv`;
    
    // Return CSV response
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error exporting table data:', error);
    return json({ 
      error: 'Failed to export table data',
      details: error.message 
    }, { status: 500 });
  }
} 