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
  
  function handleToggle(newFrequency: string) {
    if (disabled || isLoading || frequency === newFrequency) return;
    
    // Check if user can switch to immediate
    if (newFrequency === 'immediate' && !canUseImmediate) {
      errorMessage = 'Immediate notifications require a Pro subscription';
      return;
    }
    
    // Demo mode - just update the state
    frequency = newFrequency;
    errorMessage = '';
    dispatch('change', { frequency: newFrequency });
  }
</script>

<div class="frequency-toggle creative">
  <div class="toggle-container" class:disabled>
    <button 
      class="toggle-option daily" 
      class:active={!isImmediate}
      class:disabled={disabled || isLoading}
      on:click={() => handleToggle('daily')}
      disabled={disabled || isLoading}
    >
      <span class="icon">📅</span>
      <span class="text">Daily</span>
    </button>
    
    <button 
      class="toggle-option immediate" 
      class:active={isImmediate}
      class:disabled={disabled || isLoading || isImmediateDisabled}
      on:click={() => handleToggle('immediate')}
      disabled={disabled || isLoading || isImmediateDisabled}
    >
      <span class="icon">⚡</span>
      <span class="text">Immediate</span>
    </button>
    
    <!-- Sliding background pill -->
    <div class="sliding-pill" class:immediate={isImmediate}></div>
  </div>
  
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}
  
  {#if isImmediateDisabled}
    <div class="upgrade-notice">
      <span class="icon">🔒</span>
      Pro subscription required for immediate notifications
    </div>
  {/if}
</div>

<style>
  .frequency-toggle.creative {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .toggle-container {
    position: relative;
    display: flex;
    background: #f1f5f9;
    border-radius: 22px;
    padding: 4px;
    width: 200px;
    height: 48px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .toggle-container.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .toggle-option {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex: 1;
    border: none;
    background: transparent;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0.5rem 1rem;
  }
  
  .toggle-option:hover:not(.disabled) {
    color: #1e293b;
    transform: translateY(-1px);
  }
  
  .toggle-option.active {
    color: white;
    font-weight: 700;
  }
  
  .toggle-option.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .icon {
    font-size: 1.1rem;
  }
  
  .sliding-pill {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 20px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    z-index: 1;
  }
  
  .sliding-pill.immediate {
    transform: translateX(100%);
  }
  
  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    max-width: 300px;
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
    padding: 0.5rem 1rem;
    max-width: 300px;
  }
  
  .upgrade-notice .icon {
    font-size: 1rem;
  }
</style> 