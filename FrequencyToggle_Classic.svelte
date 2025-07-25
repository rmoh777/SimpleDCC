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

<div class="classic-toggle-container">
  <fieldset class="frequency-fieldset" class:disabled class:loading={isLoading}>
    <legend class="fieldset-legend">Notification Frequency</legend>
    
    <div class="radio-options">
      <!-- Daily Option -->
      <label class="radio-option" class:disabled={disabled || isLoading}>
        <input 
          type="radio" 
          name="frequency"
          value="daily"
          checked={!isImmediate}
          disabled={disabled || isLoading}
          on:change={() => handleSelection('daily')}
        />
        <div class="radio-display">
          <div class="radio-circle" class:checked={!isImmediate}>
            {#if !isImmediate}
              <div class="radio-dot"></div>
            {/if}
          </div>
          <div class="radio-content">
            <div class="radio-title">Daily Digest</div>
            <div class="radio-description">Delivered each morning with overnight filings</div>
          </div>
        </div>
      </label>
      
      <!-- Immediate Option -->
      <label 
        class="radio-option" 
        class:disabled={disabled || isLoading || isImmediateDisabled}
        class:pro-required={isImmediateDisabled}
      >
        <input 
          type="radio" 
          name="frequency"
          value="immediate"
          checked={isImmediate}
          disabled={disabled || isLoading || isImmediateDisabled}
          on:change={() => handleSelection('immediate')}
        />
        <div class="radio-display">
          <div class="radio-circle" class:checked={isImmediate}>
            {#if isImmediate}
              <div class="radio-dot"></div>
            {/if}
          </div>
          <div class="radio-content">
            <div class="radio-title">
              Immediate Alerts
              {#if isImmediateDisabled}
                <span class="pro-required-badge">Pro Required</span>
              {/if}
            </div>
            <div class="radio-description">Sent within the hour of filing</div>
          </div>
        </div>
      </label>
    </div>
    
    {#if isLoading}
      <div class="loading-indicator">
        <div class="spinner"></div>
        <span>Updating frequency...</span>
      </div>
    {/if}
  </fieldset>
  
  {#if errorMessage}
    <div class="error-message">
      ⚠️ {errorMessage}
    </div>
  {/if}
</div>

<style>
  .classic-toggle-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }
  
  .frequency-fieldset {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 16px;
    margin: 0;
    background: white;
    position: relative;
    min-width: 300px;
  }
  
  .frequency-fieldset.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .fieldset-legend {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    padding: 0 8px;
    margin-bottom: 8px;
  }
  
  .radio-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .radio-option {
    display: block;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .radio-option.disabled {
    cursor: not-allowed;
  }
  
  .radio-option.pro-required {
    opacity: 0.7;
  }
  
  .radio-option input[type="radio"] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  
  .radio-display {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .radio-option:hover:not(.disabled) .radio-display {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  .radio-option:not(.disabled):not(.pro-required) input:checked + .radio-display {
    background: #f0fdf4;
    border-color: #10b981;
  }
  
  .radio-circle {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .radio-circle.checked {
    border-color: #10b981;
    background: white;
  }
  
  .radio-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .radio-content {
    flex: 1;
  }
  
  .radio-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .pro-required-badge {
    font-size: 0.6rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .radio-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }
  
  .radio-option.disabled .radio-title,
  .radio-option.disabled .radio-description {
    color: #9ca3af;
  }
  
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
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
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    align-self: center;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .frequency-fieldset {
      min-width: 280px;
      padding: 12px;
    }
    
    .radio-display {
      padding: 10px;
    }
    
    .radio-title {
      font-size: 0.8rem;
    }
    
    .radio-description {
      font-size: 0.7rem;
    }
    
    .radio-circle {
      width: 18px;
      height: 18px;
    }
    
    .radio-dot {
      width: 6px;
      height: 6px;
    }
  }
</style> 