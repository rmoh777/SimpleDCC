// cron-worker/src/index.ts - Real Production Pipeline Implementation
import { processNotificationQueue } from './lib/notifications/queue-processor';
import { getETTimeInfo, getProcessingStrategy } from './lib/utils/timezone';
import { getActiveDockets } from './lib/database/db-operations';
import { fetchLatestFilings } from './lib/fcc/ecfs-enhanced-client';
import { storeFilingsEnhanced } from './lib/storage/filing-storage-enhanced';
import { checkDatabaseSchema } from './lib/database/auto-migration';
import { processFilingBatchEnhanced } from './lib/ai/gemini-enhanced';

/**
 * Process seed subscriptions - Welcome experience for new users
 * @param {Object} env - Environment variables from worker
 * @returns {Promise<Object>} Seeding results
 */
async function processSeedSubscriptions(env: any) {
  const startTime = Date.now();
  
  try {
    console.log('🌱 Starting seed subscription processing...');
    
    // Find subscriptions that need seeding
    const seedSubscriptions = await env.DB.prepare(`
      SELECT s.id as subscription_id, s.docket_number, u.id as user_id, u.email, u.user_tier
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.needs_seed = 1
      LIMIT 25
    `).all();
    
    if (!seedSubscriptions.results || seedSubscriptions.results.length === 0) {
      console.log('🌱 No subscriptions need seeding');
      return { processed: 0, sent: 0, errors: [] };
    }
    
    console.log(`🌱 Found ${seedSubscriptions.results.length} subscriptions needing seed digest`);
    
    let processed = 0;
    let sent = 0;
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
        
        // Fetch latest 5 filings for this docket
        const filings = await fetchLatestFilings(docketNumber, 5, env);
        
        if (filings.length === 0) {
          console.log(`🌱 No filings found for docket ${docketNumber}, skipping seed`);
          continue;
        }
        
        console.log(`🌱 Found ${filings.length} filings for docket ${docketNumber}, processing with AI...`);
        
        // Process filings through AI pipeline
        const processedFilings = await processFilingBatchEnhanced(filings, env, {
          maxConcurrent: 2,
          delayBetween: 1000
        });
        
        console.log(`🌱 AI processing completed for ${processedFilings.length} filings`);
        
        // Create seed digest notifications for each subscription
        for (const subscription of subscriptions as any[]) {
          try {
            // Queue seed digest notification
            await env.DB.prepare(`
              INSERT INTO notification_queue (user_email, docket_number, digest_type, filing_data, created_at)
              VALUES (?, ?, 'seed_digest', ?, ?)
            `).bind(
              subscription.email,
              docketNumber,
              JSON.stringify({ filings: processedFilings, tier: subscription.user_tier }),
              Date.now()
            ).run();
            
            // Mark subscription as seeded
            await env.DB.prepare(`
              UPDATE subscriptions 
              SET needs_seed = 0 
              WHERE id = ?
            `).bind(subscription.subscription_id).run();
            
            console.log(`🌱 Queued seed digest for ${subscription.email} on docket ${docketNumber}`);
            processed++;
            
          } catch (subError) {
            console.error(`🌱 Failed to process seed for ${subscription.email}:`, subError);
            errors.push({ email: subscription.email, error: subError.message });
          }
        }
        
        // Rate limiting between dockets
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
        const filings = await fetchLatestFilings(docketNumber, smartLimit, env);
        addLog('info', `✅ ${docketNumber}: Found ${filings.length} filings`);
        
        if (isManualTrigger && filings.length > 0) {
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
        
      } catch (docketError) {
        const errorMessage = docketError instanceof Error ? docketError.message : String(docketError);
        addLog('error', `❌ ${docketNumber}: Failed to fetch filings`, { error: errorMessage });
        docketResults.push({ docket_number: docketNumber, filings_count: 0, success: false, error: errorMessage });
      }
      
      // Rate limiting between dockets
      if (testDockets.length > 1 && testDockets.indexOf(docket) < testDockets.length - 1) {
        addLog('info', '⏱️ Rate limiting: 2 second delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
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
        
        const storageEndTime = Date.now();
        addLog('info', '✅ Enhanced storage completed', {
          ...storageResults,
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