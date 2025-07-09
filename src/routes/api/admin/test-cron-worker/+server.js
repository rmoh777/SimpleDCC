import { json } from '@sveltejs/kit';

export async function POST({ platform, cookies, request }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = platform.env.DB;
    const { simulateFailure = false } = await request.json().catch(() => ({}));
    
    const startTime = Date.now();
    let status = 'SUCCESS';
    let errorMessage = null;
    let errorStack = null;

    try {
      console.log('🧪 Testing cron worker simulation...');
      
      if (simulateFailure) {
        throw new Error('This is a test failure for the dashboard.');
      }
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Test cron simulation completed successfully');
      
    } catch (error) {
      status = 'FAILURE';
      errorMessage = error.message;
      errorStack = error.stack;
      console.error('❌ Test cron simulation failed:', error);
    } finally {
      const durationMs = Date.now() - startTime;
      
      // Log to system_health_logs table
      const logEntry = {
        service_name: 'cron-worker',
        status: status,
        run_timestamp: Math.floor(startTime / 1000),
        duration_ms: durationMs,
        metrics: JSON.stringify({ test_run: true }),
        error_message: errorMessage,
        error_stack: errorStack
      };

      const stmt = db.prepare(
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
      
      await stmt.run();
      console.log(`🧪 Test health status logged: ${status} in ${durationMs}ms`);
    }

    return json({
      success: true,
      message: `Test cron worker simulation completed with status: ${status}`,
      status: status,
      duration: Date.now() - startTime,
      simulatedFailure: simulateFailure
    });

  } catch (error) {
    console.error('Test cron worker endpoint failed:', error);
    return json({ 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
} 