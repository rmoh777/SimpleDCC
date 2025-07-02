<script>
  import { page } from '$app/stores';
  
  // Monitoring sub-navigation
  const monitoringTabs = [
    { href: '/admin/monitoring', label: 'Overview', icon: '📊' },
    { href: '/admin/monitoring/ecfs', label: 'ECFS Status', icon: '🔍' },
    { href: '/admin/monitoring/ai', label: 'AI Processing', icon: '🤖' },
    { href: '/admin/monitoring/logs', label: 'System Logs', icon: '📝' },
  ];
  
  $: currentPath = $page.url.pathname;
</script>

<div class="space-y-6">
  <!-- Monitoring Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-primary">System Monitoring</h2>
      <p class="text-secondary mt-1">
        Monitor ECFS integration, AI processing, and system health
      </p>
    </div>
    
    <!-- Quick Actions -->
    <div class="flex space-x-3">
      <button class="btn-base btn-secondary btn-sm" id="refresh-data">
        🔄 Refresh
      </button>
      <button class="btn-base btn-primary btn-sm" id="manual-check">
        ⚡ Manual Check
      </button>
    </div>
  </div>
  
  <!-- Sub-navigation Tabs -->
  <nav class="border-b border-base">
    <div class="flex space-x-8">
      {#each monitoringTabs as tab}
        <a 
          href={tab.href}
          class="flex items-center px-1 py-3 text-sm font-medium border-b-2 transition-colors
            {currentPath === tab.href 
              ? 'border-primary text-primary' 
              : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'}"
        >
          <span class="mr-2">{tab.icon}</span>
          {tab.label}
        </a>
      {/each}
    </div>
  </nav>
  
  <!-- Content Area -->
  <div class="space-y-6">
    <slot />
  </div>
</div>

<style>
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-x-3 > * + * {
    margin-left: var(--spacing-3);
  }
  
  .space-x-8 > * + * {
    margin-left: var(--spacing-8);
  }
  
  .text-primary {
    color: var(--color-primary);
  }
  
  .text-secondary {
    color: var(--color-text-secondary);
  }
  
  .border-primary {
    border-color: var(--color-primary);
  }
  
  .border-base {
    border-color: var(--color-border);
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
</style> 