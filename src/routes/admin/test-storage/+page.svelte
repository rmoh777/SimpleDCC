<script lang="ts">
  import { onMount } from 'svelte';
  
  interface TestResult {
    testName: string;
    timestamp: string;
    success: boolean;
    message?: string;
    error?: string;
    results?: {
      validation: {
        total: number;
        valid: number;
        invalid: number;
      };
      storage: {
        newFilings: number;
        duplicates: number;
        errors: number;
        duration: number;
      };
      batchProcessing: {
        docketsProcessed: number;
        totalNewFilings: number;
        totalDuplicates: number;
      };
      statistics: {
        total: number;
        recent24h: number;
        avgPerDay: number;
      };
      deduplication: {
        duplicatesDetected: number;
        newFilingsOnRetest: number;
      };
    };
  }
  
  let testResult: TestResult | null = null;
  let loading = false;
  let error: string | null = null;

  async function runStorageTest() {
    loading = true;
    error = null;
    testResult = null;
    
    try {
      const response = await fetch('/api/admin/test-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      testResult = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Storage test failed:', err);
    } finally {
      loading = false;
    }
  }

  async function getStorageStats() {
    try {
      const response = await fetch('/api/admin/monitoring/storage', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const stats = await response.json();
        console.log('Current storage stats:', stats);
        return stats;
      }
    } catch (err) {
      console.error('Failed to get storage stats:', err);
    }
    return null;
  }

  onMount(async () => {
    // Get initial storage stats
    await getStorageStats();
  });
</script>

<svelte:head>
  <title>Admin - Storage System Test</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        🧪 Filing Storage System Test
      </h1>
      
      <div class="mb-6">
        <p class="text-gray-700 mb-4">
          This test validates the comprehensive filing storage system implementation (Card B4):
        </p>
        <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Advanced deduplication with batch processing</li>
          <li>Data validation and sanitization</li>
          <li>Multi-docket batch processing</li>
          <li>Comprehensive statistics and monitoring</li>
          <li>Error handling and logging</li>
          <li>AI processing pipeline integration</li>
        </ul>
      </div>

      <div class="mb-6">
        <button 
          on:click={runStorageTest}
          disabled={loading}
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? '🔄 Running Test...' : '🚀 Run Storage Test'}
        </button>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 class="text-red-800 font-medium mb-2">❌ Test Failed</h3>
          <p class="text-red-700">{error}</p>
        </div>
      {/if}

      {#if testResult}
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 class="text-green-800 font-bold text-lg mb-4">
            ✅ {testResult.testName}
          </h3>
          
          {#if testResult.success}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <!-- Validation Results -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-medium text-gray-900 mb-2">📋 Validation</h4>
                <div class="text-sm text-gray-600">
                  <p>Total: {testResult.results.validation.total}</p>
                  <p>Valid: <span class="text-green-600">{testResult.results.validation.valid}</span></p>
                  <p>Invalid: <span class="text-red-600">{testResult.results.validation.invalid}</span></p>
                </div>
              </div>

              <!-- Storage Results -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-medium text-gray-900 mb-2">💾 Storage</h4>
                <div class="text-sm text-gray-600">
                  <p>New Filings: <span class="text-blue-600">{testResult.results.storage.newFilings}</span></p>
                  <p>Duplicates: <span class="text-yellow-600">{testResult.results.storage.duplicates}</span></p>
                  <p>Errors: <span class="text-red-600">{testResult.results.storage.errors}</span></p>
                  <p>Duration: {testResult.results.storage.duration}ms</p>
                </div>
              </div>

              <!-- Batch Processing -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-medium text-gray-900 mb-2">📦 Batch Processing</h4>
                <div class="text-sm text-gray-600">
                  <p>Dockets: {testResult.results.batchProcessing.docketsProcessed}</p>
                  <p>New Filings: {testResult.results.batchProcessing.totalNewFilings}</p>
                  <p>Duplicates: {testResult.results.batchProcessing.totalDuplicates}</p>
                </div>
              </div>

              <!-- Statistics -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-medium text-gray-900 mb-2">📊 Statistics</h4>
                <div class="text-sm text-gray-600">
                  <p>Total Filings: {testResult.results.statistics.total}</p>
                  <p>Recent (24h): {testResult.results.statistics.recent24h}</p>
                  <p>Avg/Day: {testResult.results.statistics.avgPerDay}</p>
                </div>
              </div>
            </div>

            <!-- Deduplication Test -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 class="font-medium text-blue-900 mb-2">🔄 Deduplication Test</h4>
              <p class="text-sm text-blue-800">
                Re-tested with same data - Detected {testResult.results.deduplication.duplicatesDetected} duplicates, 
                stored {testResult.results.deduplication.newFilingsOnRetest} new filings (should be 0)
              </p>
            </div>

            <!-- Success Message -->
            <div class="bg-green-100 border border-green-300 rounded-lg p-4">
              <p class="text-green-800 font-medium">
                🎉 {testResult.message}
              </p>
              <p class="text-sm text-green-700 mt-1">
                Test completed at: {new Date(testResult.timestamp).toLocaleString()}
              </p>
            </div>
          {:else}
            <div class="bg-red-100 border border-red-300 rounded-lg p-4">
              <p class="text-red-800 font-medium">Test failed: {testResult.error}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Test Details -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-medium text-gray-900 mb-2">📋 Test Coverage</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 class="font-medium text-gray-800">Storage Features:</h4>
            <ul class="list-disc list-inside space-y-1 mt-1">
              <li>Batch processing (25 items/batch)</li>
              <li>Advanced deduplication</li>
              <li>Individual error handling</li>
              <li>Performance monitoring</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-gray-800">Data Processing:</h4>
            <ul class="list-disc list-inside space-y-1 mt-1">
              <li>Data validation & sanitization</li>
              <li>Multi-docket processing</li>
              <li>Status tracking</li>
              <li>Comprehensive statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
</style> 