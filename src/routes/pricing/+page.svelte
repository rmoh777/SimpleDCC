<script lang="ts">
  function startFreeMonitoring() {
    window.location.href = '/';
  }

  function startProMonitoring() {
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>DocketCC - Pricing Plans</title>
  <meta name="description" content="Choose your FCC docket monitoring plan. Start free or unlock AI-powered regulatory intelligence with unlimited docket tracking and overview summaries." />
</svelte:head>

<!-- Hero Section -->
<section class="pricing-hero">
  <div class="container">
    <h1>Choose Your <span class="highlight">Intelligence</span> Plan</h1>
    <p class="subtitle">
      Start monitoring FCC proceedings for free, or unlock the full power of AI-driven 
      regulatory intelligence with unlimited docket tracking and overview summaries.
    </p>
  </div>
</section>

<!-- Pricing Cards -->
<section class="pricing-section">
  <div class="container">
    <div class="pricing-grid">
      <!-- Free Plan -->
      <div class="pricing-card free">
        <div class="plan-header">
          <h3 class="plan-name">Free</h3>
          <p class="plan-description">Perfect for getting started with FCC monitoring</p>
          <div class="plan-price">
            <span class="free-badge">Free</span>
          </div>
        </div>

        <ul class="features-list">
          <li><strong>1 docket subscription</strong></li>
          <li>Daily or weekly notification frequency</li>
          <li>Real-time filing alerts</li>
          <li>Basic email notifications</li>
          <li>Standard support</li>
        </ul>

        <button class="cta-button secondary" on:click={startFreeMonitoring}>
          Start Free Monitoring
        </button>
      </div>

      <!-- Pro Plan -->
      <div class="pricing-card featured">
        <div class="plan-header">
          <h3 class="plan-name">Pro</h3>
          <p class="plan-description">Complete regulatory intelligence for professionals</p>
          <div class="plan-price">
            <span class="price-amount">$2.99</span>
            <span class="price-period">/month</span>
          </div>
        </div>

        <ul class="features-list">
          <li><strong>Unlimited docket subscriptions</strong></li>
          <li><span class="feature-highlight">AI overview summaries</span> - who, what, when, where, why</li>
          <li>Real-time filing alerts</li>
          <li>Daily or weekly notifications</li>
          <li>Priority support</li>
        </ul>

        <button class="cta-button primary" on:click={startProMonitoring}>
          Start Pro Monitoring
        </button>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section class="faq-section">
  <div class="container">
    <div class="faq-header">
      <h2>Frequently Asked Questions</h2>
    </div>

    <div class="faq-item">
      <h3 class="faq-question">What's included in the AI overview summaries?</h3>
      <p class="faq-answer">Our AI analyzes each filing to provide clear summaries covering the essential elements: who filed it, what they're requesting, when it was submitted, where it applies, and why it matters to the proceeding.</p>
    </div>

    <div class="faq-item">
      <h3 class="faq-question">How quickly will I receive notifications?</h3>
      <p class="faq-answer">Free users receive daily or weekly digest emails. Pro users get the same frequency options but with enhanced AI summaries included in each notification.</p>
    </div>

    <div class="faq-item">
      <h3 class="faq-question">Can I upgrade or downgrade my plan?</h3>
      <p class="faq-answer">Yes, you can upgrade from Free to Pro at any time. Pro users can cancel their subscription and continue with free monitoring of one docket.</p>
    </div>

    <div class="faq-item">
      <h3 class="faq-question">What does "unlimited" mean for Pro subscriptions?</h3>
      <p class="faq-answer">Pro users can monitor as many FCC dockets as needed for professional use. Fair use policies apply to ensure service quality for all users.</p>
    </div>

    <div class="faq-item">
      <h3 class="faq-question">How do I cancel my Pro subscription?</h3>
      <p class="faq-answer">You can cancel your Pro subscription at any time through your account dashboard. You'll continue to have Pro access until the end of your billing period, then automatically move to the Free plan.</p>
    </div>
  </div>
</section>

<style>
  /* Hero section for pricing */
  .pricing-hero {
    padding: 4rem 0 2rem;
    background: linear-gradient(135deg, var(--color-secondary) 0%, #1e293b 100%);
    text-align: center;
  }

  .pricing-hero h1 {
    font-size: 3.5rem;
    font-weight: var(--font-weight-black);
    color: white;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .pricing-hero .highlight {
    color: var(--color-primary);
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }

  .pricing-hero .subtitle {
    font-size: 1.3rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 3rem;
    line-height: 1.6;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Pricing Cards Section */
  .pricing-section {
    padding: 2rem 0;
    background: linear-gradient(135deg, var(--color-secondary) 0%, #1e293b 100%);
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: start;
    max-width: 1000px;
    margin: 0 auto;
  }

  .pricing-card {
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px);
    border-radius: var(--border-radius-xl);
    padding: 3rem;
    box-shadow: var(--shadow-xl);
    border: 1px solid rgba(255,255,255,0.3);
    position: relative;
    transition: all var(--transition-normal);
    display: flex;
    flex-direction: column;
    min-height: 600px;
  }

  .pricing-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 50px 100px rgba(0,0,0,0.25);
  }

  .pricing-card.featured {
    border: 2px solid var(--color-primary);
    transform: scale(1.05);
  }

  .pricing-card.featured::before {
    content: 'MOST POPULAR';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    background: var(--color-primary);
    color: var(--color-secondary);
    padding: 0.75rem;
    font-weight: var(--font-weight-bold);
    font-size: 0.8rem;
    text-align: center;
    border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
  }

  .plan-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .plan-name {
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: 0.5rem;
  }

  .plan-description {
    color: var(--color-text-secondary);
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 2rem;
  }

  .price-amount {
    font-size: 3rem;
    font-weight: var(--font-weight-black);
    color: var(--color-secondary);
  }

  .price-period {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
  }

  .free-badge {
    font-size: 2.5rem;
    font-weight: var(--font-weight-black);
    color: var(--color-primary);
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin-bottom: 2.5rem;
    flex-grow: 1;
  }

  .features-list li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  .features-list li::before {
    content: '✓';
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
    margin-right: 0.75rem;
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .feature-highlight {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: var(--font-weight-semibold);
  }

  .cta-button {
    width: 100%;
    padding: 1.25rem 2rem;
    font-size: 1.1rem;
    font-weight: var(--font-weight-bold);
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    border: none;
    position: relative;
    overflow: hidden;
  }

  .cta-button.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: white;
  }

  .cta-button.secondary {
    background: transparent;
    color: var(--color-secondary);
    border: 2px solid var(--color-secondary);
  }

  .cta-button:hover {
    transform: translateY(-3px);
  }

  .cta-button.primary:hover {
    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4);
  }

  .cta-button.secondary:hover {
    background: var(--color-secondary);
    color: white;
    box-shadow: var(--shadow-lg);
  }

  .cta-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .cta-button:hover::before {
    left: 100%;
  }

  /* FAQ Section */
  .faq-section {
    background: var(--color-background);
    padding: 4rem 0;
  }

  .faq-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .faq-header h2 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: 1rem;
  }

  .faq-item {
    border-bottom: 1px solid var(--color-border);
    padding: 1.5rem 0;
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-question {
    font-size: 1.1rem;
    font-weight: var(--font-weight-semibold);
    color: var(--color-secondary);
    margin-bottom: 0.75rem;
  }

  .faq-answer {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .pricing-hero h1 {
      font-size: 2.5rem;
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .pricing-card {
      padding: 2rem 1.5rem;
    }

    .pricing-card.featured {
      transform: none;
    }

    .price-amount {
      font-size: 2.5rem;
    }

    .free-badge {
      font-size: 2rem;
    }
  }
</style> 