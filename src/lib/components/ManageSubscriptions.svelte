<script lang="ts">
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  
  export let compact: boolean = false;
  
  let email = '';
  let subscriptions: Array<{
    id: string;
    docket_number: string;
    created_at: number;
    frequency: string;
    user_tier: string;
  }> = [];
  let isLoading = false;
  let isLoadingSubscriptions = false;
  let message = '';
  let messageType: 'success' | 'error' | 'info' = 'info';
  let unsubscribeLoading: Set<string> = new Set();
  let frequencyUpdating: Set<string> = new Set();
  let hasPerformedLookup = false;
  let userTier = 'free';
  
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
        userTier = result.user_tier || 'free';
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
  
  async function handleFrequencyUpdate(subscriptionId: string, docketNumber: string, newFrequency: string) {
    // Check if user tier allows this frequency
    if (userTier === 'free' && newFrequency !== 'daily') {
      showMessage('Pro subscription required for hourly and immediate notifications. Please upgrade to Pro.', 'error');
      return;
    }
    
    frequencyUpdating = new Set([...frequencyUpdating, subscriptionId]);
    
    try {
      const response = await fetch('/api/subscriptions/frequency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          docket_number: docketNumber,
          frequency: newFrequency,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Update local subscription
        subscriptions = subscriptions.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, frequency: newFrequency }
            : sub
        );
        showMessage(`Updated notification frequency for docket ${docketNumber} to ${newFrequency}.`, 'success');
      } else {
        showMessage(result.error || 'Failed to update frequency.', 'error');
      }
    } catch (error) {
      console.error('Frequency update error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      frequencyUpdating = new Set([...frequencyUpdating].filter(id => id !== subscriptionId));
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
  
  function isFrequencyUpdating(subscriptionId: string): boolean {
    return frequencyUpdating.has(subscriptionId);
  }
  
  function getTierBadge(tier: string): { text: string; class: string } {
    switch (tier) {
      case 'pro':
        return { text: 'Pro', class: 'tier-badge--pro' };
      case 'trial':
        return { text: 'Trial', class: 'tier-badge--trial' };
      default:
        return { text: 'Free', class: 'tier-badge--free' };
    }
  }
  
  function getFrequencyOptions(tier: string) {
    const options = [
      { value: 'daily', label: 'Daily', available: true }
    ];
    
    if (tier === 'pro' || tier === 'trial') {
      options.push(
        { value: 'weekly', label: 'Weekly', available: true },
        { value: 'immediate', label: 'Immediate', available: true }
      );
    } else {
      options.push(
        { value: 'weekly', label: 'Weekly (Pro)', available: false },
        { value: 'immediate', label: 'Immediate (Pro)', available: false }
      );
    }
    
    return options;
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
        <div class="subscriptions-header">
          <h3 class="subscriptions-title">Your Active Subscriptions</h3>
          <div class="user-tier-badge">
            {#if userTier === 'pro'}
              <span class="tier-badge tier-badge--pro">Pro</span>
            {:else if userTier === 'trial'}
              <span class="tier-badge tier-badge--trial">Trial</span>
            {:else}
              <span class="tier-badge tier-badge--free">Free</span>
            {/if}
          </div>
        </div>
        
        {#if !compact && userTier === 'free'}
          <div class="upgrade-note upgrade-note--top">
            <span class="upgrade-icon">⭐</span>
            <span class="upgrade-text">
              Want AI summaries and immediate notifications? 
              <a href="/pricing" class="upgrade-link">Upgrade to Pro</a>
            </span>
          </div>
        {/if}
        
        {#if !compact && userTier === 'trial'}
          <div class="trial-note">
            <span class="trial-icon">🎁</span>
            <span class="trial-text">
              You're in a Pro trial! Enjoy AI summaries and all notification frequencies.
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
              
              <div class="subscription-controls">
                <div class="frequency-control">
                  <label 
                    class="frequency-label" 
                    for="frequency-toggle-{subscription.id}"
                  >
                    Notification Frequency
                  </label>
                  <div 
                    class="frequency-toggle-wrap"
                    title={userTier === 'free' ? 'Upgrade to Pro for Immediate alerts' : ''}
                  >
                    <label class="toggle-switch" for="frequency-toggle-{subscription.id}">
                      <input 
                        type="checkbox" 
                        id="frequency-toggle-{subscription.id}"
                        checked={subscription.frequency === 'immediate'}
                        disabled={isFrequencyUpdating(subscription.id) || userTier === 'free'}
                        on:change={(e) => handleFrequencyUpdate(subscription.id, subscription.docket_number, e.currentTarget.checked ? 'immediate' : 'daily')}
                      />
                      <span class="slider">
                        <span class="toggle-text-daily">Daily</span>
                        <span class="toggle-text-immediate">Immediate</span>
                      </span>
                    </label>
                  </div>
                  {#if isFrequencyUpdating(subscription.id)}
                    <span class="frequency-updating">Updating...</span>
                  {/if}
                </div>
                
                {#if userTier === 'free'}
                  <div class="frequency-upgrade-note">
                    <span class="upgrade-icon">⭐</span>
                    <a href="/pricing">Upgrade to Pro</a> for Immediate alerts
                  </div>
                {/if}
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
  
  .subscriptions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
  
  .subscriptions-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-secondary);
    margin: 0;
  }
  
  .user-tier-badge {
    display: flex;
    align-items: center;
  }
  
  .tier-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .tier-badge--free {
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .tier-badge--trial {
    background: #fef3c7;
    color: #92400e;
  }
  
  .tier-badge--pro {
    background: #d1fae5;
    color: #065f46;
  }
  
  .trial-note {
    background: rgba(16, 185, 129, 0.05);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    border: 1px solid rgba(16, 185, 129, 0.2);
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  
  .trial-icon {
    color: var(--color-primary);
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
    align-items: flex-start;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background);
    transition: all var(--transition-normal);
    gap: var(--spacing-md);
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
  
  .subscription-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    min-width: 150px;
  }
  
  .frequency-control {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .frequency-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-gray-300);
    margin-bottom: 0.5rem;
    display: block;
  }

  .frequency-select {
    background-color: var(--color-gray-800);
    color: var(--color-text);
    border: 1px solid var(--color-gray-600);
    border-radius: var(--border-radius);
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  
  .frequency-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .frequency-updating {
    font-size: 0.8rem;
    color: var(--color-primary);
    margin-left: 0.5rem;
  }

  .frequency-upgrade-note {
    font-size: 0.85rem;
    color: var(--color-gray-400);
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .upgrade-icon {
    color: #ffc107;
  }

  .frequency-upgrade-note a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .frequency-upgrade-note a:hover {
    text-decoration: underline;
  }
  
  .subscription-actions {
    display: flex;
    align-items: flex-start;
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
    
    .subscriptions-header {
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: flex-start;
    }
    
    .subscription-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
    
    .subscription-controls {
      width: 100%;
      min-width: auto;
    }
    
    .subscription-actions {
      width: 100%;
    }
    
    .subscriptions-footer {
      text-align: center;
    }
  }

  .frequency-toggle-wrap {
    position: relative;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 140px;
    height: 34px;
    cursor: pointer;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-gray-700);
    transition: 0.4s;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 66px;
    left: 4px;
    bottom: 4px;
    background-color: var(--color-primary);
    transition: 0.4s;
    border-radius: 34px;
    box-shadow: 0 0 4px rgba(0,0,0,0.2);
  }
  
  input:disabled + .slider {
    cursor: not-allowed;
    background-color: var(--color-gray-800);
  }
  
  input:disabled + .slider:before {
    background-color: var(--color-gray-600);
  }

  input:checked + .slider:before {
    transform: translateX(62px);
  }

  .toggle-text-daily, .toggle-text-immediate {
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 1;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  }

  .toggle-text-daily {
    left: 22px;
  }

  .toggle-text-immediate {
    right: 12px;
  }

</style> 