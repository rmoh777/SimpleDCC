import { json } from '@sveltejs/kit';
import { getEnvVar } from '$lib/utils/env-loader.js';

export async function GET({ platform }) {
  try {
    // Test custom environment loader
    const geminiKeyFromLoader = getEnvVar(platform.env, 'GEMINI_API_KEY');
    
    return json({
      platform_env: {
        gemini_key_exists: !!platform.env?.GEMINI_API_KEY,
        gemini_key_length: platform.env?.GEMINI_API_KEY?.length || 0,
        gemini_key_preview: platform.env?.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not found',
        all_platform_keys: Object.keys(platform.env || {})
      },
      process_env: {
        gemini_key_exists: !!process.env?.GEMINI_API_KEY,
        gemini_key_length: process.env?.GEMINI_API_KEY?.length || 0,
        gemini_key_preview: process.env?.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not found',
        node_env: process.env.NODE_ENV
      },
      custom_loader: {
        gemini_key_exists: !!geminiKeyFromLoader,
        gemini_key_length: geminiKeyFromLoader?.length || 0,
        gemini_key_preview: geminiKeyFromLoader?.substring(0, 10) + '...' || 'Not found',
        loader_working: !!geminiKeyFromLoader
      }
    });
    
  } catch (error) {
    return json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 