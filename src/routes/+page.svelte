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

<!-- Hero Section -->
<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1 class="hero-title">
        Monitor FCC Filings with <span class="highlight">AI Intelligence</span>
      </h1>
      <p class="hero-subtitle">
        Stay ahead of regulatory changes. Get AI-powered summaries of FCC docket 
        filings delivered to your inbox. Never miss important telecommunications policy 
        updates again.
      </p>
    </div>
  </div>
</section>

<!-- Main Content -->
<div class="page-content">
  <div class="container">
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
  </div>
</div>

<!-- Features Section -->
<section class="features">
  <div class="container">
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
  </div>
</section>

<style>
  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, var(--color-secondary) 0%, #1e293b 100%);
    color: white;
    padding: var(--spacing-3xl) 0;
    text-align: center;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-black);
    margin-bottom: var(--spacing-lg);
    line-height: 1.1;
  }

  .highlight {
    color: var(--color-primary);
  }

  .hero-subtitle {
    font-size: var(--font-size-xl);
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin-bottom: 0;
  }

  /* Page Content */
  .page-content {
    padding: var(--spacing-3xl) 0;
    background: var(--color-background);
  }

  /* Tab Navigation */
  .tab-navigation {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-2xl);
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
  }

  .tab-button:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .tab-button.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-lg);
  }

  .tab-icon {
    width: 20px;
    height: 20px;
  }

  /* Content Area */
  .content-area {
    margin-bottom: var(--spacing-3xl);
  }

  .content-section {
    background: var(--color-surface);
    padding: var(--spacing-2xl);
    border-radius: var(--border-radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border);
  }

  /* Features Section */
  .features {
    padding: var(--spacing-3xl) 0;
    background: var(--color-surface);
  }

  .features-header {
    text-align: center;
    margin-bottom: var(--spacing-3xl);
  }

  .features-header h2 {
    font-size: var(--font-size-3xl);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .features-header p {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-xl);
  }

  .feature-card {
    background: var(--color-surface);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    text-align: center;
    transition: all var(--transition-normal);
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .feature-icon svg {
    width: 24px;
    height: 24px;
  }

  .feature-card h3 {
    font-size: var(--font-size-xl);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
    font-weight: var(--font-weight-bold);
  }

  .feature-card p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .hero {
      padding: var(--spacing-2xl) 0;
    }

    .hero-title {
      font-size: var(--font-size-3xl);
    }

    .hero-subtitle {
      font-size: var(--font-size-lg);
    }

    .tab-navigation {
      flex-direction: column;
      align-items: center;
    }

    .tab-button {
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }

    .content-section {
      padding: var(--spacing-lg);
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
  }
</style>