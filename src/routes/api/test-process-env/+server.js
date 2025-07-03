import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    console.log('🔍 Testing process.env directly...');
    console.log('All process.env keys:', Object.keys(process.env));
    console.log('GEMINI_API_KEY in process.env:', !!process.env.GEMINI_API_KEY);
    console.log('GEMINI_API_KEY value:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    
    return json({
      success: true,
      gemini_key_exists: !!process.env.GEMINI_API_KEY,
      gemini_key_preview: process.env.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not found',
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