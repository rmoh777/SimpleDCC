import { json } from '@sveltejs/kit';

export async function POST({ request, cookies, platform }) {
  try {
    // Check admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      docketNumber, 
      userEmail, 
      userTier, 
      filingLimit = 5, 
      simulateFailure = false 
    } = await request.json();
    
    if (!docketNumber || !userEmail || !userTier) {
      return json({ error: 'docketNumber, userEmail, and userTier are required' }, { status: 400 });
    }

    const startTime = Date.now();
    const steps = [];
    
    try {
      // Step 1: ECFS Fetching
      const ecfsStart = Date.now();
      if (simulateFailure && Math.random() < 0.3) {
        steps.push({
          name: 'ECFS Data Fetching',
          success: false,
          duration: Date.now() - ecfsStart,
          error: 'Simulated ECFS API failure'
        });
        throw new Error('ECFS fetching failed (simulated)');
      }
      
      const mockFilings = Array.from({ length: filingLimit }, (_, i) => ({
        id: `${docketNumber}-filing-${i + 1}`,
        title: `Sample Filing ${i + 1} for Docket ${docketNumber}`,
        author: `Test Organization ${i + 1}`,
        filing_type: ['Comment', 'Reply', 'Ex Parte'][i % 3],
        date_received: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      
      steps.push({
        name: 'ECFS Data Fetching',
        success: true,
        duration: Date.now() - ecfsStart,
        details: `Found ${mockFilings.length} filings`
      });

      // Step 2: Document Processing (Jina)
      const jinaStart = Date.now();
      if (simulateFailure && Math.random() < 0.2) {
        steps.push({
          name: 'Document Processing (Jina)',
          success: false,
          duration: Date.now() - jinaStart,
          error: 'Simulated Jina API failure'
        });
        throw new Error('Jina processing failed (simulated)');
      }
      
      steps.push({
        name: 'Document Processing (Jina)',
        success: true,
        duration: Date.now() - jinaStart,
        details: 'Extracted text from documents'
      });

      // Step 3: AI Analysis (Gemini)
      const geminiStart = Date.now();
      if (simulateFailure && Math.random() < 0.2) {
        steps.push({
          name: 'AI Analysis (Gemini)',
          success: false,
          duration: Date.now() - geminiStart,
          error: 'Simulated Gemini API failure'
        });
        throw new Error('Gemini analysis failed (simulated)');
      }
      
      steps.push({
        name: 'AI Analysis (Gemini)',
        success: true,
        duration: Date.now() - geminiStart,
        details: 'Generated summaries and analysis'
      });

      // Step 4: Queue Entry Creation
      const queueStart = Date.now();
      const queueId = `queue-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      steps.push({
        name: 'Queue Entry Creation',
        success: true,
        duration: Date.now() - queueStart,
        details: `Created queue entry ${queueId}`
      });

      // Step 5: Email Generation
      const emailStart = Date.now();
      const emailData = {
        free: { features: ['Basic metadata', 'Upgrade prompts'], length: 2500 },
        trial: { features: ['Full AI summary', 'Trial reminder'], length: 4200 },
        pro: { features: ['Full AI summary', 'Complete analysis'], length: 4500 }
      };
      
      steps.push({
        name: 'Email Generation',
        success: true,
        duration: Date.now() - emailStart,
        details: `Generated ${userTier} tier email (${emailData[userTier]?.length || 2500} chars)`
      });

      // Step 6: Email Delivery
      const deliveryStart = Date.now();
      if (simulateFailure && Math.random() < 0.1) {
        steps.push({
          name: 'Email Delivery',
          success: false,
          duration: Date.now() - deliveryStart,
          error: 'Simulated email delivery failure'
        });
        throw new Error('Email delivery failed (simulated)');
      }
      
      steps.push({
        name: 'Email Delivery',
        success: true,
        duration: Date.now() - deliveryStart,
        details: `Email sent to ${userEmail}`
      });

      const totalDuration = Date.now() - startTime;
      const successfulSteps = steps.filter(s => s.success).length;

      return json({
        success: true,
        docketNumber,
        userEmail,
        userTier,
        filingLimit,
        totalDuration,
        stepsCompleted: successfulSteps,
        totalSteps: steps.length,
        steps,
        summary: `Successfully completed full pipeline test:\n✅ Found ${mockFilings.length} filings\n✅ Processed documents with Jina\n✅ Generated AI analysis with Gemini\n✅ Created queue entry\n✅ Generated ${userTier} tier email\n✅ Delivered email to ${userEmail}\n\nTotal time: ${totalDuration}ms`,
        note: 'This is a mock pipeline test for testing purposes. In production, this would execute the actual cron-worker pipeline.'
      });

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      return json({
        success: false,
        docketNumber,
        userEmail,
        userTier,
        totalDuration,
        stepsCompleted: steps.filter(s => s.success).length,
        totalSteps: steps.length,
        steps,
        error: error.message,
        summary: `Pipeline test failed at step ${steps.length}:\n${error.message}\n\nCompleted ${steps.filter(s => s.success).length}/${steps.length} steps in ${totalDuration}ms`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Pipeline test error:', error);
    return json({ 
      error: 'Internal server error during pipeline test',
      details: error.message 
    }, { status: 500 });
  }
} 