import { json } from '@sveltejs/kit';
import { checkDatabaseSchema } from '$lib/database/auto-migration.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
};

export async function GET({ platform, cookies, request }) {
  try {
    const db = platform.env.DB;
    
    // Support both authentication methods:
    // 1. Cookie-based (for admin UI)
    // 2. Header-based (for curl/API calls)  
    const adminSession = cookies.get('admin_session');
    const adminKeyHeader = request.headers.get('x-admin-key');
    const adminSecretKey = platform.env.ADMIN_SECRET_KEY;
    
    const isAuthenticatedViaCookie = adminSession === 'authenticated';
    const isAuthenticatedViaHeader = adminKeyHeader && adminKeyHeader === adminSecretKey;
    
    if (!isAuthenticatedViaCookie && !isAuthenticatedViaHeader) {
      return json({ 
        error: 'Unauthorized',
        details: 'Provide either valid admin session cookie or x-admin-key header'
      }, { status: 401, headers: corsHeaders });
    }

    // Check database schema without running migration
    console.log('📋 Checking database schema...');
    const schemaResult = await checkDatabaseSchema(db);
    
    return json({
      success: true,
      ...schemaResult,
      timestamp: Date.now()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Schema check endpoint failed:', error);
    return json({ 
      success: false,
      error: 'Failed to check database schema',
      details: error.message 
    }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
} 