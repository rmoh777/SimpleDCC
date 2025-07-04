// SvelteKit-native environment variable handling
// This runs before all server-side code in SvelteKit
import { env } from '$env/dynamic/private';

console.log('🔧 Hooks.server.js: Using SvelteKit native environment variables');
console.log('🔑 GEMINI_API_KEY loaded:', !!env.GEMINI_API_KEY);
console.log('🔑 GEMINI_API_KEY preview:', env.GEMINI_API_KEY?.substring(0, 10) + '...');

// SvelteKit hooks can be exported here if needed
// export async function handle({ event, resolve }) {
//   return resolve(event);
// } 