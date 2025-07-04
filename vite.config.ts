import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
// Remove dotenv import - SvelteKit handles environment variables natively
// import { config } from 'dotenv';

// Remove dotenv config call - causes node:fs runtime errors in Cloudflare Pages
// config();

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    globals: true,
    environment: "node",
  },
  ssr: {
    noExternal: ['@google/generative-ai']
  },
  optimizeDeps: {
    include: ['@google/generative-ai']
  },
  define: {
    // Make env vars available to server-side code
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.ECFS_API_KEY': JSON.stringify(process.env.ECFS_API_KEY),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  }
});
