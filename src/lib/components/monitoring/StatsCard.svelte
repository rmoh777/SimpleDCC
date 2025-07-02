<script lang="ts">
  export let title = '';
  export let value = '';
  export let icon = '';
  export let status: 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
  export let subtitle = '';
  export let loading = false;
  export let onClick: (() => void) | null = null;
  
  const statusColors: Record<string, string> = {
    success: 'text-success',
    warning: 'text-warning', 
    error: 'text-error',
    neutral: 'text-primary'
  };
  
  const handleClick = () => {
    if (onClick) onClick();
  };
</script>

<div 
  class="card-base card-padding-md {onClick ? 'card-hover cursor-pointer' : ''}"
  on:click={handleClick}
  role={onClick ? 'button' : null}
  tabindex={onClick ? 0 : null}
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <p class="text-sm text-secondary mb-1">{title}</p>
      
      {#if loading}
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-border rounded animate-pulse"></div>
          <div class="w-8 h-6 bg-border rounded animate-pulse"></div>
        </div>
      {:else}
        <p class="text-2xl font-semibold {statusColors[status]} mb-1">
          {value}
        </p>
      {/if}
      
      {#if subtitle}
        <p class="text-xs text-muted">{subtitle}</p>
      {/if}
    </div>
    
    {#if icon}
      <div class="text-3xl ml-4 opacity-60">
        {icon}
      </div>
    {/if}
  </div>
</div>

<style>
  .cursor-pointer {
    cursor: pointer;
  }
  
  .space-x-2 > * + * {
    margin-left: var(--spacing-2);
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .bg-border {
    background-color: var(--color-border);
  }
</style> 