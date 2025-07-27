<script lang="ts">
  import '$lib/styles/design-tokens.css';
  import '$lib/styles/component-base.css';
  import '$lib/styles/globals.css';
  import { page } from '$app/stores';
  import HidingNavbar from '$lib/components/layout/HidingNavbar.svelte';
  
  $: isAdminRoute = $page.url.pathname.startsWith('/admin');
  $: isTestRoute = $page.url.pathname.startsWith('/test-');
</script>

{#if isAdminRoute}
  <!-- Admin routes keep their existing layout -->
  <slot />
{:else if isTestRoute}
  <!-- Test routes get minimal layout -->
  <main>
    <slot />
  </main>
{:else}
  <!-- Public routes get the new DocketCC layout -->
  <div class="app">
    <!-- New Hiding Navbar Component -->
    <HidingNavbar />
    
    <!-- Main Content -->
    <main class="main">
      <slot />
    </main>
    
    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3>DocketCC</h3>
            <p>Professional FCC docket monitoring and intelligence service trusted by legal professionals, regulatory experts, and enterprise teams nationwide.</p>
            <p class="footer-tagline">Stay ahead of regulatory changes that impact your business.</p>
          </div>
          
                     <div class="footer-section">
             <h4>Product</h4>
             <span>Features</span>
             <span>Pricing</span>
             <span>API Access</span>
             <span>Enterprise</span>
             <span>Security</span>
           </div>
           
           <div class="footer-section">
             <h4>Resources</h4>
             <span>Documentation</span>
             <span>FCC Guide</span>
             <span>Best Practices</span>
             <span>Case Studies</span>
             <span>Blog</span>
           </div>
           
           <div class="footer-section">
             <h4>Support</h4>
             <span>Help Center</span>
             <span>Contact Support</span>
             <span>System Status</span>
             <span>Privacy Policy</span>
             <a href="/terms-of-service"><span>Terms of Service</span></a>
           </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 DocketCC. Professional regulatory intelligence service. This product uses the FCC Data API but is not endorsed or certified by the FCC.</p>
        </div>
      </div>
    </footer>
  </div>
{/if}

<style>
  /* Global base styles using new design tokens */
  :global(body) {
    font-family: var(--font-family);
    color: var(--color-text-primary);
    background-color: var(--color-background);
    line-height: 1.6;
  }
  
  :global(h1, h2, h3, h4, h5, h6) {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  
  :global(h1) { font-size: var(--font-size-3xl); }
  :global(h2) { font-size: var(--font-size-2xl); }
  :global(h3) { font-size: var(--font-size-xl); }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  

  
  .main {
    flex: 1;
  }
  
  .footer {
    background: var(--color-secondary);
    color: white;
    padding: 4rem 0 2rem;
    margin-top: auto;
  }
  
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }
  
  .footer-brand h3 {
    color: var(--color-primary);
    font-size: 1.5rem;
    font-weight: var(--font-weight-black);
    margin-bottom: 1rem;
  }
  
  .footer-brand p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  .footer-tagline {
    color: var(--color-primary) !important;
    font-weight: var(--font-weight-semibold) !important;
  }
  
  .footer-section h4 {
    color: white;
    font-weight: var(--font-weight-bold);
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
     .footer-section span {
     color: rgba(255, 255, 255, 0.7);
     display: block;
     margin-bottom: 0.5rem;
   }
   
   .footer-section a {
     text-decoration: none;
   }
   
   .footer-section a:hover span {
     color: var(--color-primary);
   }
  
  .footer-bottom {
    border-top: 1px solid #334155;
    padding-top: 2rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: var(--font-size-sm);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .nav {
      flex-direction: column;
      gap: 1rem;
    }
    
    .nav-links {
      gap: 1rem;
    }
    
    .footer-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style> 