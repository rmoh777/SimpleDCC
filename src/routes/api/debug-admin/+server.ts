import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import bcrypt from 'bcryptjs';

export const GET: RequestHandler = async ({ platform }) => {
  try {
    // Test database binding
    if (!platform?.env?.DB) {
      return json({ 
        error: 'Database not available',
        platform_exists: !!platform,
        env_exists: !!platform?.env,
        db_exists: !!platform?.env?.DB
      }, { status: 500 });
    }

    // Test admin user lookup
    const user = await platform.env.DB
      .prepare('SELECT email, password_hash FROM admin_users WHERE email = ?')
      .bind('admin@simpledcc.com')
      .first();

    if (!user) {
      return json({ 
        error: 'Admin user not found',
        db_connected: true
      }, { status: 404 });
    }

    // Test password hash comparison
    const testPassword = 'admin123';
    const hashMatches = bcrypt.compareSync(testPassword, user.password_hash);

    return json({
      success: true,
      db_connected: true,
      user_found: true,
      email: user.email,
      hash_preview: user.password_hash.substring(0, 20) + '...',
      hash_matches_admin123: hashMatches,
      hash_length: user.password_hash.length
    });

  } catch (error) {
    return json({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}; 