import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, platform }) => {
  const token = url.searchParams.get('token');
  
  // If no token, this is an old-style access - redirect to homepage
  if (!token) {
    const email = url.searchParams.get('email');
    if (email) {
      // Legacy email parameter - redirect to homepage
      throw redirect(302, '/?legacy=true');
    }
    throw redirect(302, '/');
  }

  // If no database, return error state
  if (!platform?.env?.DB) {
    return {
      error: 'Service temporarily unavailable',
      token: null,
      pendingSignup: null
    };
  }

  try {
    // Fetch pending signup data on server side
    const tokenId = parseInt(token, 10);
    
    if (isNaN(tokenId)) {
      throw redirect(302, '/?error=invalid_token');
    }

    const db = platform.env.DB;
    const now = Date.now();

    // Look up pending signup record
    const pendingRecord = await db.prepare(`
      SELECT id, email, docket_number, status, created_at, expires_at, completed_at
      FROM pending_signups 
      WHERE id = ?
    `).bind(tokenId).first();

    if (!pendingRecord) {
      throw redirect(302, '/?error=invalid_signup');
    }

    // Check if expired
    if (pendingRecord.expires_at && now > pendingRecord.expires_at) {
      throw redirect(302, '/?error=signup_expired');
    }

    // Check if already completed
    if (pendingRecord.status === 'completed') {
      throw redirect(302, '/manage?message=already_completed');
    }

    return {
      token: tokenId,
      pendingSignup: {
        email: pendingRecord.email,
        docket_number: pendingRecord.docket_number,
        created_at: pendingRecord.created_at,
        expires_at: pendingRecord.expires_at
      },
      error: null
    };

  } catch (error) {
    // Handle redirects
    if (error instanceof Response) {
      throw error;
    }
    
    console.error('Upgrade page load error:', error);
    throw redirect(302, '/?error=system_error');
  }
}; 