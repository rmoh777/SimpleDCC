import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, platform }) => {
  const email = url.searchParams.get('email');
  const signupSuccess = url.searchParams.get('signup') === 'success';
  
  // Check if user is logged in (from auto-login after signup)
  let user = null;
  let isLoggedIn = false;
  
  if (platform?.env?.DB) {
    try {
      const sessionToken = cookies.get('session_token');
      if (sessionToken) {
        // Use the same session checking pattern as manage page
        user = await platform.env.DB.prepare(`
          SELECT * FROM users 
          WHERE session_token = ? 
          AND session_expires > ?
        `).bind(sessionToken, Date.now()).first();
        
        isLoggedIn = !!user;
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }

  return {
    email: email || user?.email || null,
    user: user ? {
      id: user.id,
      email: user.email,
      user_tier: user.user_tier
    } : null,
    isLoggedIn,
    signupSuccess
  };
}; 