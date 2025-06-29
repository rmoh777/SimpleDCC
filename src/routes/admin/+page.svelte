<script lang="ts">
  import { onMount } from 'svelte';
  
  interface LogEntry {
    level: string;
    message: string;
    component: string;
    created_at: number;
  }
  
  interface DocketEntry {
    docket_number: string;
    subscriber_count: number;
  }
  
  let stats: {
    totalSubscriptions: number;
    activeDockets: number;
    recentLogs: LogEntry[];
    topDockets: DocketEntry[];
    systemHealth: string;
  } = {
    totalSubscriptions: 0,
    activeDockets: 0,
    recentLogs: [],
    topDockets: [],
    systemHealth: 'loading'
  };
  
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await loadStats();
  });
  
  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        stats = await response.json();
        error = '';
      } else {
        error = 'Failed to load dashboard stats';
      }
    } catch (err) {
      error = 'Network error loading stats';
      console.error('Dashboard error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function runManualCheck() {
    try {
      const response = await fetch('/api/admin/trigger/manual-check', { 
        method: 'POST' 
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Manual check triggered successfully');
        await loadStats(); // Refresh stats
      } else {
        alert('Failed to trigger manual check');
      }
    } catch (err) {
      alert('Error triggering manual check');
    }
  }
  
  function formatLogTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
  
  function getLogIcon(level: string): string {
    switch (level) {
      case 'error': return '🔴';
      case 'warn': return '🟡';
      default: return '🟢';
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - SimpleDCC</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
    <p class="mt-1 text-sm text-gray-600">
      Overview of your SimpleDCC monitoring system
    </p>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {/if}
  
  {#if isLoading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading dashboard...</p>
    </div>
  {:else}
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Subscriptions -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm">👥</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Subscriptions
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {stats.totalSubscriptions}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Active Dockets -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm">📋</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Active Dockets
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {stats.activeDockets}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <!-- System Health -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm">⚡</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  System Health
                </dt>
                <dd class="text-lg font-medium text-gray-900 capitalize">
                  {stats.systemHealth}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm">🔧</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Quick Actions
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  <button 
                    on:click={runManualCheck}
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Run Check
                  </button>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Activity -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent System Logs
          </h3>
          
          {#if stats.recentLogs.length === 0}
            <p class="text-gray-500 text-sm">No recent logs available</p>
          {:else}
            <div class="space-y-3">
              {#each stats.recentLogs as log}
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 mt-1">
                    <span class="text-lg">{getLogIcon(log.level)}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-gray-900">{log.message}</p>
                    <p class="text-xs text-gray-500">
                      {log.component} • {formatLogTime(log.created_at)}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Top Dockets -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Most Popular Dockets
          </h3>
          
          {#if stats.topDockets.length === 0}
            <p class="text-gray-500 text-sm">No docket data available</p>
          {:else}
            <div class="space-y-3">
              {#each stats.topDockets as docket}
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-900">
                    Docket {docket.docket_number}
                  </span>
                  <span class="text-sm text-gray-500">
                    {docket.subscriber_count} subscriber{docket.subscriber_count !== 1 ? 's' : ''}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Dashboard will show placeholder data until Card 5 (Stats API) is complete --> 