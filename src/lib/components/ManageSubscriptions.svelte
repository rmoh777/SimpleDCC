<script lang="ts">
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  
  export let compact: boolean = false;
  
  let email = '';
  let subscriptions: Array<{
    id: string;
    docket_number: string;
    created_at: number;
  }> = [];
  let isLoading = false;
  let isLoadingSubscriptions = false;
  let message = '';
  let messageType: 'success' | 'error' | 'info' = 'info';
  let unsubscribeLoading: Set<string> = new Set();
  let hasPerformedLookup = false;
  
  async function handleLookup() {
    if (!email.trim()) {
      showMessage('Please enter your email address', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    isLoadingSubscriptions = true;
    message = '';
    subscriptions = [];
    hasPerformedLookup = false;
    
    try {
      // Add realistic delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch(`/api/subscribe?email=${encodeURIComponent(email.trim())}`);
      
      const result = await response.json();
      
      if (response.ok) {
        subscriptions = result.subscriptions || [];
        if (subscriptions.length === 0) {
          showMessage('No active subscriptions found for this email address.', 'info');
        } else {
          showMessage(`Found ${subscriptions.length} active subscription${subscriptions.length === 1 ? '' : 's'}.`, 'success');
        }
      } else {
        showMessage(result.error || 'Failed to lookup subscriptions.', 'error');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      isLoadingSubscriptions = false;
      hasPerformedLookup = true;
    }
  }
  
  async function handleUnsubscribe(subscriptionId: string, docketNumber: string) {
    unsubscribeLoading = new Set([...unsubscribeLoading, subscriptionId]);
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          docket_number: docketNumber,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove from local list
        subscriptions = subscriptions.filter(sub => sub.id !== subscriptionId);
        showMessage(`Successfully unsubscribed from docket ${docketNumber}.`, 'success');
        
        if (subscriptions.length === 0) {
          showMessage('You have no remaining active subscriptions.', 'info');
        }
      } else {
        showMessage(result.message || result.error || 'Failed to unsubscribe.', 'error');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      unsubscribeLoading = new Set([...unsubscribeLoading].filter(id => id !== subscriptionId));
    }
  }
  
  function showMessage(text: string, type: 'success' | 'error' | 'info') {
    message = text;
    messageType = type;
    
    // Auto-clear success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        message = '';
      }, 5000);
    }
  }
  
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLookup();
    }
  }
  
  function isUnsubscribeLoading(subscriptionId: string): boolean {
    return unsubscribeLoading.has(subscriptionId);
  }
</script>

