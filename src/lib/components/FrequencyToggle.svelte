<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let frequency: string = 'daily';
  export let userTier: string = 'free';
  export let disabled: boolean = false;
  export let size: string = 'normal';
  export let email: string = '';
  export let docketNumber: string = '';
  
  const dispatch = createEventDispatcher<{change: {frequency: string}}>();
  
  let isLoading: boolean = false;
  let errorMessage: string = '';
  let errorTimeout: NodeJS.Timeout;
  
  $: isHourly = frequency === 'immediate';
  $: canUseHourly = userTier === 'pro' || userTier === 'trial';
  $: isHourlyDisabled = !canUseHourly && !isHourly;
  
  async function handleToggle() {
    if (disabled || isLoading) return;
    
    const newFrequency = isHourly ? 'daily' : 'immediate';
    
    // Check if user can switch to hourly
    if (newFrequency === 'immediate' && !canUseHourly) {
      showError('Upgrade to Pro for hourly notifications');
      return;
    }
    
    // Clear any existing error
    clearError();
    
    try {
      isLoading = true;
      
      const response = await fetch('/api/subscriptions/frequency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        if (result.error?.includes('Pro subscription required')) {
          showError('Upgrade to Pro for hourly notifications');
        } else {
          showError('Please try again later');
        }
      }
    } catch (error) {
      console.error('Frequency update error:', error);
      showError('Please check connection and try again');
    } finally {
      isLoading = false;
    }
  }
  
  function showError(message: string) {
    errorMessage = message;
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = '';
    }, 5000);
  }
  
  function clearError() {
    errorMessage = '';
    clearTimeout(errorTimeout);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  }
</script>

<div class="frequency-toggle-container">
  <div 
    class="frequency-toggle" 
    class:loading={isLoading}
    class:disabled={disabled}
    class:compact={size === 'compact'}
    role="switch"
    aria-checked={isHourly}
    aria-label="Notification frequency toggle"
    tabindex="0"
    on:click={handleToggle}
    on:keydown={handleKeydown}
    title={isHourlyDisabled ? 'Upgrade to Pro for hourly notifications' : ''}
  >
    <div class="toggle-track" class:hourly={isHourly}>
      <span class="toggle-label left" class:active={!isHourly}>Daily</span>
      <span class="toggle-label right" class:active={isHourly} class:disabled={isHourlyDisabled}>Hourly</span>
      
      <div class="toggle-slider" class:hourly={isHourly}>
        {#if isLoading}
          <div class="loading-spinner"></div>
        {/if}
      </div>
    </div>
  </div>
  
  {#if errorMessage}
    <div class="frequency-error">
      ⚠️ {errorMessage}
    </div>
  {/if}
</div>

<style>
  .frequency-toggle-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .frequency-toggle {
    position: relative;
    cursor: pointer;
    outline: none;
    transition: all 0.3s ease;
  }
  
  .frequency-toggle:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
  
  .frequency-toggle.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .frequency-toggle.loading {
    cursor: wait;
  }
  
  .toggle-track {
    position: relative;
    width: 120px;
    height: 32px;
    background: #f3f4f6;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .toggle-track.hourly {
    background: #10b981;
    border-color: #059669;
  }
  
  .compact .toggle-track {
    width: 100px;
    height: 28px;
    border-radius: 14px;
  }
  
  .toggle-label {
    position: relative;
    z-index: 2;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.3s ease;
    padding: 0 8px;
    white-space: nowrap;
    pointer-events: none;
    line-height: 1;
  }
  
  .compact .toggle-label {
    font-size: 0.7rem;
    padding: 0 6px;
  }
  
  .toggle-label.active {
    color: white;
    font-weight: 600;
  }
  
  .toggle-label.disabled {
    opacity: 0.5;
  }
  
  .toggle-label.left {
    margin-left: 2px;
  }
  
  .toggle-label.right {
    margin-right: 2px;
  }
  
  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 56px;
    height: 26px;
    background: white;
    border-radius: 13px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  
  .compact .toggle-slider {
    width: 46px;
    height: 22px;
    border-radius: 11px;
  }
  
  .toggle-slider.hourly {
    transform: translateX(60px);
  }
  
  .compact .toggle-slider.hourly {
    transform: translateX(50px);
  }
  
  .loading-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .compact .loading-spinner {
    width: 10px;
    height: 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .frequency-error {
    margin-top: 4px;
    padding: 4px 8px;
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .frequency-toggle-container {
      align-items: center;
      margin: 0.5rem 0;
    }
    
    .toggle-track {
      width: 110px;
      height: 30px;
    }
    
    .toggle-slider {
      width: 52px;
      height: 24px;
    }
    
    .toggle-slider.hourly {
      transform: translateX(54px);
    }
  }
</style> 