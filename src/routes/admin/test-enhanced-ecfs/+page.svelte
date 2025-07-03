<script lang="ts">
  let testResults: any = null;
  let loading: boolean = false;
  let error: string | null = null;

  async function runTest(testType: string) {
    loading = true;
    error = null;
    testResults = null;
    
    try {
      let response: Response;
      
      switch(testType) {
        case 'basic':
          response = await fetch('/api/admin/test-ecfs-enhanced?docket=11-42&limit=5');
          break;
        case 'documents':
          response = await fetch('/api/admin/test-ecfs-enhanced?docket=11-42&limit=3&docs=true');
          break;
        case 'multi':
          response = await fetch('/api/admin/test-ecfs-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dockets: ['11-42', '21-450'] })
          });
          break;
        default:
          throw new Error('Unknown test type');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      testResults = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<div class="p-8 max-w-6xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Enhanced ECFS API Tests</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <button 
      on:click={() => runTest('basic')} 
      disabled={loading}
      class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      {loading ? 'Testing...' : 'Basic Test'}
      <div class="text-sm opacity-75">Docket 11-42, 5 filings</div>
    </button>
    
    <button 
      on:click={() => runTest('documents')} 
      disabled={loading}
      class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      {loading ? 'Testing...' : 'Document Test'}
      <div class="text-sm opacity-75">With PDF processing</div>
    </button>
    
    <button 
      on:click={() => runTest('multi')} 
      disabled={loading}
      class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
    >
      {loading ? 'Testing...' : 'Multi-Docket Test'}
      <div class="text-sm opacity-75">Multiple dockets</div>
    </button>
  </div>

  {#if loading}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        <span class="text-yellow-800">Running enhanced ECFS test...</span>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 class="text-red-800 font-semibold">Test Error</h3>
      <p class="text-red-700 mt-1">{error}</p>
    </div>
  {/if}

  {#if testResults}
    <div class="bg-white border border-gray-200 rounded-lg shadow">
      <div class="border-b border-gray-200 px-6 py-4">
        <h2 class="text-xl font-semibold text-gray-900">
          {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
        </h2>
      </div>
      
      <div class="p-6">
        <pre class="bg-gray-50 rounded-lg p-4 overflow-auto text-sm">{JSON.stringify(testResults, null, 2)}</pre>
      </div>
    </div>
  {/if}

  <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 class="text-blue-800 font-semibold mb-2">Direct API URLs:</h3>
    <div class="space-y-1 text-sm text-blue-700">
      <div><strong>Basic:</strong> <code>/api/admin/test-ecfs-enhanced?docket=11-42&limit=5</code></div>
      <div><strong>Documents:</strong> <code>/api/admin/test-ecfs-enhanced?docket=11-42&limit=3&docs=true</code></div>
      <div><strong>Multi-docket:</strong> <code>POST /api/admin/test-ecfs-enhanced</code></div>
    </div>
  </div>
</div>

<style>
  code {
    background-color: rgba(59, 130, 246, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }
</style> 