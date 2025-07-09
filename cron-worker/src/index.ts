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
}; 