// Force load environment variables from .env file
// This runs before all server-side code in SvelteKit
import { config } from 'dotenv';
config();

console.log('🔧 Hooks.server.js: Manually loaded .env file');
console.log('🔑 GEMINI_API_KEY loaded:', !!process.env.GEMINI_API_KEY);
console.log('🔑 GEMINI_API_KEY preview:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

// SvelteKit hooks can be exported here if needed
// export async function handle({ event, resolve }) {
//   return resolve(event);
// } 