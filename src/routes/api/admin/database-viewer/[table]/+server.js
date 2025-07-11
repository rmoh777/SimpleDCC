import { json } from '@sveltejs/kit';

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
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Cap at 100
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || '';
    const order = url.searchParams.get('order') || 'asc';
    
    // Get table schema first
    const schemaResult = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = schemaResult.results || [];
    
    if (columns.length === 0) {
      return json({ error: 'Table not found or has no columns' }, { status: 404 });
    }
    
    // Build WHERE clause for search and filters
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
        // Add search parameter for each text column
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
    
    // Build ORDER BY clause
    let orderClause = '';
    if (sort && columns.find(col => col.name === sort)) {
      const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY ${sort} ${sortOrder}`;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    const countResult = await db.prepare(countQuery).bind(...params_array).first();
    const total = countResult?.total || 0;
    
    // Get paginated data
    const offset = (page - 1) * limit;
    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const dataResult = await db.prepare(dataQuery).bind(...params_array, limit, offset).all();
    
    return json({
      success: true,
      data: dataResult.results || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tableName,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error loading table data:', error);
    return json({ 
      error: 'Failed to load table data',
      details: error.message 
    }, { status: 500 });
  }
} 