// Auto-Migration System
// Prevents database schema issues by checking required tables AND columns on startup

/**
 * Complete schema definition with expected columns for each table
 */
const REQUIRED_SCHEMA = {
  subscriptions: ['id', 'email', 'docket_number', 'created_at', 'frequency', 'last_notified'],
  admin_users: ['id', 'username', 'password_hash', 'created_at'],
  filings: ['id', 'docket_number', 'title', 'author', 'filing_type', 'date_received', 'filing_url', 'documents', 'raw_data', 'ai_summary', 'status', 'created_at', 'processed_at'],
  active_dockets: ['docket_number', 'last_checked', 'total_filings', 'subscribers_count', 'status', 'error_count', 'created_at', 'updated_at'],
  system_logs: ['id', 'level', 'message', 'component', 'details', 'docket_number', 'filing_id', 'created_at'],  // Added missing columns!
  notification_queue: ['id', 'email', 'docket_number', 'filing_ids', 'digest_type', 'status', 'created_at', 'sent_at', 'error_message']
};

/**
 * Check if all required tables AND columns exist
 * @param {Object} db - D1 database instance
 * @returns {Promise<{isValid: boolean, missingTables: string[], missingColumns: Object, error?: string}>}
 */
export async function checkDatabaseSchema(db) {
  try {
    const requiredTables = Object.keys(REQUIRED_SCHEMA);

    // Check existing tables
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence'
    `).all();

    const existingTables = result.results?.map(row => row.name) || [];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    // Check columns for existing tables
    const missingColumns = {};
    for (const tableName of existingTables) {
      if (REQUIRED_SCHEMA[tableName]) {
        const columnCheck = await checkTableColumns(db, tableName, REQUIRED_SCHEMA[tableName]);
        if (columnCheck.missingColumns.length > 0) {
          missingColumns[tableName] = columnCheck.missingColumns;
        }
      }
    }

    const hasColumnIssues = Object.keys(missingColumns).length > 0;
    
    console.log(`Schema Check: Found ${existingTables.length} tables, missing ${missingTables.length} tables`);
    if (hasColumnIssues) {
      console.log(`Column Issues:`, missingColumns);
    }
    
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(', ')}`);
    }

    return {
      isValid: missingTables.length === 0 && !hasColumnIssues,
      missingTables,
      missingColumns,
      existingTables
    };

  } catch (error) {
    console.error('Database schema check failed:', error);
    return {
      isValid: false,
      missingTables: [],
      missingColumns: {},
      error: error.message
    };
  }
}

/**
 * Check if a table has all required columns
 * @param {Object} db - D1 database instance
 * @param {string} tableName - Name of table to check
 * @param {string[]} requiredColumns - Array of required column names
 * @returns {Promise<{hasAllColumns: boolean, missingColumns: string[], existingColumns: string[]}>}
 */
async function checkTableColumns(db, tableName, requiredColumns) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const existingColumns = result.results?.map(col => col.name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return {
      hasAllColumns: missingColumns.length === 0,
      missingColumns,
      existingColumns
    };
  } catch (error) {
    console.error(`Failed to check columns for table ${tableName}:`, error);
    return {
      hasAllColumns: false,
      missingColumns: requiredColumns,
      existingColumns: []
    };
  }
}

/**
 * Automatically run database migration if needed (tables OR columns)
 * @param {Object} db - D1 database instance
 * @returns {Promise<{success: boolean, message: string, migrationRan?: boolean}>}
 */
export async function ensureDatabaseSchema(db) {
  try {
    console.log('🔍 Checking database schema and columns...');
    
    const schemaCheck = await checkDatabaseSchema(db);
    
    if (schemaCheck.error) {
      return {
        success: false,
        message: `Schema check failed: ${schemaCheck.error}`
      };
    }

    const needsTableMigration = schemaCheck.missingTables.length > 0;
    const needsColumnMigration = Object.keys(schemaCheck.missingColumns).length > 0;

    if (schemaCheck.isValid) {
      console.log('✅ Database schema is valid - all tables and columns present');
      return {
        success: true,
        message: 'Database schema is up to date',
        migrationRan: false
      };
    }

    // Schema is invalid - run migration
    console.log('🔧 Running automatic database migration...');
    const migrationResult = await runAutoMigration(db, needsTableMigration, needsColumnMigration, schemaCheck.missingColumns);
    
    if (migrationResult.success) {
      console.log('✅ Automatic migration completed successfully');
      return {
        success: true,
        message: `Auto-migration completed: ${migrationResult.details.length} operations executed`,
        migrationRan: true,
        details: migrationResult.details
      };
    } else {
      console.error('❌ Automatic migration failed:', migrationResult.error);
      return {
        success: false,
        message: `Auto-migration failed: ${migrationResult.error}`
      };
    }

  } catch (error) {
    console.error('ensureDatabaseSchema failed:', error);
    return {
      success: false,
      message: `Database initialization error: ${error.message}`
    };
  }
}

