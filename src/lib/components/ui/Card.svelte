<script lang="ts">
  export let variant: 'default' | 'feature' | 'pricing' | 'stats' = 'default';
  export let padding: 'sm' | 'md' | 'lg' = 'md';
  export let hover: boolean = false;
  export let elevation: 'none' | 'sm' | 'md' | 'lg' = 'sm';
  export let border: boolean = true;
  
  $: classes = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    `card--elevation-${elevation}`,
    hover && 'card--hover',
    !border && 'card--no-border'
  ].filter(Boolean).join(' ');
</script>

<div class={classes} {...$$restProps}>
  <slot />
</div>

<style>
  .card {
    background: var(--color-surface);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-border);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }
  
  /* Padding variants */
  .card--padding-sm {
    padding: var(--spacing-sm);
  }
  
  .card--padding-md {
    padding: var(--spacing-md);
  }
  
  .card--padding-lg {
    padding: var(--spacing-lg);
  }
  
  /* Elevation variants */
  .card--elevation-none {
    box-shadow: none;
  }
  
  .card--elevation-sm {
    box-shadow: var(--shadow-sm);
  }
  
  .card--elevation-md {
    box-shadow: var(--shadow-md);
  }
  
  .card--elevation-lg {
    box-shadow: var(--shadow-lg);
  }
  
  /* Card variants */
  .card--default {
    /* Base styles already applied */
  }
  
  .card--feature {
    border: 2px solid var(--color-border);
    position: relative;
  }
  
  .card--feature::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  }
  
  .card--pricing {
    border: 2px solid var(--color-border);
    position: relative;
  }
  
  .card--pricing.card--featured {
    border-color: var(--color-primary);
    transform: scale(1.05);
    z-index: 10;
  }
  
  .card--pricing.card--featured::before {
    content: 'Most Popular';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  
  .card--stats {
    background: linear-gradient(135deg, var(--color-surface) 0%, #f8fafc 100%);
  }
  
  /* Hover effects */
  .card--hover {
    cursor: pointer;
  }
  
  .card--hover:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }
  
  .card--no-border {
    border: none;
  }
</style> 