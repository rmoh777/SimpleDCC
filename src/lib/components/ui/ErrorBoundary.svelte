<script lang="ts">
  import { onMount } from 'svelte';
  import Button from './Button.svelte';
  import Card from './Card.svelte';
  
  export let fallback: boolean = false;
  export let error: Error | null = null;
  
  let hasError = false;
  let errorDetails = '';
  
  onMount(() => {
    if (error) {
      hasError = true;
      errorDetails = error.message;
    }
  });
  
  function handleRetry() {
    hasError = false;
    error = null;
    errorDetails = '';
    // Trigger page reload for recovery
    window.location.reload();
  }
  
  function handleReportError() {
    // This could send error details to monitoring service
    console.error('User reported error:', errorDetails);
    alert('Error report sent. Thank you for helping us improve DocketCC.');
  }
</script>

{#if hasError || fallback}
  <div class="error-boundary">
    <Card variant="default" padding="lg" elevation="md">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-description">
          We're sorry, but something unexpected happened. This error has been logged and our team will investigate.
        </p>
        
        {#if errorDetails}
          <details class="error-details">
            <summary>Technical Details</summary>
            <pre class="error-code">{errorDetails}</pre>
          </details>
        {/if}
        
        <div class="error-actions">
          <Button variant="primary" on:click={handleRetry}>
            Try Again
          </Button>
          <Button variant="outline" on:click={handleReportError}>
            Report Issue
          </Button>
        </div>
        
        <div class="error-help">
          <p>If this problem persists, please contact our support team:</p>
          <a href="/contact" class="support-link">Contact Support</a>
        </div>
      </div>
    </Card>
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
  }
  
  .error-content {
    text-align: center;
    max-width: 500px;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .error-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .error-description {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: var(--spacing-lg);
  }
  
  .error-details {
    text-align: left;
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background);
  }
  
  .error-details summary {
    padding: var(--spacing-sm) var(--spacing-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    color: var(--color-text-primary);
  }
  
  .error-details summary:hover {
    background: var(--color-border);
  }
  
  .error-code {
    padding: var(--spacing-md);
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: var(--font-size-xs);
    color: var(--color-text-primary);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    overflow-x: auto;
  }
  
  .error-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--spacing-lg);
  }
  
  .error-help {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-md);
  }
  
  .error-help p {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
  }
  
  .support-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
  }
  
  .support-link:hover {
    text-decoration: underline;
  }
</style> 