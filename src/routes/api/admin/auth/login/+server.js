import bcrypt from 'bcryptjs';

export async function POST({ request, platform, cookies }) {
  const { email, password } = await request.json();
  
  try {
    const user = await platform?.env?.DB.prepare(
      'SELECT * FROM admin_users WHERE email = ?'
    ).bind(email).first();
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Set auth cookie (expires in 24 hours)
    cookies.set('admin_session', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax'
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 