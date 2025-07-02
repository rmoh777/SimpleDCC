<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let loading = false;
  export let lastCheck: number | null = null;
  export let systemHealth = 'healthy';
  
  let manualCheckLoading = false;
  let refreshLoading = false;
  
  async function triggerManualCheck() {
    try {
      manualCheckLoading = true;
      dispatch('manual-check');
    } catch (error) {
      console.error('Manual check failed:', error);
    } finally {
      manualCheckLoading = false;
    }
  }
  
  async function refreshData() {
    try {
      refreshLoading = true;
      dispatch('refresh');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      refreshLoading = false;
    }
  }
  
  function formatLastCheck(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  }
  
  function getHealthColor(health: string): string {
    switch (health) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-secondary';
    }
  }
  
  function getHealthIcon(health: string): string {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }
</script>

<div class="card-base card-padding-md">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-primary">System Controls</h3>
    
    <div class="flex items-center space-x-2 text-sm">
      <span class={getHealthColor(systemHealth)}>
        {getHealthIcon(systemHealth)}
      </span>
      <span class="text-secondary">
        Last check: {formatLastCheck(lastCheck)}
      </span>
    </div>
  </div>
  
  <!-- Action Buttons -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <button 
      class="btn-base btn-primary btn-lg flex items-center justify-center space-x-2"
      on:click={triggerManualCheck}
      disabled={manualCheckLoading || loading}
    >
      {#if manualCheckLoading}
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Checking...</span>
      {:else}
        <span>⚡</span>
        <span>Trigger ECFS Check</span>
      {/if}
    </button>
    
    <button 
      class="btn-base btn-secondary btn-lg flex items-center justify-center space-x-2"
      on:click={refreshData}
      disabled={refreshLoading || loading}
    >
      {#if refreshLoading}
        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>Refreshing...</span>
      {:else}
        <span>🔄</span>
        <span>Refresh Data</span>
      {/if}
    </button>
  </div>
  
  <!-- System Status Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-background rounded-lg p-3">
      <div class="flex items-center space-x-2 mb-1">
        <span>🔍</span>
        <span class="text-sm font-medium text-secondary">ECFS API</span>
      </div>
      <p class="text-xs text-muted">Last response: 850ms</p>
    </div>
    
    <div class="bg-background rounded-lg p-3">
      <div class="flex items-center space-x-2 mb-1">
        <span>🤖</span>
        <span class="text-sm font-medium text-secondary">AI Processing</span>
      </div>
      <p class="text-xs text-muted">Queue: 0 pending</p>
    </div>
    
    <div class="bg-background rounded-lg p-3">
      <div class="flex items-center space-x-2 mb-1">
        <span>💾</span>
        <span class="text-sm font-medium text-secondary">Database</span>
      </div>
      <p class="text-xs text-muted">Response: 45ms</p>
    </div>
  </div>
</div>

<style>
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 768px) {
    .md\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .md\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  
  .gap-4 {
    gap: var(--spacing-4);
  }
  
  .space-x-2 > * + * {
    margin-left: var(--spacing-2);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .rounded-lg {
    border-radius: var(--border-radius-lg);
  }
</style> 