import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
  try {
    console.log('🔍 Testing SvelteKit native env vs process.env...');
    console.log('SvelteKit env.GEMINI_API_KEY:', !!env.GEMINI_API_KEY);
    console.log('Process env.GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
    console.log('All process.env keys:', Object.keys(process.env));
    
    return json({
      success: true,
      sveltekit_env: {
        gemini_key_exists: !!env.GEMINI_API_KEY,
        gemini_key_preview: env.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not found'
      },
      process_env: {
        gemini_key_exists: !!process.env.GEMINI_API_KEY,
        gemini_key_preview: process.env.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not found'
      },
      comparison: {
        both_exist: !!env.GEMINI_API_KEY && !!process.env.GEMINI_API_KEY,
        values_match: env.GEMINI_API_KEY === process.env.GEMINI_API_KEY
      },
      all_env_keys: Object.keys(process.env).filter(key => 
        key.includes('GEMINI') || 
        key.includes('API') || 
        key.includes('NODE_ENV') ||
        key.includes('VITE')
      )
    });
    
  } catch (error) {
    return json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 