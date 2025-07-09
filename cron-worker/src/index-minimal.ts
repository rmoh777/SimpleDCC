// Minimal test version to isolate build issues
import { processNotificationQueue } from './lib/notifications/queue-processor';
import { getETTimeInfo, getProcessingStrategy } from './lib/utils/timezone';

export default {
  async scheduled(controller: any, env: any, ctx: any) {
    const startTime = Date.now();
    
    try {
      console.log("(INFO) ⏰ Minimal test scheduled cron job triggered.");

      const { etHour } = getETTimeInfo();
      const processingStrategy = getProcessingStrategy();
      console.log(`(INFO) ET hour is ${etHour}. Using strategy: ${processingStrategy.processingType}`);

      if (!processingStrategy.shouldProcess) {
        console.log("(INFO) 😴 Skipping processing during quiet hours.");
        return;
      }

      // Test notification queue processing
      await processNotificationQueue(env.DB, env);
      console.log("(INFO) ✅ Minimal test completed successfully.");

    } catch (error) {
      console.error("❌ Minimal test failed:", error);
    }
  },

  async fetch(request: any, env: any, ctx: any) {
    const url = new URL(request.url);
    
    if (url.pathname !== '/test') {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Minimal test endpoint works',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 