<script lang="ts">
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
  import ManageSubscriptions from '$lib/components/ManageSubscriptions.svelte';

  let activeTab: 'subscribe' | 'manage' = 'subscribe';

  function setActiveTab(tab: 'subscribe' | 'manage'): void {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>DocketCC - Monitor FCC Filings with AI Intelligence</title>
  <meta name="description" content="Stay ahead of regulatory changes. Get AI-powered summaries of FCC docket filings delivered to your inbox. Never miss important telecommunications policy updates again." />
</svelte:head>

<div class="app-container">
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="logo-section">
        <h1 class="logo">DocketCC</h1>
        <div class="beta-badge">Beta</div>
      </div>
      <nav class="nav">
        <a href="/" class="nav-link active">Dashboard</a>
        <a href="/about" class="nav-link">About</a>
        <a href="/pricing" class="nav-link">Pricing</a>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">
        Monitor FCC Filings with <span class="highlight">AI Intelligence</span>
      </h1>
      <p class="hero-subtitle">
        Stay ahead of regulatory changes. Get AI-powered summaries of FCC docket 
        filings delivered to your inbox. Never miss important telecommunications policy 
        updates again.
      </p>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-number">1,500+</div>
          <div class="stat-label">Active Subscriptions</div>
        </div>
        <div class="stat">
          <div class="stat-number">24hrs</div>
          <div class="stat-label">Average Notification Speed</div>
        </div>
        <div class="stat">
          <div class="stat-number">98%</div>
          <div class="stat-label">Accuracy Rate</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-button" 
        class:active={activeTab === 'subscribe'}
        on:click={() => setActiveTab('subscribe')}
      >
        <svg class="tab-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Add Subscription
      </button>
      <button 
        class="tab-button" 
        class:active={activeTab === 'manage'}
        on:click={() => setActiveTab('manage')}
      >
        <svg class="tab-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        Manage Subscriptions
      </button>
    </div>

    <!-- Content Areas -->
    <div class="content-area">
      {#if activeTab === 'subscribe'}
        <div class="content-section">
          <SubscribeForm />
        </div>
      {:else}
        <div class="content-section">
          <ManageSubscriptions />
        </div>
      {/if}
    </div>

    <!-- Features Section -->
    <section class="features">
      <div class="features-header">
        <h2>Why Choose DocketCC?</h2>
        <p>Powerful features to keep you informed</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h3>Real-time Monitoring</h3>
          <p>Get notified the moment new filings are submitted to your tracked dockets.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3>AI-Powered Summaries</h3>
          <p>Complex legal documents simplified into clear, actionable insights.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 016.243 4h7.515l2 2H20a2 2 0 012 2v9a2 2 0 01-2 2h-8"></path>
            </svg>
          </div>
          <h3>Custom Alerts</h3>
          <p>Choose your notification frequency: hourly, daily, or weekly updates.</p>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>DocketCC</h3>
        <p>AI-powered FCC filing monitoring for regulatory professionals.</p>
      </div>
      <div class="footer-section">
        <h4>Product</h4>
        <a href="/features">Features</a>
        <a href="/pricing">Pricing</a>
        <a href="/api">API</a>
      </div>
      <div class="footer-section">
        <h4>Support</h4>
        <a href="/help">Help Center</a>
        <a href="/contact">Contact</a>
        <a href="/status">Status</a>
      </div>
      <div class="footer-section">
        <h4>Legal</h4>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/security">Security</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2024 DocketCC. Built for regulatory transparency.</p>
    </div>
  </footer>
</div>

<style>
  /* Global Styles */
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f8fafc;
    color: #1f2937;
    line-height: 1.6;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #4f46e5;
    margin: 0;
  }

  .beta-badge {
    background: #4f46e5;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .nav {
    display: flex;
    gap: 32px;
  }

  .nav-link {
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: color 0.2s ease;
    position: relative;
  }

  .nav-link:hover,
  .nav-link.active {
    color: #4f46e5;
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 0;
    right: 0;
    height: 2px;
    background: #4f46e5;
  }

  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 80px 24px 60px;
    text-align: center;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700;
    margin: 0 0 24px;
    line-height: 1.2;
  }

  .highlight {
    background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 18px;
    margin: 0 0 48px;
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 32px;
    max-width: 500px;
    margin: 0 auto;
  }

  .stat {
    text-align: center;
  }

  .stat-number {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    opacity: 0.8;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
    width: 100%;
  }

  /* Tab Navigation */
  .tab-navigation {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 40px;
    background: white;
    padding: 8px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 40px;
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: #6b7280;
    font-weight: 500;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    justify-content: center;
  }

  .tab-button:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .tab-button.active {
    background: #4f46e5;
    color: white;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
  }

  .tab-icon {
    width: 16px;
    height: 16px;
  }

  /* Content Area */
  .content-area {
    margin-bottom: 60px;
  }

  .content-section {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Features Section */
  .features {
    margin-top: 80px;
    text-align: center;
  }

  .features-header {
    margin-bottom: 48px;
  }

  .features-header h2 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 12px;
    color: #1f2937;
  }

  .features-header p {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .feature-card {
    background: white;
    padding: 32px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background: #4f46e5;
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .feature-icon svg {
    width: 24px;
    height: 24px;
  }

  .feature-card h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px;
    color: #1f2937;
  }

  .feature-card p {
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
  }

  /* Footer */
  .footer {
    background: #1f2937;
    color: white;
    margin-top: 80px;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 24px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 32px;
  }

  .footer-section h3 {
    color: #4f46e5;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px;
  }

  .footer-section h4 {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .footer-section p {
    color: #9ca3af;
    margin: 0;
    line-height: 1.6;
  }

  .footer-section a {
    display: block;
    color: #9ca3af;
    text-decoration: none;
    margin-bottom: 8px;
    transition: color 0.2s ease;
  }

  .footer-section a:hover {
    color: #4f46e5;
  }

  .footer-bottom {
    border-top: 1px solid #374151;
    padding: 24px;
    text-align: center;
  }

  .footer-bottom p {
    color: #9ca3af;
    margin: 0;
    font-size: 14px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .header-content {
      padding: 0 16px;
    }

    .nav {
      display: none;
    }

    .hero {
      padding: 60px 16px 40px;
    }

    .hero-stats {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .main-content {
      padding: 24px 16px;
    }

    .tab-navigation {
      margin-left: 16px;
      margin-right: 16px;
    }

    .tab-button {
      padding: 10px 16px;
      font-size: 13px;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .footer-content {
      padding: 32px 16px 16px;
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 28px;
    }

    .hero-subtitle {
      font-size: 16px;
    }

    .tab-button {
      flex-direction: column;
      gap: 4px;
      padding: 12px 8px;
    }

    .tab-icon {
      width: 14px;
      height: 14px;
    }
  }
</style>