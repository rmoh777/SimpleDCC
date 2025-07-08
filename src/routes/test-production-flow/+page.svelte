<script lang="ts">
  import { onMount } from 'svelte';
  
  let testResults: any = null;
  let loading = false;
  let error: string | null = null;
  let docketNumber = '11-42';
  let limit = 2;
  let skipStorage = false;
  
  async function runProductionTest() {
    // Allow empty docket number for testing all active dockets
    
    loading = true;
    error = null;
    testResults = null;
    
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip_storage: skipStorage.toString()
      });
      
      // Only add docket parameter if it's not empty
      if (docketNumber.trim()) {
        params.set('docket', docketNumber.trim());
      }
      
      const response = await fetch(`/api/test-production-flow?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      testResults = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('Production test failed:', err);
    } finally {
      loading = false;
    }
  }
  
  function setExampleDocket(docket: string) {
    docketNumber = docket;
  }
  
  function runAllActiveDockets() {
    docketNumber = '';
    limit = 3;
    runProductionTest();
  }
</script>

<div class="container">
  <h1>🚀 Production Pipeline Test (E3 Enhanced)</h1>
  <p>Complete end-to-end test of the enhanced production pipeline: Database → ECFS → Storage → AI</p>
  
  <div class="input-section">
    <div class="form-row">
      <div class="form-group">
        <label for="docket">Docket Number:</label>
        <input 
          id="docket"
          type="text" 
          bind:value={docketNumber}
          placeholder="Leave empty to test all active dockets"
          class="docket-input"
        />
      </div>
      
      <div class="form-group">
        <label for="limit">Limit:</label>
        <input 
          id="limit"
          type="number" 
          bind:value={limit}
          min="1"
          max="10"
          class="limit-input"
        />
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            bind:checked={skipStorage}
          />
          Skip Storage (faster test)
        </label>
      </div>
    </div>
    
    <div class="example-dockets">
      <p><strong>Example Dockets:</strong></p>
      <button type="button" on:click={() => setExampleDocket('11-42')} class="example-btn">
        11-42 (Lifeline)
      </button>
      <button type="button" on:click={() => setExampleDocket('10-90')} class="example-btn">
        10-90 (Broadband)
      </button>
      <button type="button" on:click={() => setExampleDocket('23-108')} class="example-btn">
        23-108 (Recent)
      </button>
      <button type="button" on:click={runAllActiveDockets} class="example-btn all-btn">
        Test All Active Dockets
      </button>
    </div>
  </div>
  
  <div class="controls">
    <button on:click={runProductionTest} disabled={loading} class="test-button">
      {loading ? '🔄 Running Production Test...' : `🚀 Test ${docketNumber.trim() || 'All Active Dockets'}`}
    </button>
  </div>
  
  {#if error}
    <div class="error">
      <h3>❌ Error</h3>
      <pre>{error}</pre>
    </div>
  {/if}
  
  {#if testResults}
    <div class="results">
      
      <!-- Test Parameters -->
      <div class="step">
        <h2>🎯 Test Parameters</h2>
        <div class="section">
          <div class="params-grid">
            <div class="param">
              <strong>Target Docket:</strong>
              <span>{testResults.test_parameters.target_docket || 'All Active'}</span>
            </div>
            <div class="param">
              <strong>Dockets Tested:</strong>
              <span>{testResults.test_parameters.dockets_tested.join(', ')}</span>
            </div>
            <div class="param">
              <strong>Limit:</strong>
              <span>{testResults.test_parameters.limit}</span>
            </div>
            <div class="param">
              <strong>Skip Storage:</strong>
              <span>{testResults.test_parameters.skip_storage ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- STEP 1: Database -->
      <div class="step">
        <h2>📊 Step 1: Database Query</h2>
        <div class="section">
          <div class="stats-grid">
            <div class="stat">
              <strong>Total Active Dockets:</strong>
              <span>{testResults.step_results.database.total_active_dockets}</span>
            </div>
            <div class="stat">
              <strong>Processing Time:</strong>
              <span>{testResults.step_results.database.processing_time_ms}ms</span>
            </div>
          </div>
          
          <div class="dockets-tested">
            <h4>🎯 Dockets Selected for Testing</h4>
            <div class="docket-list">
              {#each testResults.step_results.database.test_dockets as docket}
                <span class="docket-tag">{docket}</span>
              {/each}
            </div>
          </div>
        </div>
      </div>
      
      <!-- STEP 2: ECFS Fetching -->
      <div class="step">
        <h2>📡 Step 2: Enhanced ECFS Processing</h2>
        <div class="section">
          <div class="stats-grid">
            <div class="stat">
              <strong>Total Filings Found:</strong>
              <span>{testResults.step_results.ecfs.total_filings}</span>
            </div>
            <div class="stat">
              <strong>Successful Dockets:</strong>
              <span>{testResults.step_results.ecfs.successful_dockets}</span>
            </div>
            <div class="stat">
              <strong>Failed Dockets:</strong>
              <span>{testResults.step_results.ecfs.failed_dockets}</span>
            </div>
            <div class="stat">
              <strong>Processing Time:</strong>
              <span>{testResults.step_results.ecfs.processing_time_ms}ms</span>
            </div>
          </div>
          
          {#if testResults.step_results.ecfs.sample_filing_ids?.length > 0}
            <div class="sample-filings">
              <h4>📄 Sample Filing IDs Found</h4>
              <div class="filing-list">
                {#each testResults.step_results.ecfs.sample_filing_ids as filingId}
                  <span class="filing-tag">{filingId}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- STEP 3: Storage -->
      <div class="step">
        <h2>💾 Step 3: Enhanced Storage Pipeline</h2>
        <div class="section">
          <div class="stats-grid">
            <div class="stat">
              <strong>Storage Enabled:</strong>
              <span>{testResults.step_results.storage.enabled ? '✅' : '❌'}</span>
            </div>
            <div class="stat">
              <strong>New Filings Stored:</strong>
              <span>{testResults.step_results.storage.new_filings}</span>
            </div>
            <div class="stat">
              <strong>AI Processed:</strong>
              <span>{testResults.step_results.storage.ai_processed}</span>
            </div>
            <div class="stat">
              <strong>Documents Processed:</strong>
              <span>{testResults.step_results.storage.documents_processed}</span>
            </div>
          </div>
          
          <div class="storage-status">
            <h4>🔧 Storage Configuration</h4>
            <p><strong>Enhanced Storage:</strong> {testResults.step_results.storage.enhanced_storage ? '✅ Active' : '❌ Fallback'}</p>
            <p><strong>Processing Time:</strong> {testResults.step_results.storage.processing_time_ms}ms</p>
          </div>
        </div>
      </div>
      
      <!-- STEP 4: AI Processing -->
      <div class="step">
        <h2>🤖 Step 4: AI Enhancement</h2>
        <div class="section">
          <div class="stats-grid">
            <div class="stat">
              <strong>AI Enabled:</strong>
              <span>{testResults.step_results.ai.enabled ? '✅' : '❌'}</span>
            </div>
            <div class="stat">
              <strong>Summary Generated:</strong>
              <span>{testResults.step_results.ai.summary_generated ? '✅' : '❌'}</span>
            </div>
            <div class="stat">
              <strong>Key Points:</strong>
              <span>{testResults.step_results.ai.key_points_count}</span>
            </div>
            <div class="stat">
              <strong>Processing Time:</strong>
              <span>{testResults.step_results.ai.processing_time_ms}ms</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Final Results -->
      <div class="step">
        <h2>✅ Final Results & Performance</h2>
        <div class="section">
          <div class="performance-grid">
            <div class="perf-stat">
              <strong>Total Processing Time:</strong>
              <span class="time-total">{testResults.processing_stats.total_time_ms}ms</span>
            </div>
            <div class="perf-stat">
              <strong>Database Query:</strong>
              <span>{testResults.processing_stats.database_time_ms}ms</span>
            </div>
            <div class="perf-stat">
              <strong>ECFS Fetching:</strong>
              <span>{testResults.processing_stats.ecfs_time_ms}ms</span>
            </div>
            <div class="perf-stat">
              <strong>Storage Processing:</strong>
              <span>{testResults.processing_stats.storage_time_ms}ms</span>
            </div>
            <div class="perf-stat">
              <strong>AI Processing:</strong>
              <span>{testResults.processing_stats.ai_time_ms}ms</span>
            </div>
          </div>
          
          <div class="success-status">
            <h4>🎯 Success Flags</h4>
            <div class="flags-grid">
              <div class="flag">
                <strong>Database:</strong>
                <span class="flag-value">{testResults.success_flags.database_success ? '✅' : '❌'}</span>
              </div>
              <div class="flag">
                <strong>ECFS:</strong>
                <span class="flag-value">{testResults.success_flags.ecfs_success ? '✅' : '❌'}</span>
              </div>
              <div class="flag">
                <strong>Storage:</strong>
                <span class="flag-value">{testResults.success_flags.storage_success ? '✅' : '❌'}</span>
              </div>
              <div class="flag">
                <strong>AI:</strong>
                <span class="flag-value">{testResults.success_flags.ai_success ? '✅' : '❌'}</span>
              </div>
              <div class="flag overall">
                <strong>Overall:</strong>
                <span class="flag-value">{testResults.success_flags.overall_success ? '✅' : '❌'}</span>
              </div>
              <div class="flag enhanced">
                <strong>Enhanced Pipeline:</strong>
                <span class="flag-value">{testResults.success_flags.enhanced_pipeline ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
          
          <div class="environment-status">
            <h4>🔧 Environment Configuration</h4>
            <div class="env-grid">
              <div class="env-item">
                <strong>ECFS API:</strong>
                <span>{testResults.environment_status.ecfs_api_configured ? '✅' : '❌'}</span>
              </div>
              <div class="env-item">
                <strong>Gemini API:</strong>
                <span>{testResults.environment_status.gemini_api_configured ? '✅' : '❌'}</span>
              </div>
              <div class="env-item">
                <strong>Jina API:</strong>
                <span>{testResults.environment_status.jina_api_configured ? '✅' : '❌'}</span>
              </div>
              <div class="env-item">
                <strong>Database:</strong>
                <span>{testResults.environment_status.database_available ? '✅' : '❌'}</span>
              </div>
              <div class="env-item">
                <strong>Cron Secret:</strong>
                <span>{testResults.environment_status.cron_secret_configured ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .input-section {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 20px;
    align-items: end;
    margin-bottom: 16px;
  }
  
  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
    color: #374151;
    font-size: 14px;
  }
  
  .docket-input {
    width: 100%;
    min-width: 250px;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
  }
  
  .limit-input {
    width: 80px;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
  }
  
  .checkbox-label input {
    margin-right: 8px;
  }
  
  .docket-input:focus, .limit-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .example-dockets {
    margin-top: 16px;
  }
  
  .example-dockets p {
    margin: 0 0 8px 0;
    color: #6b7280;
    font-size: 14px;
  }
  
  .example-btn {
    background: #ffffff;
    border: 1px solid #d1d5db;
    padding: 8px 16px;
    border-radius: 6px;
    margin-right: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .example-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
  
  .all-btn {
    background: #059669;
    color: white;
    border-color: #047857;
  }
  
  .all-btn:hover {
    background: #047857;
  }
  
  .controls {
    margin: 20px 0;
  }
  
  .test-button {
    background: #2563eb;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  }
  
  .test-button:hover {
    background: #1d4ed8;
  }
  
  .test-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .error {
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 16px;
    margin: 20px 0;
    color: #dc2626;
  }
  
  .results {
    margin-top: 20px;
  }
  
  .step {
    margin: 20px 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .step h2 {
    background: #f3f4f6;
    margin: 0;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .section {
    padding: 16px;
  }
  
  .params-grid, .stats-grid, .performance-grid, .flags-grid, .env-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 12px 0;
  }
  
  .param, .stat, .perf-stat, .flag, .env-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .time-total {
    font-weight: 600;
    color: #059669;
  }
  
  .flag.overall {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  
  .flag.enhanced {
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  
  .dockets-tested, .sample-filings, .storage-status, .success-status, .environment-status {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
  }
  
  .success-status {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  
  .docket-list, .filing-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  
  .docket-tag, .filing-tag {
    background: #2563eb;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .filing-tag {
    background: #059669;
  }
  
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
  }
  
  h4 {
    margin: 0 0 8px 0;
    color: #374151;
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .params-grid, .stats-grid, .performance-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 