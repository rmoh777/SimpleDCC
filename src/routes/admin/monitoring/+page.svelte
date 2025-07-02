<script lang="ts">
  import { onMount } from 'svelte';
  import StatsCard from '$lib/components/monitoring/StatsCard.svelte';
  import ActivityFeed from '$lib/components/monitoring/ActivityFeed.svelte';
  import SystemControls from '$lib/components/monitoring/SystemControls.svelte';
  
  // Mock data structure that matches B3 interface
  let monitoringData: {
    systemHealth: 'healthy' | 'warning' | 'error';
    activeJobs: number;
    lastCheck: number;
    totalFilings: number;
    activeDockets: number;
    recentActivity: any[];
    stats: {
      pendingFilings: number;
      processedToday: number;
      errorRate: number;
    };
  } = {
    systemHealth: 'healthy',
    activeJobs: 0,
    lastCheck: Date.now(),
    totalFilings: 0,
    activeDockets: 0,
    recentActivity: [],
    stats: {
      pendingFilings: 0,
      processedToday: 0,
      errorRate: 0
    }
  };
  
  let isLoading = true;
  let error: string | null = null;
  
  onMount(() => {
    loadMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  });
  
  async function loadMonitoringData() {
    try {
      isLoading = true;
      
      // Mock API call - will be replaced with real API in A5
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data that matches the interface B3 will provide
      monitoringData = {
        systemHealth: 'healthy',
        activeJobs: Math.floor(Math.random() * 5),
        lastCheck: Date.now() - Math.floor(Math.random() * 3600000),
        totalFilings: 156 + Math.floor(Math.random() * 10),
        activeDockets: 8,
        stats: {
          pendingFilings: Math.floor(Math.random() * 20),
          processedToday: 45 + Math.floor(Math.random() * 15),
          errorRate: Math.floor(Math.random() * 5)
        },
        recentActivity: [
          {
            id: 1,
            message: 'ECFS check completed for docket 23-108',
            component: 'ecfs',
            level: 'info',
            created_at: Date.now() - 1800000
          },
          {
            id: 2,
            message: 'AI processing completed for 3 new filings',
            component: 'ai',
            level: 'info',
            created_at: Date.now() - 3600000
          },
          {
            id: 3,
            message: 'Daily digest sent to 24 subscribers',
            component: 'email',
            level: 'info',
            created_at: Date.now() - 7200000
          },
          {
            id: 4,
            message: 'Rate limit warning from ECFS API',
            component: 'ecfs',
            level: 'warning',
            created_at: Date.now() - 10800000
          }
        ]
      };
      
      error = null;
    } catch (err) {
      error = 'Failed to load monitoring data';
      console.error('Monitoring data error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function handleManualCheck() {
    try {
      // Mock manual trigger - will be replaced with real API in A5
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadMonitoringData();
    } catch (err) {
      error = 'Manual check failed';
    }
  }
  
  async function handleRefresh() {
    await loadMonitoringData();
  }
</script>

<svelte:head>
  <title>System Monitoring - SimpleDCC Admin</title>
</svelte:head>

{#if error}
  <div class="card-base card-padding-md bg-error text-white mb-6">
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

<!-- Stats Overview Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
  <StatsCard
    title="System Health"
    value={monitoringData.systemHealth}
    icon={monitoringData.systemHealth === 'healthy' ? '✅' : 
         monitoringData.systemHealth === 'warning' ? '⚠️' : '❌'}
    status={monitoringData.systemHealth === 'healthy' ? 'success' : monitoringData.systemHealth}
    loading={isLoading}
  />
  
  <StatsCard
    title="Active Jobs"
    value={monitoringData.activeJobs.toString()}
    icon="🔄"
    status={monitoringData.activeJobs > 5 ? 'warning' : 'neutral'}
    subtitle={monitoringData.activeJobs > 0 ? 'Processing...' : 'Idle'}
    loading={isLoading}
  />
  
  <StatsCard
    title="Total Filings"
    value={monitoringData.totalFilings.toString()}
    icon="📄"
    status="neutral"
    subtitle="All time"
    loading={isLoading}
  />
  
  <StatsCard
    title="Active Dockets"
    value={monitoringData.activeDockets.toString()}
    icon="📋"
    status="neutral"
    subtitle="Being monitored"
    loading={isLoading}
  />
</div>

<!-- Additional Stats Row -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  <StatsCard
    title="Pending Filings"
    value={monitoringData.stats.pendingFilings.toString()}
    icon="⏳"
    status={monitoringData.stats.pendingFilings > 10 ? 'warning' : 'neutral'}
    subtitle="Awaiting AI processing"
    loading={isLoading}
  />
  
  <StatsCard
    title="Processed Today"
    value={monitoringData.stats.processedToday.toString()}
    icon="✅"
    status="success"
    subtitle="Completed with AI summaries"
    loading={isLoading}
  />
  
  <StatsCard
    title="Error Rate"
    value={`${monitoringData.stats.errorRate}%`}
    icon="⚠️"
    status={monitoringData.stats.errorRate > 5 ? 'error' : 
           monitoringData.stats.errorRate > 2 ? 'warning' : 'success'}
    subtitle="Last 24 hours"
    loading={isLoading}
  />
</div>

<!-- Two Column Layout -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- System Controls -->
  <SystemControls
    loading={isLoading}
    lastCheck={monitoringData.lastCheck}
    systemHealth={monitoringData.systemHealth === 'healthy' ? 'healthy' : monitoringData.systemHealth}
    on:manual-check={handleManualCheck}
    on:refresh={handleRefresh}
  />
  
  <!-- Activity Feed -->
  <ActivityFeed
    activities={monitoringData.recentActivity}
    loading={isLoading}
    title="Recent System Activity"
    maxItems={8}
  />
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
  
  @media (min-width: 1024px) {
    .lg\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .lg\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
  
  .mb-6 {
    margin-bottom: var(--spacing-6);
  }
  
  .bg-error {
    background-color: var(--color-error);
  }
</style> 