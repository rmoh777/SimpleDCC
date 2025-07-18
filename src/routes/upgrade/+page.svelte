<script lang="ts">
  import { loadStripe } from '@stripe/stripe-js';
  import { stripePublishableKey } from '$lib/stripe/client';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let data;

  // State management
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Initialize email and isEmailValid from data prop
  let email = data.email || '';
  let isEmailValid = validateEmail(email);
  let isEmailPrefilled = !!data.email;

  // Check for success or cancellation from Stripe redirect
  onMount(() => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const canceled = urlParams.get('canceled');

      if (success) {
        successMessage = 'Subscription started successfully! Check your email for details.';
        // You might want to fetch more details using the session_id if needed
      } else if (canceled) {
        errorMessage = 'Subscription process canceled. You can try again.';
      }
    }
  });

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function handleEmailChange(event: Event) {
    const target = event.target as HTMLInputElement;
    email = target.value;
    isEmailValid = validateEmail(email);
  }

  async function startProTrial() {
    if (!isEmailValid) {
      errorMessage = 'Please enter a valid email address';
      return;
    }

    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
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

  function continueWithFree() {
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>Pick your plan - SimpleDCC</title>
  <meta name="description" content="Choose the plan that works best for you. Free 30 day trial, cancel anytime." />
</svelte:head>

<div class="pricing-container">
  <!-- Header Section -->
  <div class="header-section">
    <h1 class="main-title">Pick your plan</h1>
    <p class="subtitle">Choose the plan that works best for you. Free 30 day trial, cancel anytime.</p>
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

      <button class="cta-button secondary" on:click={continueWithFree}>
        Continue with Free
      </button>

      <div class="features-section">
        <h4 class="features-title">What's included</h4>
        <ul class="features-list">
          <li>1 docket subscription</li>
          <li>Daily email notifications</li>
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
        on:click={startProTrial}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Start your 30 day Pro trial'}
      </button>

      <div class="features-section">
        <h4 class="features-title">What's included</h4>
        <ul class="features-list">
          <li>Everything in Free plan</li>
          <li>+</li>
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

  <!-- Email Input Section -->
  <div class="email-section">
    <div class="email-container">
      <label for="email" class="email-label">Your Email Address</label>
      <div class="email-input-group">
        <input
          id="email"
          type="email"
          placeholder="Enter your email address"
          bind:value={email}
          on:input={handleEmailChange}
          class="email-input"
          disabled={isEmailPrefilled || isLoading}
        />
        <button 
          class="email-submit-btn"
          on:click={startProTrial}
          disabled={!isEmailValid || isLoading}
        >
          {isLoading ? 'Processing...' : 'Start Pro Trial'}
        </button>
      </div>
      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}
      {#if successMessage}
        <p class="success-message">{successMessage}</p>
      {/if}
    </div>
  </div>

  <!-- Bottom Section -->
  <div class="bottom-section">
    <div class="bottom-container">
      <div class="bottom-content">
        <h3 class="bottom-title">Curious how it works?</h3>
        <p class="bottom-subtitle">You can try SimpleDCC for free</p>
      </div>
      <button class="try-button" on:click={continueWithFree}>
        Try It Now
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
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Header Section */
  .header-section {
    text-align: center;
    max-width: 500px;
    margin: 0 auto 1.5rem;
  }

  .main-title {
    font-size: 2.25rem;
    font-weight: 900;
    color: #111827;
    margin-bottom: 0.4rem;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 1rem;
    color: #6b7280;
    font-weight: 400;
  }

  /* Pricing Grid */
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto 1.5rem;
  }

  /* Pricing Cards */
  .pricing-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1.25rem;
    position: relative;
    transition: all 0.3s ease;
  }

  .pricing-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-1.5px);
  }

  .pricing-card.featured {
    border: 2px solid #10b981;
    background: linear-gradient(135deg, #effef4, #e2fbe9);
    transform: scale(1.01);
  }

  .popular-badge {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  /* Plan Header */
  .plan-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }

  .plan-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.2rem;
  }

  .plan-description {
    color: #6b7280;
    font-size: 0.8rem;
    margin-bottom: 0.8rem;
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.2rem;
  }

  .price-amount {
    font-size: 2.25rem;
    font-weight: 900;
    color: #10b981;
  }

  .price-period {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* CTA Buttons */
  .cta-button {
    width: 100%;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    margin-bottom: 1.25rem;
  }

  .cta-button.primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .cta-button.primary:hover:not(:disabled) {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.25);
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
    margin-top: 0.8rem;
  }

  .features-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.6rem;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .features-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.4rem;
    font-size: 0.75rem;
    color: #374151;
  }

  .features-list li::before {
    content: '✓';
    color: #10b981;
    font-weight: 700;
    margin-right: 0.4rem;
    font-size: 0.8rem;
  }

  .features-list li:nth-child(2)::before {
    content: '+';
    color: #6b7280;
    font-weight: 400;
  }

  /* Email Section */
  .email-section {
    max-width: 450px;
    margin: 0 auto 1.25rem;
  }

  .email-container {
    background: #fcfcfc;
    border: 1px solid #eceff1;
    border-radius: 10px;
    padding: 1.25rem;
  }

  .email-label {
    display: block;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.4rem;
    font-size: 0.8rem;
  }

  .email-input-group {
    display: flex;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
  }

  .email-input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid #dbe1e6;
    border-radius: 5px;
    font-size: 0.8rem;
    transition: border-color 0.3s ease;
  }

  .email-input:focus {
    outline: none;
    border-color: #10b981;
  }

  .email-submit-btn {
    padding: 0.4rem 0.8rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.8rem;
  }

  .email-submit-btn:hover:not(:disabled) {
    transform: translateY(-0.5px);
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.2);
  }

  .email-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.7rem;
    margin: 0;
  }

  .success-message {
    color: #10b981;
    font-size: 0.7rem;
    margin: 0;
  }

  /* Bottom Section */
  .bottom-section {
    max-width: 450px;
    margin: 0 auto;
  }

  .bottom-container {
    background: #fcfcfc;
    border: 1px solid #eceff1;
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .bottom-content {
    flex: 1;
  }

  .bottom-title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.2rem;
  }

  .bottom-subtitle {
    color: #6b7280;
    font-size: 0.8rem;
    margin: 0;
  }

  .try-button {
    padding: 0.4rem 0.8rem;
    background: #111827;
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.8rem;
  }

  .try-button:hover {
    background: #374151;
    transform: translateY(-0.5px);
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .pricing-container {
      padding: 0.75rem;
    }

    .main-title {
      font-size: 1.75rem;
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .pricing-card.featured {
      transform: none;
    }

    .pricing-card {
      padding: 1rem;
    }

    .email-input-group {
      flex-direction: column;
    }

    .bottom-container {
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }

    .try-button {
      width: 100%;
    }
  }
</style>