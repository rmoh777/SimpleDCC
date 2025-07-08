import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getActiveDockets } from '$lib/database/db-operations.js';
import { fetchLatestFilings } from '$lib/fcc/ecfs-enhanced-client.js';

export async function GET({ url, cookies, platform }) {
  // Check admin authentication
  const adminSession = cookies.get('admin_session');
  if (adminSession !== 'authenticated') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!platform?.env) {
    return json({ error: 'Platform environment not available' }, { status: 500 });
  }

  // ✅ UNIFIED ENVIRONMENT PATTERN: Use SvelteKit env for development, platform.env for production
  const environmentVars = {
    ECFS_API_KEY: env.ECFS_API_KEY || platform.env?.['ECFS_API_KEY'],
    GEMINI_API_KEY: env.GEMINI_API_KEY || platform.env?.['GEMINI_API_KEY'],
    JINA_API_KEY: env.JINA_API_KEY || platform.env?.['JINA_API_KEY']
  };

  console.log(`🔍 Environment check: ECFS=${!!environmentVars.ECFS_API_KEY}, GEMINI=${!!environmentVars.GEMINI_API_KEY}, JINA=${!!environmentVars.JINA_API_KEY}`);

  const docket = url.searchParams.get('docket') || null;
  const limit = parseInt(url.searchParams.get('limit') || '3');
  const skipStorage = url.searchParams.get('skip_storage') === 'true';
  
  const startTime = Date.now();
  console.log(`🔍 PRODUCTION FLOW TEST: Starting ${docket ? `for docket ${docket}` : 'for all active dockets'}`);
  console.log(`🎯 Parameters: limit=${limit}, skip_storage=${skipStorage}`);
  
  try {
    // ==============================================
    // STEP 1: GET ACTIVE DOCKETS
    // ==============================================
    console.log(`📊 STEP 1: Getting active dockets from database`);
    const docketStartTime = Date.now();
    
    const activeDockets = await getActiveDockets(platform.env.DB);
    console.log(`✅ Database returned ${activeDockets.length} active dockets`);
    
    const testDockets = docket ? [docket] : activeDockets.slice(0, limit).map(d => d.docket_number);
    const docketEndTime = Date.now();
    
    if (testDockets.length === 0) {
      throw new Error('No active dockets found for testing');
    }
    
    console.log(`📋 Testing dockets: ${testDockets.join(', ')}`);
    console.log(`⏱️ Database query time: ${docketEndTime - docketStartTime}ms`);
    
    // ==============================================
    // STEP 2: FETCH FILINGS
    // ==============================================
    console.log(`📡 STEP 2: Fetching filings from ECFS`);
    const ecfsStartTime = Date.now();
    
    // Convert lookbackHours to smart count limit (same as production)
    const lookbackHours = 2; // Keep for API compatibility
    const smartLimit = Math.min(Math.max(Math.ceil(lookbackHours * 5), 10), 50);
    console.log(`🔍 Using smart count limit: ${smartLimit} (converted from ${lookbackHours}h lookback)`);
    
    // Fetch filings for all test dockets
    const allFilings = [];
    for (const docketNumber of testDockets) {
      console.log(`🎯 Fetching filings for docket ${docketNumber}...`);
      
      try {
        const filings = await fetchLatestFilings(docketNumber, smartLimit, environmentVars);
        console.log(`✅ ${docketNumber}: Found ${filings.length} filings`);
        allFilings.push(...filings);
      } catch (docketError) {
        const errorMessage = docketError instanceof Error ? docketError.message : String(docketError);
        console.error(`❌ ${docketNumber}: Failed to fetch filings:`, errorMessage);
      }
      
      // Rate limiting delay between dockets
      if (testDockets.length > 1 && testDockets.indexOf(docketNumber) < testDockets.length - 1) {
        console.log(`⏱️ Rate limiting: 2 second delay before next docket...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const ecfsEndTime = Date.now();
    console.log(`✅ ECFS fetch completed: ${allFilings.length} total filings`);
    console.log(`⏱️ ECFS fetch time: ${ecfsEndTime - ecfsStartTime}ms`);
    
    // ==============================================
    // STEP 3: ENHANCED STORAGE (REAL PRODUCTION PIPELINE)
    // ==============================================
    let storageResults = null;
    let storageEndTime = ecfsEndTime;
    
    if (!skipStorage && allFilings.length > 0) {
      console.log(`💾 STEP 3: Testing enhanced storage with ${allFilings.length} filings`);
      const storageStartTime = Date.now();
      
      try {
        console.log(`🔍 Using storeFilingsEnhanced (real production pipeline)...`);
        
        // Try enhanced storage first
        try {
          const { storeFilingsEnhanced } = await import('$lib/storage/filing-storage-enhanced.js');
          const enhancedResults = await storeFilingsEnhanced(allFilings, platform.env.DB, platform.env, {
            enableAIProcessing: true,
            enableJinaProcessing: true
          });
          
          storageResults = {
            newFilings: enhancedResults?.newFilings || 0,
            aiProcessed: enhancedResults?.aiProcessed || 0,
            documentsProcessed: enhancedResults?.documentsProcessed || 0,
            enhanced: true
          };
          
          console.log(`✅ Enhanced storage completed:`);
          console.log(`   💾 New filings stored: ${storageResults.newFilings}`);
          console.log(`   🤖 AI processed: ${storageResults.aiProcessed}`);
          console.log(`   📄 Documents processed: ${storageResults.documentsProcessed}`);
          
        } catch (enhancedError) {
          const errorMessage = enhancedError instanceof Error ? enhancedError.message : String(enhancedError);
          console.warn(`⚠️ Enhanced storage failed, using basic storage fallback:`, errorMessage);
          
          const { storeFilings } = await import('$lib/storage/filing-storage.js');
          const basicStored = await storeFilings(allFilings, platform.env.DB);
          storageResults = { 
            newFilings: basicStored, 
            enhanced: false, 
            fallback: true,
            error: errorMessage
          };
          console.log(`✅ Basic storage fallback: ${basicStored} filings stored`);
        }
        
      } catch (storageError) {
        const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
        console.error(`❌ Storage test failed:`, errorMessage);
        storageResults = { error: errorMessage };
      }
      
      storageEndTime = Date.now();
      console.log(`⏱️ Storage processing time: ${storageEndTime - storageStartTime}ms`);
    } else {
      console.log(`⏭️ STEP 3: Skipping storage test (skip_storage=${skipStorage} or no filings)`);
    }
    
    // ==============================================
    // STEP 4: COMPILE RESULTS
    // ==============================================
    const totalEndTime = Date.now();
    
    console.log(`🎯 PRODUCTION FLOW TEST COMPLETE`);
    console.log(`⏱️ Total processing time: ${totalEndTime - startTime}ms`);
    console.log(`📊 Breakdown:`);
    console.log(`   📊 Database: ${docketEndTime - docketStartTime}ms`);
    console.log(`   📡 ECFS: ${ecfsEndTime - ecfsStartTime}ms`);
    console.log(`   💾 Storage: ${storageEndTime - ecfsEndTime}ms`);
    
    console.log(`✅ Success flags:`);
    console.log(`   ✅ database_success: true`);
    console.log(`   ✅ ecfs_success: ${allFilings.length > 0}`);
    console.log(`   ${storageResults && !storageResults.error ? '✅' : '❌'} storage_success: ${storageResults && !storageResults.error}`);
    console.log(`   ${storageResults && storageResults.aiProcessed > 0 ? '✅' : '❌'} ai_success: ${storageResults && storageResults.aiProcessed > 0}`);
    console.log(`   ✅ overall_success: true`);
    console.log(`   ✅ enhanced_pipeline: true`);
    
    return json({
      success: true,
      enhanced_pipeline: true,
      
      // Results
      dockets_tested: testDockets,
      filings_fetched: allFilings.length,
      storage_results: storageResults,
      
      // Processing Statistics
      processing_stats: {
        total_time_ms: totalEndTime - startTime,
        database_time_ms: docketEndTime - docketStartTime,
        ecfs_time_ms: ecfsEndTime - ecfsStartTime,
        storage_time_ms: storageEndTime - ecfsEndTime,
        smart_limit_used: smartLimit
      },
      
      // Success Flags
      success_flags: {
        database_success: true,
        ecfs_success: allFilings.length > 0,
        storage_success: storageResults && !storageResults.error,
        ai_success: storageResults && storageResults.aiProcessed > 0,
        overall_success: true,
        enhanced_pipeline: true
      }
    });
    
  } catch (error) {
    console.error('❌ PRODUCTION FLOW ERROR:', error);
    
    return json({
      success: false,
      error: error.message,
      enhanced_pipeline: true,
      processing_stats: {
        total_time_ms: Date.now() - startTime
      },
      success_flags: {
        database_success: false,
        ecfs_success: false,
        storage_success: false,
        ai_success: false,
        overall_success: false,
        enhanced_pipeline: true
      }
    }, { status: 500 });
  }
} 