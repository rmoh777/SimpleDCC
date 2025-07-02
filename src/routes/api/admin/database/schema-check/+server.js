import { json } from '@sveltejs/kit';
import { checkDatabaseSchema } from '$lib/database/auto-migration.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
};

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const db = platform.env.DB;
    
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