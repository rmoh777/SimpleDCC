## SvelteKit CSS Import Rules

### CSS Import Guidelines
1. **NEVER** use `<link rel="stylesheet" href="/src/lib/...">` in `app.html`
2. **ALWAYS** use SvelteKit imports: `import '$lib/styles/filename.css'` in Svelte components
3. **Global CSS** should be imported in `src/routes/+layout.svelte` for app-wide availability
4. **Component-specific CSS** should be imported at the component level

### Why This Matters
- Direct file paths in `app.html` break in production builds (Cloudflare, Vercel, etc.)
- SvelteKit's module resolution ensures CSS is properly bundled
- Prevents "missing styles" issues in deployment

### Correct Patterns
```svelte
<!-- ✅ CORRECT: In layout or component -->
<script>
  import '$lib/styles/globals.css';
</script>

<!-- ❌ WRONG: In app.html -->
<link rel="stylesheet" href="/src/lib/styles/globals.css">
```

### File Structure for CSS
- `src/routes/+layout.svelte` - Global app styles
- `src/lib/components/ComponentName.svelte` - Component-specific imports
- `src/lib/styles/` - All CSS files using `$lib` imports