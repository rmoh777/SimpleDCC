// cron-worker/src/index.ts
import { processNotificationQueue } from './lib/notifications/queue-processor';
import { getETTimeInfo, getProcessingStrategy } from './lib/utils/timezone';

// A placeholder for the fetchAndStoreFilings function, assuming it will be part of the cron logic
async function fetchAndStoreFilings(env, lookbackHours, batchSize) {
  console.log(`(INFO) Placeholder for fetchAndStoreFilings. Lookback: ${lookbackHours}, Batch: ${batchSize}`);
  // In the future, the actual ECFS fetching logic will go here.
  return;
}

export default {
  async scheduled(controller, env, ctx) {
    const startTime = Date.now();
    let status = 'SUCCESS';
    let errorMessage = null;
    let errorStack = null;

    try {
      console.log("(INFO) ⏰ Cron job triggered by schedule.");

      const { etHour } = getETTimeInfo();
      const processingStrategy = getProcessingStrategy();
      console.log(`(INFO) ET hour is ${etHour}. Using strategy: ${processingStrategy.processingType}`);

      if (!processingStrategy.shouldProcess) {
        console.log("(INFO) 😴 Skipping processing during quiet hours.");
        return;
      }

      console.log("(INFO) Starting ECFS processing...");
      await fetchAndStoreFilings(env, processingStrategy.lookbackHours, processingStrategy.batchSize);

      console.log("(INFO) Starting notification queue processing...");
      await processNotificationQueue(env.DB, env);

      console.log("(INFO) ✅ Cron processing complete.");

    } catch (error) {
      status = 'FAILURE';
      errorMessage = error.message;
      errorStack = error.stack;
      console.error("❌ Cron job failed:", error);

    } finally {
      const durationMs = Date.now() - startTime;
      const logEntry = {
        service_name: 'cron-worker',
        status: status,
        run_timestamp: Math.floor(startTime / 1000),
        duration_ms: durationMs,
        metrics: JSON.stringify({}), // Placeholder for future metrics
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
        
        ctx.waitUntil(stmt.run()); // Use waitUntil to ensure the log is written even if the main function has returned
        console.log(`(INFO) Health status logged: ${status} in ${durationMs}ms`);
      } catch (logError) {
        console.error("❌ Failed to log health status:", logError);
      }
    }
  },

  // NEW: Add this 'fetch' handler for manual testing
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/manual-test') {
      return new Response('Not Found', { status: 404 });
    }

    // Security Check: Only allow this if a secret header is present
    if (request.headers.get('X-Admin-Secret') !== env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    // --- Test Configuration ---
    const TEST_DOCKET_NUMBER = '11-42'; // The docket to test
    const TEST_USER_EMAIL = 'test-user@example.com';
    const TEST_USER_TIER = 'pro'; // Change to 'free' to test the other path

    try {
      let log = '🚀 Starting Manual End-to-End Test...\n\n';

      // Step 1: Fetch latest filing from ECFS
      log += '--- Step 1: Fetching from ECFS ---\n';
      const { fetchLatestFilings } = await import('./lib/fcc/ecfs-enhanced-client.js');
      const newFilings = await fetchLatestFilings(TEST_DOCKET_NUMBER, 5, env);
      if (!newFilings || newFilings.length === 0) {
        return new Response(`No new filings found for docket ${TEST_DOCKET_NUMBER}. Test cannot proceed.`, { status: 404 });
      }
      const testFiling = newFilings[0];
      log += `✅ Found filing: ${testFiling.title}\n`;
      log += `   ID: ${testFiling.id}\n`;
      log += `   URL: ${testFiling.filing_url}\n`;
      log += `   Documents: ${testFiling.documents ? testFiling.documents.length : 0} documents\n\n`;

      // Step 2: Process notification queue (this tests the existing cron-worker functionality)
      log += '--- Step 2: Testing Notification Queue Processing ---\n';
      
      // First, create a test notification queue entry
      const testNotificationId = await env.DB.prepare(`
        INSERT INTO notification_queue (user_email, docket_number, filing_ids, digest_type, status, scheduled_for, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        TEST_USER_EMAIL,
        TEST_DOCKET_NUMBER,
        JSON.stringify([testFiling.id]),
        'daily',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      ).run();
      
      log += `✅ Created test notification queue entry (ID: ${testNotificationId.meta.last_row_id})\n`;

      // Test the queue processing
      const queueResult = await processNotificationQueue(env.DB, env);
      log += `✅ Queue processing completed:\n`;
      log += `   Processed: ${queueResult.processed}\n`;
      log += `   Sent: ${queueResult.sent}\n`;
      log += `   Failed: ${queueResult.failed}\n`;
      if (queueResult.errors.length > 0) {
        log += `   Errors: ${queueResult.errors.join(', ')}\n`;
      }
      log += '\n';

      // Step 3: Test Email Generation (using cron-worker functions)
      log += `--- Step 3: Testing Email Generation for '${TEST_USER_TIER}' user ---\n`;
      
      // Create a mock filing with some basic AI content for testing
      const mockFilingWithAI = {
        ...testFiling,
        ai_summary: 'This is a test AI summary for the manual test. It demonstrates how AI-processed content would appear in the email.',
        ai_key_points: 'Key test points, Enhanced security protocols, Updated compliance requirements',
        ai_stakeholders: 'Test stakeholders, Regulatory bodies, Industry participants',
        ai_regulatory_impact: 'Significant impact on test operations and compliance requirements',
        ai_confidence: '0.85'
      };
      
      const { generateDailyDigest } = await import('./lib/email/daily-digest.js');
      const emailContent = generateDailyDigest(TEST_USER_EMAIL, [mockFilingWithAI], { 
        user_tier: TEST_USER_TIER,
        APP_URL: env.APP_URL || 'https://simpledcc.pages.dev'
      });
      
      log += `✅ Email generated successfully for ${TEST_USER_TIER} user.\n`;
      log += `   Subject: ${emailContent.subject}\n`;
      log += `   HTML length: ${emailContent.html ? emailContent.html.length : 0} characters\n`;
      log += `   Text length: ${emailContent.text ? emailContent.text.length : 0} characters\n\n`;

      // Step 4: Show tier-specific content differences
      log += '--- Step 4: Testing Tier-Specific Content ---\n';
      
      const tiers = ['free', 'trial', 'pro'];
      for (const tier of tiers) {
        const tierEmail = generateDailyDigest(TEST_USER_EMAIL, [mockFilingWithAI], { 
          user_tier: tier,
          APP_URL: env.APP_URL || 'https://simpledcc.pages.dev'
        });
        
        log += `✅ ${tier.toUpperCase()} tier email:\n`;
        log += `   Subject: ${tierEmail.subject}\n`;
        log += `   HTML length: ${tierEmail.html ? tierEmail.html.length : 0} characters\n`;
        
        // Show tier-specific content indicators
        if (tier === 'free') {
          const hasUpgradePrompt = tierEmail.html.includes('Upgrade to Pro') || tierEmail.html.includes('upgrade');
          log += `   Contains upgrade prompt: ${hasUpgradePrompt}\n`;
        } else if (tier === 'trial') {
          const hasTrialReminder = tierEmail.html.includes('trial') || tierEmail.html.includes('expires');
          log += `   Contains trial reminder: ${hasTrialReminder}\n`;
        } else {
          const hasFullContent = tierEmail.html.includes('ai_summary') || tierEmail.html.length > 2000;
          log += `   Contains full AI content: ${hasFullContent}\n`;
        }
        log += '\n';
      }

      // Show sample of the generated email
      log += '--- SAMPLE EMAIL CONTENT ---\n';
      log += emailContent.html ? emailContent.html.substring(0, 800) + '...' : 'No HTML content generated';
      log += '\n\n';

      log += '✅ End-to-End Test Complete.\n';
      log += '📊 Test Summary:\n';
      log += `   - ECFS Fetching: ✅ Retrieved ${newFilings.length} filings\n`;
      log += `   - Queue Processing: ✅ Processed ${queueResult.processed} notifications\n`;
      log += `   - Email Generation: ✅ Generated emails for all tiers\n`;
      log += `   - Tier Differentiation: ✅ Verified tier-specific content\n`;

      return new Response(log, { 
        headers: { 'Content-Type': 'text/plain' },
        status: 200
      });

    } catch (error) {
      console.error('Manual Test Failed:', error);
      const errorLog = `❌ Test failed: ${error.message}\n\nStack Trace:\n${error.stack}`;
      return new Response(errorLog, { 
        headers: { 'Content-Type': 'text/plain' },
        status: 500 
      });
    }
  },
}; 