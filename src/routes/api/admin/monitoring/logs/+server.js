import { json } from '@sveltejs/kit';

export async function GET({ platform, cookies, url }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const level = url.searchParams.get('level') || null;
    const component = url.searchParams.get('component') || null;
    const search = url.searchParams.get('search') || null;
    
    // Build query with filters (only select columns that exist in current schema)
    let query = `
      SELECT id, level, message, component, details, created_at
      FROM system_logs 
      WHERE 1=1
    `;
    const params = [];
    
    if (level) {
      query += ` AND level = ?`;
      params.push(level);
    }
    
    if (component) {
      query += ` AND component = ?`;
      params.push(component);
    }
    
    if (search) {
      query += ` AND (message LIKE ? OR details LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count for pagination
    const countQuery = query.replace(
      'SELECT id, level, message, component, details, docket_number, filing_id, created_at',
      'SELECT COUNT(*) as total'
    );
    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    
    // Add pagination and ordering
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Format logs for frontend
    const logs = (result.results || []).map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      component: log.component,
      details: log.details ? JSON.parse(log.details) : null,
      docket_number: log.docket_number,
      filing_id: log.filing_id,
      created_at: log.created_at,
      formatted_time: new Date(log.created_at).toISOString()
    }));
    
    return json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: { level, component, search }
    });
    
  } catch (error) {
    console.error('Error getting system logs:', error);
    return json({ 
      error: 'Failed to retrieve system logs',
      details: error.message 
    }, { status: 500 });
  }
} 