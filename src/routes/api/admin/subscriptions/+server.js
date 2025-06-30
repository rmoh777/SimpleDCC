export async function GET({ platform, cookies, url }) {
  // Check authentication
  const session = cookies.get('admin_session');
  if (session !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const email = searchParams.get('email') || '';
    const docket = searchParams.get('docket') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (email) {
      whereConditions.push('email LIKE ?');
      params.push(`%${email}%`);
    }
    
    if (docket) {
      whereConditions.push('docket_number LIKE ?');
      params.push(`%${docket}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM subscriptions ${whereClause}`;
    const countResult = await platform?.env?.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.count || 0;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT * FROM subscriptions 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const dataResult = await platform?.env?.DB.prepare(dataQuery)
      .bind(...params, limit, offset)
      .all();
    
    return new Response(JSON.stringify({
      subscriptions: dataResult?.results || [],
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Subscriptions API error:', error);
    
    // Log the error
    try {
      await platform?.env?.DB.prepare(
        'INSERT INTO system_logs (level, message, component) VALUES (?, ?, ?)'
      ).bind('error', `Subscriptions API failed: ${error.message}`, 'admin-api').run();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ error: 'Failed to load subscriptions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ platform, cookies, request }) {
  // Check authentication
  const session = cookies.get('admin_session');
  if (session !== 'authenticated') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { email, docket_number } = await request.json();
    
    if (!email || !docket_number) {
      return new Response(JSON.stringify({ error: 'Email and docket_number required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete the subscription
    const result = await platform?.env?.DB.prepare(
      'DELETE FROM subscriptions WHERE email = ? AND docket_number = ?'
    ).bind(email, docket_number).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Log the deletion
    await platform?.env?.DB.prepare(
      'INSERT INTO system_logs (level, message, component) VALUES (?, ?, ?)'
    ).bind('info', `Admin deleted subscription: ${email} from docket ${docket_number}`, 'admin-api').run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 