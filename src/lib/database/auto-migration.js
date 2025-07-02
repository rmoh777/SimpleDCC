// Auto-Migration System
// Prevents database schema issues by checking required tables on startup

/**
 * Check if all required ECFS integration tables exist
 * @param {Object} db - D1 database instance
 * @returns {Promise<{isValid: boolean, missingTables: string[], error?: string}>}
 */
export async function checkDatabaseSchema(db) {
  try {
    const requiredTables = [
      'subscriptions',      // Core subscription table
      'admin_users',        // Admin authentication
      'filings',           // ECFS filings storage
      'active_dockets',    // Docket monitoring
      'system_logs',       // System logging
      'notification_queue' // Email notifications
    ];

    // Query existing tables
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence'
    `).all();

    const existingTables = result.results?.map(row => row.name) || [];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    console.log(`Schema Check: Found ${existingTables.length} tables, missing ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(', ')}`);
    }

    return {
      isValid: missingTables.length === 0,
      missingTables,
      existingTables
    };

  } catch (error) {
    console.error('Database schema check failed:', error);
    return {
      isValid: false,
      missingTables: [],
      error: error.message
    };
  }
}

/**
 * Automatically run database migration if needed
 * @param {Object} db - D1 database instance
 * @returns {Promise<{success: boolean, message: string, migrationRan?: boolean}>}
 */
export async function ensureDatabaseSchema(db) {
  try {
    console.log('🔍 Checking database schema...');
    
    const schemaCheck = await checkDatabaseSchema(db);
    
    if (schemaCheck.error) {
      return {
        success: false,
        message: `Schema check failed: ${schemaCheck.error}`
      };
    }

    if (schemaCheck.isValid) {
      console.log('✅ Database schema is valid - all tables present');
      return {
        success: true,
        message: 'Database schema is up to date',
        migrationRan: false
      };
    }

    // Schema is invalid - run auto-migration
    console.log('🔧 Running automatic database migration...');
    const migrationResult = await runAutoMigration(db);
    
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
 * Run the ECFS integration migration automatically
 * @param {Object} db - D1 database instance
 * @returns {Promise<{success: boolean, error?: string, details: string[]}>}
 */
async function runAutoMigration(db) {
  const operations = [];
  
  try {
    // ECFS Integration Migration SQL (from migrations/003_ecfs_integration.sql)
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

      -- Enhanced system logging for monitoring
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,           -- 'info', 'warning', 'error', 'debug'
        message TEXT NOT NULL,
        component TEXT NOT NULL,       -- 'ecfs', 'ai', 'email', 'cron'
        details TEXT,                  -- JSON with additional context
        docket_number TEXT,            -- Optional docket context
        filing_id TEXT,                -- Optional filing context
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

    // Execute migration SQL
    const result = await db.exec(migrationSQL);
    operations.push('Created tables: filings, active_dockets, system_logs, notification_queue');

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

    // Add missing columns to subscriptions table if needed
    try {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN frequency TEXT DEFAULT 'daily'`);
      operations.push('Added frequency column to subscriptions');
    } catch (error) {
      // Column might already exist, that's okay
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    try {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN last_notified INTEGER DEFAULT 0`);
      operations.push('Added last_notified column to subscriptions');
    } catch (error) {
      // Column might already exist, that's okay
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    // Initialize active_dockets from existing subscriptions
    const initResult = await db.prepare(`
      INSERT OR IGNORE INTO active_dockets (docket_number, subscribers_count)
      SELECT docket_number, COUNT(*) 
      FROM subscriptions 
      GROUP BY docket_number
    `).run();

    if (initResult.changes > 0) {
      operations.push(`Initialized ${initResult.changes} active dockets from subscriptions`);
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