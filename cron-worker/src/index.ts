// cron-worker/src/index.ts - Real Production Pipeline Implementation
import { processNotificationQueue } from './lib/notifications/queue-processor';
import { getETTimeInfo, getProcessingStrategy, isBusinessHoursStart } from './lib/utils/timezone';
import { getActiveDockets } from './lib/database/db-operations';
import { fetchLatestFilings, smartFilingDetection, liftDelugeFlags } from './lib/fcc/ecfs-enhanced-client';
import { storeFilingsEnhanced } from './lib/storage/filing-storage-enhanced';
import { checkDatabaseSchema } from './lib/database/auto-migration';
import { processFilingBatchEnhanced } from './lib/ai/gemini-enhanced';

/**
 * Process seed subscriptions - Simplified single-filing welcome experience
 * @param {Object} env - Environment variables from worker
 * @returns {Promise<Object>} Seeding results
 */
async function processSeedSubscriptions(env: any) {
  const startTime = Date.now();
  
  try {
    console.log('🌱 Starting simplified seed processing...');
    
    // Find subscriptions that need seeding
    const seedSubscriptions = await env.DB.prepare(`
      SELECT s.id as subscription_id, s.docket_number, u.id as user_id, u.email, u.user_tier
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.needs_seed = 1
      LIMIT 10
    `).all();
    
    if (!seedSubscriptions.results || seedSubscriptions.results.length === 0) {
      console.log('🌱 No subscriptions need seeding');
      return { processed: 0, sent: 0, errors: [] };
    }
    
    console.log(`🌱 Found ${seedSubscriptions.results.length} subscriptions needing seed`);
    
    let processed = 0;
    const errors: any[] = [];
    
    // Group by docket to process efficiently
    const docketGroups = seedSubscriptions.results.reduce((groups, sub) => {
      if (!groups[sub.docket_number]) {
        groups[sub.docket_number] = [];
      }
      groups[sub.docket_number].push(sub);
      return groups;
    }, {} as any);
    
    for (const [docketNumber, subscriptions] of Object.entries(docketGroups)) {
      try {
        console.log(`🌱 Processing seed for docket ${docketNumber}...`);
        
        // Use existing smart detection (proven, efficient)
        const smartResult = await smartFilingDetection(docketNumber, env);
        
        let seedFiling = null;
        
        if (smartResult.status === 'new_found' && smartResult.newFilings.length > 0) {
          // Use the latest new filing (already processed by smart detection)
          seedFiling = smartResult.newFilings[0];
          console.log(`🌱 Using new filing ${seedFiling.id} for ${docketNumber}`);
        } else {
          // Fallback: Get most recent filing from database
          const recentFiling = await env.DB.prepare(`
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
            console.log(`🌱 Using existing filing ${seedFiling.id} for ${docketNumber}`);
          }
        }
        
        if (!seedFiling) {
          console.log(`🌱 No filings available for docket ${docketNumber}, skipping`);
          continue;
        }
        
        // Queue seed digest for each subscription (existing notification system)
        for (const subscription of subscriptions as any[]) {
          try {
            await env.DB.prepare(`
              INSERT INTO notification_queue (user_email, docket_number, digest_type, filing_data, created_at)
              VALUES (?, ?, 'seed_digest', ?, ?)
            `).bind(
              subscription.email,
              docketNumber,
              JSON.stringify({ 
                filings: [seedFiling], 
                tier: subscription.user_tier 
              }),
              Date.now()
            ).run();
            
            // Mark subscription as seeded
            await env.DB.prepare(`
              UPDATE subscriptions SET needs_seed = 0 WHERE id = ?
            `).bind(subscription.subscription_id).run();
            
            console.log(`🌱 Queued seed digest for ${subscription.email} on docket ${docketNumber}`);
            processed++;
            
          } catch (subError) {
            console.error(`🌱 Failed to process seed for ${subscription.email}:`, subError);
            errors.push({ email: subscription.email, error: subError.message });
          }
        }
        
        // Rate limiting between dockets (reduced from 5000ms to 2000ms)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (docketError) {
        console.error(`🌱 Failed to process seed for docket ${docketNumber}:`, docketError);
        errors.push({ docket: docketNumber, error: docketError.message });
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`🌱 Seed processing completed: ${processed} processed in ${duration}ms`);
    
    return { processed, sent: 0, errors, duration_ms: duration };
    
  } catch (error) {
    console.error('🌱 Seed processing failed:', error);
    return { processed: 0, sent: 0, errors: [{ error: error.message }] };
  }
}

/**
 * Main pipeline orchestration function - migrated from working SvelteKit test-production-flow
 * @param {Object} env - Environment variables from worker
 * @param {Object} ctx - Worker context
 * @param {boolean} isManualTrigger - Whether this is a manual trigger or scheduled run
 * @param {string} targetDocket - Specific docket to process (for manual triggers)
 * @param {number} filingLimit - Number of filings to process (for manual triggers)
 * @returns {Promise<Object>} Pipeline execution results
 */
async function runDataPipeline(env: any, ctx: any, isManualTrigger = false, targetDocket?: string, filingLimit?: number) {
  const startTime = Date.now();
  let logEntries: any[] = [];
  
  function addLog(level: string, message: string, data: any = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      duration_ms: Date.now() - startTime
    };
    logEntries.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  }

  try {
    addLog('info', '🚀 Starting data pipeline execution', { 
      manual_trigger: isManualTrigger,
      target_docket: targetDocket || 'all',
      filing_limit: filingLimit || 'default',
      worker_env_keys: Object.keys(env).filter(key => !key.includes('SECRET'))
    });

    // ==============================================
    // STEP 1: SCHEMA CHECK (Critical for Manual Trigger)
    // ==============================================
    if (isManualTrigger) {
      addLog('info', '🔍 Running database schema check...');
      const schemaCheck = await checkDatabaseSchema(env.DB);
      
      if (!schemaCheck.isValid) {
        addLog('error', 'Database schema check failed', {
          missing_tables: schemaCheck.missingTables,
          missing_columns: schemaCheck.missingColumns,
          error: schemaCheck.error
        });
        
        return {
          success: false,
          error: 'Database schema validation failed',
          schema_check: schemaCheck,
          logs: logEntries
        };
      }
      
      addLog('info', '✅ Database schema validation passed', {
        schema_valid: true,
        all_columns_present: Object.keys(schemaCheck.missingColumns).length === 0
      });
    }

    // ==============================================
    // STEP 2: GET ACTIVE DOCKETS
    // ==============================================
    addLog('info', '📊 Fetching active dockets from database...');
    const docketStartTime = Date.now();
    
    const activeDockets = await getActiveDockets(env.DB);
    const docketEndTime = Date.now();
    
    addLog('info', `✅ Retrieved ${activeDockets.length} active dockets`, {
      dockets: activeDockets.map(d => d.docket_number),
      query_time_ms: docketEndTime - docketStartTime
    });

    if (activeDockets.length === 0) {
      addLog('warning', 'No active dockets found - pipeline will exit early');
      return {
        success: true,
        skipped: true,
        reason: 'No active dockets found',
        logs: logEntries
      };
    }

    // NEW: Configurable docket selection for manual triggers
    let testDockets = activeDockets;
    
    if (isManualTrigger) {
      if (targetDocket) {
        // Validate docket format (XX-XX pattern)
        const docketPattern = /^\d{2}-\d+$/;
        if (!docketPattern.test(targetDocket)) {
          addLog('error', 'Invalid docket format', { 
            provided: targetDocket, 
            expected_format: 'XX-XX (e.g., 11-42)' 
          });
          return {
            success: false,
            error: `Invalid docket format: ${targetDocket}. Expected format: XX-XX (e.g., 11-42)`,
            logs: logEntries
          };
        }
        
        // For manual triggers, bypass active dockets check and test any docket
        // This allows testing/debugging of any docket that exists on FCC ECFS
        testDockets = [{ docket_number: targetDocket }];
        addLog('info', `🎯 Manual trigger: Testing docket ${targetDocket} (bypassing active dockets validation)`);
        
      } else {
        // Backward compatibility: default to 02-10 if no docket specified
        const defaultDocket = activeDockets.find(d => d.docket_number === '02-10');
        if (defaultDocket) {
          testDockets = [defaultDocket];
          addLog('info', '🎯 Manual trigger: Using default docket 02-10 (backward compatibility)');
        } else {
          // If 02-10 doesn't exist, use first available docket
          testDockets = activeDockets.slice(0, 1);
          addLog('info', `🎯 Manual trigger: Default docket 02-10 not found, using ${testDockets[0].docket_number}`);
        }
      }
    }

    // ==============================================
    // STEP 3: FETCH FILINGS FROM ECFS
    // ==============================================
    addLog('info', `📡 Fetching filings from ECFS for ${testDockets.length} dockets...`);
    const ecfsStartTime = Date.now();
    
    const { etHour } = getETTimeInfo();
    const processingStrategy = getProcessingStrategy();
    
    // NEW: Configurable filing limit for manual triggers
    let smartLimit: number;
    if (isManualTrigger) {
      // Use provided filing limit with safety constraints
      smartLimit = Math.min(Math.max(filingLimit || 2, 1), 50); // Between 1-50 filings
      addLog('info', `Manual trigger: Using filing limit ${smartLimit}`, {
        requested: filingLimit,
        applied: smartLimit,
        max_allowed: 50
      });
    } else {
      // Production logic unchanged
      smartLimit = Math.min(Math.max(Math.ceil(processingStrategy.lookbackHours * 5), 10), 50);
    }
    
    addLog('info', `Using processing strategy: ${processingStrategy.processingType}`, {
      et_hour: etHour,
      lookback_hours: processingStrategy.lookbackHours,
      smart_limit: smartLimit
    });

    const allFilings: any[] = [];
    const docketResults: any[] = [];

    for (const docket of testDockets) {
      const docketNumber = docket.docket_number;
      addLog('info', `🎯 Processing docket ${docketNumber}...`);
      
      try {
        // For manual triggers, use traditional approach to maintain debugging capability
        if (isManualTrigger) {
          const filings = await fetchLatestFilings(docketNumber, smartLimit, env);
          addLog('info', `✅ ${docketNumber}: Found ${filings.length} filings (manual trigger mode)`);
          
          if (filings.length > 0) {
            // For manual trigger, include detailed filing info
            addLog('info', `📋 Sample filing details for ${docketNumber}:`, {
              first_filing: {
                id: filings[0].id,
                title: filings[0].title,
                author: filings[0].author,
                filing_type: filings[0].filing_type,
                date_received: filings[0].date_received,
                documents_count: filings[0].documents?.length || 0,
                has_downloadable_docs: filings[0].documents?.some(doc => doc.downloadable) || false
              }
            });
          }
          
          allFilings.push(...filings);
          docketResults.push({ docket_number: docketNumber, filings_count: filings.length, success: true });
          
        } else {
          // For scheduled runs, use smart detection
          const smartResult = await smartFilingDetection(docketNumber, env);
          
          // Handle different smart detection results
          if (smartResult.status === 'no_new' || smartResult.status === 'no_filings') {
            addLog('info', `✅ ${docketNumber}: No new filings`);
            docketResults.push({ docket_number: docketNumber, filings_count: 0, success: true, smart_status: smartResult.status });
            continue; // HUGE efficiency gain - skip processing!
          }
          
          if (smartResult.status === 'deluge_active') {
            addLog('info', `🚨 ${docketNumber}: In deluge mode - skipping`);
            docketResults.push({ docket_number: docketNumber, filings_count: 0, success: true, smart_status: smartResult.status });
            continue;
          }
          
          if (smartResult.status === 'deluge') {
            addLog('info', `🚨 ${docketNumber}: Deluge detected - suspended processing`);
            docketResults.push({ docket_number: docketNumber, filings_count: 0, success: true, smart_status: smartResult.status });
            continue;
          }
          
          // Process new filings (existing logic)
          const newFilings = smartResult.newFilings;
          if (newFilings && newFilings.length > 0) {
            addLog('info', `📄 ${docketNumber}: Processing ${newFilings.length} new filings`);
            allFilings.push(...newFilings);
            docketResults.push({ docket_number: docketNumber, filings_count: newFilings.length, success: true, smart_status: smartResult.status });
          } else {
            docketResults.push({ docket_number: docketNumber, filings_count: 0, success: true, smart_status: smartResult.status });
          }
          
          // Log performance metrics
          const apiCallsUsed = smartResult.status === 'fallback' ? 1 : 
                              smartResult.status === 'new_found' ? 2 : 1;
          addLog('info', `📊 ${docketNumber}: API calls used: ${apiCallsUsed} (smart detection: ${smartResult.status})`);
        }
        
      } catch (docketError) {
        const errorMessage = docketError instanceof Error ? docketError.message : String(docketError);
        addLog('error', `❌ ${docketNumber}: Failed to process docket`, { error: errorMessage });
        docketResults.push({ docket_number: docketNumber, filings_count: 0, success: false, error: errorMessage });
      }
      
      // Preserve existing rate limiting
      if (testDockets.length > 1 && testDockets.indexOf(docket) < testDockets.length - 1) {
        addLog('info', '⏱️ Rate limiting: 5 second delay...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const ecfsEndTime = Date.now();
    addLog('info', `✅ ECFS processing completed`, {
      total_filings: allFilings.length,
      docket_results: docketResults,
      processing_time_ms: ecfsEndTime - ecfsStartTime
    });

    // ==============================================
    // STEP 4: ENHANCED STORAGE (REAL PRODUCTION PIPELINE)
    // ==============================================
    let storageResults: any = null;
    const docketStorageResults: any = {}; // Track storage results by docket for notification queuing
    
    if (allFilings.length > 0) {
      addLog('info', `💾 Processing ${allFilings.length} filings through enhanced storage...`);
      const storageStartTime = Date.now();
      
      try {
        // For manual trigger, respect the filing limit for storage too
        const filingsToProcess = isManualTrigger ? 
          allFilings.slice(0, smartLimit) : 
          allFilings;
        
        addLog('info', `🔍 Using storeFilingsEnhanced with AI processing enabled...`);
        const enhancedResults = await storeFilingsEnhanced(filingsToProcess, env.DB, env, {
          enableAIProcessing: true,
          enableJinaProcessing: true
        });
        
        storageResults = {
          newFilings: enhancedResults?.newFilings || 0,
          aiProcessed: enhancedResults?.aiProcessed || 0,
          documentsProcessed: enhancedResults?.documentsProcessed || 0,
          enhanced: true
        };
        
        // Track storage results by docket for notification queuing
        // Group filings by docket to track which dockets had new filings
        const filingsByDocket = filingsToProcess.reduce((acc, filing) => {
          if (!acc[filing.docket_number]) {
            acc[filing.docket_number] = [];
          }
          acc[filing.docket_number].push(filing);
          return acc;
        }, {});
        
        // Create docket-specific storage results for notification queuing
        for (const [docketNumber, docketFilings] of Object.entries(filingsByDocket)) {
          docketStorageResults[docketNumber] = {
            newFilings: enhancedResults?.newFilings || 0, // This will be refined per docket
            duplicates: enhancedResults?.duplicates || 0,
            errors: enhancedResults?.errors || 0,
            totalProcessed: (docketFilings as any[]).length,
            enhanced: enhancedResults?.enhanced || false,
            aiProcessed: enhancedResults?.aiProcessed || 0
          };
        }
        
        const storageEndTime = Date.now();
        addLog('info', '✅ Enhanced storage completed', {
          ...storageResults,
          dockets_processed: Object.keys(docketStorageResults).length,
          processing_time_ms: storageEndTime - storageStartTime
        });
        
        // For manual trigger, include detailed AI processing results
        if (isManualTrigger && enhancedResults?.aiProcessed > 0) {
          // Get the processed filing details for all processed filings
          const processedFilings = await env.DB.prepare(`
            SELECT id, title, ai_summary, ai_key_points, ai_stakeholders, ai_regulatory_impact, ai_confidence 
            FROM filings 
            WHERE id IN (${filingsToProcess.map(() => '?').join(',')}) AND ai_summary IS NOT NULL
          `).bind(...filingsToProcess.map(f => f.id)).all();
          
          if (processedFilings.results && processedFilings.results.length > 0) {
            for (const processedFiling of processedFilings.results) {
              addLog('info', '🤖 AI processing results:', {
                filing_id: processedFiling.id,
                filing_title: processedFiling.title,
                ai_summary_length: processedFiling.ai_summary?.length || 0,
                ai_confidence: processedFiling.ai_confidence,
                has_key_points: !!processedFiling.ai_key_points,
                has_stakeholders: !!processedFiling.ai_stakeholders,
                has_regulatory_impact: !!processedFiling.ai_regulatory_impact
              });
            }
          }
        }
        
      } catch (storageError) {
        const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
        addLog('error', '❌ Enhanced storage failed', { error: errorMessage });
        storageResults = { error: errorMessage };
      }
    } else {
      addLog('info', '⏭️ Skipping storage - no new filings to process');
    }

    // ==============================================
    // STEP 4.5: QUEUE NOTIFICATIONS FOR NEW FILINGS
    // ==============================================
    if (Object.keys(docketStorageResults).length > 0 && !storageResults?.error) {
      addLog('info', '📬 QUICK FIX: Queuing notifications for users subscribed to dockets with new filings...');
      const notificationQueuingStartTime = Date.now();
      
      // Fix 3: Better error handling that doesn't break the pipeline
      try {
        // Fix 4: Use static import (already done at top of file)
        const { queueNotificationsForNewFilings } = await import('./lib/storage/notification-integration.js');
        
        // Fix 1: QUICK FIX - Pass pipeline start time for better filtering
        const notificationResult = await queueNotificationsForNewFilings(
          docketStorageResults, 
          env.DB, 
          allFilings // Pass the filings array for reference
        );
        
        const notificationQueuingEndTime = Date.now();
        addLog('info', `✅ QUICK FIX: Notification queuing complete: ${notificationResult.queued} queued`, {
          queued: notificationResult.queued,
          errors: notificationResult.errors.length,
          duration_ms: notificationQueuingEndTime - notificationQueuingStartTime
        });
        
        if (notificationResult.errors.length > 0) {
          addLog('warning', 'QUICK FIX: Some notification queuing errors occurred (non-critical)', {
            error_count: notificationResult.errors.length,
            errors: notificationResult.errors.slice(0, 3) // Limit error logging
          });
        }
        
        // Add to storage results for tracking
        if (storageResults) {
          storageResults.notification_queuing = {
            queued: notificationResult.queued,
            errors: notificationResult.errors.length,
            duration_ms: notificationResult.duration_ms
          };
        }
        
      } catch (notificationError) {
        const errorMessage = notificationError instanceof Error ? notificationError.message : String(notificationError);
        addLog('warning', 'QUICK FIX: Notification queuing failed (non-critical - pipeline continues)', {
          error: errorMessage
        });
        
        // Fix 3: Don't fail the entire pipeline for notification errors
        if (storageResults) {
          storageResults.notification_queuing = {
            queued: 0,
            errors: 1,
            error: errorMessage
          };
        }
      }
    } else {
      addLog('info', '📬 QUICK FIX: Skipping notification queuing - no new filings or storage errors');
    }

    // ==============================================
    // STEP 5: NOTIFICATION QUEUE PROCESSING
    // ==============================================
    addLog('info', '📧 Processing notification queue...');
    const notificationStartTime = Date.now();
    
    try {
      const queueResult = await processNotificationQueue(env.DB, env);
      const notificationEndTime = Date.now();
      
      addLog('info', '✅ Notification queue processing completed', {
        processed: queueResult.processed,
        sent: queueResult.sent,
        failed: queueResult.failed,
        errors: queueResult.errors,
        processing_time_ms: notificationEndTime - notificationStartTime
      });
      
    } catch (notificationError) {
      const errorMessage = notificationError instanceof Error ? notificationError.message : String(notificationError);
      addLog('error', '❌ Notification queue processing failed', { error: errorMessage });
    }

    // ==============================================
    // STEP 6: FINAL RESULTS
    // ==============================================
    const totalEndTime = Date.now();
    const totalDuration = totalEndTime - startTime;
    
    addLog('info', '🎯 Pipeline execution completed successfully', {
      total_duration_ms: totalDuration,
      dockets_processed: testDockets.length,
      filings_fetched: allFilings.length,
      storage_success: storageResults && !storageResults.error,
      ai_processed: storageResults?.aiProcessed || 0
    });

    return {
      success: true,
      manual_trigger: isManualTrigger,
      target_docket: targetDocket,
      pipeline_results: {
        dockets_processed: testDockets.length,
        filings_fetched: allFilings.length,
        storage_results: storageResults,
        docket_results: docketResults
      },
      processing_stats: {
        total_duration_ms: totalDuration,
        ecfs_duration_ms: ecfsEndTime - ecfsStartTime,
        storage_duration_ms: storageResults ? Date.now() - startTime : 0
      },
      logs: logEntries
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog('error', '❌ Pipeline execution failed', { error: errorMessage, stack: error.stack });
    
    return {
      success: false,
      error: errorMessage,
      logs: logEntries
    };
  }
}

export default {
  async scheduled(controller, env, ctx) {
    const startTime = Date.now();
    let status = 'SUCCESS';
    let errorMessage = null;
    let errorStack = null;

    try {
      console.log("(INFO) ⏰ Scheduled cron job triggered - executing real pipeline.");

      const { etHour } = getETTimeInfo();
      const processingStrategy = getProcessingStrategy();
      console.log(`(INFO) ET hour is ${etHour}. Using strategy: ${processingStrategy.processingType}`);

      // Daily reset: Lift deluge flags only at start of business hours (8 AM ET)
      if (isBusinessHoursStart()) {
        console.log("(INFO) 🌅 Lifting deluge flags at start of business hours...");
        await liftDelugeFlags(env);
      }

      if (!processingStrategy.shouldProcess) {
        console.log("(INFO) 😴 Skipping processing during quiet hours.");
        return;
      }

      // Process seed subscriptions first (welcome experience)
      console.log("(INFO) 🌱 Processing seed subscriptions...");
      const seedResult = await processSeedSubscriptions(env);
      console.log(`(INFO) 🌱 Seed processing completed: ${seedResult.processed} subscriptions processed`);

      // Execute the real pipeline (no target docket or filing limit for scheduled runs)
      const pipelineResult = await runDataPipeline(env, ctx, false);
      
      if (!pipelineResult.success) {
        throw new Error(`Pipeline failed: ${pipelineResult.error}`);
      }

      console.log(`(INFO) ✅ Real pipeline execution completed successfully. Processed ${pipelineResult.pipeline_results?.dockets_processed || 0} dockets, ${pipelineResult.pipeline_results?.filings_fetched || 0} filings.`);

    } catch (error) {
      status = 'FAILURE';
      errorMessage = error.message;
      errorStack = error.stack;
      console.error("❌ Real pipeline execution failed:", error);

    } finally {
      const durationMs = Date.now() - startTime;
      const logEntry = {
        service_name: 'cron-worker',
        status: status,
        run_timestamp: Math.floor(startTime / 1000),
        duration_ms: durationMs,
        metrics: JSON.stringify({}),
        error_message: errorMessage,
        error_stack: errorStack
      };

      try {
        const stmt = env.DB.prepare(
          'INSERT INTO system_health_logs (service_name, status, run_timestamp, duration_ms, metrics, error_message, error_stack) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          logEntry.service_name,
          logEntry.status,
          logEntry.run_timestamp,
          logEntry.duration_ms,
          logEntry.metrics,
          logEntry.error_message,
          logEntry.error_stack
        );
        
        ctx.waitUntil(stmt.run());
        console.log(`(INFO) Health status logged: ${status} in ${durationMs}ms`);
      } catch (logError) {
        console.error("❌ Failed to log health status:", logError);
      }
    }
  },

  // Manual trigger endpoint for testing and debugging
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Test Email Endpoint
    if (url.pathname === '/test-email') {
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { 
          status: 405,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Auth check
      const adminSecret = request.headers.get('X-Admin-Secret');
      if (!adminSecret || adminSecret !== env.CRON_SECRET) {
        return new Response('Unauthorized', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      try {
        const { template_type, recipient_email, user_tier = 'pro' } = await request.json();

        // Import existing template functions
        const { generateDailyDigest, generateFilingAlert, generateWelcomeEmail } = 
          await import('./lib/email/daily-digest.js');
        const { sendEmail } = await import('./lib/email.ts');

        // Create mock data
        const mockFilings = [{
          id: 'test123',
          docket_number: '14-58',
          title: 'USF Certification Filing - Test Communications',
          author: 'Test Communications',
          filing_type: 'COMPLIANCE FILING',
          date_received: '2025-07-09T16:47:42.136Z',
          ai_summary: 'Test filing submitted for compliance certification with universal service fund requirements.',
          ai_key_points: ['USF compliance certification', 'Required by FCC regulations', 'Annual filing requirement'],
          filing_url: 'https://www.fcc.gov/ecfs/filing/test123'
        }];

        let emailContent;
        const baseUrl = env.APP_URL || 'https://simpledcc.pages.dev';

        switch (template_type) {
          case 'daily_digest':
            emailContent = generateDailyDigest(recipient_email, mockFilings, {
              user_tier,
              digest_type: 'daily',
              unsubscribeBaseUrl: baseUrl
            });
            break;

          case 'filing_alert':
            emailContent = generateFilingAlert(recipient_email, mockFilings[0], {
              user_tier,
              unsubscribeBaseUrl: baseUrl
            });
            break;

          case 'welcome':
            emailContent = generateWelcomeEmail(recipient_email, '14-58', {
              unsubscribeBaseUrl: baseUrl
            });
            break;

          default:
            return new Response('Invalid template_type', { 
              status: 400,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
        }

        // Send email
        const result = await sendEmail(
          recipient_email, 
          emailContent.subject, 
          emailContent.html, 
          emailContent.text, 
          env
        );

        return new Response(JSON.stringify({
          success: result.success,
          message: result.success ? 'Test email sent successfully' : 'Email failed',
          template_type,
          subject: emailContent.subject,
          email_id: result.id,
          error: result.error
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret'
          }
        });
      }
    }
    
    if (url.pathname !== '/manual-trigger') {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Security Check: Verify admin secret
    const adminSecret = request.headers.get('X-Admin-Secret');
    if (!adminSecret || adminSecret !== env.CRON_SECRET) {
      console.log(`❌ Manual trigger: Unauthorized access attempt`);
      return new Response('Unauthorized', { status: 401 });
    }

    console.log(`🔍 Manual trigger: Authorized access - executing configurable pipeline test`);

    try {
      // Parse request body for configuration parameters
      let requestBody: any = {};
      try {
        const bodyText = await request.text();
        if (bodyText) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse request body:', parseError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          timestamp: new Date().toISOString(),
          test_mode: 'manual_trigger'
        }, null, 2), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // Extract parameters with validation
      const targetDocket = requestBody.docket || null;
      const filingLimit = requestBody.filingLimit || requestBody.filing_limit || null;
      
      console.log(`🎯 Manual trigger configuration:`, {
        target_docket: targetDocket || 'default (02-10)',
        filing_limit: filingLimit || 'default (2)',
        request_body: requestBody
      });

      // Execute pipeline in manual mode with configurable parameters
      const pipelineResult = await runDataPipeline(env, ctx, true, targetDocket, filingLimit);
      
      // Return detailed JSON response for debugging
      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        test_mode: 'manual_trigger',
        docket_tested: targetDocket || pipelineResult.target_docket || '02-10',
        ...pipelineResult
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

    } catch (error) {
      console.error('❌ Manual trigger failed:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        test_mode: 'manual_trigger'
      }, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
  }
}; 