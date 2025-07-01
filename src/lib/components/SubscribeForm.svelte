<script lang="ts">
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  
  export let compact: boolean = false;
  
  let email = '';
  let docketNumber = '';
  let isLoading = false;
  let message = '';
  let messageType: 'success' | 'error' | 'info' = 'info';
  
  async function handleSubmit() {
    if (!email.trim() || !docketNumber.trim()) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    if (!isValidDocketNumber(docketNumber)) {
      showMessage('Please enter a valid docket number (e.g., 21-402)', 'error');
      return;
    }
    
    isLoading = true;
    message = '';
    
    try {
      // ✨ UX ENHANCEMENT: Brief delay for better perceived performance
      // Ensures users see loading state and feel confident the action is processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          docket_number: docketNumber.trim(),
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showMessage(result.message || 'Successfully subscribed to docket notifications!', 'success');
        // Reset form on success
        email = '';
        docketNumber = '';
      } else {
        showMessage(result.error || 'Failed to subscribe. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      isLoading = false;
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
  
  function isValidDocketNumber(docket: string): boolean {
    // Accept formats like: 21-402, 2021-402, etc.
    const docketRegex = /^\d{2,4}-\d{1,4}$/;
    return docketRegex.test(docket.trim());
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<Card variant="default" padding={compact ? "md" : "lg"} elevation="md">
  <div class="subscribe-form" class:compact>
    <div class="form-header">
      <h2 class="form-title">
        {compact ? 'Subscribe to Docket' : 'Start Monitoring FCC Dockets'}
      </h2>
      {#if !compact}
        <p class="form-subtitle">
          Get instant notifications when new filings are published for any FCC docket.
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
    
    <form on:submit|preventDefault={handleSubmit} class="form">
      <div class="form-grid" class:compact>
        <div class="form-group">
          <label for="docket-number" class="form-label">
            Docket Number <span class="required">*</span>
          </label>
          <input
            id="docket-number"
            type="text"
            class="form-input"
            placeholder="e.g., 21-402"
            bind:value={docketNumber}
            on:keypress={handleKeyPress}
            disabled={isLoading}
            required
          />
          <span class="form-hint">Enter the FCC docket number you want to monitor</span>
        </div>
        
        <div class="form-group">
          <label for="email" class="form-label">
            Email Address <span class="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            class="form-input"
            placeholder="your.email@company.com"
            bind:value={email}
            on:keypress={handleKeyPress}
            disabled={isLoading}
            required
          />
          <span class="form-hint">Where you'll receive docket notifications</span>
        </div>
      </div>
      
      <div class="form-actions">
        <Button 
          type="submit"
          variant="primary"
          size={compact ? "md" : "lg"}
          loading={isLoading}
          disabled={isLoading || !email.trim() || !docketNumber.trim()}
          style="width: 100%;"
        >
          {isLoading ? 'Subscribing...' : 'Start Monitoring'}
        </Button>
      </div>
    </form>
    
    <div class="form-footer">
      <div class="security-note">
        <span class="security-icon">🔒</span>
        <span class="security-text">
          Your email is secure and will only be used for docket notifications.
        </span>
      </div>
      
      {#if !compact}
        <div class="features-preview">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <span>Instant notifications</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🤖</span>
            <span>AI summaries (Pro)</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📱</span>
            <span>Mobile alerts</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</Card>

<style>
  .subscribe-form {
    width: 100%;
  }
  
  .subscribe-form.compact .form-header {
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
  
  .subscribe-form.compact .form-title {
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
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }
  
  .form-grid.compact {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
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
  
  .form-input {
    width: 100%;
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
  
  .form-actions {
    margin-bottom: var(--spacing-lg);
  }
  
  .form-footer {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-lg);
  }
  
  .security-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }
  
  .security-icon {
    color: var(--color-primary);
  }
  
  .security-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .features-preview {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
  }
  
  .feature {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
  
  .feature-icon {
    color: var(--color-primary);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .form-grid:not(.compact) {
      grid-template-columns: 1fr;
    }
    
    .features-preview {
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
    }
  }
</style> 