import bcrypt from 'bcryptjs';

export async function POST({ request, platform, cookies }) {
  console.log('🚀 Login attempt started');
  
  const { email, password } = await request.json();
  console.log('📧 Email:', email);
  console.log('🔑 Password length:', password?.length);
  
  try {
    console.log('🔍 Checking platform and DB...');
    console.log('Platform exists:', !!platform);
    console.log('Env exists:', !!platform?.env);
    console.log('DB exists:', !!platform?.env?.DB);
    
    if (!platform?.env?.DB) {
      console.log('❌ Database not available');
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔍 Looking up admin user...');
    const user = await platform.env.DB.prepare(
      'SELECT * FROM admin_users WHERE email = ?'
    ).bind(email).first();
    
    console.log('👤 User found:', !!user);
    if (user) {
      console.log('📧 User email:', user.email);
      console.log('🔐 Hash preview:', user.password_hash?.substring(0, 20) + '...');
      console.log('🔐 Hash length:', user.password_hash?.length);
    }
    
    if (!user) {
      console.log('❌ No user found for email:', email);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔐 Testing password hash...');
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    console.log('🔐 Password matches:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Password does not match hash');
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Authentication successful, setting cookie...');
    // Set auth cookie (expires in 24 hours)
    cookies.set('admin_session', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax'
    });
    
    console.log('✅ Login successful');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    console.error('💥 Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 