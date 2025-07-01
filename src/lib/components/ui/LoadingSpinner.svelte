<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'primary' | 'secondary' | 'white' = 'primary';
  export let inline: boolean = false;
  
  $: sizeClass = `spinner--${size}`;
  $: colorClass = `spinner--${color}`;
</script>

<div class="spinner-container" class:inline>
  <div class="spinner {sizeClass} {colorClass}" role="status" aria-label="Loading">
    <span class="sr-only">Loading...</span>
  </div>
</div>

<style>
  .spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-md);
  }
  
  .spinner-container.inline {
    display: inline-flex;
    padding: 0;
  }
  
  .spinner {
    border-radius: 50%;
    border-style: solid;
    animation: spin 1s linear infinite;
  }
  
  .spinner--sm {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
  }
  
  .spinner--md {
    width: 1.5rem;
    height: 1.5rem;
    border-width: 2px;
  }
  
  .spinner--lg {
    width: 2rem;
    height: 2rem;
    border-width: 3px;
  }
  
  .spinner--primary {
    border-color: rgba(16, 185, 129, 0.2);
    border-top-color: var(--color-primary);
  }
  
  .spinner--secondary {
    border-color: rgba(15, 23, 42, 0.2);
    border-top-color: var(--color-secondary);
  }
  
  .spinner--white {
    border-color: rgba(255, 255, 255, 0.2);
    border-top-color: white;
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
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style> 