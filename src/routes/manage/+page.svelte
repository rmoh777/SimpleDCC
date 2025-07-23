<script lang="ts">
  import { onMount } from 'svelte';
  import FrequencyToggle from '$lib/components/FrequencyToggle.svelte';
  import DocketCCLogo from '$lib/components/ui/DocketCCLogo.svelte';
  
  export let data: {
    user?: {
      id: any;
      email: any;
      user_tier: any;
      created_at: any;
      google_id?: any;
      google_email?: any;
      google_linked_at?: any;
    };
    subscriptions?: any[];
    isLoggedIn?: boolean;
    statusMessage?: string;
    errorMessage?: string;
  };
  
  let email = '';
  let subscriptions: any[] = [];
  let userTier = 'free';
  let isLoading = false;
  let errorMessage = '';
  let showEmailForm = true;
  let isUnsubscribing = false;
  let unsubscribeStatus = '';
  
  // Magic link variables
  let magicLinkEmail = '';
  let isSendingMagicLink = false;
  let magicLinkStatus = '';
  let magicLinkError = '';
  let keepSignedIn = false;
  
  // Initialize from server data
  onMount(() => {
    if (data.isLoggedIn && data.user) {
      email = data.user.email;
      subscriptions = data.subscriptions || [];
      userTier = data.user.user_tier || 'free';
      showEmailForm = false;
    }
    
    if (data.statusMessage) {
      unsubscribeStatus = data.statusMessage;
    }
    
    if (data.errorMessage) {
      errorMessage = data.errorMessage;
    }
    
    // Handle trial started and upgrade canceled messages from URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trialStarted = urlParams.get('trial_started');
      const upgradeCanceled = urlParams.get('upgrade_canceled');
      
      if (trialStarted) {
        unsubscribeStatus = '🎉 Pro trial started successfully! Welcome to SimpleDCC Pro - enjoy your 30-day trial with AI-powered insights.';
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (upgradeCanceled) {
        errorMessage = 'Upgrade process was canceled. You can try again anytime from your dashboard.';
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  });
  
  async function loadSubscriptions() {
    if (!email) return;
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok) {
        subscriptions = data.subscriptions || [];
        userTier = data.user_tier || 'free';
        showEmailForm = false;
      } else {
        errorMessage = data.error || 'Failed to load subscriptions';
      }
    } catch (error) {
      errorMessage = 'Network error occurred';
    } finally {
      isLoading = false;
    }
  }
  
  async function unsubscribe(docketNumber: string) {
    isUnsubscribing = true;
    unsubscribeStatus = '';
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          docket_number: docketNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove from local list
        subscriptions = subscriptions.filter(sub => sub.docket_number !== docketNumber);
        unsubscribeStatus = `Successfully unsubscribed from ${docketNumber}`;
      } else {
        unsubscribeStatus = `Error: ${data.error || 'Unsubscribe failed'}`;
      }
    } catch (error) {
      unsubscribeStatus = 'Error: Network error occurred';
    } finally {
      isUnsubscribing = false;
    }
  }
  
  function backToEmailForm() {
    showEmailForm = true;
    subscriptions = [];
    email = '';
    errorMessage = '';
    unsubscribeStatus = '';
  }
  
  function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp * 1000));
  }

  function handleFrequencyChange(event: CustomEvent<{frequency: string}>, docketNumber: string) {
    // Update the local subscription data
    subscriptions = subscriptions.map(sub => 
      sub.docket_number === docketNumber 
        ? { ...sub, frequency: event.detail.frequency }
        : sub
    );
  }

  async function sendMagicLink() {
    if (!magicLinkEmail || !magicLinkEmail.includes('@')) {
      magicLinkError = 'Please enter a valid email address';
      return;
    }

    isSendingMagicLink = true;
    magicLinkStatus = '';
    magicLinkError = '';

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: magicLinkEmail,
          extendedSession: keepSignedIn
        })
      });

      const data = await response.json();

      if (response.ok) {
        magicLinkStatus = data.message;
        magicLinkEmail = ''; // Clear the form
      } else {
        if (data.rateLimited) {
          magicLinkError = data.error;
        } else {
          magicLinkError = data.error || 'Failed to send magic link. Please try again.';
        }
      }
    } catch (error) {
      magicLinkError = 'Network error occurred. Please try again.';
    } finally {
      isSendingMagicLink = false;
    }
  }
</script>

<svelte:head>
  <title>My Subscriptions - DocketCC</title>
  <meta name="description" content="Manage your FCC docket monitoring subscriptions with DocketCC's professional dashboard." />
