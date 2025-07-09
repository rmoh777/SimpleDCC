import { json } from '@sveltejs/kit';

export async function POST({ request, cookies, platform }) {
  try {
    // Check admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, docketNumber, simulateFailure = false } = await request.json();
    
    if (!userEmail || !docketNumber) {
      return json({ error: 'userEmail and docketNumber are required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Simulate queue processing
    if (simulateFailure) {
      return json({
        success: false,
        processed: 0,
        sent: 0,
        failed: 1,
        error: 'Simulated failure: Email delivery failed',
        duration: Date.now() - startTime,
        userEmail,
        docketNumber,
        message: 'Queue processing failed (simulated failure)',
        note: 'This is a simulated failure for testing error handling.'
      }, { status: 500 });
    }

    // Mock successful queue processing
    const mockQueueId = `queue-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Simulate database operations
    try {
      // In real implementation, this would:
      // 1. Create notification_queue entry
      // 2. Process the queue
      // 3. Send email
      // 4. Update status
      
      const duration = Date.now() - startTime;
      
      return json({
        success: true,
        processed: 1,
        sent: 1,
        failed: 0,
        queueId: mockQueueId,
        duration,
        userEmail,
        docketNumber,
        message: `Successfully processed queue entry for ${userEmail}`,
        steps: [
          { name: 'Create queue entry', success: true, duration: 50 },
          { name: 'Generate email content', success: true, duration: 200 },
          { name: 'Send email', success: true, duration: 300 },
          { name: 'Update status', success: true, duration: 25 }
        ],
        note: 'This is mock queue processing for testing purposes. In production, this would process actual notification queue entries.'
      });
      
    } catch (error) {
      return json({
        success: false,
        processed: 0,
        sent: 0,
        failed: 1,
        error: `Queue processing failed: ${error.message}`,
        duration: Date.now() - startTime,
        userEmail,
        docketNumber
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Queue test error:', error);
    return json({ 
      error: 'Internal server error during queue test',
      details: error.message 
    }, { status: 500 });
  }
} 