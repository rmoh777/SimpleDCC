import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

// SvelteKit handles environment variables automatically for Cloudflare Pages
// No need for dotenv or manual process.env definitions

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
  }
  // Environment variables are handled by SvelteKit's $env/dynamic/private for Cloudflare Pages
});
