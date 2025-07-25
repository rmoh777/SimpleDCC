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
  
  async function handleToggle(newFrequency: string) {
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

<div class="creative-toggle-container">
  <div class="toggle-wrapper" class:disabled class:loading={isLoading}>
    <!-- Background track -->
    <div class="toggle-track">
      <!-- Sliding pill background -->
      <div class="sliding-pill" class:immediate={isImmediate}></div>
      
      <!-- Option buttons -->
      <button 
        class="option-btn daily" 
        class:active={!isImmediate}
        disabled={disabled || isLoading}
        on:click={() => handleToggle('daily')}
      >
        <span class="option-icon">📅</span>
        <span class="option-text">Daily</span>
      </button>
      
      <button 
        class="option-btn immediate" 
        class:active={isImmediate}
        class:disabled={isImmediateDisabled}
        disabled={disabled || isLoading || isImmediateDisabled}
        on:click={() => handleToggle('immediate')}
      >
        <span class="option-icon">⚡</span>
        <span class="option-text">Immediate</span>
      </button>
    </div>
    
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
  .creative-toggle-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }
  
  .toggle-wrapper {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .toggle-wrapper:hover:not(.disabled) {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
    transform: translateY(-1px);
  }
  
  .toggle-wrapper.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .toggle-track {
    position: relative;
    display: flex;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    border-radius: 24px;
    padding: 3px;
    width: 180px;
    height: 44px;
  }
  
  .sliding-pill {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 85px;
    height: 34px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }
  
  .sliding-pill.immediate {
    transform: translateX(86px);
  }
  
  .option-btn {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    border: none;
    border-radius: 20px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .option-btn:disabled {
    cursor: not-allowed;
  }
  
  .option-btn.active {
    color: white;
    font-weight: 600;
  }
  
  .option-btn.disabled {
    opacity: 0.5;
  }
  
  .option-icon {
    font-size: 1rem;
    transition: transform 0.3s ease;
  }
  
  .option-btn:hover:not(:disabled) .option-icon {
    transform: scale(1.1);
  }
  
  .option-text {
    font-size: 0.875rem;
    white-space: nowrap;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24px;
    z-index: 3;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    padding: 6px 12px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .toggle-track {
      width: 160px;
      height: 40px;
    }
    
    .sliding-pill {
      width: 75px;
      height: 30px;
    }
    
    .sliding-pill.immediate {
      transform: translateX(76px);
    }
    
    .option-text {
      font-size: 0.8rem;
    }
  }
</style> 