<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Test configuration
  let testConfig = {
    adminSecret: '',
    docketNumber: '11-42',
    filingLimit: 2
  };

  // Test state
  let testResults = null;
  let loading = false;
  let error = null;
  let testStartTime = null;

  onMount(async () => {
    // Check authentication on mount
    try {
      const response = await fetch('/api/admin/auth/check');
      if (!response.ok) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/admin/login';
    }
  });

  async function runProductionTest() {
    if (!testConfig.adminSecret.trim()) {
      error = 'Admin secret is required';
      return;
    }
    
    if (!testConfig.docketNumber.trim()) {
      error = 'Docket number is required';
      return;
    }

    loading = true;
    error = null;
    testResults = null;
    testStartTime = new Date().toISOString();

    try {
      const response = await fetch('/api/admin/manual-production-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret: testConfig.adminSecret,
          docketNumber: testConfig.docketNumber,
          filingLimit: testConfig.filingLimit
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults = result;
      } else {
        error = result.error || 'Test failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('Production test failed:', err);
    } finally {
      loading = false;
    }
  }

  function clearResults() {
    testResults = null;
    error = null;
  }

  function copyToClipboard(text, elementId) {
    navigator.clipboard.writeText(text).then(() => {
      // Show temporary feedback
      const button = document.getElementById(elementId);
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  }
</script>

<svelte:head>
  <title>Manual Production Test - SimpleDCC Admin</title>
</svelte:head>

<div class="production-test">
  <header class="test-header">
    <h1>🚀 Manual Production Test</h1>
    <p>Test the production Cloudflare Worker pipeline with full visibility into each processing step</p>
  </header>

  <!-- Test Configuration -->
  <Card>
    <div slot="header">
      <h2>⚙️ Test Configuration</h2>
    </div>
    
    <div class="config-form">
      <div class="form-row">
        <div class="form-group">
          <label for="adminSecret">Admin Secret (CRON_SECRET)</label>
          <input 
            id="adminSecret"
            type="password"
            bind:value={testConfig.adminSecret} 
            placeholder="Enter admin secret"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="docketNumber">Docket Number</label>
          <input 
            id="docketNumber"
            bind:value={testConfig.docketNumber} 
            placeholder="e.g., 11-42"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="filingLimit">Filing Limit</label>
          <input 
            id="filingLimit"
            type="number" 
            bind:value={testConfig.filingLimit} 
            min="1" 
            max="100"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-actions">
        <Button 
          on:click={runProductionTest} 
          disabled={loading || !testConfig.adminSecret.trim() || !testConfig.docketNumber.trim()}
          variant="primary"
        >
          {#if loading}
            <LoadingSpinner size="sm" /> Running Production Test...
          {:else}
            🚀 Run Production Test
          {/if}
        </Button>
        
        <Button variant="secondary" on:click={clearResults}>
          Clear Results
        </Button>
      </div>
    </div>
  </Card>

  <!-- Error Display -->
  {#if error}
    <Card>
      <div slot="header">
        <h3>❌ Error</h3>
      </div>
      <div class="error-content">
        <pre>{error}</pre>
      </div>
    </Card>
  {/if}

  <!-- Test Results -->
  {#if testResults}
    <div class="test-results">
      
      <!-- Test Summary -->
      <Card>
        <div slot="header">
          <h3>📊 Test Summary</h3>
        </div>
        <div class="summary-content">
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-label">Status:</span>
              <span class="stat-value" class:success={testResults.success} class:error={!testResults.success}>
                {testResults.success ? '✅ Success' : '❌ Failed'}
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">Mode:</span>
              <span class="stat-value">{testResults.mode || 'manual'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Docket:</span>
              <span class="stat-value">{testResults.docket || testConfig.docketNumber}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Execution Time:</span>
              <span class="stat-value">{testResults.execution_time_ms || 'N/A'}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">Test Started:</span>
              <span class="stat-value">{testStartTime}</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Request Details -->
      <Card>
        <div slot="header">
          <h3>📤 Request Details</h3>
          <button 
            id="copy-request"
            class="copy-button" 
            on:click={() => copyToClipboard(JSON.stringify(testResults.request_details, null, 2), 'copy-request')}
          >
            Copy
          </button>
        </div>
        <div class="raw-output-container">
          <pre class="raw-output">{JSON.stringify(testResults.request_details, null, 2)}</pre>
        </div>
      </Card>

      <!-- Processing Steps -->
      {#if testResults.processing}
        <Card>
          <div slot="header">
            <h3>🔄 Processing Overview</h3>
            <button 
              id="copy-processing"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.processing, null, 2), 'copy-processing')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.processing, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- ECFS Data -->
      {#if testResults.ecfs_data}
        <Card>
          <div slot="header">
            <h3>🌐 ECFS Data Fetching</h3>
            <button 
              id="copy-ecfs"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.ecfs_data, null, 2), 'copy-ecfs')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.ecfs_data, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- Document Processing -->
      {#if testResults.document_processing}
        <Card>
          <div slot="header">
            <h3>📄 Document Processing (Jina)</h3>
            <button 
              id="copy-docs"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.document_processing, null, 2), 'copy-docs')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.document_processing, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- AI Analysis -->
      {#if testResults.ai_analysis}
        <Card>
          <div slot="header">
            <h3>🤖 AI Analysis (Gemini)</h3>
            <button 
              id="copy-ai"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.ai_analysis, null, 2), 'copy-ai')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.ai_analysis, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- Storage Operations -->
      {#if testResults.storage_operations}
        <Card>
          <div slot="header">
            <h3>💾 Storage Operations</h3>
            <button 
              id="copy-storage"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.storage_operations, null, 2), 'copy-storage')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.storage_operations, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- Notification Queue -->
      {#if testResults.notification_queue}
        <Card>
          <div slot="header">
            <h3>📬 Notification Queue</h3>
            <button 
              id="copy-notifications"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.notification_queue, null, 2), 'copy-notifications')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.notification_queue, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- Details -->
      {#if testResults.details}
        <Card>
          <div slot="header">
            <h3>🔍 Execution Details</h3>
            <button 
              id="copy-details"
              class="copy-button" 
              on:click={() => copyToClipboard(JSON.stringify(testResults.details, null, 2), 'copy-details')}
            >
              Copy
            </button>
          </div>
          <div class="raw-output-container">
            <pre class="raw-output">{JSON.stringify(testResults.details, null, 2)}</pre>
          </div>
        </Card>
      {/if}

      <!-- Full Raw Response -->
      <Card>
        <div slot="header">
          <h3>📋 Complete Raw Response</h3>
          <button 
            id="copy-full"
            class="copy-button" 
            on:click={() => copyToClipboard(JSON.stringify(testResults, null, 2), 'copy-full')}
          >
            Copy All
          </button>
        </div>
        <div class="raw-output-container">
          <pre class="raw-output">{JSON.stringify(testResults, null, 2)}</pre>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  .production-test {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .test-header {
    margin-bottom: 30px;
    text-align: center;
  }

  .test-header h1 {
    color: #1f2937;
    margin-bottom: 10px;
  }

  .test-header p {
    color: #6b7280;
    font-size: 16px;
  }

  .config-form {
    padding: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 600;
    margin-bottom: 5px;
    color: #374151;
  }

  .form-input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .error-content {
    padding: 20px;
    background: #fef2f2;
    border-radius: 6px;
    color: #dc2626;
  }

  .error-content pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    font-family: monospace;
  }

  .test-results {
    margin-top: 30px;
  }

  .summary-content {
    padding: 20px;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .stat-label {
    font-weight: 600;
    color: #374151;
  }

  .stat-value {
    font-family: monospace;
    font-size: 14px;
  }

  .stat-value.success {
    color: #059669;
  }

  .stat-value.error {
    color: #dc2626;
  }

  .copy-button {
    background: #6b7280;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
  }

  .copy-button:hover {
    background: #4b5563;
  }

  .raw-output-container {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f8fafc;
  }

  .raw-output {
    margin: 0;
    padding: 16px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    background: transparent;
    color: #1f2937;
  }

  /* Card header styling to include copy buttons */
  :global(.card .card-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style> 