<script>
  // Placeholder for ECFS-specific monitoring
  let ecfsStats = {
    lastCheck: Date.now() - 1800000,
    totalRequests: 45,
    failedRequests: 2,
    averageResponseTime: 850
  };
</script>

<div class="space-y-6">
  <h3 class="text-xl font-semibold text-primary">ECFS API Status</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card-base card-padding-md">
      <p class="text-sm text-secondary">API Requests (24h)</p>
      <p class="text-2xl font-semibold text-primary">{ecfsStats.totalRequests}</p>
    </div>
    
    <div class="card-base card-padding-md">
      <p class="text-sm text-secondary">Failed Requests</p>
      <p class="text-2xl font-semibold {ecfsStats.failedRequests > 0 ? 'text-warning' : 'text-success'}">
        {ecfsStats.failedRequests}
      </p>
    </div>
    
    <div class="card-base card-padding-md">
      <p class="text-sm text-secondary">Avg Response Time</p>
      <p class="text-2xl font-semibold text-primary">{ecfsStats.averageResponseTime}ms</p>
    </div>
  </div>
  
  <div class="card-base card-padding-md">
    <p class="text-secondary">Detailed ECFS monitoring will be implemented in Phase 2</p>
  </div>
</div>

<style>
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 768px) {
    .md\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  
  .text-primary {
    color: var(--color-primary);
  }
  
  .text-secondary {
    color: var(--color-text-secondary);
  }
  
  .text-success {
    color: var(--color-success);
  }
  
  .text-warning {
    color: var(--color-warning);
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
</style> 