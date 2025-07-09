// cron-worker/src/index.ts
import { processNotificationQueue } from './lib/notifications/queue-processor';
import { getTimezoneInfo } from './lib/utils/timezone';

// A placeholder for the fetchAndStoreFilings function, assuming it will be part of the cron logic
async function fetchAndStoreFilings(env, lookbackHours, batchSize) {
  console.log(`(INFO) Placeholder for fetchAndStoreFilings. Lookback: ${lookbackHours}, Batch: ${batchSize}`);
  // In the future, the actual ECFS fetching logic will go here.
  return;
}

export default {
  async scheduled(controller, env, ctx) {
    console.log("(INFO) ⏰ Cron job triggered by schedule.");

    const { etHour, currentStrategy } = getTimezoneInfo();
    console.log(`(INFO) ET hour is ${etHour}. Using strategy: ${currentStrategy.key}`);

    if (currentStrategy.key === 'quiet_hours') {
      console.log("(INFO) 😴 Skipping processing during quiet hours.");
      return;
    }

    try {
      console.log("(INFO) Starting ECFS processing...");
      await fetchAndStoreFilings(env, currentStrategy.lookbackHours, currentStrategy.batchSize);

      console.log("(INFO) Starting notification queue processing...");
      await processNotificationQueue(env.DB, env);

      console.log("(INFO) ✅ Cron processing complete.");
    } catch (error) {
      console.error("❌ Cron job failed:", error);
    }
  },
}; 