<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let frequency: string = 'daily';
  export let userTier: string = 'free';
  export let disabled: boolean = false;
  export let email: string = '';
  export let docketNumber: string = '';
  
  const dispatch = createEventDispatcher<{change: {frequency: string}}>();
  
  let isLoading: boolean = false;
  let errorMessage: string = '';
  
  $: isImmediate = frequency === 'immediate';
  $: canUseImmediate = userTier === 'pro' || userTier === 'trial';
  $: isImmediateDisabled = !canUseImmediate && !isImmediate;
  
  async function handleSelection(newFrequency: string) {
    if (disabled || isLoading || frequency === newFrequency) return;
    
    // Check if user can switch to immediate
    if (newFrequency === 'immediate' && !canUseImmediate) {
      errorMessage = 'Upgrade to Pro for immediate notifications';
      setTimeout(() => errorMessage = '', 3000);
      return;
    }
    
    errorMessage = '';
    
    try {
      isLoading = true;
      
      const response = await fetch('/api/subscriptions/frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          docket_number: docketNumber,
          frequency: newFrequency
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        frequency = newFrequency;
        dispatch('change', { frequency: newFrequency });
      } else {
        errorMessage = result.error?.includes('Pro subscription') 
          ? 'Upgrade to Pro for immediate notifications'
          : 'Please try again later';
        setTimeout(() => errorMessage = '', 3000);
      }
    } catch (error) {
      errorMessage = 'Please check connection and try again';
      setTimeout(() => errorMessage = '', 3000);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="saas-toggle-container">
  <div class="frequency-cards" class:disabled class:loading={isLoading}>
    <!-- Daily Card -->
    <button 
      class="frequency-card daily"
      class:active={!isImmediate}
      disabled={disabled || isLoading}
      on:click={() => handleSelection('daily')}
    >
      <div class="card-icon">📅</div>
      <div class="card-content">
        <div class="card-title">Daily Digest</div>
        <div class="card-description">Perfect for most users</div>
      </div>
      <div class="card-indicator" class:visible={!isImmediate}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </button>
    
    <!-- Immediate Card -->
    <button 
      class="frequency-card immediate"
      class:active={isImmediate}
      class:disabled={isImmediateDisabled}
      disabled={disabled || isLoading || isImmediateDisabled}
      on:click={() => handleSelection('immediate')}
    >
      <div class="card-icon">⚡</div>
      <div class="card-content">
        <div class="card-title">
          Immediate Alerts
          {#if isImmediateDisabled}
            <span class="pro-badge">PRO</span>
          {/if}
        </div>
        <div class="card-description">Real-time notifications</div>
      </div>
      <div class="card-indicator" class:visible={isImmediate}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </button>
    
    {#if isLoading}
      <div class="loading-overlay">
        <div class="spinner"></div>
      </div>
    {/if}
  </div>
  
  {#if errorMessage}
    <div class="error-message">
      ⚠️ {errorMessage}
    </div>
  {/if}
</div>

<style>
  .saas-toggle-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }
  
  .frequency-cards {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 340px;
  }
  
  .frequency-cards.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .frequency-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: inherit;
    text-align: left;
    min-height: 80px;
  }
  
  .frequency-card:hover:not(:disabled):not(.disabled) {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  .frequency-card.active {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
  }
  
  .frequency-card.disabled {
    cursor: not-allowed;
    background: #f8fafc;
    border-color: #e2e8f0;
  }
  
  .card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }
  
  .frequency-card:hover:not(:disabled) .card-icon {
    transform: scale(1.1);
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
  }
  
  .card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .pro-badge {
    font-size: 0.6rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .card-description {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.3;
  }
  
  .frequency-card.disabled .card-title,
  .frequency-card.disabled .card-description {
    color: #9ca3af;
  }
  
  .card-indicator {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: transparent;
    transition: all 0.25s ease;
  }
  
  .card-indicator.visible {
    background: #10b981;
    color: white;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 1;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    align-self: center;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .frequency-cards {
      width: 100%;
      max-width: 320px;
      gap: 8px;
    }
    
    .frequency-card {
      padding: 12px;
      min-height: 70px;
    }
    
    .card-icon {
      font-size: 1.25rem;
    }
    
    .card-title {
      font-size: 0.8rem;
    }
    
    .card-description {
      font-size: 0.7rem;
    }
  }
</style> 