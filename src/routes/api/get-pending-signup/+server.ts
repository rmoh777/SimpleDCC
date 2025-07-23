import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { token } = await request.json();

    // Validate token input
    if (!token || typeof token !== 'number') {
      return json({ error: 'Valid token is required' }, { status: 400 });
    }

    const db = platform.env.DB;
    const now = Date.now();

    // Look up pending signup record by ID
    const pendingRecord = await db.prepare(`
      SELECT id, email, docket_number, status, created_at, expires_at, completed_at
      FROM pending_signups 
      WHERE id = ?
    `).bind(token).first();

    if (!pendingRecord) {
      // Log failed lookup attempt
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'warning',
        `Failed pending signup lookup - invalid token`,
        'auth',
        JSON.stringify({ 
          token,
          reason: 'token_not_found',
          timestamp: now
        }),
        Math.floor(now / 1000)
      ).run();

      return json({ error: 'Invalid signup token' }, { status: 404 });
    }

    // Check if record has expired
    if (pendingRecord.expires_at && now > pendingRecord.expires_at) {
      // Log expired token attempt
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'info',
        `Expired pending signup token accessed`,
        'auth',
        JSON.stringify({ 
          token,
          email: pendingRecord.email,
          expired_at: pendingRecord.expires_at,
          reason: 'token_expired',
          timestamp: now
        }),
        Math.floor(now / 1000)
      ).run();

      return json({ 
        error: 'Signup session has expired. Please start over.' 
      }, { status: 410 });
    }

    // Check if record is already completed
    if (pendingRecord.status === 'completed') {
      // Log already completed attempt
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'info',
        `Already completed pending signup accessed`,
        'auth',
        JSON.stringify({ 
          token,
          email: pendingRecord.email,
          completed_at: pendingRecord.completed_at,
          reason: 'already_completed',
          timestamp: now
        }),
        Math.floor(now / 1000)
      ).run();

      return json({ 
        error: 'Signup already completed. Please log in to your account.' 
      }, { status: 409 });
    }

    // Valid pending signup - return email and docket info
    console.log(`✅ Valid pending signup lookup: ${pendingRecord.email} → ${pendingRecord.docket_number} (token: ${token})`);

    return json({
      email: pendingRecord.email,
      docket_number: pendingRecord.docket_number,
      created_at: pendingRecord.created_at,
      expires_at: pendingRecord.expires_at
    });

  } catch (error) {
    console.error('Pending signup lookup error:', error);
    return json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}; 