/**
 * Shared seeding operations for cron-worker
 * Simplified version that reuses existing cron-worker functions
 */

/**
 * Handle immediate seeding using existing cron-worker infrastructure
 * @param {string} docketNumber - Docket number being subscribed to
 * @param {string} userEmail - User's email address
 * @param {string} userTier - User's tier (free, trial, pro)
 * @param {Object} db - Database connection
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Result with success status and details
 */
export async function handleImmediateSeeding(docketNumber, userEmail, userTier, db, env) {
  try {
    console.log(`🌱 Processing seeding for ${userEmail} on docket ${docketNumber}`);

    // Check if docket is currently being monitored
    const activeEntry = await db.prepare(`
      SELECT docket_number, latest_filing_id, last_checked 
      FROM active_dockets 
      WHERE docket_number = ?
    `).bind(docketNumber).first();

    let seedFiling = null;

    if (activeEntry) {
      // Docket is actively monitored - use database
      console.log(`🌱 ${docketNumber}: Using existing monitoring (active docket)`);
      
      const latestFiling = await db.prepare(`
        SELECT * FROM filings 
        WHERE docket_number = ? 
        ORDER BY date_received DESC 
        LIMIT 1
      `).bind(docketNumber).first();

      if (latestFiling) {
        seedFiling = {
          ...latestFiling,
          documents: latestFiling.documents ? JSON.parse(latestFiling.documents) : null,
          raw_data: latestFiling.raw_data ? JSON.parse(latestFiling.raw_data) : null
        };
        
        // Update subscriber count
        await db.prepare(`
          UPDATE active_dockets 
          SET subscribers_count = subscribers_count + 1, updated_at = ?
          WHERE docket_number = ?
        `).bind(Date.now(), docketNumber).run();
      }
    } else {
      // Docket not actively monitored - fetch latest filing directly (bypass smart detection to avoid deluge)
      console.log(`🌱 ${docketNumber}: Not actively monitored - fetching latest filing directly`);
      
      const { fetchSingleLatestFiling } = await import('../fcc/ecfs-enhanced-client.js');
      const latestFiling = await fetchSingleLatestFiling(docketNumber, env);
      
      if (latestFiling) {
        seedFiling = latestFiling;
        console.log(`🌱 Using latest filing ${seedFiling.id} for seeding docket ${docketNumber}`);
      } else {
        // Fallback: Check if we have any existing filings in database
        const recentFiling = await db.prepare(`
          SELECT * FROM filings 
          WHERE docket_number = ? 
          ORDER BY date_received DESC 
          LIMIT 1
        `).bind(docketNumber).first();
        
        if (recentFiling) {
          seedFiling = {
            ...recentFiling,
            documents: recentFiling.documents ? JSON.parse(recentFiling.documents) : null,
            raw_data: recentFiling.raw_data ? JSON.parse(recentFiling.raw_data) : null
          };
          console.log(`🌱 Using existing filing ${seedFiling.id} for docket ${docketNumber}`);
        }
      }
      
      // Add to active_dockets if we have a filing
      if (seedFiling) {
        try {
          await db.prepare(`
            INSERT OR REPLACE INTO active_dockets (
              docket_number, 
              subscribers_count, 
              status, 
              last_checked, 
              latest_filing_id,
              created_at, 
              updated_at
            ) VALUES (?, ?, 'active', ?, ?, ?, ?)
          `).bind(
            docketNumber,
            1,
            Date.now(),
            seedFiling.id,
            Date.now(),
            Date.now()
          ).run();
          
          console.log(`🌱 Added docket ${docketNumber} to active monitoring with filing ${seedFiling.id}`);
        } catch (insertError) {
          console.error(`🌱 Failed to add docket ${docketNumber} to active_dockets:`, insertError);
        }
      }
    }

    if (!seedFiling) {
      console.log(`🌱 No filings available for docket ${docketNumber}`);
      return { success: false, error: 'No filings available for this docket' };
    }

    // Store filing in database first (Option 1)
    try {
      const { storeFilings } = await import('../storage/filing-storage.js');
      const storageResult = await storeFilings([seedFiling], db);
      console.log(`🌱 Stored filing ${seedFiling.id} in database: ${storageResult.newFilings} new, ${storageResult.duplicates} duplicates`);
    } catch (storeError) {
      console.error(`🌱 Failed to store filing ${seedFiling.id}:`, storeError);
      // Continue with notification even if storage fails
    }

    // Queue seed digest with scheduled_for
    const scheduledFor = Math.floor(Date.now() / 1000); // Schedule for immediate processing
    
    await db.prepare(`
      INSERT INTO notification_queue (user_email, docket_number, digest_type, filing_ids, filing_data, scheduled_for, created_at)
      VALUES (?, ?, 'seed_digest', ?, ?, ?, ?)
    `).bind(
      userEmail,
      docketNumber,
      JSON.stringify([seedFiling.id]), // Include filing ID for consistency
      JSON.stringify({ 
        filings: [seedFiling], 
        tier: userTier 
      }),
      scheduledFor,
      Math.floor(Date.now() / 1000)
    ).run();

    console.log(`🌱 Queued seed digest for ${userEmail} on docket ${docketNumber}`);

    return { 
      success: true, 
      filing: seedFiling,
      scenario: activeEntry ? 'existing_active' : 'new_setup',
      message: 'Seeding completed successfully'
    };

  } catch (error) {
    console.error(`🌱 Failed seeding for ${userEmail} on ${docketNumber}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a subscription as seeded (set needs_seed = 0)
 * @param {number} subscriptionId - Subscription ID to mark as seeded
 * @param {Object} db - Database connection
 * @returns {Promise<boolean>} Success status
 */
export async function markSubscriptionSeeded(subscriptionId, db) {
  try {
    await db.prepare(`
      UPDATE subscriptions SET needs_seed = 0 WHERE id = ?
    `).bind(subscriptionId).run();
    
    console.log(`🌱 Marked subscription ${subscriptionId} as seeded`);
    return true;
  } catch (error) {
    console.error(`🌱 Failed to mark subscription ${subscriptionId} as seeded:`, error);
    return false;
  }
} 