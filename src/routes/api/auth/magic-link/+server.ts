import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrGetUser } from '$lib/users/user-operations';
import { sendMagicLinkEmail } from '$lib/email/magic-link';

// Rate limiting: 5 requests per 15 minutes per email (generous but secure)
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    if (!platform?.env?.DB) {
      return json({ error: 'Database not available' }, { status: 500 });
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = platform.env.DB;

    // Get or create user
    const user = await createOrGetUser(normalizedEmail, db);

    // Check rate limiting
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Reset attempts if window has passed
    if (!user.last_magic_link_sent || user.last_magic_link_sent < windowStart) {
      await db.prepare(`
        UPDATE users 
        SET magic_link_attempts = 0, last_magic_link_sent = ?
        WHERE id = ?
      `).bind(now, user.id).run();
      user.magic_link_attempts = 0;
    }

    // Check if rate limit exceeded
    if ((user.magic_link_attempts || 0) >= RATE_LIMIT_REQUESTS) {
      const waitTime = Math.ceil((user.last_magic_link_sent + RATE_LIMIT_WINDOW - now) / 1000 / 60);
      return json({ 
        error: `Too many requests. Please wait ${waitTime} minutes before requesting another magic link.`,
        rateLimited: true,
        waitMinutes: waitTime
      }, { status: 429 });
    }

    // Generate magic link token
    const magicToken = crypto.randomUUID();
    const expiresAt = now + MAGIC_LINK_EXPIRY;

    // Update user with magic link token
    await db.prepare(`
      UPDATE users 
      SET magic_token = ?, 
          magic_token_expires = ?,
          magic_link_attempts = ?,
          last_magic_link_sent = ?
      WHERE id = ?
    `).bind(
      magicToken, 
      expiresAt, 
      (user.magic_link_attempts || 0) + 1,
      now,
      user.id
    ).run();

    // Generate magic link URL
    const baseUrl = platform.env.PUBLIC_ORIGIN || 'http://localhost:5175';
    const magicLink = `${baseUrl}/auth/verify?token=${magicToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send magic link email
    const emailResult = await sendMagicLinkEmail(normalizedEmail, magicLink, platform.env, 15);

    if (!emailResult.success) {
      // Clear the token if email failed
      await db.prepare(`
        UPDATE users 
        SET magic_token = NULL, magic_token_expires = NULL
        WHERE id = ?
      `).bind(user.id).run();

      return json({ 
        error: 'Failed to send magic link email. Please try again.',
        details: emailResult.error 
      }, { status: 500 });
    }

    // Log successful magic link request
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'info',
      `Magic link requested for ${normalizedEmail}`,
      'auth',
      JSON.stringify({ 
        email: normalizedEmail, 
        attempts: (user.magic_link_attempts || 0) + 1,
        user_tier: user.user_tier
      }),
      Math.floor(now / 1000)
    ).run();

    return json({
      success: true,
      message: 'Magic link sent! Check your email and click the link to sign in.',
      expiryMinutes: 15
    });

  } catch (error) {
    console.error('Magic link request error:', error);
    return json({ 
      error: 'Failed to process magic link request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 