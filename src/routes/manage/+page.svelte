<script lang="ts">
  import { onMount } from 'svelte';
  import FrequencyToggle from '$lib/components/FrequencyToggle.svelte';
  import DocketCCLogo from '$lib/components/ui/DocketCCLogo.svelte';
  
  let email = '';
  let subscriptions: any[] = [];
  let userTier = 'free';
  let isLoading = false;
  let errorMessage = '';
  let showEmailForm = true;
  let isUnsubscribing = false;
  let unsubscribeStatus = '';
  
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
</style> 