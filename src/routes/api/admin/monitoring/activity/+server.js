import { json } from '@sveltejs/kit';
import { getSystemLogs } from '$lib/database/db-operations.js';

export async function GET({ platform, cookies, url }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const component = url.searchParams.get('component') || null;
    const level = url.searchParams.get('level') || null;
    
    // Build query with filters
    let query = `
      SELECT id, level, message, component, details, docket_number, filing_id, created_at
      FROM system_logs 
      WHERE 1=1
    `;
    const params = [];
    
    if (component) {
      query += ` AND component = ?`;
      params.push(component);
    }
    
    if (level) {
      query += ` AND level = ?`;
      params.push(level);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Math.min(limit, 100)); // Cap at 100 for performance
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Format activity data for frontend
    const activities = (result.results || []).map(log => ({
      id: log.id,
      message: log.message,
      component: log.component,
      level: log.level,
      details: log.details ? JSON.parse(log.details) : null,
      docket_number: log.docket_number,
      filing_id: log.filing_id,
      created_at: log.created_at,
      timestamp: log.created_at // Alias for frontend compatibility
    }));
    
    return json({
      activities,
      total: activities.length,
      filters: { component, level, limit }
    });
    
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return json({ 
      error: 'Failed to retrieve activity logs',
      details: error.message 
    }, { status: 500 });
  }
} 