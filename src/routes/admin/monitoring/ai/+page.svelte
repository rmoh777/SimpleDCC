<script lang="ts">
  import { onMount } from 'svelte';
  import { resilientAPI } from '$lib/api/monitoring-real.js';
  import StatsCard from '$lib/components/monitoring/StatsCard.svelte';
  
  let aiStatus: {
    apiConfigured: boolean;
    pendingFilings: number;
    processedLast24h: number;
    errorsLast24h: number;
    systemHealth: string;
  } = {
    apiConfigured: false,
    pendingFilings: 0,
    processedLast24h: 0,
    errorsLast24h: 0,
    systemHealth: 'unknown'
  };
  
  let isLoading = true;
  let error: string | null = null;
  let processing = false;
  let processingProgress: { completed: number; total: number; message?: string } | null = null;
  
  onMount(async () => {
    await loadAIStatus();
  });
  
  async function loadAIStatus() {
    try {
      isLoading = true;
      error = null;
      
      aiStatus = await resilientAPI.getAIStatus();
      
    } catch (err: any) {
      console.error('Error loading AI status:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }
  
  async function processPendingFilings() {
    if (!aiStatus.apiConfigured) {
      error = 'AI API not configured';
      return;
    }
    
    try {
      processing = true;
      error = null;
      processingProgress = { completed: 0, total: aiStatus.pendingFilings };
      
      const result = await resilientAPI.processPendingAI({
        limit: Math.min(aiStatus.pendingFilings, 20),
        maxConcurrent: 2
      });
      
      if (result.success) {
        processingProgress = {
          completed: result.processed,
          total: result.processed + result.failed,
          message: `Successfully processed ${result.processed} filings${result.failed > 0 ? `, ${result.failed} failed` : ''}`
        };
        
        // Refresh status after processing
        setTimeout(async () => {
          await loadAIStatus();
          processingProgress = null;
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Processing failed');
      }
      
    } catch (err: any) {
      console.error('AI processing failed:', err);
      error = err.message;
      processingProgress = null;
    } finally {
      processing = false;
    }
  }
  
  function getHealthColor(health: string): 'success' | 'warning' | 'error' | 'neutral' {
    switch (health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'neutral';
    }
  }
  
  function getHealthIcon(health: string) {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }
</script>

<svelte:head>
  <title>AI Processing - SimpleDCC Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h3 class="text-xl font-semibold text-primary">AI Processing Status</h3>
    <p class="text-secondary mt-1">
      Real-time Gemini AI integration and filing processing status
    </p>
  </div>
  
  {#if error}
    <div class="card-base card-padding-md bg-error text-white">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold">⚠️ AI System Error</h4>
          <p class="mt-1">{error}</p>
        </div>
        <button 
          class="btn-base btn-secondary btn-sm"
          on:click={loadAIStatus}
        >
          Retry
        </button>
      </div>
    </div>
  {/if}
  
  <!-- AI Status Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatsCard
      title="API Status"
      value={aiStatus.apiConfigured ? 'Connected' : 'Not Configured'}
      icon={aiStatus.apiConfigured ? '🔑' : '🚫'}
      status={aiStatus.apiConfigured ? 'success' : 'error'}
      loading={isLoading}
    />
    
    <StatsCard
      title="System Health"
      value={aiStatus.systemHealth}
      icon={getHealthIcon(aiStatus.systemHealth)}
      status={getHealthColor(aiStatus.systemHealth)}
      loading={isLoading}
    />
    
    <StatsCard
      title="Pending Filings"
      value={aiStatus.pendingFilings.toString()}
      icon="⏳"
      status={aiStatus.pendingFilings > 20 ? 'warning' : 'neutral'}
      subtitle="Awaiting AI processing"
      loading={isLoading}
    />
    
    <StatsCard
      title="Processed (24h)"
      value={aiStatus.processedLast24h.toString()}
      icon="✅"
      status="success"
      subtitle="Completed with summaries"
      loading={isLoading}
    />
  </div>
  
  <!-- AI Processing Controls -->
  {#if aiStatus.apiConfigured}
    <div class="card-base card-padding-md">
      <h4 class="text-lg font-semibold text-primary mb-4">AI Processing Controls</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button 
          class="btn-base btn-primary btn-lg flex items-center justify-center space-x-2"
          on:click={processPendingFilings}
          disabled={processing || aiStatus.pendingFilings === 0}
        >
          {#if processing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          {:else}
            <span>🤖</span>
            <span>Process Pending Filings</span>
          {/if}
        </button>
        
        <button 
          class="btn-base btn-secondary btn-lg flex items-center justify-center space-x-2"
          on:click={loadAIStatus}
          disabled={isLoading}
        >
          <span>🔄</span>
          <span>Refresh Status</span>
        </button>
      </div>
      
      <!-- Processing Progress -->
      {#if processingProgress}
        <div class="bg-primary bg-opacity-10 border border-primary rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-semibold text-primary">🤖 AI Processing Progress</h5>
            <span class="text-sm text-secondary">
              {processingProgress.completed}/{processingProgress.total}
            </span>
          </div>
          
          <div class="w-full bg-background rounded-full h-2 mb-2">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-300"
              style="width: {(processingProgress.completed / processingProgress.total) * 100}%"
            ></div>
          </div>
          
          {#if processingProgress.message}
            <p class="text-sm text-secondary">{processingProgress.message}</p>
          {/if}
        </div>
      {/if}
      
      <!-- Error Alert -->
      {#if aiStatus.errorsLast24h > 0}
        <div class="bg-warning bg-opacity-10 border border-warning rounded-lg p-4">
          <h5 class="font-semibold text-warning">⚠️ Recent Processing Errors</h5>
          <p class="text-sm text-secondary mt-1">
            {aiStatus.errorsLast24h} AI processing errors in the last 24 hours. 
            Check system logs for detailed error information.
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="card-base card-padding-md bg-warning bg-opacity-10 border border-warning">
      <h4 class="font-semibold text-warning">⚠️ AI API Not Configured</h4>
      <p class="text-secondary mt-2">
        Gemini AI integration is not configured. To enable AI-powered filing summaries:
      </p>
      <ol class="list-decimal list-inside text-secondary mt-2 space-y-1">
        <li>Obtain a Gemini API key from Google AI Studio</li>
        <li>Add GEMINI_API_KEY to environment variables</li>
        <li>Redeploy the application</li>
        <li>Refresh this page to verify configuration</li>
      </ol>
    </div>
  {/if}
</div>

<style>
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-x-2 > * + * {
    margin-left: var(--spacing-2);
  }
  
  .space-y-1 > * + * {
    margin-top: var(--spacing-1);
  }
  
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
  
  .gap-4 {
    gap: var(--spacing-4);
  }
  
  .gap-6 {
    gap: var(--spacing-6);
  }
  
  .bg-opacity-10 {
    background-color: rgba(var(--color-rgb), 0.1);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .list-decimal {
    list-style-type: decimal;
  }
  
  .list-inside {
    list-style-position: inside;
  }
</style> 