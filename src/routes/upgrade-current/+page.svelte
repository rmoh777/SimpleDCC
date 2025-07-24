<script lang="ts">
  import { loadStripe } from '@stripe/stripe-js';
  import { stripePublishableKey } from '$lib/stripe/client';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import DocketCCLogo from '$lib/components/ui/DocketCCLogo.svelte';

  // State management
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  // Check for success or cancellation from Stripe redirect
  onMount(() => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const canceled = urlParams.get('canceled');

      if (success) {
        successMessage = 'Upgrade successful! Welcome to your Pro plan.';
      } else if (canceled) {
        errorMessage = 'Upgrade process canceled. You are still on the Free plan.';
      }
    }
  });

  async function startProTrial() {
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch('/api/stripe/create-upgrade-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session.');
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('Stripe checkout URL not received.');
      }

    } catch (error) {
      console.error('Error starting trial:', error);
      errorMessage = `Failed to start trial: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Upgrade to Pro - DocketCC</title>
  <meta name="description" content="Upgrade your FCC docket monitoring to Pro for unlimited subscriptions and AI-powered insights." />
</svelte:head>

<main class="upgrade-page">
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <a href="/" class="logo-link">
        <DocketCCLogo />
      </a>
      <a href="/manage" class="back-link">← Back to Dashboard</a>
    </div>
  </header>

  <div class="container">
    <!-- Status Messages -->
    {#if successMessage}
      <div class="alert success">
        <span class="alert-icon">✅</span>
        <span class="alert-text">{successMessage}</span>
      </div>
    {/if}

    {#if errorMessage}
      <div class="alert error">
        <span class="alert-icon">❌</span>
        <span class="alert-text">{errorMessage}</span>
      </div>
    {/if}

    <!-- Main Content -->
    <div class="upgrade-content">
      <div class="upgrade-header">
        <h1>Upgrade to Pro</h1>
        <p class="subtitle">Unlock unlimited docket monitoring with AI-powered insights</p>
      </div>

      <!-- Single Pro Plan Card -->
      <div class="pricing-container">
        <div class="pricing-card featured">
          <div class="popular-badge">Recommended</div>
          <div class="plan-header">
            <h3 class="plan-name">Pro</h3>
            <p class="plan-description">AI-powered regulatory intelligence</p>
            <div class="plan-price">
              <span class="price-amount">$4.99</span>
              <span class="price-period">/month</span>
            </div>
            <div class="trial-info">
              <span class="trial-badge">30-day free trial</span>
            </div>
          </div>

          <button 
            class="cta-button primary" 
            on:click={startProTrial}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Start your 30 day Pro trial'}
          </button>

          <div class="features-section">
            <h4 class="features-title">What's included</h4>
            <ul class="features-list">
              <li>Everything in Free plan</li>
              <li>Unlimited docket monitoring</li>
              <li>AI-powered summaries</li>
              <li>Immediate notifications</li>
              <li>Smart document analysis</li>
              <li>Advanced search & filtering</li>
              <li>Priority support</li>
              <li>Export capabilities</li>
            </ul>
          </div>

          <div class="billing-info">
            <p class="billing-text">
              <strong>30-day free trial</strong> • Then $4.99/month • Cancel anytime
            </p>
            <p class="billing-subtext">
              No commitment required • Secure payment via Stripe
            </p>
          </div>
        </div>
      </div>

      <!-- Benefits Section -->
      <div class="benefits-section">
        <h2>Why upgrade to Pro?</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">🚀</div>
            <h3>Unlimited Monitoring</h3>
            <p>Track as many FCC proceedings as you need without restrictions</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🤖</div>
            <h3>AI-Powered Insights</h3>
            <p>Get intelligent summaries and analysis of complex regulatory documents</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">⚡</div>
            <h3>Immediate Alerts</h3>
            <p>Receive notifications as soon as new filings are available</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🎯</div>
            <h3>Smart Analysis</h3>
            <p>Advanced document processing and relevance scoring</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .upgrade-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
  }

  .header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-link {
    text-decoration: none;
  }

  .back-link {
    color: #6b7280;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #374151;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .alert.success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .alert.error {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .alert-icon {
    font-size: 1.25rem;
  }

  .upgrade-content {
    text-align: center;
  }

  .upgrade-header {
    margin-bottom: 3rem;
  }

  .upgrade-header h1 {
    font-size: 3rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #6b7280;
    margin-bottom: 0;
  }

  .pricing-container {
    max-width: 500px;
    margin: 0 auto 4rem;
  }

  .pricing-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .pricing-card.featured {
    border-color: #10b981;
    box-shadow: 0 25px 80px rgba(16, 185, 129, 0.15);
  }

  .pricing-card.featured::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .popular-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 600;
    display: inline-block;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .plan-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .plan-name {
    font-size: 1.8rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }

  .plan-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .price-amount {
    font-size: 3rem;
    font-weight: 800;
    color: #0f172a;
  }

  .price-period {
    font-size: 1.1rem;
    color: #6b7280;
    font-weight: 500;
  }

  .trial-info {
    margin-bottom: 1.5rem;
  }

  .trial-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .cta-button {
    width: 100%;
    padding: 1.25rem 2rem;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .cta-button.primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  }

  .cta-button.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
  }

  .cta-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .features-section {
    text-align: left;
    margin-bottom: 2rem;
  }

  .features-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 1rem;
    text-align: center;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  .features-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #374151;
    font-weight: 500;
  }

  .features-list li::before {
    content: '✓';
    width: 20px;
    height: 20px;
    background: #10b981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .billing-info {
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .billing-text {
    color: #374151;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .billing-subtext {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
  }

  .benefits-section {
    margin-top: 4rem;
  }

  .benefits-section h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2rem;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .benefit-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    text-align: center;
  }

  .benefit-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .benefit-card h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.75rem;
  }

  .benefit-card p {
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .container {
      padding: 2rem 1rem;
    }

    .header-content {
      padding: 0 1rem;
    }

    .upgrade-header h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .pricing-card {
      padding: 2rem 1.5rem;
    }

    .benefits-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .benefit-card {
      padding: 1.5rem;
    }
  }
</style> 