</svelte:head>

<main class="main">
  <div class="container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>My Subscriptions</h1>
      <p>Manage your FCC docket monitoring subscriptions</p>
    </div>

    {#if showEmailForm}
      <!-- Email Entry Form -->
      <div class="email-card">
        <div class="email-card-content">
          <div class="email-icon">📧</div>
          <h2>Access Your Subscriptions</h2>
          <p>Enter your email address to view and manage your active docket monitoring subscriptions.</p>
          
          <form on:submit|preventDefault={loadSubscriptions} class="email-form">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input 
                type="email" 
                id="email"
                bind:value={email}
                class="email-input"
                placeholder="your.email@organization.gov"
                required
              />
            </div>
            
            <button 
              type="submit" 
              class="btn-primary"
              disabled={isLoading || !email}
            >
              {#if isLoading}
                <span class="loading-spinner"></span>
                Loading Subscriptions...
              {:else}
                View My Subscriptions
              {/if}
            </button>
          </form>
          
          {#if errorMessage}
            <div class="error-message">
              ❌ {errorMessage}
            </div>
          {/if}
        </div>
      </div>

      <!-- Magic Link Section -->
      <div class="magic-link-section">
        <div class="section-divider">
          <span>or</span>
        </div>
        
        <div class="magic-link-card">
          <div class="magic-link-content">
            <div class="magic-link-icon">🔗</div>
            <h3>Sign In with Magic Link</h3>
            <p>We'll send you a secure link to sign in instantly - no password needed!</p>
            
            <form on:submit|preventDefault={sendMagicLink} class="magic-link-form">
              <div class="form-group">
                <label for="magic-email" class="form-label">Email Address</label>
                <input 
                  type="email" 
                  id="magic-email"
                  bind:value={magicLinkEmail}
                  class="email-input"
                  placeholder="your.email@organization.gov"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" bind:checked={keepSignedIn} class="checkbox-input" />
                  <span class="checkbox-text">Keep me signed in for 24 hours</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                class="btn-magic"
                disabled={isSendingMagicLink || !magicLinkEmail}
              >
                {#if isSendingMagicLink}
                  <span class="loading-spinner"></span>
                  Sending Magic Link...
                {:else}
                  🪄 Send Magic Link
                {/if}
              </button>
            </form>
            
            {#if magicLinkStatus}
              <div class="success-message">
                ✅ {magicLinkStatus}
              </div>
            {/if}
            
            {#if magicLinkError}
              <div class="error-message">
                ❌ {magicLinkError}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Google OAuth Section -->
        <div class="oauth-section">
          <div class="section-divider">
            <span>or</span>
          </div>
          
          <div class="oauth-card">
            <div class="oauth-content">
              <div class="oauth-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <h3>Sign In with Google</h3>
              <p>Quick sign-in with your Google account (if you signed up with a Google email)</p>
              
              <a href="/auth/google" class="btn-google">
                <span class="google-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </span>
                Sign in with Google
              </a>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Dashboard View -->
      <div class="dashboard">
        <!-- Account Header -->
        <div class="account-header">
          <div class="account-info">
            <div class="account-avatar">
              {email.charAt(0).toUpperCase()}
            </div>
            <div class="account-details">
              <h2>{email}</h2>
              <p>{subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button class="btn-secondary" on:click={backToEmailForm}>
            Switch Account
          </button>
        </div>

        <!-- Google Account Section -->
        {#if data.user?.google_id}
          <div class="google-account-section">
            <div class="google-account-card">
              <div class="google-account-header">
                <div class="google-account-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div class="google-account-info">
                  <h4>Google Account Linked</h4>
                  <p>{data.user.google_email}</p>
                </div>
                <div class="google-account-status">
                  <span class="status-badge connected">✓ Connected</span>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="google-account-section">
            <div class="google-account-card">
              <div class="google-account-header">
                <div class="google-account-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div class="google-account-info">
                  <h4>Link Google Account</h4>
                  <p>Sign in faster with your Google account</p>
                </div>
                <div class="google-account-action">
                  <a href="/auth/google?link=true" class="btn-link-google">
                    Link Account
                  </a>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Upgrade Banner for Free Users -->
        {#if userTier === 'free'}
          <div class="upgrade-banner">
            <div class="upgrade-content">
              <div class="upgrade-icon">⭐</div>
              <div class="upgrade-text">
                <h3>Upgrade to Pro</h3>
                <p>Get AI-powered summaries, instant notifications, and enhanced monitoring features with a 30-day free trial.</p>
              </div>
              <a href="/upgrade" class="btn-upgrade">Start Pro Trial</a>
            </div>
          </div>
        {/if}

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{subscriptions.length}</div>
              <div class="stat-label">Active Subscriptions</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-number">
                {subscriptions.length > 0 ? formatDate(Math.max(...subscriptions.map(s => s.created_at))) : 'N/A'}
              </div>
              <div class="stat-label">Latest Subscription</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔔</div>
            <div class="stat-content">
              <div class="stat-number">Active</div>
              <div class="stat-label">Notification Status</div>
            </div>
          </div>
        </div>

        <!-- Subscriptions List -->
        <div class="subscriptions-section">
          <div class="section-header">
            <h3>Your Monitored Dockets</h3>
            <a href="/" class="btn-outline">Add New Subscription</a>
          </div>

          {#if subscriptions.length === 0}
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h4>No Subscriptions Found</h4>
              <p>You don't have any active docket monitoring subscriptions yet.</p>
              <a href="/" class="btn-primary">Start Monitoring Dockets</a>
            </div>
          {:else}
            <div class="subscriptions-grid">
              {#each subscriptions as subscription}
                <div class="subscription-card">
                  <div class="subscription-header">
                    <div class="docket-info">
                      <div class="docket-number">Proceeding {subscription.docket_number}</div>
                      <div class="subscription-date">
                        Subscribed {formatDate(subscription.created_at)}
                      </div>
                    </div>
                    <div class="frequency-controls">
                      <FrequencyToggle 
                        frequency={subscription.frequency || 'daily'}
                        {userTier}
                        {email}
                        docketNumber={subscription.docket_number}
                        on:change={(event) => handleFrequencyChange(event, subscription.docket_number)}
                      />
                    </div>
                  </div>
                  
                  <div class="subscription-content">
                    <div class="features">
                      <div class="feature">
                        <span class="feature-icon">🔔</span>
                        Real-time alerts
                      </div>
                      <div class="feature">
                        <span class="feature-icon">📊</span>
                        AI summaries
                      </div>
                      <div class="feature">
                        <span class="feature-icon">🔒</span>
                        Secure delivery
                      </div>
                    </div>
                  </div>
                  
                  <div class="subscription-actions">
                    <button 
                      class="btn-danger"
                      on:click={() => unsubscribe(subscription.docket_number)}
                      disabled={isUnsubscribing}
                    >
                      {#if isUnsubscribing}
                        Removing...
                      {:else}
                        Unsubscribe
                      {/if}
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if unsubscribeStatus}
          <div class="status-notification" class:success={unsubscribeStatus.includes('Successfully')}>
            {unsubscribeStatus}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>


  .main {
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
    min-height: calc(100vh - 80px);
    padding: 3rem 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }



  .page-header h1 {
    font-size: 3rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    font-size: 1.2rem;
    color: #6b7280;
  }

  /* Email Entry Form */
  .email-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    border: 1px solid #e5e7eb;
    max-width: 600px;
    margin: 0 auto;
    overflow: hidden;
  }

  .email-card::before {
    content: '';
    display: block;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .email-card-content {
    padding: 3rem;
    text-align: center;
  }

  .email-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 2rem;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  }

  .email-card h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
  }

  .email-card p {
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .email-form {
    max-width: 400px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .form-label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .email-input {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    outline: none;
    transition: all 0.3s;
    font-weight: 500;
  }

  .email-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  .btn-outline {
    background: transparent;
    color: #10b981;
    border: 2px solid #10b981;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;
    display: inline-block;
  }

  .btn-outline:hover {
    background: #10b981;
    color: white;
    transform: translateY(-1px);
  }

  .btn-danger {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
  }

  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-weight: 600;
  }

  .success-message {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-weight: 600;
  }

  /* Magic Link Styles */
  .magic-link-section {
    max-width: 600px;
    margin: 2rem auto 0;
  }

  .section-divider {
    text-align: center;
    margin: 2rem 0 1.5rem;
    position: relative;
  }

  .section-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
    z-index: 1;
  }

  .section-divider span {
    background: #f8fafc;
    padding: 0 1rem;
    color: #9ca3af;
    font-weight: 600;
    font-size: 0.9rem;
    position: relative;
    z-index: 2;
  }

  .magic-link-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .magic-link-card::before {
    content: '';
    display: block;
    height: 4px;
    background: linear-gradient(90deg, #8b5cf6, #a855f7);
  }

  .magic-link-content {
    padding: 2.5rem;
    text-align: center;
  }

  .magic-link-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto 1.5rem;
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  }

  .magic-link-content h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.75rem;
  }

  .magic-link-content p {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .magic-link-form {
    max-width: 350px;
    margin: 0 auto;
  }

  .btn-magic {
    width: 100%;
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-magic:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(139, 92, 246, 0.4);
  }

  .btn-magic:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Checkbox styles */
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #374151;
    margin-top: 0.5rem;
  }

  .checkbox-input {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .checkbox-input:checked {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-color: #8b5cf6;
  }

  .checkbox-input:checked::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .checkbox-text {
    user-select: none;
    font-weight: 500;
  }

  /* Dashboard */
  .dashboard {
    max-width: 1000px;
    margin: 0 auto;
  }

  .account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
  }

  .account-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .account-avatar {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .account-details h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.25rem 0;
  }

  .account-details p {
    color: #6b7280;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
  }

  .stat-number {
    font-size: 1.8rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
  }

  .subscriptions-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .section-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .subscriptions-grid {
    display: grid;
    gap: 1.5rem;
  }

  .subscription-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s;
  }

  .subscription-card:hover {
    border-color: #10b981;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
  }

  .subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .docket-number {
    font-size: 1.2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.25rem;
  }

  .subscription-date {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-badge.active {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  .frequency-controls {
    display: flex;
    align-items: center;
  }

  .features {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #374151;
    font-weight: 500;
  }

  .feature-icon {
    font-size: 1rem;
    color: #10b981;
  }

  .subscription-actions {
    display: flex;
    justify-content: flex-end;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    background: #f3f4f6;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1.5rem;
    color: #9ca3af;
  }

  .empty-state h4 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .status-notification {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #ef4444;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }

  .status-notification.success {
    background: #10b981;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .container {
      padding: 0 1rem;
    }

    .page-header h1 {
      font-size: 2rem;
    }



    .account-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .section-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .features {
      flex-direction: column;
      gap: 0.75rem;
    }

    .subscription-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .frequency-controls {
      justify-content: center;
      margin: 0.5rem 0;
    }

    .status-notification {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
    }
  }

  /* Google OAuth Styles */
  .oauth-section {
    margin-top: 2rem;
  }

  .oauth-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
  }

  .oauth-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335);
  }

  .oauth-content {
    text-align: center;
  }

  .oauth-icon {
    margin: 0 auto 1rem;
    display: flex;
    justify-content: center;
  }

  .oauth-content h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .oauth-content p {
    color: #6b7280;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .btn-google {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: #4285F4;
    color: white;
    padding: 0.875rem 2rem;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(66, 133, 244, 0.2);
  }

  .btn-google:hover {
    background: #3367d6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(66, 133, 244, 0.3);
  }

  .google-icon {
    display: flex;
    align-items: center;
  }

  /* Google Account Dashboard Styles */
  .google-account-section {
    margin: 1.5rem 0;
  }

  .google-account-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .google-account-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .google-account-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .google-account-info {
    flex: 1;
  }

  .google-account-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
  }

  .google-account-info p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .google-account-status {
    display: flex;
    align-items: center;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .status-badge.connected {
    background: #dcfce7;
    color: #166534;
  }

  .google-account-action {
    display: flex;
    align-items: center;
  }

  .btn-link-google {
    background: #4285F4;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-link-google:hover {
    background: #3367d6;
    transform: translateY(-1px);
  }

  /* Upgrade Banner */
  .upgrade-banner {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-radius: 16px;
    padding: 0;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
    overflow: hidden;
    position: relative;
  }

  .upgrade-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
    pointer-events: none;
  }

  .upgrade-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    position: relative;
    z-index: 1;
  }

  .upgrade-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    backdrop-filter: blur(10px);
  }

  .upgrade-text {
    flex: 1;
    color: white;
  }

  .upgrade-text h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .upgrade-text p {
    margin: 0;
    opacity: 0.9;
    line-height: 1.5;
    font-size: 1rem;
  }

  .btn-upgrade {
    background: white;
    color: #8b5cf6;
    padding: 1rem 2rem;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
  }

  .btn-upgrade:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    background: #f8fafc;
  }

  @media (max-width: 768px) {
    .upgrade-content {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .upgrade-icon {
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
    }

    .upgrade-text h3 {
      font-size: 1.3rem;
    }

    .upgrade-text p {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 768px) {
    .oauth-card {
      padding: 1.5rem;
    }

    .google-account-header {
      flex-direction: column;
      text-align: center;
      gap: 0.75rem;
    }

    .google-account-info {
      text-align: center;
    }
  }
</style> 