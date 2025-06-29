export async function GET({ cookies }) {
  const session = cookies.get('admin_session');
  
  if (session === 'authenticated') {
    return new Response(JSON.stringify({ authenticated: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ authenticated: false }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
} 