import { json } from '@sveltejs/kit';

export async function GET({ platform, cookies }) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    // const adminSession = cookies.get('admin_session');
    // if (adminSession !== 'authenticated') {
    //   return json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🔑 Testing Gemini API key...');

    // Test the API key directly with a simple HTTP request
    const apiKey = platform.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No API key found in environment variables');
      return json({
        success: false,
        error: 'GEMINI_API_KEY not found in environment variables',
        debug: {
          env_keys: Object.keys(platform.env || {})
        }
      });
    }

    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Test with direct fetch (no package dependency)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    console.log('📡 Making request to Gemini API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Test: Say hello and confirm this API key works"
          }]
        }]
      })
    });

    console.log(`📥 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API request failed: ${errorText}`);
      return json({
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('✅ API request successful!');
    
    return json({
      success: true,
      message: 'Gemini API key is working!',
      api_response: {
        text: result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text',
        usage: result.usageMetadata || 'No usage data'
      },
      configuration: {
        api_key_present: true,
        api_key_length: apiKey.length,
        api_key_prefix: apiKey.substring(0, 10) + '...'
      }
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return json({
      success: false,
      error: error.message,
      type: 'fetch_error'
    }, { status: 500 });
  }
} 