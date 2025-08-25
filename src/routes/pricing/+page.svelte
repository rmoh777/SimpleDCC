<script lang="ts">
  function goToSignup() {
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>Pricing Plans - SimpleDCC</title>
  <meta name="description" content="Choose the plan that works best for you. Start with our free plan or unlock advanced AI features with our Pro tier." />
</svelte:head>

<div class="pricing-container">
  <!-- Header Section -->
  <div class="header-section">
    <h1 class="main-title">Simple, Transparent Pricing</h1>
    <p class="subtitle">Choose the plan that's right for you. Get started for free or unlock powerful AI features with our Pro plan.</p>
  </div>

  <!-- Pricing Cards -->
  <div class="pricing-grid">
    <!-- Free Plan -->
    <div class="pricing-card">
      <div class="plan-header">
        <h3 class="plan-name">Free</h3>
        <p class="plan-description">Essential docket monitoring</p>
        <div class="plan-price">
          <span class="price-amount">$0</span>
          <span class="price-period">/month</span>
        </div>
      </div>

      <button class="cta-button secondary" on:click={goToSignup}>
        Get Started
      </button>

      <div class="features-section">
        <h4 class="features-title">What's included</h4>
        <ul class="features-list">
          <li>1 docket subscription</li>
          <li>Basic filing metadata</li>
          <li>Document links & access</li>
          <li>Standard support</li>
        </ul>
      </div>
    </div>

    <!-- Pro Plan -->
    <div class="pricing-card featured">
      <div class="popular-badge">Most Popular</div>
      <div class="plan-header">
        <h3 class="plan-name">Pro</h3>
        <p class="plan-description">AI-powered regulatory intelligence</p>
        <div class="plan-price">
          <span class="price-amount">$4.99</span>
          <span class="price-period">/month</span>
        </div>
      </div>

      <button 
        class="cta-button primary" 
        on:click={goToSignup}
      >
        Get Started
      </button>

      <div class="features-section">
        <h4 class="features-title">What's included</h4>
        <ul class="features-list">
          <li>Everything in Free plan</li>
          <li>Unlimited docket monitoring</li>
          <li>AI-powered summaries</li>
          <li>Instant notifications</li>
          <li>Stakeholder analysis</li>
          <li>Regulatory impact insights</li>
          <li>Priority support</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Bottom Section -->
  <div class="bottom-section">
    <div class="bottom-container">
      <div class="bottom-content">
        <h3 class="bottom-title">Ready to get started?</h3>
        <p class="bottom-subtitle">Monitor your first docket for free.</p>
      </div>
        <button class="try-button" on:click={goToSignup}>
        Sign Up Now
      </button>
    </div>
  </div>
</div>

<style>
  /* Main Container */
  .pricing-container {
    min-height: 100vh;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: #374151;
    line-height: 1.6;
    padding: 2rem 0.75rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Header Section */
  .header-section {
    text-align: center;
    max-width: 500px;
    margin: 0 auto 2.5rem;
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 900;
    color: #111827;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    font-weight: 400;
  }

  /* Pricing Grid */
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    max-width: 800px;
    margin: 0 auto 2.5rem;
  }

  /* Pricing Cards */
  .pricing-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.75rem;
    position: relative;
    transition: all 0.3s ease;
  }

  .pricing-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .pricing-card.featured {
    border: 2px solid #10b981;
    background: linear-gradient(135deg, #f0fdf4, #e6fcf5);
    transform: scale(1.02);
  }

  .popular-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Plan Header */
  .plan-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .plan-name {
    font-size: 1.25rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .plan-description {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
  }

  .price-amount {
    font-size: 2.75rem;
    font-weight: 900;
    color: #111827;
  }
  
  .pricing-card.featured .price-amount {
    color: #10b981;
  }

  .price-period {
    font-size: 1rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* CTA Buttons */
  .cta-button {
    width: 100%;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    margin-bottom: 1.5rem;
  }

  .cta-button.primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .cta-button.primary:hover:not(:disabled) {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
  }

  .cta-button.secondary {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .cta-button.secondary:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .cta-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Features Section */
  .features-section {
    margin-top: 1rem;
  }

  .features-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .features-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #374151;
  }

  .features-list li::before {
    content: '✓';
    color: #10b981;
    font-weight: 700;
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }



  /* Bottom Section */
  .bottom-section {
    max-width: 600px;
    margin: 0 auto;
  }

  .bottom-container {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .bottom-content {
    flex: 1;
  }

  .bottom-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .bottom-subtitle {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
  }

  .try-button {
    padding: 0.6rem 1.2rem;
    background: #111827;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .try-button:hover {
    background: #374151;
    transform: translateY(-1px);
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .pricing-container {
      padding: 1rem;
    }

    .main-title {
      font-size: 2rem;
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .pricing-card.featured {
      transform: none;
    }

    .pricing-card {
      padding: 1.25rem;
    }

    .bottom-container {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .try-button {
      width: 100%;
    }
  }
</style> 