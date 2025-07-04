<script lang="ts">
  import { onMount } from 'svelte';
  
  let testResults: any = null;
  let loading = false;
  let error: string | null = null;
  let docketNumber = '10-90';
  
  async function runFullTest() {
    if (!docketNumber.trim()) {
      error = 'Please enter a docket number';
      return;
    }
    
    loading = true;
    error = null;
    testResults = null;
    
    try {
      const response = await fetch(`/api/test-document-flow?docket=${encodeURIComponent(docketNumber.trim())}`, {
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
      console.error('Test failed:', err);
    } finally {
      loading = false;
    }
  }
  
  function setExampleDocket(docket: string) {
    docketNumber = docket;
  }
</script>

<div class="container">
  <h1>📄 Document Processing Flow Test</h1>
  <p>Complete end-to-end test of ECFS → Document Processing → Gemini AI</p>
  
  <div class="input-section">
    <label for="docket">Docket Number:</label>
    <input 
      id="docket"
      type="text" 
      bind:value={docketNumber}
      placeholder="Enter docket number (e.g., 10-90)"
      class="docket-input"
    />
    
    <div class="example-dockets">
      <p><strong>Example Dockets:</strong></p>
      <button type="button" on:click={() => setExampleDocket('11-42')} class="example-btn">
        11-42 (Direct PDFs)
      </button>
      <button type="button" on:click={() => setExampleDocket('10-90')} class="example-btn">
        10-90 (HTML Viewers)
      </button>
      <button type="button" on:click={() => setExampleDocket('07-114')} class="example-btn">
        07-114 (HTML Viewers)
      </button>
      <button type="button" on:click={() => setExampleDocket('02-6')} class="example-btn">
        02-6 (Mixed Types)
      </button>
    </div>
  </div>
  
  <div class="controls">
    <button on:click={runFullTest} disabled={loading || !docketNumber.trim()} class="test-button">
      {loading ? '🔄 Running Test...' : `🚀 Test Docket ${docketNumber}`}
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
      
      <!-- STEP 1: ECFS Fetching -->
      <div class="step">
        <h2>🔍 Step 1: ECFS Data Fetching</h2>
        <div class="section">
          <h3>📊 ECFS Results</h3>
          <p><strong>Docket:</strong> {testResults.docket}</p>
          <p><strong>Filings Found:</strong> {testResults.ecfs_results.filings_count}</p>
          <p><strong>Test Filing ID:</strong> {testResults.ecfs_results.test_filing_id}</p>
          <p><strong>Documents in Test Filing:</strong> {testResults.ecfs_results.documents_count}</p>
          
          {#if testResults.ecfs_results.test_document}
            <div class="document-info">
              <h4>📄 Test Document Details</h4>
              <p><strong>Filename:</strong> {testResults.ecfs_results.test_document.filename}</p>
              <p><strong>Original URL:</strong> {testResults.ecfs_results.test_document.src}</p>
              <p><strong>Transformed URL:</strong> {testResults.ecfs_results.test_document.transformed_url}</p>
              <p><strong>Route:</strong> {testResults.ecfs_results.test_document.route}</p>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- STEP 2: Jina Processing -->
      <div class="step">
        <h2>🌐 Step 2: Jina API Processing</h2>
        <div class="section">
          <h3>📡 Jina Request Details</h3>
          <p><strong>Strategy Used:</strong> {testResults.jina_results.strategy}</p>
          <p><strong>Total Chunks:</strong> {testResults.jina_results.total_chunks}</p>
          <p><strong>Successful Parses:</strong> {testResults.jina_results.successful_parses}</p>
          <p><strong>Final Text Length:</strong> {testResults.jina_results.final_text_length}</p>
          <p><strong>Sanitized Text Length:</strong> {testResults.jina_results.sanitized_text_length}</p>
          
          {#if testResults.jina_results.chunk_details}
            <div class="chunk-details">
              <h4>📦 All Chunk Details</h4>
              <div class="chunk-grid">
                {#each testResults.jina_results.chunk_details as chunk, i}
                  <div class="chunk-item">
                    <div class="chunk-header">
                      <strong>Chunk {i + 1}</strong>
                      <span class="chunk-size">{chunk.size} chars</span>
                    </div>
                    <div class="chunk-content">
                      <pre>{chunk.content}</pre>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <div class="final-text">
            <h4>📄 Final Extracted Text</h4>
            <div class="text-preview">
              <pre>{testResults.jina_results.final_text}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- STEP 3: Gemini Processing -->
      <div class="step">
        <h2>🤖 Step 3: Gemini AI Processing</h2>
        <div class="section">
          <h3>📤 Gemini Input</h3>
          <div class="gemini-input">
            <h4>💬 Full Prompt Sent to Gemini</h4>
            <div class="prompt-text">
              <pre>{testResults.gemini_results.prompt}</pre>
            </div>
          </div>
          
          <div class="gemini-output">
            <h4>📥 Gemini Raw Response</h4>
            <div class="response-text">
              <pre>{testResults.gemini_results.raw_response}</pre>
            </div>
          </div>
          
          <div class="gemini-parsed">
            <h4>🔍 Parsed Results</h4>
            <p><strong>Summary:</strong> {testResults.gemini_results.parsed.summary}</p>
            <p><strong>Key Points:</strong> {testResults.gemini_results.parsed.key_points.length} points</p>
            <p><strong>Confidence:</strong> {testResults.gemini_results.parsed.confidence}</p>
            
            {#if testResults.gemini_results.parsed.key_points.length > 0}
              <div class="key-points">
                <h5>📋 Key Points</h5>
                <ul>
                  {#each testResults.gemini_results.parsed.key_points as point}
                    <li>{point}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- STEP 4: Final Results -->
      <div class="step">
        <h2>✅ Step 4: Final Results</h2>
        <div class="section">
          <h3>📊 Processing Statistics</h3>
          <div class="stats-grid">
            <div class="stat">
              <strong>Total Processing Time:</strong>
              <span>{testResults.processing_stats.total_time_ms}ms</span>
            </div>
            <div class="stat">
              <strong>ECFS Time:</strong>
              <span>{testResults.processing_stats.ecfs_time_ms}ms</span>
            </div>
            <div class="stat">
              <strong>Jina Time:</strong>
              <span>{testResults.processing_stats.jina_time_ms}ms</span>
            </div>
            <div class="stat">
              <strong>Gemini Time:</strong>
              <span>{testResults.processing_stats.gemini_time_ms}ms</span>
            </div>
          </div>
          
          <div class="success-status">
            <h4>🎯 Success Status</h4>
            <p><strong>ECFS Success:</strong> {testResults.success_flags.ecfs_success ? '✅' : '❌'}</p>
            <p><strong>Jina Success:</strong> {testResults.success_flags.jina_success ? '✅' : '❌'}</p>
            <p><strong>Gemini Success:</strong> {testResults.success_flags.gemini_success ? '✅' : '❌'}</p>
            <p><strong>Overall Success:</strong> {testResults.success_flags.overall_success ? '✅' : '❌'}</p>
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
  
  .input-section label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #374151;
  }
  
  .docket-input {
    width: 100%;
    max-width: 300px;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
    margin-bottom: 16px;
  }
  
  .docket-input:focus {
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
    padding: 6px 12px;
    border-radius: 4px;
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
  
  .document-info {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
  }
  
  .chunk-details {
    margin: 20px 0;
  }
  
  .chunk-grid {
    display: grid;
    gap: 12px;
    margin: 12px 0;
  }
  
  .chunk-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .chunk-header {
    background: #f9fafb;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chunk-size {
    font-size: 12px;
    color: #6b7280;
  }
  
  .chunk-content {
    padding: 8px 12px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .final-text, .gemini-input, .gemini-output, .gemini-parsed {
    margin: 20px 0;
  }
  
  .text-preview, .prompt-text, .response-text {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 12px 0;
  }
  
  .stat {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .success-status {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
  }
  
  .key-points {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
  }
  
  .key-points ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  .key-points li {
    margin: 4px 0;
  }
  
  pre {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }
</style> 