import { json } from '@sveltejs/kit';
import { ensureDatabaseSchema, checkDatabaseSchema } from '$lib/database/auto-migration.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
};

export async function POST({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const db = platform.env.DB;
    
    console.log('🚀 Running database migration via admin API...');
    
    // Use the new auto-migration system
    const migrationResult = await ensureDatabaseSchema(db);
    
    if (migrationResult.success) {
      console.log('✅ Migration completed successfully');
      
      return json({
        success: true,
        message: migrationResult.message,
        migrationRan: migrationResult.migrationRan,
        details: {
          operations: migrationResult.details || [],
          timestamp: Date.now(),
          tablesCreated: extractTablesCreated(migrationResult.details),
          columnsAdded: extractColumnsAdded(migrationResult.details)
        }
      }, { headers: corsHeaders });
      
    } else {
      console.error('❌ Migration failed:', migrationResult.message);
      
      return json({
        success: false,
        error: migrationResult.message,
        details: {
          timestamp: Date.now()
        }
      }, { status: 500, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Migration endpoint failed:', error);
    return json({ 
      success: false,
      error: 'Migration system error',
      details: error.message 
    }, { status: 500, headers: corsHeaders });
  }
}

// GET endpoint for migration status (legacy compatibility)
export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const db = platform.env.DB;
    
    // Use the new schema check system
    const schemaResult = await checkDatabaseSchema(db);
    
    return json({
      success: true,
      migrationComplete: schemaResult.isValid,
      existingTables: schemaResult.existingTables || [],
      missingTables: schemaResult.missingTables || [],
      details: {
        requiredTables: ['subscriptions', 'admin_users', 'filings', 'active_dockets', 'system_logs', 'notification_queue'],
        schemaValid: schemaResult.isValid,
        timestamp: Date.now()
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Migration status check failed:', error);
    return json({ 
      success: false,
      error: 'Failed to check migration status',
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

// Helper functions to extract specific details for UI display
function extractTablesCreated(details) {
  if (!Array.isArray(details)) return [];
  
  return details
    .filter(detail => detail.includes('Created tables:'))
    .map(detail => detail.replace('Created tables: ', ''))
    .flatMap(tables => tables.split(', '))
    .filter(table => table.trim().length > 0);
}

function extractColumnsAdded(details) {
  if (!Array.isArray(details)) return [];
  
  return details
    .filter(detail => detail.includes('Added') && detail.includes('column'))
    .map(detail => detail.replace(/^Added /, '').replace(/ column.*$/, ''));
} 