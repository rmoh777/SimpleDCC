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
      errorMessage = 'Immediate notifications require a Pro subscription';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await fetch('/api/update-frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          docketNumber,
          frequency: newFrequency
        })
      });
      
      if (response.ok) {
        frequency = newFrequency;
        dispatch('change', { frequency: newFrequency });
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to update frequency';
      }
    } catch (error) {
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="frequency-toggle saas">
  <div class="selection-grid">
    <button 
      class="option-card daily" 
      class:active={!isImmediate}
      class:disabled={disabled || isLoading}
      on:click={() => handleSelection('daily')}
      disabled={disabled || isLoading}
    >
      <div class="card-header">
        <span class="icon">📅</span>
        <h3>Daily Digest</h3>
      </div>
      <p class="description">Perfect for most users</p>
      <p class="details">Delivered each morning at 9 AM</p>
      <div class="active-indicator" class:show={!isImmediate}>
        <span>✓</span>
      </div>
    </button>
    
    <button 
      class="option-card immediate" 
      class:active={isImmediate}
      class:disabled={disabled || isLoading || isImmediateDisabled}
      on:click={() => handleSelection('immediate')}
      disabled={disabled || isLoading || isImmediateDisabled}
    >
      <div class="card-header">
        <span class="icon">⚡</span>
        <h3>Immediate Alerts</h3>
        {#if isImmediateDisabled}
          <span class="pro-badge">PRO</span>
        {/if}
      </div>
      <p class="description">Real-time notifications</p>
      <p class="details">Sent within the hour of new filings</p>
      <div class="active-indicator" class:show={isImmediate}>
        <span>✓</span>
      </div>
    </button>
  </div>
  
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}
  
  {#if isImmediateDisabled}
    <div class="upgrade-notice">
      <span class="icon">🔒</span>
      Upgrade to Pro for immediate notifications
    </div>
  {/if}
</div>

<style>
  .frequency-toggle.saas {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .selection-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 500px;
  }
  
  .option-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    min-height: 140px;
  }
  
  .option-card:hover:not(.disabled) {
    border-color: #10b981;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
  }
  
  .option-card.active {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
  }
  
  .option-card.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    width: 100%;
  }
  
  .card-header h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    flex: 1;
  }
  
  .icon {
    font-size: 1.5rem;
  }
  
  .pro-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .description {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }
  
  .details {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }
  
  .active-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.875rem;
    font-weight: 700;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .active-indicator.show {
    opacity: 1;
    transform: scale(1);
  }
  
  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    max-width: 500px;
  }
  
  .upgrade-notice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f59e0b;
    font-size: 0.875rem;
    background: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    max-width: 500px;
  }
  
  .upgrade-notice .icon {
    font-size: 1rem;
  }
  
  /* Mobile responsive */
  @media (max-width: 640px) {
    .selection-grid {
      grid-template-columns: 1fr;
    }
    
    .option-card {
      min-height: 120px;
      padding: 1.25rem;
    }
  }
</style> 