/**
 * Run the comprehensive database migration (tables + columns)
 * @param {Object} db - D1 database instance
 * @param {boolean} needsTableMigration - Whether to create missing tables
 * @param {boolean} needsColumnMigration - Whether to add missing columns
 * @param {Object} missingColumns - Object mapping table names to missing column arrays
 * @returns {Promise<{success: boolean, error?: string, details: string[]}>}
 */
async function runAutoMigration(db, needsTableMigration, needsColumnMigration, missingColumns) {
  const operations = [];
  
  try {
    // STEP 1: Create missing tables (if needed)
    if (needsTableMigration) {
      console.log('📋 Creating missing tables...');
      
      const migrationSQL = `
        -- Filing storage and tracking
        CREATE TABLE IF NOT EXISTS filings (
          id TEXT PRIMARY KEY,           -- FCC filing ID (e.g., "2025010112345")
          docket_number TEXT NOT NULL,   -- Format: "XX-XXX" (e.g., "23-108")
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          filing_type TEXT NOT NULL,     -- "comment", "reply", "ex_parte", etc.
          date_received TEXT NOT NULL,   -- ISO date string from FCC
          filing_url TEXT NOT NULL,      -- FCC ECFS URL
          documents TEXT,                -- JSON array of document metadata
          raw_data TEXT,                 -- Full JSON response from FCC API
          ai_summary TEXT,               -- Generated AI summary
          status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
          created_at INTEGER DEFAULT (unixepoch()),
          processed_at INTEGER
        );

        -- Docket monitoring optimization
        CREATE TABLE IF NOT EXISTS active_dockets (
          docket_number TEXT PRIMARY KEY,  -- Format: "XX-XXX"
          last_checked INTEGER DEFAULT 0,  -- Unix timestamp of last ECFS check
          total_filings INTEGER DEFAULT 0, -- Total filings found for this docket
          subscribers_count INTEGER DEFAULT 0, -- Number of active subscribers
          status TEXT DEFAULT 'active',    -- 'active', 'paused', 'error'
          error_count INTEGER DEFAULT 0,   -- Consecutive error count
          created_at INTEGER DEFAULT (unixepoch()),
          updated_at INTEGER DEFAULT (unixepoch())
        );

        -- Enhanced system logging for monitoring (WITH missing columns!)
        CREATE TABLE IF NOT EXISTS system_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,           -- 'info', 'warning', 'error', 'debug'
          message TEXT NOT NULL,
          component TEXT NOT NULL,       -- 'ecfs', 'ai', 'email', 'cron'
          details TEXT,                  -- JSON with additional context
          docket_number TEXT,            -- Optional docket context (MISSING COLUMN!)
          filing_id TEXT,                -- Optional filing context (MISSING COLUMN!)
          created_at INTEGER DEFAULT (unixepoch())
        );

        -- Email notification queue
        CREATE TABLE IF NOT EXISTS notification_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          docket_number TEXT NOT NULL,
          filing_ids TEXT NOT NULL,      -- JSON array of filing IDs
          digest_type TEXT DEFAULT 'daily', -- 'daily', 'instant'
          status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
          created_at INTEGER DEFAULT (unixepoch()),
          sent_at INTEGER,
          error_message TEXT
        );
      `;

      await db.exec(migrationSQL);
      operations.push('Created missing tables: filings, active_dockets, system_logs, notification_queue');

      // Create indexes for performance
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_filings_docket ON filings(docket_number);
        CREATE INDEX IF NOT EXISTS idx_filings_date ON filings(date_received);
        CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
        CREATE INDEX IF NOT EXISTS idx_active_dockets_status ON active_dockets(status);
        CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
        CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
        CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
        CREATE INDEX IF NOT EXISTS idx_notification_queue_email ON notification_queue(email);
      `;

      await db.exec(indexSQL);
      operations.push('Created performance indexes');
    }

    // STEP 2: Add missing columns to existing tables (NEW FEATURE!)
    if (needsColumnMigration) {
      console.log('🔧 Adding missing columns to existing tables...');
      
      for (const [tableName, columns] of Object.entries(missingColumns)) {
        for (const columnName of columns) {
          try {
            // Define column types based on schema expectations
            const columnType = getColumnType(tableName, columnName);
            await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
            operations.push(`Added column ${tableName}.${columnName} (${columnType})`);
            console.log(`✅ Added ${tableName}.${columnName}`);
          } catch (error) {
            // Column might already exist, that's okay
            if (!error.message.includes('duplicate column name')) {
              console.error(`Failed to add column ${tableName}.${columnName}:`, error);
              throw error;
            }
          }
        }
      }
    }

    // STEP 3: Handle subscriptions table columns (existing logic)
    try {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN frequency TEXT DEFAULT 'daily'`);
      operations.push('Added frequency column to subscriptions');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    try {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN last_notified INTEGER DEFAULT 0`);
      operations.push('Added last_notified column to subscriptions');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // STEP 4: Populate active_dockets from real subscription data
    console.log('📊 Populating active_dockets from real subscriptions...');
    
    // First, get all unique dockets from subscriptions with their stats
    const subscriptionDockets = await db.prepare(`
      SELECT 
        docket_number, 
        COUNT(*) as subscribers_count,
        MIN(created_at) as first_subscription
      FROM subscriptions 
      GROUP BY docket_number
    `).all();

    let populatedCount = 0;
    
    if (subscriptionDockets.results && subscriptionDockets.results.length > 0) {
      // Insert each real docket into active_dockets
      for (const docket of subscriptionDockets.results) {
        const insertResult = await db.prepare(`
          INSERT OR REPLACE INTO active_dockets (
            docket_number, 
            subscribers_count, 
            status, 
            last_checked, 
            created_at, 
            updated_at
          ) VALUES (?, ?, 'active', 0, ?, ?)
        `).bind(
          docket.docket_number,
          docket.subscribers_count,
          docket.first_subscription,
          Date.now()
        ).run();
        
        if (insertResult.changes > 0) {
          populatedCount++;
        }
      }
      
      operations.push(`Populated ${populatedCount} real dockets from ${subscriptionDockets.results.length} subscription groups`);
      console.log(`✅ Populated active_dockets with ${populatedCount} real dockets:`, 
                  subscriptionDockets.results.map(d => d.docket_number).join(', '));
    } else {
      operations.push('No subscriptions found - active_dockets table remains empty');
      console.log('⚠️ No subscriptions found to populate active_dockets');
    }

    // Log successful migration
    await db.prepare(`
      INSERT INTO system_logs (level, message, component, details)
      VALUES (?, ?, ?, ?)
    `).bind(
      'info',
      'Automatic database migration completed successfully',
      'auto-migration',
      JSON.stringify({ operations, timestamp: Date.now() })
    ).run();

    operations.push('Logged migration completion');

    return {
      success: true,
      details: operations
    };

  } catch (error) {
    console.error('Auto-migration failed:', error);
    return {
      success: false,
      error: error.message,
      details: operations
    };
  }
}

/**
 * Get the appropriate SQL column type for a given table/column
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 * @returns {string} SQL column type definition
 */
function getColumnType(tableName, columnName) {
  // Define column types based on schema requirements
  const columnTypes = {
    'system_logs': {
      'docket_number': 'TEXT',           // Optional docket context
      'filing_id': 'TEXT'                // Optional filing context
    },
    'subscriptions': {
      'frequency': 'TEXT DEFAULT \'daily\'',
      'last_notified': 'INTEGER DEFAULT 0'
    },
    'filings': {
      'ai_summary': 'TEXT',
      'processed_at': 'INTEGER'
    }
  };

  if (columnTypes[tableName] && columnTypes[tableName][columnName]) {
    return columnTypes[tableName][columnName];
  }

  // Default fallback types
  if (columnName.includes('_at') || columnName.includes('timestamp')) {
    return 'INTEGER DEFAULT (unixepoch())';
  }
  if (columnName.includes('_id') || columnName === 'id') {
    return 'TEXT';
  }
  if (columnName.includes('count') || columnName.includes('total')) {
    return 'INTEGER DEFAULT 0';
  }
  
  return 'TEXT'; // Safe default
} 