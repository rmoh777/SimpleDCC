import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Rate limiting: 3 requests per 5 minutes per email
const RATE_LIMIT_REQUESTS = 3;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

function isValidEmail(email: string): boolean {
  return !!(email && email.includes('@') && email.includes('.'));
}

function isValidDocket(docket: string): boolean {
  // FCC docket format: XX-XXX (e.g., "11-42", "23-108")
  return !!(docket && /^\d{2}-\d{2,3}$/.test(docket.trim()));
}

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { email, docket_number } = await request.json();

    // Validate input
    if (!email || !isValidEmail(email)) {
      return json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!docket_number || !isValidDocket(docket_number)) {
      return json({ error: 'Valid docket number is required (format: XX-XXX)' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedDocket = docket_number.trim();
    const db = platform.env.DB;
    const now = Date.now();

    // Check rate limiting
    const windowStart = now - RATE_LIMIT_WINDOW;

    const recentAttempts = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM pending_signups 
      WHERE email = ? 
      AND created_at > ?
    `).bind(normalizedEmail, windowStart).first();

    if (recentAttempts && recentAttempts.count >= RATE_LIMIT_REQUESTS) {
      const waitTime = Math.ceil(RATE_LIMIT_WINDOW / 1000 / 60);
      return json({ 
        error: `Too many signup attempts. Please wait ${waitTime} minutes before trying again.`,
        rateLimited: true,
        waitMinutes: waitTime
      }, { status: 429 });
    }

    // Create pending signup record
    const result = await db.prepare(`
      INSERT INTO pending_signups (email, docket_number, status, created_at, expires_at) 
      VALUES (?, ?, 'pending', ?, ?)
    `).bind(
      normalizedEmail, 
      normalizedDocket, 
      now,
      now + (60 * 60 * 1000) // Expires in 1 hour
    ).run();

    if (!result.success) {
      console.error('Failed to create pending signup:', result);
      return json({ error: 'Failed to create signup record' }, { status: 500 });
    }

    const pendingId = result.meta.last_row_id;

    // Log the pending signup creation
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'info',
      `Pending signup created for ${normalizedEmail}`,
      'auth',
      JSON.stringify({ 
        email: normalizedEmail,
        docket_number: normalizedDocket,
        pending_id: pendingId
      }),
      Math.floor(now / 1000)
    ).run();

    console.log(`✅ Pending signup created: ${normalizedEmail} → ${normalizedDocket} (ID: ${pendingId})`);

    // Return redirect to upgrade page with token
    return new Response(null, {
      status: 302,
      headers: { 
        Location: `/upgrade?token=${pendingId}` 
      }
    });

  } catch (error) {
    console.error('Pending signup creation error:', error);
    return json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}; 