import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserByEmail } from '$lib/users/user-operations';

export const load: PageServerLoad = async ({ url, platform, cookies }) => {
  if (!platform?.env?.DB) {
    throw redirect(302, '/manage?error=service_unavailable');
  }

  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  const extended = url.searchParams.get('extended') === 'true';

  if (!token || !email) {
    throw redirect(302, '/manage?error=invalid_link');
  }

  const db = platform.env.DB;
  const now = Date.now();

  try {
    // Find user with matching token
    const user = await db.prepare(`
      SELECT * FROM users 
      WHERE magic_token = ? 
      AND email = ? 
      AND magic_token_expires > ?
    `).bind(token, email.toLowerCase().trim(), now).first();

    if (!user) {
      // Log failed verification attempt
      await db.prepare(`
        INSERT INTO system_logs (level, message, component, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'warning',
        `Failed magic link verification for ${email}`,
        'auth',
        JSON.stringify({ 
          email, 
          reason: 'token_not_found_or_expired',
          timestamp: now
        }),
        Math.floor(now / 1000)
      ).run();

      throw redirect(302, '/manage?error=link_expired');
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const sessionDuration = extended ? 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000; // 24 hours or 1 hour
    const sessionExpires = now + sessionDuration;

    // Update user: clear magic token, set session token
    await db.prepare(`
      UPDATE users 
      SET magic_token = NULL,
          magic_token_expires = NULL,
          session_token = ?,
          session_expires = ?
      WHERE id = ?
    `).bind(sessionToken, sessionExpires, user.id).run();

    // Set session cookie
    const cookieMaxAge = extended ? 24 * 60 * 60 : 60 * 60; // 24 hours or 1 hour in seconds
    cookies.set('user_session', sessionToken, {
      path: '/',
      maxAge: cookieMaxAge,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });

    // Log successful login
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'info',
      `Successful magic link login for ${user.email}`,
      'auth',
      JSON.stringify({ 
        email: user.email,
        user_tier: user.user_tier,
        session_duration_hours: extended ? 24 : 1,
        extended_session: extended
      }),
      Math.floor(now / 1000)
    ).run();

    // Redirect to manage page with success indicator
    throw redirect(302, '/manage?login=success');

  } catch (error) {
    if (error instanceof Response) {
      // This is a redirect, re-throw it
      throw error;
    }

    console.error('Magic link verification error:', error);
    
    // Log the error
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'error',
      `Magic link verification system error for ${email}`,
      'auth',
      JSON.stringify({ 
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      Math.floor(now / 1000)
    ).run();

    throw redirect(302, '/manage?error=verification_failed');
  }
}; 