<Card variant="default" padding={compact ? "md" : "lg"} elevation="md">
  <div class="manage-subscriptions" class:compact>
    <div class="form-header">
      <h2 class="form-title">
        {compact ? 'Manage Subscriptions' : 'Manage Your Docket Subscriptions'}
      </h2>
      {#if !compact}
        <p class="form-subtitle">
          Enter your email address to view and manage your active FCC docket subscriptions.
        </p>
      {/if}
    </div>
    
    {#if message}
      <div class="message message--{messageType}" role="alert">
        <span class="message-icon">
          {#if messageType === 'success'}✓{:else if messageType === 'error'}⚠{:else}ℹ{/if}
        </span>
        <span class="message-text">{message}</span>
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleLookup} class="lookup-form">
      <div class="form-group">
        <label for="lookup-email" class="form-label">
          Email Address <span class="required">*</span>
        </label>
        <div class="input-group">
          <input
            id="lookup-email"
            type="email"
            class="form-input"
            placeholder="your.email@company.com"
            bind:value={email}
            on:keypress={handleKeyPress}
            disabled={isLoadingSubscriptions}
            required
          />
          <Button 
            type="submit"
            variant="primary"
            loading={isLoadingSubscriptions}
            disabled={isLoadingSubscriptions || !email.trim()}
          >
            {isLoadingSubscriptions ? 'Looking up...' : 'Lookup'}
          </Button>
        </div>
        <span class="form-hint">We'll show all active subscriptions for this email</span>
      </div>
    </form>
    
    {#if subscriptions.length > 0}
      <div class="subscriptions-section">
        <h3 class="subscriptions-title">Your Active Subscriptions</h3>
        
        {#if !compact}
          <div class="upgrade-note upgrade-note--top">
            <span class="upgrade-icon">⭐</span>
            <span class="upgrade-text">
              Want AI summaries and unlimited dockets? 
              <a href="/pricing" class="upgrade-link">Upgrade to Pro</a>
            </span>
          </div>
        {/if}
        
        <div class="subscriptions-list">
          {#each subscriptions as subscription}
            <div class="subscription-item">
              <div class="subscription-info">
                <div class="docket-number">
                  Docket {subscription.docket_number}
                </div>
                <div class="subscribe-date">
                  Subscribed on {formatDate(subscription.created_at)}
                </div>
              </div>
              
              <div class="subscription-actions">
                <Button
                  variant="outline"
                  size="sm"
                  loading={isUnsubscribeLoading(subscription.id)}
                  disabled={isUnsubscribeLoading(subscription.id)}
                  on:click={() => handleUnsubscribe(subscription.id, subscription.docket_number)}
                >
                  {isUnsubscribeLoading(subscription.id) ? 'Removing...' : 'Unsubscribe'}
                </Button>
              </div>
            </div>
          {/each}
        </div>
        
        <div class="subscriptions-footer">
          <div class="subscription-stats">
            <span class="stats-icon">📊</span>
            <span class="stats-text">
              Managing {subscriptions.length} active subscription{subscriptions.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    {/if}
    
    {#if !isLoadingSubscriptions && subscriptions.length === 0 && email.trim() && hasPerformedLookup}
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">No Subscriptions Found</h3>
        <p class="empty-description">
          We couldn't find any active subscriptions for this email address.
        </p>
        <div class="empty-actions">
          <Button href="/" variant="primary">
            Start Monitoring Dockets
          </Button>
        </div>
      </div>
    {/if}
  </div>
</Card>

<style>
  .manage-subscriptions {
    width: 100%;
  }
  
  .manage-subscriptions.compact .form-header {
    margin-bottom: var(--spacing-md);
  }
  
  .form-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }
  
  .form-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .manage-subscriptions.compact .form-title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-xs);
  }
  
  .form-subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    margin: 0;
    line-height: 1.5;
  }
  
  .message {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  
  .message--success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  
  .message--error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  
  .message--info {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  
  .message-icon {
    flex-shrink: 0;
    font-weight: var(--font-weight-bold);
  }
  
  .lookup-form {
    margin-bottom: var(--spacing-xl);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }
  
  .required {
    color: #ef4444;
  }
  
  .input-group {
    display: flex;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .form-input {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    font-family: var(--font-family);
    transition: all var(--transition-normal);
    background: var(--color-surface);
  }
  
  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-background);
  }
  
  .form-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: var(--spacing-xs);
  }
  
  .subscriptions-section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-lg);
  }
  
  .subscriptions-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-md);
  }
  
  .subscriptions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }
  
  .subscription-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background);
    transition: all var(--transition-normal);
  }
  
  .subscription-item:hover {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }
  
  .subscription-info {
    flex: 1;
  }
  
  .docket-number {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    margin-bottom: 0.25rem;
  }
  
  .subscribe-date {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  
  .subscriptions-footer {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: center;
  }
  
  .subscription-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
  
  .stats-icon {
    color: var(--color-primary);
  }
  
  .upgrade-note {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .upgrade-note--top {
    background: rgba(16, 185, 129, 0.05);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    border: 1px solid rgba(16, 185, 129, 0.2);
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-sm);
  }
  
  .upgrade-icon {
    color: var(--color-primary);
  }
  
  .upgrade-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-semibold);
  }
  
  .upgrade-link:hover {
    text-decoration: underline;
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-md);
    border-top: 1px solid var(--color-border);
    margin-top: var(--spacing-lg);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .empty-description {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.5;
  }
  
  .empty-actions {
    margin-top: var(--spacing-md);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .input-group {
      flex-direction: column;
    }
    
    .subscription-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
    
    .subscription-actions {
      width: 100%;
    }
    
    .subscriptions-footer {
      text-align: center;
    }
  }
</style> 