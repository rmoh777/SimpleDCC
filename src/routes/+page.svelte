<script lang="ts">
  import HeroSection from '$lib/components/sections/HeroSection.svelte';
  import FeaturesSection from '$lib/components/sections/FeaturesSection.svelte';
</script>

<svelte:head>
  <title>DocketCC - Professional FCC Docket Monitoring & AI Intelligence</title>
  <meta name="description" content="Professional FCC docket monitoring service with AI-powered summaries. Trusted by legal professionals, regulatory experts, and enterprise teams. Get instant notifications and regulatory intelligence." />
  <meta name="keywords" content="FCC docket monitoring, regulatory intelligence, telecommunications policy, legal compliance, government filings" />
  
  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="DocketCC - Professional FCC Docket Monitoring" />
  <meta property="og:description" content="Professional FCC docket monitoring service with AI-powered summaries. Trusted by legal professionals and enterprise teams." />
  <meta property="og:url" content="https://docketcc.com" />
  
  <!-- Professional/Business focused meta tags -->
  <meta name="robots" content="index, follow" />
  <meta name="author" content="DocketCC" />
  <link rel="canonical" href="https://docketcc.com" />
</svelte:head>

<!-- Hero Section -->
<HeroSection />

<!-- Features Section -->
<div id="features">
  <FeaturesSection />
</div>

<!-- Call-to-Action Section -->
<section class="cta-section">
  <div class="container">
    <div class="cta-content">
      <h2>Ready to Stay Ahead of Regulatory Changes?</h2>
      <p>Join thousands of professionals who trust DocketCC for critical regulatory intelligence.</p>
      <div class="cta-buttons">
        <a href="/admin" class="cta-button primary">
          Start Monitoring
        </a>
        <a href="#features" class="cta-button secondary">
          Learn More
        </a>
      </div>
      
      <div class="cta-trust">
        <p class="trust-text">
          <span class="trust-icon">🔒</span>
          Enterprise-grade security • SOC 2 certified • No credit card required
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .cta-section {
    background: linear-gradient(135deg, var(--color-secondary) 0%, #1e293b 100%);
    padding: var(--spacing-3xl) 0;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .cta-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .cta-content {
    position: relative;
    z-index: 1;
    color: white;
  }
  
  .cta-content h2 {
    font-size: 2.5rem;
    font-weight: var(--font-weight-black);
    margin-bottom: var(--spacing-md);
    color: white;
  }
  
  .cta-content p {
    font-size: var(--font-size-xl);
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: var(--spacing-xl);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .cta-buttons {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--spacing-xl);
  }
  
  .cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    border-radius: var(--border-radius-lg);
    transition: all var(--transition-normal);
    min-width: 180px;
  }
  
  .cta-button.primary {
    background: var(--color-primary);
    color: white;
    border: 2px solid var(--color-primary);
  }
  
  .cta-button.primary:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  .cta-button.secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .cta-button.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
  
  .cta-trust {
    margin-top: var(--spacing-lg);
  }
  
  .trust-text {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    margin: 0;
  }
  
  .trust-icon {
    color: var(--color-primary);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .cta-content h2 {
      font-size: 2rem;
    }
    
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .cta-button {
      width: 100%;
      max-width: 300px;
    }
    
    .trust-text {
      flex-direction: column;
      gap: var(--spacing-xs);
      text-align: center;
    }
  }
</style>