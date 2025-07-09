<!-- src/routes/admin/status/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';

  let data = null;
  let error = null;
  let loading = true;

  onMount(async () => {
    await loadHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    
    return () => clearInterval(interval);
  });

  async function loadHealthData() {
    try {
      const res = await fetch('/api/admin/system-health');
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      data = await res.json();
      error = null;
    } catch (e) {
      error = e.message;
      console.error('Failed to load health data:', e);
    } finally {
      loading = false;
    }
  }

  function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
  }

  function getStatusColor(status) {
    switch (status) {
      case 'SUCCESS': return 'text-green-600';
      case 'FAILURE': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'sent': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'pending': return '⏳';
      case 'sent': return '📧';
      default: return '⚪';
    }
  }
</script>

<svelte:head>
  <title>System Health - SimpleDCC Admin</title>
</svelte:head>

<ErrorBoundary>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">System Health Status</h1>
      <button 
        on:click={loadHealthData}
        disabled={loading}
        class="btn-base btn-primary btn-sm"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>

    {#if loading && !data}
      <div class="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {error}
      </div>
    {:else if data}
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">Latest Cron Run</h3>
          {#if data.health_logs.length > 0}
            {@const latest = data.health_logs[0]}
            <div class="flex items-center space-x-2">
              <span class={getStatusColor(latest.status)}>{getStatusIcon(latest.status)}</span>
              <span class={getStatusColor(latest.status)}>{latest.status}</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
              {formatTimestamp(latest.run_timestamp)}
            </div>
            <div class="text-sm text-gray-600">
              Duration: {latest.duration_ms}ms
            </div>
          {:else}
            <div class="text-gray-500">No runs recorded</div>
          {/if}
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">Notification Queue</h3>
          {#if data.queue_stats.length > 0}
            {#each data.queue_stats as stat}
              <div class="flex justify-between items-center">
                <span class="capitalize">{stat.status}:</span>
                <span class="font-mono">{stat.count}</span>
              </div>
            {/each}
          {:else}
            <div class="text-gray-500">Queue is empty</div>
          {/if}
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-2">System Status</h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Total Runs:</span>
              <span class="font-mono">{data.health_logs.length}</span>
            </div>
            <div class="flex justify-between">
              <span>Failures:</span>
              <span class="font-mono text-red-600">
                {data.health_logs.filter(log => log.status === 'FAILURE').length}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Success Rate:</span>
              <span class="font-mono">
                {data.health_logs.length > 0 
                  ? Math.round(((data.health_logs.filter(log => log.status === 'SUCCESS').length) / data.health_logs.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cron Worker Last 10 Runs -->
      <div class="bg-white rounded-lg shadow mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold">Cron Worker Last 10 Runs</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each data.health_logs as log}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.run_timestamp)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class={getStatusColor(log.status)}>
                      {getStatusIcon(log.status)} {log.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {log.duration_ms}ms
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {#if log.error_message}
                      <details class="cursor-pointer">
                        <summary class="text-red-600 hover:text-red-800">
                          {log.error_message}
                        </summary>
                        {#if log.error_stack}
                          <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{log.error_stack}</pre>
                        {/if}
                      </details>
                    {:else}
                      <span class="text-gray-500">N/A</span>
                    {/if}
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    No health logs found
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent System Logs -->
      {#if data.recent_logs && data.recent_logs.length > 0}
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold">Recent System Logs</h2>
          </div>
          <div class="p-6">
            <div class="space-y-2">
              {#each data.recent_logs as log}
                <div class="flex items-start space-x-3 text-sm">
                  <span class="text-gray-500 font-mono">
                    {new Date(log.created_at * 1000).toLocaleTimeString()}
                  </span>
                  <span class="text-gray-700 font-medium">
                    [{log.level?.toUpperCase()}]
                  </span>
                  <span class="text-gray-600 font-medium">
                    {log.component}:
                  </span>
                  <span class="text-gray-900 flex-1">
                    {log.message}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Footer -->
      <div class="mt-8 text-center text-sm text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleString()}
        • Auto-refreshes every 30 seconds
      </div>
    {/if}
  </div>
</ErrorBoundary>

<style>
  .container {
    max-width: 1200px;
  }
  
  /* Ensure table is responsive */
  table {
    min-width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #e5e7eb;
    padding: 8px;
    text-align: left;
  }
  
  th {
    background-color: #f9fafb;
    font-weight: 600;
  }
  
  /* Code blocks in error details */
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    max-width: 100%;
  }
</style> 