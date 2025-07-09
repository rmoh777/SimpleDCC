import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    // Check admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docketNumber, limit = 5 } = await request.json();
    
    if (!docketNumber) {
      return json({ error: 'Docket number is required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Simulate ECFS fetching (in real implementation, this would call the actual ECFS API)
    // For now, we'll create mock data that resembles what the ECFS API would return
    const mockFilings = [
      {
        id: `${docketNumber}-filing-1`,
        title: `Sample Filing 1 for Docket ${docketNumber}`,
        author: 'Test Organization',
        filing_type: 'Comment',
        date_received: '2024-01-15',
        filing_url: `https://ecfs.fcc.gov/filing/${docketNumber}-filing-1`
      },
      {
        id: `${docketNumber}-filing-2`,
        title: `Sample Filing 2 for Docket ${docketNumber}`,
        author: 'Consumer Advocacy Group',
        filing_type: 'Reply',
        date_received: '2024-01-16',
        filing_url: `https://ecfs.fcc.gov/filing/${docketNumber}-filing-2`
      },
      {
        id: `${docketNumber}-filing-3`,
        title: `Sample Filing 3 for Docket ${docketNumber}`,
        author: 'Industry Association',
        filing_type: 'Ex Parte',
        date_received: '2024-01-17',
        filing_url: `https://ecfs.fcc.gov/filing/${docketNumber}-filing-3`
      }
    ];

    const filingsToReturn = mockFilings.slice(0, limit);
    const duration = Date.now() - startTime;

    // In real implementation, we would also store these in the database
    // For testing, we'll just return the mock data
    
    return json({
      success: true,
      filingsFound: filingsToReturn.length,
      docketNumber,
      duration,
      sampleFiling: filingsToReturn[0] || null,
      filings: filingsToReturn,
      message: `Successfully fetched ${filingsToReturn.length} filings for docket ${docketNumber}`,
      note: 'This is mock data for testing purposes. In production, this would fetch from the actual ECFS API.'
    });

  } catch (error) {
    console.error('ECFS test error:', error);
    return json({ 
      error: 'Internal server error during ECFS test',
      details: error.message 
    }, { status: 500 });
  }
} 