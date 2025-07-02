import { json } from '@sveltejs/kit';
import { fetchECFSFilings } from '$lib/fcc/ecfs-client.js';

export async function GET({ platform, cookies, url }) {
  try {
    // Check admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get test parameters from query string
    const docketNumber = url.searchParams.get('docket') || '11-42';
    const lookbackHours = parseInt(url.searchParams.get('hours') || '168'); // Default 1 week (7 * 24 = 168)
    
    console.log(`🧪 ECFS Test Endpoint - Docket: ${docketNumber}, Lookback: ${lookbackHours} hours`);
    
    // Validate parameters
    if (!docketNumber || !docketNumber.match(/^\d{2}-\d{2,3}$/)) {
      return json({ 
        error: 'Invalid docket format. Expected XX-XXX (e.g., 11-42)',
        provided: docketNumber
      }, { status: 400 });
    }
    
    if (isNaN(lookbackHours) || lookbackHours < 1 || lookbackHours > 8760) { // Max 1 year
      return json({ 
        error: 'Invalid lookback hours. Must be between 1 and 8760 (1 year)',
        provided: lookbackHours
      }, { status: 400 });
    }

    const startTime = Date.now();
    
    try {
      // Call ECFS client directly with custom parameters
      const filings = await fetchECFSFilings(docketNumber, lookbackHours, platform.env);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Return comprehensive debug information
      return json({
        success: true,
        test_parameters: {
          docket_number: docketNumber,
          lookback_hours: lookbackHours,
          lookback_days: Math.round(lookbackHours / 24 * 10) / 10,
          since_date: new Date(Date.now() - (lookbackHours * 60 * 60 * 1000)).toISOString().split('T')[0]
        },
        results: {
          filings_found: filings.length,
          duration_ms: duration,
          api_response_ok: true
        },
        filings: filings.map(filing => ({
          id: filing.id,
          title: filing.title,
          author: filing.author,
          filing_type: filing.filing_type,
          date_received: filing.date_received,
          filing_url: filing.filing_url,
          documents_count: filing.documents ? filing.documents.length : 0
        })),
        raw_first_filing: filings.length > 0 ? filings[0].raw_data : null,
        debug_info: {
          ecfs_base_url: 'https://publicapi.fcc.gov/ecfs/filings',
          api_key_configured: !!platform.env?.ECFS_API_KEY,
          environment: platform.env?.CF_PAGES ? 'production' : 'development'
        }
      });
      
    } catch (ecfsError) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('🚨 ECFS Test Failed:', ecfsError);
      
      return json({
        success: false,
        test_parameters: {
          docket_number: docketNumber,
          lookback_hours: lookbackHours,
          lookback_days: Math.round(lookbackHours / 24 * 10) / 10,
          since_date: new Date(Date.now() - (lookbackHours * 60 * 60 * 1000)).toISOString().split('T')[0]
        },
        error: {
          message: ecfsError.message,
          type: ecfsError.name || 'ECFSError',
          duration_ms: duration
        },
        debug_info: {
          ecfs_base_url: 'https://publicapi.fcc.gov/ecfs/filings',
          api_key_configured: !!platform.env?.ECFS_API_KEY,
          environment: platform.env?.CF_PAGES ? 'production' : 'development',
          full_error: ecfsError.toString()
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🚨 ECFS Test Endpoint Error:', error);
    return json({ 
      error: 'Test endpoint failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST({ platform, cookies, request }) {
  try {
    // Check admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { docket, hours } = body;
    
    // Use POST parameters if provided, otherwise fall back to defaults
    const docketNumber = docket || '11-42';
    const lookbackHours = parseInt(hours || '168');
    
    console.log(`🧪 ECFS Test Endpoint (POST) - Docket: ${docketNumber}, Lookback: ${lookbackHours} hours`);
    
    // Re-use the same logic as GET
    const testUrl = new URL(`/api/admin/monitoring/ecfs-test?docket=${docketNumber}&hours=${lookbackHours}`, 'http://localhost');
    return await GET({ platform, cookies, url: testUrl });
    
  } catch (error) {
    console.error('🚨 ECFS Test POST Error:', error);
    return json({ 
      error: 'Test endpoint POST failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 