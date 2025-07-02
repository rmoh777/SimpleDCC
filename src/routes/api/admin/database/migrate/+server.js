import { json } from '@sveltejs/kit';
import { initializeActiveDockets, logSystemEvent } from '$lib/database/db-operations.js';

// Migration SQL - matches migrations/003_ecfs_integration.sql
const MIGRATION_SQL = `
-- ECFS Integration Database Migration
-- Adds tables for filing storage, AI processing, and system monitoring

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

-- Notification tracking
CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  docket_number TEXT NOT NULL,
  filing_ids TEXT NOT NULL,      -- JSON array of filing IDs
  digest_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'immediate'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for INTEGER NOT NULL, -- Unix timestamp
  sent_at INTEGER,
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
`;

const MIGRATION_INDEXES = `
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_filings_docket_date ON filings(docket_number, date_received);
CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
CREATE INDEX IF NOT EXISTS idx_filings_created_at ON filings(created_at);
CREATE INDEX IF NOT EXISTS idx_active_dockets_last_checked ON active_dockets(last_checked);
CREATE INDEX IF NOT EXISTS idx_active_dockets_status ON active_dockets(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_component_level ON system_logs(component, level, created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_email ON notification_queue(user_email);
`;

const MIGRATION_ALTERATIONS = `
-- Add new columns to existing subscriptions table
-- Using IF NOT EXISTS equivalent for ALTER TABLE (checking if column exists)
PRAGMA table_info(subscriptions);
`;

export async function POST({ platform, request }) {
  try {
    const db = platform?.env?.DB;
    
    if (!db) {
      return json({ 
        success: false, 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Verify admin access
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== platform.env.ADMIN_SECRET_KEY) {
      return json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('Starting ECFS integration database migration...');

    // Execute main migration SQL
    await db.exec(MIGRATION_SQL);
    console.log('Created tables successfully');

    // Execute indexes
    await db.exec(MIGRATION_INDEXES);
    console.log('Created indexes successfully');

    // Check if frequency column exists in subscriptions table
    const tableInfo = await db.prepare(`PRAGMA table_info(subscriptions)`).all();
    const hasFrequency = tableInfo.results?.some(col => col.name === 'frequency');
    const hasLastNotified = tableInfo.results?.some(col => col.name === 'last_notified');

    // Add columns if they don't exist
    if (!hasFrequency) {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN frequency TEXT DEFAULT 'daily'`);
      console.log('Added frequency column to subscriptions');
    }

    if (!hasLastNotified) {
      await db.exec(`ALTER TABLE subscriptions ADD COLUMN last_notified INTEGER DEFAULT 0`);
      console.log('Added last_notified column to subscriptions');
    }

    // Initialize active dockets from existing subscriptions
    const initResult = await initializeActiveDockets(db);
    console.log('Initialized active dockets:', initResult);

    // Log the migration completion
    await logSystemEvent(
      db, 
      'info', 
      'ECFS integration database migration completed successfully', 
      'cron',
      {
        migration: '003_ecfs_integration',
        tablesCreated: ['filings', 'active_dockets', 'system_logs', 'notification_queue'],
        columnsAdded: ['subscriptions.frequency', 'subscriptions.last_notified'],
        activeDocketsInitialized: initResult.success
      }
    );

    return json({ 
      success: true, 
      message: 'ECFS integration database migration completed successfully',
      details: {
        tablesCreated: ['filings', 'active_dockets', 'system_logs', 'notification_queue'],
        indexesCreated: 9,
        columnsAdded: !hasFrequency || !hasLastNotified ? ['frequency', 'last_notified'] : [],
        activeDocketsInitialized: initResult.success,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Try to log the error if database is available
    try {
      if (platform?.env?.DB) {
        await logSystemEvent(
          platform.env.DB, 
          'error', 
          'ECFS integration database migration failed', 
          'cron',
          { error: error.message, stack: error.stack }
        );
      }
    } catch (logError) {
      console.error('Failed to log migration error:', logError);
    }
    
    return json({ 
      success: false, 
      error: error.message,
      details: {
        timestamp: new Date().toISOString(),
        migration: '003_ecfs_integration'
      }
    }, { status: 500 });
  }
}

// GET endpoint for migration status
export async function GET({ platform }) {
  try {
    const db = platform?.env?.DB;
    
    if (!db) {
      return json({ 
        success: false, 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Check if migration tables exist
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('filings', 'active_dockets', 'system_logs', 'notification_queue')
    `).all();

    const requiredTables = ['filings', 'active_dockets', 'system_logs', 'notification_queue'];
    const existingTables = tables.results?.map(t => t.name) || [];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    // Check subscription table columns
    const subscriptionInfo = await db.prepare(`PRAGMA table_info(subscriptions)`).all();
    const hasFrequency = subscriptionInfo.results?.some(col => col.name === 'frequency');
    const hasLastNotified = subscriptionInfo.results?.some(col => col.name === 'last_notified');

    const migrationComplete = missingTables.length === 0 && hasFrequency && hasLastNotified;

    return json({
      success: true,
      migrationComplete,
      details: {
        existingTables,
        missingTables,
        hasFrequencyColumn: hasFrequency,
        hasLastNotifiedColumn: hasLastNotified,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to check migration status:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 