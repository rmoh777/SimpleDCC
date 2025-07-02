import { json } from '@sveltejs/kit';
import { storeFilings, getFilingStats, getRecentFilings } from '$lib/storage/filing-storage.js';
import { createBatchProcessor } from '$lib/storage/batch-processor.js';
import { validateFiling, sanitizeFiling } from '$lib/storage/storage-utils.js'; 

export async function POST({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Sample ECFS filing data to test the storage system
    const sampleFilings = [
      {
        id: 'TEST2025010101',
        docket_number: '23-108',
        title: 'Comments on Open Internet Rules - Test Filing 1',
        author: 'Test Consumer Group',
        filing_type: 'comment',
        date_received: '2025-01-01T10:00:00Z',
        filing_url: 'https://www.fcc.gov/ecfs/search/search-filings/filing/TEST2025010101',
        documents: [
          {
            filename: 'test-comment-1.pdf',
            type: 'pdf',
            size: 125600
          }
        ],
        raw_data: {
          original_api_response: 'This would contain the full ECFS API response'
        },
        status: 'pending'
      },
      {
        id: 'TEST2025010102',
        docket_number: '23-108', 
        title: 'Reply Comments on Net Neutrality - Test Filing 2',
        author: 'Test ISP Association',
        filing_type: 'reply',
        date_received: '2025-01-01T14:30:00Z',
        filing_url: 'https://www.fcc.gov/ecfs/search/search-filings/filing/TEST2025010102',
        documents: [
          {
            filename: 'test-reply-2.pdf',
            type: 'pdf',
            size: 89300
          }
        ],
        raw_data: {
          original_api_response: 'This would contain the full ECFS API response'
        },
        status: 'pending'
      },
      {
        id: 'TEST2025010103',
        docket_number: '21-450',
        title: 'Comments on Broadband Labels - Test Filing 3',
        author: 'Test Tech Company',
        filing_type: 'comment',
        date_received: '2025-01-01T16:45:00Z',
        filing_url: 'https://www.fcc.gov/ecfs/search/search-filings/filing/TEST2025010103',
        documents: [],
        raw_data: {
          original_api_response: 'This would contain the full ECFS API response'
        },
        status: 'pending'
      }
    ];
    
    console.log('🧪 Testing Filing Storage System...');
    
    // Test 1: Validate and sanitize filings
    const validationResults = sampleFilings.map(filing => ({
      id: filing.id,
      validation: validateFiling(filing),
      sanitized: sanitizeFiling(filing)
    }));
    
    console.log('✅ Validation results:', validationResults.map(r => `${r.id}: ${r.validation.isValid ? 'VALID' : 'INVALID'}`));
    
    // Test 2: Store filings using the enhanced storage system
    const storageResult = await storeFilings(sampleFilings, db);
    console.log('💾 Storage result:', storageResult);
    
    // Test 3: Test batch processor with multiple dockets
    const docketFilingsMap = {
      '23-108': sampleFilings.filter(f => f.docket_number === '23-108'),
      '21-450': sampleFilings.filter(f => f.docket_number === '21-450')
    };
    
    const batchProcessor = createBatchProcessor(db);
    const batchResults = await batchProcessor.processDocketFilings(docketFilingsMap);
    console.log('📦 Batch processing results:', batchResults);
    
    // Test 4: Get comprehensive statistics
    const stats = await getFilingStats(db);
    console.log('📊 Filing statistics:', stats);
    
    // Test 5: Get recent filings with enhanced filtering
    const recentFilings = await getRecentFilings(db, {
      docketNumber: '23-108',
      limit: 5,
      hoursBack: 24
    });
    console.log('📋 Recent filings:', recentFilings.length);
    
    // Test 6: Try to store the same filings again (test deduplication)
    const duplicateTest = await storeFilings(sampleFilings, db);
    console.log('🔄 Duplicate test result:', duplicateTest);
    
    // Compile test results
    const testResults = {
      testName: 'Card B4: Filing Storage System Test',
      timestamp: new Date().toISOString(),
      results: {
        validation: {
          total: validationResults.length,
          valid: validationResults.filter(r => r.validation.isValid).length,
          invalid: validationResults.filter(r => !r.validation.isValid).length
        },
        storage: storageResult,
        batchProcessing: {
          docketsProcessed: Object.keys(batchResults).length,
          totalNewFilings: Object.values(batchResults).reduce((sum, r) => sum + r.newFilings, 0),
          totalDuplicates: Object.values(batchResults).reduce((sum, r) => sum + r.duplicates, 0)
        },
        statistics: stats,
        recentFilings: recentFilings.length,
        deduplication: {
          duplicatesDetected: duplicateTest.duplicates,
          newFilingsOnRetest: duplicateTest.newFilings
        }
      },
      success: true,
      message: 'Filing storage system test completed successfully'
    };
    
    return json(testResults);
    
  } catch (error) {
    console.error('❌ Filing storage test failed:', error);
    return json({ 
      testName: 'Card B4: Filing Storage System Test',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 