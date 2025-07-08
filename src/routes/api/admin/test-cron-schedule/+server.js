// Admin endpoint for testing cron scheduling and timezone logic
import { json } from '@sveltejs/kit';
import { getETTimeInfo, getProcessingStrategy, getNextProcessingTime } from '$lib/utils/timezone.js';

export async function GET({ url, platform, cookies }) {
  try {
    // Check admin auth (use your existing pattern)
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current scheduling info
    const timeInfo = getETTimeInfo();
    const strategy = getProcessingStrategy();
    
    // Test specific hour if provided
    const testHour = url.searchParams.get('hour');
    let testResults = {};
    
    if (testHour) {
      const hour = parseInt(testHour);
      // Mock time info for testing
      const mockTimeInfo = { ...timeInfo, etHour: hour };
      
      // Test what would happen at that hour
      const mockStrategy = {
        shouldProcess: hour >= 8 && hour < 22,
        processingType: hour === 8 ? 'morning_catchup' : 
                       hour >= 8 && hour < 18 ? 'business_hours' :
                       hour >= 18 && hour < 22 ? 'evening' : 'quiet',
        lookbackHours: hour === 8 ? 12 : hour >= 8 && hour < 22 ? 2 : 0,
        batchSize: hour === 8 ? 10 : hour >= 8 && hour < 18 ? 5 : hour >= 18 && hour < 22 ? 3 : 0
      };
      
      testResults = {
        test_hour: hour,
        would_process: mockStrategy.shouldProcess,
        processing_type: mockStrategy.processingType,
        lookback_hours: mockStrategy.lookbackHours,
        batch_size: mockStrategy.batchSize
      };
    }
    
    return json({
      success: true,
      current_time: {
        utc: new Date().toISOString(),
        et: timeInfo.etTime.toLocaleString("en-US", {timeZone: "America/New_York"}),
        et_hour: timeInfo.etHour,
        is_dst: timeInfo.isDST
      },
      current_strategy: strategy,
      schedule_info: {
        business_hours: '8 AM - 6 PM ET (full processing)',
        evening_hours: '6 PM - 10 PM ET (reduced processing)',
        quiet_hours: '10 PM - 8 AM ET (no processing)',
        morning_catchup: '8 AM ET (12-hour lookback)',
        cron_frequency: 'Every 2 hours (filtered by ET logic)'
      },
      next_processing: getNextProcessingTime(),
      test_results: testResults
    });
    
  } catch (error) {
    console.error('Error testing cron schedule:', error);
    return json({ 
      error: 'Failed to test cron schedule',
      details: error.message 
    }, { status: 500 });
  }
} 