<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  let selectedTemplate = 'daily_digest';
  let selectedTier = 'pro';
  let recipientEmail = 'your-email@example.com';
  let cronWorkerUrl = 'https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev';
  let adminSecret = '';
  let isLoading = false;
  let result: any = null;

  const templates = [
    { value: 'daily_digest', label: 'Daily Digest' },
    { value: 'filing_alert', label: 'Filing Alert' }, 
    { value: 'welcome', label: 'Welcome Email' }
  ];

  const tiers = [
    { value: 'free', label: 'Free Tier' },
    { value: 'trial', label: 'Trial Tier' },
    { value: 'pro', label: 'Pro Tier' }
  ];

  async function sendTestEmail() {
    if (!adminSecret.trim()) {
      result = { success: false, error: 'Admin secret is required' };
      return;
    }

    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      result = { success: false, error: 'Valid recipient email is required' };
      return;
    }

    isLoading = true;
    result = null;

    try {
      const response = await fetch(`${cronWorkerUrl}/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          template_type: selectedTemplate,
          recipient_email: recipientEmail,
          user_tier: selectedTier
        })
      });

      result = await response.json();
      
      // Add response status info for better debugging
      result.status_code = response.status;
      result.status_ok = response.ok;
      
    } catch (error) {
      result = { 
        success: false, 
        error: error.message,
        status_code: 0,
        status_ok: false
      };
    } finally {
      isLoading = false;
    }
  }

  function clearResult() {
    result = null;
  }
</script>

<svelte:head>
  <title>Email System Testing - SimpleDCC Admin</title>
</svelte:head>

<div class="test-dashboard">
  <header class="test-header">
    <h1>📧 Email System Testing</h1>
    <p>Test email templates by sending directly through the cron-worker</p>
  </header>

  <!-- Configuration -->
  <Card>
    <div slot="header">
      <h2>⚙️ Configuration</h2>
    </div>
    
    <div class="config-form">
      <div class="form-row">
        <div class="form-group">
          <label for="cronWorkerUrl">Cron Worker URL</label>
          <input 
            id="cronWorkerUrl"
            bind:value={cronWorkerUrl} 
            placeholder="https://your-worker.workers.dev"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="adminSecret">Admin Secret</label>
          <input 
            id="adminSecret"
            type="password"
            bind:value={adminSecret} 
            placeholder="Your CRON_SECRET value"
            class="form-input"
          />
        </div>
      </div>
    </div>
  </Card>

  <!-- Email Template Testing -->
  <Card>
    <div slot="header">
      <h2>📬 Email Template Testing</h2>
    </div>
    
    <div class="config-form">
      <div class="form-row">
        <div class="form-group">
          <label for="template">Template Type</label>
          <select id="template" bind:value={selectedTemplate} class="form-select">
            {#each templates as template}
              <option value={template.value}>{template.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="tier">User Tier</label>
          <select id="tier" bind:value={selectedTier} class="form-select">
            {#each tiers as tier}
              <option value={tier.value}>{tier.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="email">Recipient Email</label>
          <input 
            id="email"
            type="email" 
            bind:value={recipientEmail} 
            placeholder="test@example.com"
            class="form-input"
          />
        </div>
        
        <div class="form-group button-group">
          <Button 
            on:click={sendTestEmail}
            disabled={isLoading}
            variant="primary"
          >
            {#if isLoading}
              <LoadingSpinner size="sm" /> Sending...
            {:else}
              Send Test Email
            {/if}
          </Button>
          
          {#if result}
            <Button 
              on:click={clearResult}
              variant="secondary"
            >
              Clear Result
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </Card>

  <!-- Results -->
  {#if result}
    <Card>
      <div slot="header">
        <h2>📋 Test Results</h2>
      </div>
      
      {#if result.success}
        <div class="result-box success">
          <div class="success-header">
            <span class="status-icon">✅</span>
            <h3>Email Sent Successfully!</h3>
          </div>
          
          <div class="result-details">
            <div class="detail-row">
              <span class="detail-label">Template:</span>
              <span class="detail-value">{result.template_type}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subject:</span>
              <span class="detail-value">{result.subject}</span>
            </div>
            {#if result.email_id}
              <div class="detail-row">
                <span class="detail-label">Email ID:</span>
                <span class="detail-value">{result.email_id}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="detail-label">Message:</span>
              <span class="detail-value">{result.message}</span>
            </div>
          </div>
        </div>
      {:else}
        <div class="result-box error">
          <div class="error-header">
            <span class="status-icon">❌</span>
            <h3>Email Failed</h3>
          </div>
          
          <div class="result-details">
            <div class="detail-row">
              <span class="detail-label">Error:</span>
              <span class="detail-value error-text">{result.error || 'Unknown error'}</span>
            </div>
            {#if result.status_code}
              <div class="detail-row">
                <span class="detail-label">Status Code:</span>
                <span class="detail-value">{result.status_code}</span>
              </div>
            {/if}
            {#if result.template_type}
              <div class="detail-row">
                <span class="detail-label">Template:</span>
                <span class="detail-value">{result.template_type}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </Card>
  {/if}

  <!-- Instructions -->
  <Card>
    <div slot="header">
      <h2>📖 Instructions</h2>
    </div>
    
    <div class="instructions">
      <div class="instruction-section">
        <h3>🔧 Setup</h3>
        <ul>
          <li>Enter your cron worker URL (e.g., https://your-worker.workers.dev)</li>
          <li>Enter your CRON_SECRET value (from your environment variables)</li>
          <li>Select the email template type you want to test</li>
          <li>Choose the user tier to see tier-specific content</li>
          <li>Enter a valid recipient email address</li>
        </ul>
      </div>

      <div class="instruction-section">
        <h3>📧 Template Types</h3>
        <ul>
          <li><strong>Daily Digest:</strong> Tests the daily summary email with multiple filings</li>
          <li><strong>Filing Alert:</strong> Tests immediate notification for a single filing</li>
          <li><strong>Welcome Email:</strong> Tests subscription confirmation email</li>
        </ul>
      </div>

      <div class="instruction-section">
        <h3>👥 User Tiers</h3>
        <ul>
          <li><strong>Free:</strong> Basic content with upgrade prompts</li>
          <li><strong>Trial:</strong> Full content with trial reminders</li>
          <li><strong>Pro:</strong> Full content without banners</li>
        </ul>
      </div>
    </div>
  </Card>
</div>

<style>
  .test-dashboard {
    space-y: var(--spacing-6);
  }

  .test-header {
    margin-bottom: var(--spacing-6);
  }

  .test-header h1 {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-2) 0;
  }

  .test-header p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
    margin: 0;
  }

  .config-form {
    space-y: var(--spacing-4);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.button-group {
    display: flex;
    flex-direction: row;
    align-items: end;
    gap: var(--spacing-2);
  }

  .form-group label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-2);
  }

  .form-input, .form-select {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    transition: var(--transition-fast);
  }

  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
  }

  .result-box {
    padding: var(--spacing-4);
    border-radius: var(--border-radius);
    border: 1px solid;
    margin-bottom: var(--spacing-4);
  }

  .result-box.success {
    background-color: var(--color-success-bg);
    border-color: var(--color-success);
    color: var(--color-success-text);
  }

  .result-box.error {
    background-color: var(--color-error-bg);
    border-color: var(--color-error);
    color: var(--color-error-text);
  }

  .success-header, .error-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-3);
  }

  .success-header h3, .error-header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .status-icon {
    font-size: var(--font-size-xl);
  }

  .result-details {
    space-y: var(--spacing-2);
  }

  .detail-row {
    display: flex;
    gap: var(--spacing-2);
  }

  .detail-label {
    font-weight: 500;
    min-width: 100px;
    flex-shrink: 0;
  }

  .detail-value {
    flex: 1;
    word-break: break-all;
  }

  .error-text {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }

  .instructions {
    space-y: var(--spacing-4);
  }

  .instruction-section h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-2) 0;
  }

  .instruction-section ul {
    margin: 0;
    padding-left: var(--spacing-4);
    space-y: var(--spacing-1);
  }

  .instruction-section li {
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .form-group.button-group {
      flex-direction: column;
      align-items: stretch;
    }
  }

  /* Space-y utility */
  .test-dashboard > * + * {
    margin-top: var(--spacing-6);
  }

  .config-form > * + * {
    margin-top: var(--spacing-4);
  }

  .result-details > * + * {
    margin-top: var(--spacing-2);
  }

  .instructions > * + * {
    margin-top: var(--spacing-4);
  }

  .instruction-section ul > * + * {
    margin-top: var(--spacing-1);
  }
</style> 