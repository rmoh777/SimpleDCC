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

<div class="frequency-toggle classic">
  <fieldset class="radio-group" class:disabled>
    <legend class="sr-only">Notification Frequency</legend>
    
    <div class="radio-options">
      <label class="radio-option" class:selected={!isImmediate}>
        <input 
          type="radio" 
          name="frequency" 
          value="daily" 
          checked={!isImmediate}
          disabled={disabled || isLoading}
          on:change={() => handleSelection('daily')}
        />
        <div class="radio-custom">
          <div class="radio-circle"></div>
        </div>
        <div class="option-content">
          <div class="option-header">
            <span class="icon">📅</span>
            <h3>Daily Digest</h3>
          </div>
          <p class="description">Delivered each morning at 9 AM</p>
          <p class="details">Perfect for users who prefer to review all updates at once</p>
        </div>
      </label>
      
      <label class="radio-option" class:selected={isImmediate} class:disabled={isImmediateDisabled}>
        <input 
          type="radio" 
          name="frequency" 
          value="immediate" 
          checked={isImmediate}
          disabled={disabled || isLoading || isImmediateDisabled}
          on:change={() => handleSelection('immediate')}
        />
        <div class="radio-custom">
          <div class="radio-circle"></div>
        </div>
        <div class="option-content">
          <div class="option-header">
            <span class="icon">⚡</span>
            <h3>Immediate Alerts</h3>
            {#if isImmediateDisabled}
              <span class="pro-badge">PRO</span>
            {/if}
          </div>
          <p class="description">Sent within the hour of new filings</p>
          <p class="details">Real-time notifications for time-sensitive updates</p>
        </div>
      </label>
    </div>
  </fieldset>
  
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
  .frequency-toggle.classic {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 500px;
  }
  
  .radio-group {
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
  }
  
  .radio-group.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .radio-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .radio-option {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
  }
  
  .radio-option:hover:not(.disabled) {
    border-color: #10b981;
    background: #f8fafc;
  }
  
  .radio-option.selected {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
  }
  
  .radio-option.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .radio-option input[type="radio"] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  
  .radio-custom {
    position: relative;
    width: 20px;
    height: 20px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    background: white;
    flex-shrink: 0;
    margin-top: 0.25rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .radio-option:hover .radio-custom {
    border-color: #10b981;
  }
  
  .radio-option.selected .radio-custom {
    border-color: #10b981;
    background: #10b981;
  }
  
  .radio-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .radio-option.selected .radio-circle {
    transform: translate(-50%, -50%) scale(1);
  }
  
  .option-content {
    flex: 1;
  }
  
  .option-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .option-header h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    flex: 1;
  }
  
  .icon {
    font-size: 1.25rem;
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
    margin: 0 0 0.25rem 0;
  }
  
  .details {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }
  
  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    width: 100%;
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
    width: 100%;
  }
  
  .upgrade-notice .icon {
    font-size: 1rem;
  }
  
  /* Mobile responsive */
  @media (max-width: 640px) {
    .radio-option {
      padding: 1.25rem;
    }
    
    .option-header h3 {
      font-size: 1rem;
    }
    
    .description {
      font-size: 0.9rem;
    }
    
    .details {
      font-size: 0.8rem;
    }
  }
</style> 