<script>
  import { onMount } from 'svelte';
  
  // Mock data structure that matches B3 interface
  let monitoringData = {
    systemHealth: 'healthy',
    activeJobs: 0,
    lastCheck: Date.now(),
    totalFilings: 0,
    activeDockets: 0,
    recentActivity: [
      { id: 0, message: '', time: 0 }
    ]
  };
  
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await loadMonitoringData();
  });
  
  async function loadMonitoringData() {
    try {
      isLoading = true;
      
      // Mock API call - will be replaced with real API in A5
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      // Mock data that matches the interface B3 will provide
      monitoringData = {
        systemHealth: 'healthy',
        activeJobs: 2,
        lastCheck: Date.now() - 3600000, // 1 hour ago
        totalFilings: 156,
        activeDockets: 8,
        recentActivity: [
          { id: 1, message: 'ECFS check completed for docket 23-108', time: Date.now() - 1800000 },
          { id: 2, message: 'AI processing completed for 3 new filings', time: Date.now() - 3600000 },
          { id: 3, message: 'Daily digest sent to 24 subscribers', time: Date.now() - 7200000 }
        ]
      };
      
      error = '';
    } catch (err) {
      error = 'Failed to load monitoring data';
      console.error('Monitoring data error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function triggerManualCheck() {
    try {
      // Mock manual trigger - will be replaced with real API in A5
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadMonitoringData();
    } catch (err) {
      error = 'Manual check failed';
    }
  }
  
  /**
   * @param {number} timestamp
   */
  function formatLastCheck(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  }
</script>

{#if error}
  <div class="card-base card-padding-md bg-error text-white">
    <h3 class="font-semibold">Error</h3>
    <p>{error}</p>
    <button 
      class="btn-base btn-secondary btn-sm mt-3" 
      on:click={loadMonitoringData}
    >
      Retry
    </button>
  </div>
{/if}

{#if isLoading}
  <div class="text-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
    <p class="text-secondary">Loading monitoring data...</p>
  </div>
{:else}
  <!-- System Health Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- System Health Card -->
    <div class="card-base card-padding-md">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-secondary">System Health</p>
          <p class="text-2xl font-semibold 
            {monitoringData.systemHealth === 'healthy' ? 'text-success' : 
              monitoringData.systemHealth === 'warning' ? 'text-warning' : 'text-error'}">
            {monitoringData.systemHealth === 'healthy' ? '✅' : 
             monitoringData.systemHealth === 'warning' ? '⚠️' : '❌'}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted">Status</p>
          <p class="text-sm font-medium capitalize">{monitoringData.systemHealth}</p>
        </div>
      </div>
    </div>
    
    <!-- Active Jobs Card -->
    <div class="card-base card-padding-md">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-secondary">Active Jobs</p>
          <p class="text-2xl font-semibold text-primary">{monitoringData.activeJobs}</p>
        </div>
        <div class="text-4xl">🔄</div>
      </div>
    </div>
    
    <!-- Total Filings Card -->
    <div class="card-base card-padding-md">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-secondary">Total Filings</p>
          <p class="text-2xl font-semibold text-primary">{monitoringData.totalFilings}</p>
        </div>
        <div class="text-4xl">📄</div>
      </div>
    </div>
    
    <!-- Active Dockets Card -->
    <div class="card-base card-padding-md">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-secondary">Active Dockets</p>
          <p class="text-2xl font-semibold text-primary">{monitoringData.activeDockets}</p>
        </div>
        <div class="text-4xl">📋</div>
      </div>
    </div>
  </div>
  
  <!-- Recent Activity -->
  <div class="card-base card-padding-md">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-primary">Recent Activity</h3>
      <p class="text-sm text-secondary">Last check: {formatLastCheck(monitoringData.lastCheck)}</p>
    </div>
    
    {#if monitoringData.recentActivity.length === 0}
      <p class="text-secondary text-center py-4">No recent activity</p>
    {:else}
      <div class="space-y-3">
        {#each monitoringData.recentActivity as activity}
          <div class="flex items-center justify-between py-2 border-b border-base last:border-b-0">
            <p class="text-secondary">{activity.message}</p>
            <p class="text-xs text-muted">{formatLastCheck(activity.time)}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Manual Controls -->
  <div class="card-base card-padding-md">
    <h3 class="text-lg font-semibold text-primary mb-4">Manual Controls</h3>
    <div class="flex space-x-4">
      <button 
        class="btn-base btn-primary btn-md"
        on:click={triggerManualCheck}
      >
        ⚡ Trigger ECFS Check
      </button>
      <button 
        class="btn-base btn-secondary btn-md"
        on:click={loadMonitoringData}
      >
        🔄 Refresh Data
      </button>
    </div>
  </div>
{/if}

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
  }
  
  @media (min-width: 1024px) {
    .lg\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
  
  .space-y-3 > * + * {
    margin-top: var(--spacing-3);
  }
  
  .space-x-4 > * + * {
    margin-left: var(--spacing-4);
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
  
  .text-success {
    color: var(--color-success);
  }
  
  .text-warning {
    color: var(--color-warning);
  }
  
  .text-error {
    color: var(--color-error);
  }
  
  .text-primary {
    color: var(--color-primary);
  }
  
  .text-secondary {
    color: var(--color-text-secondary);
  }
  
  .text-muted {
    color: var(--color-text-muted);
  }
  
  .bg-error {
    background-color: var(--color-error);
  }
  
  .border-base {
    border-color: var(--color-border);
  }
  
  .card-base {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
  }
  
  .card-padding-md {
    padding: var(--spacing-6);
  }
  
  .btn-base {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    font-weight: 500;
    border: 1px solid;
    transition: var(--transition-fast);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-hover);
  }
  
  .btn-secondary {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);
  }
  
  .btn-secondary:hover {
    background-color: var(--color-background);
    color: var(--color-text-primary);
  }
  
  .btn-sm {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-xs);
  }
  
  .btn-md {
    padding: var(--spacing-3) var(--spacing-5);
    font-size: var(--font-size-sm);
  }
</style> 