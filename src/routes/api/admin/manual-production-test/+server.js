import { json } from '@sveltejs/kit';

export async function POST({ cookies, request }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { adminSecret, docketNumber, filingLimit } = await request.json();

    // Validate required fields
    if (!adminSecret) {
      return json({ error: 'Admin secret is required' }, { status: 400 });
    }

    if (!docketNumber) {
      return json({ error: 'Docket number is required' }, { status: 400 });
    }

    // Production Cloudflare Worker endpoint
    const workerUrl = 'https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev/manual-trigger';
    
    const requestPayload = {
      docket: docketNumber,
      filingLimit: filingLimit || 2
    };

    const requestDetails = {
      url: workerUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': adminSecret
      },
      body: requestPayload
    };

    console.log('🚀 Making request to production worker:', requestDetails);

    // Make the request to the production worker
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': adminSecret
      },
      body: JSON.stringify(requestPayload)
    });

    const responseText = await response.text();
    console.log('📥 Raw response from worker:', responseText);

    let workerResponse;
    try {
      workerResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse worker response:', parseError);
      return json({
        error: 'Failed to parse worker response',
        details: responseText,
        request_details: requestDetails
      }, { status: 500 });
    }

    // Handle error responses
    if (!response.ok) {
      console.error('❌ Worker returned error:', response.status, workerResponse);
      return json({
        error: `Worker returned ${response.status}: ${workerResponse.error || 'Unknown error'}`,
        details: workerResponse,
        request_details: requestDetails
      }, { status: response.status });
    }

    // Process and structure the response for detailed display
    const processedResponse = {
      success: workerResponse.success || false,
      mode: workerResponse.mode || 'manual',
      docket: workerResponse.docket || docketNumber,
      timestamp: workerResponse.timestamp || new Date().toISOString(),
      execution_time_ms: workerResponse.execution_time_ms || null,
      
      // Request details for debugging
      request_details: requestDetails,
      
      // Processing overview
      processing: workerResponse.processing || null,
      
      // Step-by-step breakdown (adapt based on actual worker response structure)
      ecfs_data: workerResponse.ecfs_data || workerResponse.ecfs_results || null,
      document_processing: workerResponse.document_processing || workerResponse.jina_results || null,
      ai_analysis: workerResponse.ai_analysis || workerResponse.gemini_results || null,
      storage_operations: workerResponse.storage_operations || workerResponse.database_operations || null,
      notification_queue: workerResponse.notification_queue || workerResponse.email_queue || null,
      
      // Additional details
      details: workerResponse.details || null,
      
      // Raw response for complete transparency
      raw_worker_response: workerResponse
    };

    console.log('✅ Production test completed successfully');
    
    return json(processedResponse);

  } catch (error) {
    console.error('❌ Production test endpoint failed:', error);
    return json({ 
      error: 'Production test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 