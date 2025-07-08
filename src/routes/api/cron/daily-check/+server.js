import { env } from '$env/dynamic/private';
import { getActiveDockets } from '$lib/database/db-operations.js';
import { fetchLatestFilings } from '$lib/fcc/ecfs-enhanced-client.js';
import { generateEnhancedSummary } from '$lib/ai/gemini-enhanced.js';
import { getETTimeInfo, getProcessingStrategy, getNextProcessingTime } from '$lib/utils/timezone.js';

// Enhanced-only cron processing - using same pipeline as production test
export async function POST({ platform, request }) {
  if (!platform?.env) {
    return new Response('Platform environment not available', { status: 500 });
  }

  const cronSecret = platform.env?.['CRON_SECRET'] || env.CRON_SECRET;
  const providedSecret = request.headers.get('X-Cron-Secret');
  
  if (cronSecret !== providedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const startTime = Date.now();
    
    // NEW: Add timezone intelligence
    const timeInfo = getETTimeInfo();
    const strategy = getProcessingStrategy();
    
    console.log(`🚀 Starting enhanced cron check...`);
    console.log(`🕐 Cron triggered: ${timeInfo.etHour}:00 ET (DST: ${timeInfo.isDST})`);
    console.log(`📋 Processing strategy: ${strategy.processingType}`);
    
    // NEW: Skip processing during quiet hours
    if (!strategy.shouldProcess) {
      console.log(`😴 Quiet hours - skipping processing until ${getNextProcessingTime()}`);
      
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'info', 'Cron skipped (quiet hours)', 'cron', {
        et_hour: timeInfo.etHour,
        is_dst: timeInfo.isDST,
        next_processing: getNextProcessingTime()
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'quiet_hours',
        et_hour: timeInfo.etHour,
        next_processing: getNextProcessingTime()
      }));
    }
    
    // ✅ FIXED UNIFIED ENVIRONMENT PATTERN: Use SvelteKit env for development, platform.env for production
    const environmentVars = {
      ECFS_API_KEY: env.ECFS_API_KEY || platform.env?.['ECFS_API_KEY'],
      GEMINI_API_KEY: env.GEMINI_API_KEY || platform.env?.['GEMINI_API_KEY'],
      JINA_API_KEY: env.JINA_API_KEY || platform.env?.['JINA_API_KEY']
    };

    console.log(`🔍 CRON Environment check: ECFS=${!!environmentVars.ECFS_API_KEY}, GEMINI=${!!environmentVars.GEMINI_API_KEY}, JINA=${!!environmentVars.JINA_API_KEY}`);
    
    // ==============================================
    // STEP 1: GET ACTIVE DOCKETS
    // ==============================================
    console.log('📊 STEP 1: Getting active dockets from database...');
    const activeDockets = await getActiveDockets(platform.env.DB);
    const docketNumbers = activeDockets.map(d => d.docket_number);
    
    if (docketNumbers.length === 0) {
      console.log('✅ No active dockets to check');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active dockets to check',
        enhanced: true,
        processing_time_ms: Date.now() - startTime
      }));
    }
    
    console.log(`📋 Found ${docketNumbers.length} active dockets`);
    
    // NEW: Use strategy-based limits instead of hardcoded ones
    const maxDockets = strategy.batchSize;
    const maxFilingsPerDocket = strategy.lookbackHours > 4 ? 5 : 3; // More filings for catch-up
    const testDockets = docketNumbers.slice(0, maxDockets);
    
    console.log(`🎯 Processing ${testDockets.length}/${docketNumbers.length} dockets (${strategy.processingType})`);
    console.log(`🎯 Dockets: ${testDockets.join(', ')}`);
    
    // ==============================================
    // STEP 2: SEQUENTIAL ENHANCED PROCESSING
    // ==============================================
    console.log('📡 STEP 2: Sequential enhanced processing with rate limiting...');
    
    // NEW: Use strategy-based lookback logic
    const lookbackHours = strategy.lookbackHours;
    const smartLimit = Math.min(Math.max(Math.ceil(lookbackHours * 5), 10), 50);
    console.log(`🔍 Using smart count limit: ${smartLimit} (converted from ${lookbackHours}h lookback, ${strategy.processingType})`);
    
    const processingResults = [];
    const allProcessedFilings = [];
    let totalProcessingTime = 0;
    
    // Process each docket sequentially with rate limiting (same as production test)
    for (const docketNumber of testDockets) {
      const docketStartTime = Date.now();
      console.log(`🎯 Processing docket ${docketNumber}...`);
      
      try {
        // Use same function call as test-document-flow and production test
        const filings = await fetchLatestFilings(docketNumber, smartLimit, environmentVars);
        
        console.log(`✅ ${docketNumber}: Found ${filings.length} filings`);
        
        if (filings.length === 0) {
          processingResults.push({
            docket: docketNumber,
            filings_found: 0,
            filings_processed: 0,
            processing_successful: 0,
            success: true,
            message: 'No filings found'
          });
          continue;
        }
        
        // Process filings with documents (same logic as production test)
        const processedFilings = [];
        const filingsToProcess = filings.slice(0, maxFilingsPerDocket);
        
        for (const filing of filingsToProcess) {
          if (filing.documents?.length > 0) {
            console.log(`📄 Processing filing ${filing.id} with ${filing.documents.length} documents...`);
            
            try {
              // Process first document (same as production test)
              const testDocument = filing.documents[0];
              const jinaResults = await processWithJinaFullDebug(testDocument.src, environmentVars);
              
              // Generate AI summary (same as production test)
              const enhancedFiling = {
                ...filing,
                documents: [{
                  ...testDocument,
                  text_content: jinaResults.final_text,
                  processing_method: jinaResults.strategy
                }]
              };
              
              const geminiResults = await generateEnhancedSummaryWithDebug(
                enhancedFiling, 
                [jinaResults.final_text], 
                environmentVars
              );
              
              processedFilings.push({
                ...filing,
                jina_results: jinaResults,
                gemini_results: geminiResults,
                processing_success: true
              });
              
              console.log(`✅ ${filing.id}: Processed successfully`);
              
            } catch (processingError) {
              const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
              console.error(`❌ ${filing.id}: Processing failed:`, errorMessage);
              processedFilings.push({
                ...filing,
                processing_error: errorMessage,
                processing_success: false
              });
            }
          } else {
            console.log(`⏭️ ${filing.id}: No documents, skipping AI processing`);
            processedFilings.push({
              ...filing,
              processing_success: false,
              processing_skip_reason: 'No documents'
            });
          }
        }
        
        allProcessedFilings.push(...processedFilings);
        
        const docketEndTime = Date.now();
        const docketProcessingTime = docketEndTime - docketStartTime;
        totalProcessingTime += docketProcessingTime;
        
        processingResults.push({
          docket: docketNumber,
          filings_found: filings.length,
          filings_processed: processedFilings.length,
          processing_successful: processedFilings.filter(f => f.processing_success).length,
          processing_time_ms: docketProcessingTime,
          success: true
        });
        
        console.log(`✅ ${docketNumber}: Completed in ${docketProcessingTime}ms`);
        
        // Rate limiting delay (as specified by engineering director)
        if (testDockets.length > 1 && testDockets.indexOf(docketNumber) < testDockets.length - 1) {
          console.log(`⏱️ Rate limiting: 2 second delay before next docket...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (docketError) {
        const errorMessage = docketError instanceof Error ? docketError.message : String(docketError);
        console.error(`❌ ${docketNumber}: Failed processing:`, errorMessage);
        
        processingResults.push({
          docket: docketNumber,
          error: errorMessage,
          success: false
        });
      }
    }
    
    // ==============================================
    // STEP 3: ENHANCED STORAGE
    // ==============================================
    console.log('💾 STEP 3: Enhanced storage processing...');
    let storageResults = null;
    
    if (allProcessedFilings.length > 0) {
      console.log(`🔍 Storing ${allProcessedFilings.length} processed filings...`);
      
      try {
        // Try enhanced storage first (same as production test)
        try {
          const { storeFilingsEnhanced } = await import('$lib/storage/filing-storage-enhanced.js');
          const enhancedResults = await storeFilingsEnhanced(allProcessedFilings, platform.env.DB, platform.env, {
            enableAIProcessing: true,
            enableJinaProcessing: true
          });
          
          storageResults = {
            newFilings: enhancedResults?.newFilings || 0,
            aiProcessed: enhancedResults?.aiProcessed || 0,
            documentsProcessed: enhancedResults?.documentsProcessed || 0,
            enhanced: true
          };
          
          console.log(`✅ Enhanced storage: ${storageResults.newFilings} new filings, ${storageResults.aiProcessed} AI processed`);
          
        } catch (enhancedError) {
          const errorMessage = enhancedError instanceof Error ? enhancedError.message : String(enhancedError);
          console.warn(`⚠️ Enhanced storage failed, using basic storage fallback:`, errorMessage);
          
          const { storeFilingsEnhanced } = await import('$lib/storage/filing-storage-enhanced.js');
          const basicStored = await storeFilingsEnhanced(allProcessedFilings, platform.env.DB, platform.env);
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
        console.error(`❌ Storage failed:`, errorMessage);
        storageResults = { error: errorMessage };
      }
    } else {
      console.log('⏭️ No processed filings to store');
      storageResults = { newFilings: 0, message: 'No processed filings to store' };
    }
    
    // ==============================================
    // STEP 4: COMPLETE NOTIFICATION QUEUE PROCESSING
    // ==============================================
    console.log(`⏭️ STEP 4: Processing notification queue and sending digests`);
    const digestResults = await processNotificationQueue(platform.env, timeInfo, strategy);
    
    // ==============================================
    // STEP 5: LOGGING AND RESULTS
    // ==============================================
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`🎯 ENHANCED CRON COMPLETE`);
    console.log(`⏱️ Total processing time: ${totalTime}ms`);
    console.log(`📊 Summary:`);
    console.log(`   📋 Dockets checked: ${testDockets.length}/${docketNumbers.length}`);
    console.log(`   📄 Filings processed: ${allProcessedFilings.length}`);
    console.log(`   ✅ Successfully processed: ${allProcessedFilings.filter(f => f.processing_success).length}`);
    console.log(`   💾 New filings stored: ${storageResults?.newFilings || 0}`);
    console.log(`   🤖 AI processed: ${storageResults?.aiProcessed || 0}`);
    
    // Enhanced logging with timezone and strategy info
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'info', 'Enhanced cron check completed', 'cron', {
        processing_type: strategy.processingType,
        et_hour: timeInfo.etHour,
        is_dst: timeInfo.isDST,
        dockets_checked: testDockets.length,
        total_dockets: docketNumbers.length,
        filings_processed: allProcessedFilings.length,
        new_filings: storageResults?.newFilings || 0,
        ai_processed: storageResults?.aiProcessed || 0,
        documents_processed: storageResults?.documentsProcessed || 0,
        emails_sent: digestResults.sent,
        duration_ms: totalTime,
        enhanced: true,
        sequential_processing: true,
        rate_limited: true
      });
    } catch (logError) {
      console.error('Failed to log cron success:', logError);
    }
    
    console.log(`✅ Enhanced cron complete: ${storageResults?.newFilings || 0} new filings, ${digestResults.sent} emails sent`);
    
    // Return comprehensive results
    const result = {
      success: true,
      enhanced: true,
      sequential_processing: true,
      rate_limited: true,
      
      // NEW: Timezone and Strategy Info
      processing_type: strategy.processingType,
      et_hour: timeInfo.etHour,
      is_dst: timeInfo.isDST,
      next_processing: getNextProcessingTime(),
      
      // Processing Summary
      dockets_checked: testDockets.length,
      total_active_dockets: docketNumbers.length,
      filings_processed: allProcessedFilings.length,
      successfully_processed: allProcessedFilings.filter(f => f.processing_success).length,
      
      // Storage Results
      new_filings: storageResults?.newFilings || 0,
      ai_processed: storageResults?.aiProcessed || 0,
      documents_processed: storageResults?.documentsProcessed || 0,
      storage_enhanced: storageResults?.enhanced === true,
      
      // Digest Results
      emails_sent: digestResults?.sent || 0,
      digest_errors: digestResults?.errors || [],
      
      // Performance Metrics
      processing_time_ms: totalTime,
      ecfs_processing_time_ms: totalProcessingTime,
      smart_limit_used: smartLimit,
      
      // Detailed Results
      docket_results: processingResults,
      storage_results: storageResults,
      digest_results: digestResults
    };
    
    return new Response(JSON.stringify(result));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Enhanced cron job failed:', errorMessage);
    
    // Enhanced error handling with timezone context
    const timeInfo = getETTimeInfo();
    try {
      const { logSystemEvent } = await import('$lib/database/db-operations.js');
      await logSystemEvent(platform.env.DB, 'error', 'Enhanced cron check failed', 'cron', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : '',
        et_hour: timeInfo.etHour,
        is_dst: timeInfo.isDST,
        enhanced: true
      });
    } catch (logError) {
      console.error('Failed to log cron error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      et_hour: timeInfo.etHour,
      enhanced: true,
      processing_time_ms: Date.now() - startTime
    }), { status: 500 });
  }
}

// NEW: Complete Step 4 implementation - notification queue processing
async function processNotificationQueue(env, timeInfo, strategy) {
  try {
    console.log(`📧 Processing notifications for ${strategy.processingType} at ${timeInfo.etHour}:00 ET`);
    
    let emailsSent = 0;
    const errors = [];
    
    // Import the existing notification queue processor
    const { processNotificationQueue: processQueue } = await import('$lib/notifications/queue-processor.js');
    
    // Process notifications using the existing queue system
    const queueResults = await processQueue(env.DB, env);
    
    emailsSent = queueResults.sent;
    if (queueResults.errors && queueResults.errors.length > 0) {
      errors.push(...queueResults.errors);
    }
    
    console.log(`📧 Notification processing complete: ${emailsSent} emails sent, ${errors.length} errors`);
    
    return {
      sent: emailsSent,
      errors: errors,
      processed: queueResults.processed || 0,
      failed: queueResults.failed || 0,
      message: `Processed ${queueResults.processed || 0} notifications, sent ${emailsSent} emails`
    };
    
  } catch (error) {
    console.error('❌ Notification queue processing failed:', error);
    return {
      sent: 0,
      errors: [error.message],
      processed: 0,
      failed: 1,
      message: 'Notification processing failed'
    };
  }
}

/**
 * Process document with Jina API - exact same function as production test
 */
async function processWithJinaFullDebug(htmlUrl, environmentVars) {
  const jinaApiKey = environmentVars.JINA_API_KEY;
  if (!jinaApiKey) {
    throw new Error('JINA_API_KEY not configured');
  }
  
  console.log(`🔍 JINA CRON: Processing ${htmlUrl.substring(0, 80)}...`);
  
  // Use the CORRECT JSON mode approach from Jina docs
  const response = await fetch('https://r.jina.ai/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jinaApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Engine': 'browser',
      'X-Timeout': '30'
    },
    body: JSON.stringify({ url: htmlUrl })
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.data?.content || '';
  
  if (!content) {
    throw new Error('No content returned from Jina API');
  }
  
  console.log(`✅ JINA CRON: Successfully extracted ${content.length} characters`);
  
  // Sanitize text to remove any artifacts
  const sanitizedText = content.replace(/undefined/g, '');
  
  return {
    strategy: 'jina_json_mode',
    total_chunks: 1,
    successful_parses: 1,
    final_text_length: content.length,
    sanitized_text_length: sanitizedText.length,
    final_text: sanitizedText,
    chunk_details: [{
      content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      size: content.length,
      success: true
    }],
    jina_response: {
      code: result.code,
      status: result.status,
      title: result.data?.title,
      url: result.data?.url
    }
  };
}

/**
 * Generate enhanced summary with debugging - exact same function as production test
 */
async function generateEnhancedSummaryWithDebug(filing, documentTexts, environmentVars) {
  console.log(`🤖 GEMINI CRON: Processing filing ${filing.id}...`);
  
  // Use the Gemini AI directly (same as production test)
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(environmentVars.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = buildPromptForCron(filing, documentTexts);
    
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    
    console.log(`✅ GEMINI CRON: Generated ${rawResponse.length} characters`);
    
    // Parse the response (same as production test)
    const parsed = parseStructuredSummary(rawResponse);
    
    return {
      prompt: prompt,
      raw_response: rawResponse,
      parsed: parsed
    };
    
  } catch (error) {
    console.error('❌ GEMINI CRON: Error:', error);
    throw error;
  }
}

/**
 * Build enhanced prompt for cron - streamlined version
 */
function buildPromptForCron(filing, documentTexts) {
  const hasDocuments = documentTexts.length > 0;
  
  let prompt = `
Analyze this FCC filing and provide a comprehensive regulatory intelligence summary:

FILING METADATA:
- ID: ${filing.id}
- Docket: ${filing.docket_number}
- Title: ${filing.title}
- Author/Filer: ${filing.author}
- Filing Type: ${filing.filing_type}
- Date: ${filing.date_received}
- Organization: ${filing.submitter_info?.organization || 'Not specified'}

`;

  if (hasDocuments) {
    prompt += `
DOCUMENT CONTENT ANALYSIS:
The following document content was extracted and should be analyzed for key insights:

`;
    documentTexts.forEach((text, index) => {
      prompt += `
Document ${index + 1} (${text.length} characters):
${text.substring(0, 6000)}${text.length > 6000 ? '\n... [truncated for length]' : ''}

`;
    });
  }

  prompt += `
Please provide a structured analysis in the following format:

SUMMARY:
[2-3 sentence executive summary of the filing's purpose and key message]

KEY_POINTS:
- [Most important regulatory point]
- [Second most important point]  
- [Third most important point]

REGULATORY_IMPACT:
- Scope: [Broad/narrow impact]
- Timeline: [Immediate/future implications]
- Precedent: [Sets new precedent or follows existing]

CONFIDENCE: [High/Medium/Low - based on available information]

Focus on regulatory implications and policy impacts.
`;

  return prompt;
}

/**
 * Parse structured AI response - same as production test
 */
function parseStructuredSummary(rawSummary) {
  try {
    const sections = {};
    
    // Extract sections using markers
    const sectionPatterns = {
      summary: /SUMMARY:\s*(.*?)(?=KEY_POINTS:|$)/s,
      key_points: /KEY_POINTS:\s*(.*?)(?=REGULATORY_IMPACT:|$)/s,
      regulatory_impact: /REGULATORY_IMPACT:\s*(.*?)(?=CONFIDENCE:|$)/s,
      confidence: /CONFIDENCE:\s*(.*?)$/s
    };
    
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      const match = rawSummary.match(pattern);
      if (match) {
        sections[section] = match[1].trim();
      }
    }
    
    // Parse key points into array
    if (sections.key_points) {
      sections.key_points = sections.key_points
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(point => point.length > 0);
    }
    
    return {
      summary: sections.summary || 'Summary not available',
      key_points: sections.key_points || [],
      regulatory_impact: sections.regulatory_impact || 'Impact analysis not available',
      confidence: sections.confidence || 'Medium'
    };
    
  } catch (error) {
    console.error('❌ Error parsing structured summary:', error);
    return {
      summary: rawSummary,
      key_points: [],
      regulatory_impact: 'Parse error',
      confidence: 'Low'
    };
  }
} 