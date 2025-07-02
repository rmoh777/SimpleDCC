<script lang="ts">
  export let activities: any[] = [];
  export let loading = false;
  export let title = 'Recent Activity';
  export let maxItems = 10;
  
  function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
  
  function getActivityIcon(activity: any): string {
    const type = activity.component || activity.type || '';
    switch (type) {
      case 'ecfs': return '🔍';
      case 'ai': return '🤖';
      case 'email': return '📧';
      case 'cron': return '⏰';
      case 'storage': return '💾';
      default: return '📝';
    }
  }
  
  function getActivityStyle(activity: any): string {
    const level = activity.level || 'info';
    switch (level) {
      case 'error': return 'border-l-error bg-error bg-opacity-5';
      case 'warning': return 'border-l-warning bg-warning bg-opacity-5';
      case 'success': return 'border-l-success bg-success bg-opacity-5';
      default: return 'border-l-primary bg-primary bg-opacity-5';
    }
  }
  
  $: displayActivities = activities.slice(0, maxItems);
</script>

<div class="card-base card-padding-md">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-primary">{title}</h3>
    {#if activities.length > maxItems}
      <span class="text-sm text-muted">
        Showing {maxItems} of {activities.length}
      </span>
    {/if}
  </div>
  
  {#if loading}
    <div class="space-y-3">
      {#each Array(5) as _}
        <div class="flex items-center space-x-3 p-3 bg-background rounded">
          <div class="w-6 h-6 bg-border rounded animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="w-3/4 h-4 bg-border rounded animate-pulse"></div>
            <div class="w-1/4 h-3 bg-border rounded animate-pulse"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if displayActivities.length === 0}
    <div class="text-center py-8 text-secondary">
      <div class="text-4xl mb-2">📭</div>
      <p>No recent activity</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each displayActivities as activity, index (activity.id || index)}
        <div class="flex items-start space-x-3 p-3 border-l-4 rounded-r {getActivityStyle(activity)}">
          <div class="text-lg mt-0.5">
            {getActivityIcon(activity)}
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm text-primary font-medium">
              {activity.message || activity.title || 'System activity'}
            </p>
            
            {#if activity.details}
              <p class="text-xs text-secondary mt-1 truncate">
                {typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)}
              </p>
            {/if}
            
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-muted">
                {activity.component || 'System'}
              </span>
              <span class="text-xs text-muted">
                {formatTimeAgo(activity.created_at || activity.timestamp || Date.now())}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .space-y-2 > * + * {
    margin-top: var(--spacing-2);
  }
  
  .space-y-3 > * + * {
    margin-top: var(--spacing-3);
  }
  
  .space-x-3 > * + * {
    margin-left: var(--spacing-3);
  }
  
  .border-l-4 {
    border-left-width: 4px;
  }
  
  .border-l-primary {
    border-left-color: var(--color-primary);
  }
  
  .border-l-success {
    border-left-color: var(--color-success);
  }
  
  .border-l-warning {
    border-left-color: var(--color-warning);
  }
  
  .border-l-error {
    border-left-color: var(--color-error);
  }
  
  .bg-opacity-5 {
    background-color: rgba(var(--color-rgb), 0.05);
  }
  
  .min-w-0 {
    min-width: 0;
  }
  
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style> 