/**
 * Shared seeding operations for both website and cron-worker
 * Handles immediate seeding when users subscribe and fallback processing
 */

/**
 * Queue a seed digest email for a user
 * @param {string} userEmail - User's email address
 * @param {string} docketNumber - Docket number being monitored
 * @param {Object} filing - Filing object to include in seed email
 * @param {string} userTier - User's tier (free, trial, pro)
 * @param {Object} db - Database connection
 * @returns {Promise<boolean>} Success status
 */
export async function queueSeedEmail(userEmail, docketNumber, filing, userTier, db) {
  try {
    // Queue seed digest in notification system
    await db.prepare(`
      INSERT INTO notification_queue (user_email, docket_number, digest_type, filing_data, created_at)
      VALUES (?, ?, 'seed_digest', ?, ?)
    `).bind(
      userEmail,
      docketNumber,
      JSON.stringify({ 
        filings: [filing], 
        tier: userTier 
      }),
      Date.now()
    ).run();

    console.log(`🌱 Queued seed digest for ${userEmail} on docket ${docketNumber}`);
    return true;
  } catch (error) {
    console.error(`🌱 Failed to queue seed email for ${userEmail}:`, error);
    return false;
  }
}

/**
 * Setup monitoring for a new docket (not in active_dockets)
 * Fetches latest filing from ECFS and prepares docket for future monitoring
 * @param {string} docketNumber - Docket number to setup
 * @param {string} userEmail - User's email address
 * @param {string} userTier - User's tier (free, trial, pro)
 * @param {Object} db - Database connection
 * @param {Object} env - Environment variables (for ECFS API)
 * @returns {Promise<Object>} Result with success status and filing
 */
export async function setupNewDocketMonitoring(docketNumber, userEmail, userTier, db, env) {
  try {
    console.log(`🌱 Setting up new docket monitoring for ${docketNumber}`);

    // Import ECFS client functions (need to create website version)
    const { fetchSingleLatestFiling } = await import('../fcc/ecfs-client.js');
    
    // Fetch latest filing from ECFS
    const latestFiling = await fetchSingleLatestFiling(docketNumber, env);
    
    if (!latestFiling) {
      console.log(`🌱 No filings found for docket ${docketNumber}`);
      return { success: false, error: 'No filings found for this docket' };
    }

    // Store the filing in our database (need to create website version)
    const { storeFilingsEnhanced } = await import('../storage/filing-storage.js');
    await storeFilingsEnhanced([latestFiling], db, env, {
      enableAIProcessing: true,
      enableJinaProcessing: true
    });

    // Add docket to active_dockets for future monitoring
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
      1, // Starting with 1 subscriber
      Date.now(),
      latestFiling.id,
      Date.now(),
      Date.now()
    ).run();

    console.log(`🌱 Added docket ${docketNumber} to active monitoring with filing ${latestFiling.id}`);

    // Queue seed email
    const emailQueued = await queueSeedEmail(userEmail, docketNumber, latestFiling, userTier, db);
    
    return { 
      success: true, 
      filing: latestFiling, 
      emailQueued,
      message: 'New docket setup complete'
    };

  } catch (error) {
    console.error(`🌱 Failed to setup new docket monitoring for ${docketNumber}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle immediate seeding when a user subscribes
 * Determines if docket is already monitored or needs new setup
 * @param {string} docketNumber - Docket number being subscribed to
 * @param {string} userEmail - User's email address
 * @param {string} userTier - User's tier (free, trial, pro)
 * @param {Object} db - Database connection
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} Result with success status and details
 */
export async function handleImmediateSeeding(docketNumber, userEmail, userTier, db, env) {
  try {
    console.log(`🌱 Processing immediate seeding for ${userEmail} on docket ${docketNumber}`);

    // Check if docket is currently being monitored
    const activeEntry = await db.prepare(`
      SELECT docket_number, latest_filing_id, last_checked 
      FROM active_dockets 
      WHERE docket_number = ?
    `).bind(docketNumber).first();

    if (activeEntry) {
      // Scenario A: Docket is actively monitored - use database
      console.log(`🌱 ${docketNumber}: Using existing monitoring (active docket)`);
      
      const latestFiling = await db.prepare(`
        SELECT * FROM filings 
        WHERE docket_number = ? 
        ORDER BY date_received DESC 
        LIMIT 1
      `).bind(docketNumber).first();

      if (latestFiling) {
        // Parse JSON fields
        const filing = {
          ...latestFiling,
          documents: latestFiling.documents ? JSON.parse(latestFiling.documents) : null,
          raw_data: latestFiling.raw_data ? JSON.parse(latestFiling.raw_data) : null
        };

        const emailQueued = await queueSeedEmail(userEmail, docketNumber, filing, userTier, db);
        
        // Update subscriber count
        await db.prepare(`
          UPDATE active_dockets 
          SET subscribers_count = subscribers_count + 1, updated_at = ?
          WHERE docket_number = ?
        `).bind(Date.now(), docketNumber).run();

        return { 
          success: true, 
          scenario: 'existing_active',
          filing: filing,
          emailQueued,
          message: 'Used existing active monitoring'
        };
      } else {
        // Active entry exists but no filings - fallback to ECFS
        console.log(`🌱 ${docketNumber}: Active entry exists but no filings - fetching from ECFS`);
        return await setupNewDocketMonitoring(docketNumber, userEmail, userTier, db, env);
      }
    } else {
      // Scenarios B & C: Docket not actively monitored
      console.log(`🌱 ${docketNumber}: Not actively monitored - checking for historical filings`);
      
      // Check if we have any historical filings for this docket
      const historicalFiling = await db.prepare(`
        SELECT * FROM filings 
        WHERE docket_number = ? 
        ORDER BY date_received DESC 
        LIMIT 1
      `).bind(docketNumber).first();

      if (historicalFiling) {
        // Scenario B: Historical data exists - check if stale
        console.log(`🌱 ${docketNumber}: Found historical filing ${historicalFiling.id} - checking if current`);
        
        // Import ECFS client to check current status
        const { fetchSingleLatestFiling } = await import('../fcc/ecfs-client.js');
        const currentFiling = await fetchSingleLatestFiling(docketNumber, env);
        
        if (currentFiling && currentFiling.id === historicalFiling.id) {
          // Data is current - reactivate monitoring with existing filing
          console.log(`🌱 ${docketNumber}: Historical data is current - reactivating monitoring`);
          
          const filing = {
            ...historicalFiling,
            documents: historicalFiling.documents ? JSON.parse(historicalFiling.documents) : null,
            raw_data: historicalFiling.raw_data ? JSON.parse(historicalFiling.raw_data) : null
          };

          // Reactivate in active_dockets
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
            historicalFiling.id,
            Date.now(),
            Date.now()
          ).run();

          const emailQueued = await queueSeedEmail(userEmail, docketNumber, filing, userTier, db);
          
          return { 
            success: true, 
            scenario: 'reactivated_current',
            filing: filing,
            emailQueued,
            message: 'Reactivated monitoring with current data'
          };
        } else {
          // Data is stale - setup new monitoring
          console.log(`🌱 ${docketNumber}: Historical data is stale - setting up new monitoring`);
          return await setupNewDocketMonitoring(docketNumber, userEmail, userTier, db, env);
        }
      } else {
        // Scenario C: Completely new docket
        console.log(`🌱 ${docketNumber}: Completely new docket - setting up monitoring`);
        return await setupNewDocketMonitoring(docketNumber, userEmail, userTier, db, env);
      }
    }

  } catch (error) {
    console.error(`🌱 Failed immediate seeding for ${userEmail} on ${docketNumber}:`, error);
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