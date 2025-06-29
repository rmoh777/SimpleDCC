export async function POST({ cookies }) {
  cookies.delete('admin_session', { path: '/' });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 