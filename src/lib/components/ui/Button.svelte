<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  $: tag = href ? 'a' : 'button';
  $: classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    disabled && 'btn--disabled',
    loading && 'btn--loading'
  ].filter(Boolean).join(' ');
</script>

<svelte:element 
  this={tag} 
  {href}
  {type}
  {disabled}
  class={classes}
  on:click
  {...$$restProps}
>
  {#if loading}
    <span class="btn__spinner" aria-hidden="true"></span>
  {/if}
  <span class="btn__content" class:btn__content--hidden={loading}>
    <slot />
  </span>
</svelte:element>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    font-family: var(--font-family);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    border: 2px solid transparent;
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    position: relative;
    white-space: nowrap;
  }
  
  /* Sizes */
  .btn--sm {
    padding: calc(var(--spacing-xs) - 2px) var(--spacing-sm);
    font-size: var(--font-size-sm);
  }
  
  .btn--md {
    padding: calc(var(--spacing-sm) - 2px) var(--spacing-md);
    font-size: var(--font-size-base);
  }
  
  .btn--lg {
    padding: calc(var(--spacing-md) - 2px) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }
  
  /* Variants */
  .btn--primary {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .btn--primary:hover:not(.btn--disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  .btn--secondary {
    background: var(--color-secondary);
    color: white;
    border-color: var(--color-secondary);
  }
  
  .btn--secondary:hover:not(.btn--disabled) {
    background: var(--color-secondary-hover);
    border-color: var(--color-secondary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  .btn--outline {
    background: transparent;
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  
  .btn--outline:hover:not(.btn--disabled) {
    background: var(--color-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .btn--ghost {
    background: transparent;
    color: var(--color-text-primary);
    border-color: transparent;
  }
  
  .btn--ghost:hover:not(.btn--disabled) {
    background: var(--color-border);
    transform: translateY(-1px);
  }
  
  /* States */
  .btn--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  .btn--loading {
    cursor: wait;
  }
  
  .btn__spinner {
    width: 1em;
    height: 1em;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    position: absolute;
  }
  
  .btn__content--hidden {
    opacity: 0;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style> 