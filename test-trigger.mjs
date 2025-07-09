// File: test-trigger.mjs
// Universal script to test the LIVE production worker with the CORRECT URL.

import 'dotenv/config'; 
import fetch from 'node-fetch';

// --- Configuration ---
// CORRECTED URL based on your Cloudflare dashboard output.
const workerUrl = 'https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev/manual-trigger';
const secret = process.env.CRON_SECRET;
const docketToTest = '11-42'; // Using a reliable docket for the first test
// ---------------------

if (!secret) {
  console.error('\n❌ ERROR: CRON_SECRET is not set!');
  console.log('Please ensure your root .env file contains the line: CRON_SECRET="your_secret"\n');
  process.exit(1);
}

async function runTest() {
  console.log(`🚀 Sending test trigger to the correct production URL:`);
  console.log(`   ${workerUrl}`);
  console.log(`📋 Testing Docket: ${docketToTest}`);
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret,
      },
      body: JSON.stringify({ docket: docketToTest }),
    });

    console.log(`\n✅ HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('❌ Test Failed. Server Response:');
      const errorText = await response.text();
      console.error(errorText);
      return;
    }

    console.log('\n✅ Test Succeeded! Full Pipeline Log from Production:');
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR: Could not connect to the worker.');
    console.error('   Please double-check the worker URL and your internet connection.');
    console.error('   Error Details:', error.message);
  }
}

runTest(); 