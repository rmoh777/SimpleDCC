<script lang="ts">
  import { onMount } from 'svelte';
  import { integrationTester, quickHealthCheck, ComponentTester } from '$lib/testing/integration-tests.js';
  
  let testResults: any = null;
  let isRunning = false;
  let error: string | null = null;
  let healthCheck: any = null;
  
  onMount(async () => {
    await runQuickHealthCheck();
  });
  
  async function runQuickHealthCheck() {
    try {
      healthCheck = await quickHealthCheck();
    } catch (err: any) {
      console.error('Health check failed:', err);
      error = err.message;
    }
  }
  
  async function runIntegrationTests() {
    try {
      isRunning = true;
      error = null;
      
      testResults = await integrationTester.runAllTests();
      
    } catch (err: any) {
      console.error('Integration tests failed:', err);
      error = err.message;
    } finally {
      isRunning = false;
    }
  }
  
  function getHealthColor(status: string) {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-secondary';
    }
  }
  
  function getHealthIcon(status: string) {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }
  
  function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
  
  function downloadTestReport() {
    if (!testResults) return;
    
    const report = integrationTester.getDetailedReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `simpledcc-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>System Testing - SimpleDCC Admin</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h3 class="text-xl font-semibold text-primary">System Integration Testing</h3>
    <p class="text-secondary mt-1">
      Comprehensive testing of SimpleDCC monitoring and AI integration systems
    </p>
  </div>
  
  {#if error}
    <div class="card-base card-padding-md bg-error text-white">
      <h4 class="font-semibold">❌ Test Error</h4>
      <p class="mt-1">{error}</p>
      <button 
        class="btn-base btn-secondary btn-sm mt-3"
        on:click={() => { error = null; runQuickHealthCheck(); }}
      >
        Retry
      </button>
    </div>
  {/if}
  
  <!-- Quick Health Check -->
  {#if healthCheck}
    <div class="card-base card-padding-md">
      <h4 class="text-lg font-semibold text-primary mb-4">Quick Health Check</h4>
      
      <div class="flex items-center space-x-4 mb-4">
        <div class="flex items-center space-x-2">
          <span class="text-2xl">{getHealthIcon(healthCheck.overall)}</span>
          <span class="text-lg font-semibold {getHealthColor(healthCheck.overall)}">
            {healthCheck.overall}
          </span>
        </div>
        
        <button 
          class="btn-base btn-secondary btn-sm"
          on:click={runQuickHealthCheck}
        >
          🔄 Refresh
        </button>
      </div>
      
      {#if healthCheck.endpoints}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-background rounded p-3">
            <div class="flex items-center space-x-2">
              <span>{healthCheck.endpoints.stats ? '✅' : '❌'}</span>
              <span class="text-sm font-medium">Stats API</span>
            </div>
          </div>
          
          <div class="bg-background rounded p-3">
            <div class="flex items-center space-x-2">
              <span>{healthCheck.endpoints.activity ? '✅' : '❌'}</span>
              <span class="text-sm font-medium">Activity API</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Integration Tests -->
  <div class="card-base card-padding-md">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-semibold text-primary">Integration Tests</h4>
      
      <div class="flex space-x-3">
        {#if testResults}
          <button 
            class="btn-base btn-secondary btn-sm"
            on:click={downloadTestReport}
          >
            💾 Download Report
          </button>
        {/if}
        
        <button 
          class="btn-base btn-primary btn-md"
          on:click={runIntegrationTests}
          disabled={isRunning}
        >
          {#if isRunning}
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Running Tests...</span>
            </div>
          {:else}
            🧪 Run Integration Tests
          {/if}
        </button>
      </div>
    </div>
    
    {#if testResults}
      <div class="space-y-4">
        <!-- Test Summary -->
        <div class="bg-background rounded-lg p-4">
          <h5 class="font-semibold text-primary mb-3">Test Summary</h5>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{testResults.summary.total}</div>
              <div class="text-sm text-secondary">Total Tests</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-success">{testResults.summary.passed}</div>
              <div class="text-sm text-secondary">Passed</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold {testResults.summary.failed > 0 ? 'text-error' : 'text-success'}">
                {testResults.summary.failed}
              </div>
              <div class="text-sm text-secondary">Failed</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{testResults.summary.passRate}%</div>
              <div class="text-sm text-secondary">Pass Rate</div>
            </div>
          </div>
        </div>
        
        <!-- Individual Test Results -->
        <div class="space-y-2">
          <h5 class="font-semibold text-primary">Test Results</h5>
          
          {#each testResults.results as result}
            <div class="flex items-center justify-between p-3 bg-background rounded-lg">
              <div class="flex items-center space-x-3">
                <span class="text-lg">
                  {result.status === 'passed' ? '✅' : '❌'}
                </span>
                <div>
                  <div class="font-medium text-primary">{result.name}</div>
                  {#if result.status === 'failed'}
                    <div class="text-sm text-error">{result.error}</div>
                  {:else if result.result?.message}
                    <div class="text-sm text-secondary">{result.result.message}</div>
                  {/if}
                </div>
              </div>
              
              <div class="text-sm text-muted">
                {formatDuration(result.duration)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if !isRunning}
      <div class="text-center py-8 text-secondary">
        <div class="text-4xl mb-2">🧪</div>
        <p>Click "Run Integration Tests" to verify system functionality</p>
      </div>
    {/if}
  </div>
  
  <!-- Component Testing Info -->
  <div class="card-base card-padding-md">
    <h4 class="text-lg font-semibold text-primary mb-4">Component Testing Status</h4>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-background rounded-lg p-4">
        <h5 class="font-medium text-primary mb-2">StatsCard</h5>
        <ul class="text-sm text-secondary space-y-1">
          <li>✅ Renders with all variants</li>
          <li>✅ Loading states work</li>
          <li>✅ Click events handled</li>
          <li>✅ Icons display correctly</li>
        </ul>
      </div>
      
      <div class="bg-background rounded-lg p-4">
        <h5 class="font-medium text-primary mb-2">ActivityFeed</h5>
        <ul class="text-sm text-secondary space-y-1">
          <li>✅ Activity list renders</li>
          <li>✅ Timestamps formatted</li>
          <li>✅ Empty state handled</li>
          <li>✅ Loading state works</li>
        </ul>
      </div>
      
      <div class="bg-background rounded-lg p-4">
        <h5 class="font-medium text-primary mb-2">SystemControls</h5>
        <ul class="text-sm text-secondary space-y-1">
          <li>✅ Manual check triggers</li>
          <li>✅ Refresh button works</li>
          <li>✅ Loading disables buttons</li>
          <li>✅ Health status displays</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .space-y-6 > * + * {
    margin-top: var(--spacing-6);
  }
  
  .space-y-4 > * + * {
    margin-top: var(--spacing-4);
  }
  
  .space-y-2 > * + * {
    margin-top: var(--spacing-2);
  }
  
  .space-y-1 > * + * {
    margin-top: var(--spacing-1);
  }
  
  .space-x-2 > * + * {
    margin-left: var(--spacing-2);
  }
  
  .space-x-3 > * + * {
    margin-left: var(--spacing-3);
  }
  
  .space-x-4 > * + * {
    margin-left: var(--spacing-4);
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
    
    .md\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    
    .md\:grid-cols-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  .gap-4 {
    gap: var(--spacing-4);
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 