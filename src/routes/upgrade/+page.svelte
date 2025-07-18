<script lang="ts">
  import { loadStripe } from '@stripe/stripe-js';
  import { stripePublishableKey } from '$lib/stripe/client';

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
  // This logic now runs immediately as the component mounts/updates after server load
  $: {
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
          disabled={isEmailPrefilled || isLoading} // Disable if prefilled or loading
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
    padding: 1rem 0.75rem; /* Reduced from 1.5rem 1rem */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Header Section */
  .header-section {
    text-align: center;
    max-width: 500px; /* Reduced from 600px */
    margin: 0 auto 1.5rem; /* Reduced from 2rem */
  }

  .main-title {
    font-size: 2.25rem; /* Reduced from 2.5rem */
    font-weight: 900;
    color: #111827;
    margin-bottom: 0.4rem; /* Reduced from 0.5rem */
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 1rem; /* Reduced from 1.1rem */
    color: #6b7280;
    font-weight: 400;
  }

  /* Pricing Grid */
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem; /* Reduced from 1.5rem */
    max-width: 800px; /* Reduced from 900px */
    margin: 0 auto 1.5rem; /* Reduced from 2rem */
  }

  /* Pricing Cards */
  .pricing-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px; /* Reduced from 12px */
    padding: 1.25rem; /* Reduced from 1.5rem */
    position: relative;
    transition: all 0.3s ease;
  }

  .pricing-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); /* Reduced shadow */
    transform: translateY(-1.5px); /* Reduced translate */
  }

  .pricing-card.featured {
    border: 2px solid #10b981;
    background: linear-gradient(135deg, #effef4, #e2fbe9); /* Slightly lighter gradient */
    transform: scale(1.01); /* Reduced scale */
  }

  .popular-badge {
    position: absolute;
    top: -6px; /* Adjusted position */
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 0.2rem 0.6rem; /* Reduced padding */
    border-radius: 10px; /* Reduced from 12px */
    font-size: 0.65rem; /* Reduced from 0.7rem */
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px; /* Reduced tracking */
  }

  /* Plan Header */
  .plan-header {
    text-align: center;
    margin-bottom: 1.25rem; /* Reduced from 1.5rem */
  }

  .plan-name {
    font-size: 1.15rem; /* Reduced from 1.25rem */
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.2rem; /* Reduced from 0.25rem */
  }

  .plan-description {
    color: #6b7280;
    font-size: 0.8rem; /* Reduced from 0.9rem */
    margin-bottom: 0.8rem; /* Reduced from 1rem */
  }

  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.2rem; /* Reduced from 0.25rem */
  }

  .price-amount {
    font-size: 2.25rem; /* Reduced from 2.5rem */
    font-weight: 900;
    color: #10b981;
  }

  .price-period {
    font-size: 0.9rem; /* Reduced from 1rem */
    color: #6b7280;
    font-weight: 500;
  }

  /* CTA Buttons */
  .cta-button {
    width: 100%;
    padding: 0.6rem 1.2rem; /* Reduced from 0.75rem 1.5rem */
    border-radius: 6px; /* Reduced from 8px */
    font-weight: 600;
    font-size: 0.8rem; /* Reduced from 0.9rem */
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    margin-bottom: 1.25rem; /* Reduced from 1.5rem */
  }

  .cta-button.primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .cta-button.primary:hover:not(:disabled) {
    transform: translateY(-1.5px); /* Reduced translate */
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.25); /* Reduced shadow */
  }

  .cta-button.secondary {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb; /* Reduced border thickness */
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
    margin-top: 0.8rem; /* Reduced from 1rem */
  }

  .features-title {
    font-size: 0.8rem; /* Reduced from 0.9rem */
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.6rem; /* Reduced from 0.75rem */
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .features-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.4rem; /* Reduced from 0.5rem */
    font-size: 0.75rem; /* Reduced from 0.85rem */
    color: #374151;
  }

  .features-list li::before {
    content: '✓';
    color: #10b981;
    font-weight: 700;
    margin-right: 0.4rem; /* Reduced from 0.5rem */
    font-size: 0.8rem; /* Reduced from 0.9rem */
  }

  .features-list li:nth-child(2)::before {
    content: '+';
    color: #6b7280;
    font-weight: 400;
  }

  /* Email Section */
  .email-section {
    max-width: 450px; /* Reduced from 500px */
    margin: 0 auto 1.25rem; /* Reduced from 1.5rem */
  }

  .email-container {
    background: #fcfcfc; /* Slightly lighter */
    border: 1px solid #eceff1; /* Lighter border */
    border-radius: 10px; /* Reduced from 12px */
    padding: 1.25rem; /* Reduced from 1.5rem */
  }

  .email-label {
    display: block;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.4rem; /* Reduced from 0.5rem */
    font-size: 0.8rem; /* Reduced from 0.9rem */
  }

  .email-input-group {
    display: flex;
    gap: 0.6rem; /* Reduced from 0.75rem */
    margin-bottom: 0.6rem; /* Reduced from 0.75rem */
  }

  .email-input {
    flex: 1;
    padding: 0.4rem 0.6rem; /* Reduced from 0.5rem 0.75rem */
    border: 1px solid #dbe1e6; /* Lighter border */
    border-radius: 5px; /* Reduced from 6px */
    font-size: 0.8rem; /* Reduced from 0.9rem */
    transition: border-color 0.3s ease;
  }

  .email-input:focus {
    outline: none;
    border-color: #10b981;
  }

  .email-submit-btn {
    padding: 0.4rem 0.8rem; /* Reduced from 0.5rem 1rem */
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 5px; /* Reduced from 6px */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.8rem; /* Reduced from 0.9rem */
  }

  .email-submit-btn:hover:not(:disabled) {
    transform: translateY(-0.5px); /* Reduced translate */
    box-shadow: 0 3px 8px rgba(16, 185, 129, 0.2); /* Reduced shadow */
  }

  .email-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.7rem; /* Reduced from 0.8rem */
    margin: 0;
  }

  .success-message {
    color: #10b981;
    font-size: 0.7rem; /* Reduced from 0.8rem */
    margin: 0;
  }

  /* Bottom Section */
  .bottom-section {
    max-width: 450px; /* Reduced from 500px */
    margin: 0 auto;
  }

  .bottom-container {
    background: #fcfcfc; /* Slightly lighter */
    border: 1px solid #eceff1; /* Lighter border */
    border-radius: 10px; /* Reduced from 12px */
    padding: 1.25rem; /* Reduced from 1.5rem */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .bottom-content {
    flex: 1;
  }

  .bottom-title {
    font-size: 1rem; /* Reduced from 1.1rem */
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.2rem; /* Reduced from 0.25rem */
  }

  .bottom-subtitle {
    color: #6b7280;
    font-size: 0.8rem; /* Reduced from 0.9rem */
    margin: 0;
  }

  .try-button {
    padding: 0.4rem 0.8rem; /* Reduced from 0.5rem 1rem */
    background: #111827;
    color: white;
    border: none;
    border-radius: 5px; /* Reduced from 6px */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.8rem; /* Reduced from 0.9rem */
  }

  .try-button:hover {
    background: #374151;
    transform: translateY(-0.5px); /* Reduced translate */
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .pricing-container {
      padding: 0.75rem; /* Reduced from 1rem */
    }

    .main-title {
      font-size: 1.75rem; /* Reduced from 2rem */
    }

    .pricing-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem; /* Reduced from 1rem */
    }

    .pricing-card.featured {
      transform: none;
    }

    .pricing-card {
      padding: 1rem; /* Reduced from 1.25rem */
    }

    .email-input-group {
      flex-direction: column;
    }

    .bottom-container {
      flex-direction: column;
      gap: 0.75rem; /* Reduced from 1rem */
      text-align: center;
    }

    .try-button {
      width: 100%;
    }
  }
</style>