<script lang="ts">
  import '$lib/styles/globals.css';
  import { page } from '$app/stores';
  
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
    <!-- Government Banner -->
    <div class="gov-banner">
      <div class="container">
        🇺🇸 An independent FCC docket monitoring service - Not affiliated with the Federal Communications Commission
      </div>
    </div>
    
    <!-- Header -->
    <header class="header">
      <div class="container">
        <nav class="nav">
          <div class="logo-section">
            <a href="/" class="logo-link">
              <div class="logo-graphic">
                <div class="logo-icon">📡</div>
                <div class="logo-text">
                  Docket<span class="logo-cc">CC</span>
                </div>
              </div>
            </a>
          </div>
          
          <div class="nav-links">
            <a href="/about" class="nav-link" class:active={$page.url.pathname === '/about'}>
              About
            </a>
            <a href="/manage" class="nav-link" class:active={$page.url.pathname === '/manage'}>
              My Subscriptions
            </a>
            <a href="/pricing" class="nav-link" class:active={$page.url.pathname === '/pricing'}>
              Pricing
            </a>
          </div>
        </nav>
      </div>
    </header>
    
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
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/api">API Access</a>
            <a href="/enterprise">Enterprise</a>
            <a href="/security">Security</a>
          </div>
          
          <div class="footer-section">
            <h4>Resources</h4>
            <a href="/docs">Documentation</a>
            <a href="/guide">FCC Guide</a>
            <a href="/best-practices">Best Practices</a>
            <a href="/case-studies">Case Studies</a>
            <a href="/blog">Blog</a>
          </div>
          
          <div class="footer-section">
            <h4>Support</h4>
            <a href="/help">Help Center</a>
            <a href="/contact">Contact Support</a>
            <a href="/status">System Status</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2024 DocketCC. Professional regulatory intelligence service. Not affiliated with the Federal Communications Commission.</p>
        </div>
      </div>
    </footer>
  </div>
{/if}

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .gov-banner {
    background: var(--color-secondary);
    color: white;
    padding: 0.5rem 0;
    font-size: var(--font-size-sm);
    text-align: center;
    border-bottom: 1px solid #334155;
  }
  
  .header {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    padding: 1rem 0;
    box-shadow: var(--shadow-lg);
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 4px solid var(--color-primary);
  }
  
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo-link {
    text-decoration: none;
  }
  
  .logo-graphic {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .logo-text {
    font-size: 1.6rem;
    font-weight: var(--font-weight-black);
    color: var(--color-secondary);
    letter-spacing: -0.5px;
  }
  
  .logo-cc {
    color: var(--color-primary);
  }
  
  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }
  
  .nav-link {
    color: #374151;
    text-decoration: none;
    font-weight: var(--font-weight-semibold);
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: all var(--transition-normal);
  }
  
  .nav-link:hover,
  .nav-link.active {
    background: var(--color-secondary);
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
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
  
  .footer-section a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    transition: color var(--transition-normal);
  }
  
  .footer-section a:hover {
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