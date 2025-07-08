<script>
  import { onMount } from 'svelte';
  
  let filings = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/test-database-view');
      const data = await response.json();
      
      if (data.success) {
        filings = data.filings;
      } else {
        error = data.error;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }
  
  function truncateText(text, maxLength = 500) {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  function formatJSON(jsonString) {
    if (!jsonString) return 'N/A';
    try {
      if (typeof jsonString === 'string') {
        return JSON.stringify(JSON.parse(jsonString), null, 2);
      }
      return JSON.stringify(jsonString, null, 2);
    } catch (e) {
      return jsonString;
    }
  }
  
  function parseKeyPoints(keyPoints) {
    if (!keyPoints) return [];
    
    // If it's a string (markdown format), split by lines that start with -
    if (typeof keyPoints === 'string') {
      return keyPoints
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^-\s*/, ''));
    }
    
    // If it's already an array, return as-is
    return Array.isArray(keyPoints) ? keyPoints : [];
  }
</script>

<div class="container">
  <h1>📊 Database Test View - Recent Filings</h1>
  <p class="subtitle">View the AI-processed filings from your latest test run</p>
  
  {#if loading}
    <div class="loading">
      <p>🔄 Loading filings from database...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ Error: {error}</p>
    </div>
  {:else if filings.length === 0}
    <div class="empty">
      <p>📭 No filings found in database</p>
    </div>
  {:else}
    <div class="summary">
      <p>✅ Found <strong>{filings.length}</strong> filings in database</p>
    </div>
    
    <div class="filings-container">
      {#each filings as filing, index}
        <div class="filing-comprehensive">
          <div class="filing-header">
            <h2>📄 Filing #{index + 1} - Complete Pipeline View</h2>
            <span class="filing-id">{filing.id}</span>
          </div>
          
          <!-- SECTION 1: FILING METADATA -->
          <div class="section">
            <h3>📋 Filing Metadata</h3>
            <div class="metadata-grid">
              <div class="metadata-item">
                <strong>Docket:</strong> {filing.docket_number || 'N/A'}
              </div>
              <div class="metadata-item">
                <strong>Type:</strong> {filing.filing_type || 'N/A'}
              </div>
              <div class="metadata-item">
                <strong>Date:</strong> {formatDate(filing.date_received)}
              </div>
              <div class="metadata-item">
                <strong>Author:</strong> {filing.author || 'N/A'}
              </div>
              <div class="metadata-item">
                <strong>Status:</strong> {filing.status || 'N/A'}
              </div>
              <div class="metadata-item">
                <strong>Processed:</strong> {formatDate(filing.processed_at)}
              </div>
              <div class="metadata-item full-width">
                <strong>Title:</strong> {filing.title || 'N/A'}
              </div>
              <div class="metadata-item full-width">
                <strong>URL:</strong> 
                {#if filing.filing_url}
                  <a href={filing.filing_url} target="_blank">{filing.filing_url}</a>
                {:else}
                  N/A
                {/if}
              </div>
            </div>
          </div>

          <!-- SECTION 2: DOCUMENTS & EXTRACTED TEXT -->
          <div class="section">
            <h3>📄 Documents & Extracted Text</h3>
            {#if filing.documents}
              <div class="scrollable-content">
                <h4>Raw Documents Data:</h4>
                <pre class="json-display">{formatJSON(filing.documents)}</pre>
              </div>
            {/if}
            
            <div class="processing-stats">
              <span class="badge">📄 {filing.documents_processed || 0} documents processed</span>
              <span class="badge">🤖 AI Enhanced: {filing.ai_enhanced ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <!-- SECTION 3: GEMINI AI PROCESSING -->
          <div class="section">
            <h3>🧠 Gemini AI Processing Pipeline</h3>
            
            <div class="ai-section">
              <h4>📤 Input to Gemini (Prompt)</h4>
              <div class="scrollable-content">
                <div class="ai-content">
                  {#if filing.documents && filing.documents.length > 0}
                    {#each filing.documents.filter(d => d.text_content) as doc}
                      <strong>Document: {doc.filename}</strong><br/>
                      <em>Extracted Text ({doc.text_content?.length || 0} characters):</em><br/>
                      {doc.text_content}<br/><br/>
                    {/each}
                  {:else}
                    <em>No document text extracted for AI processing</em>
                  {/if}
                </div>
              </div>
            </div>

            <div class="ai-section">
              <h4>📥 Raw Gemini Response</h4>
              <div class="scrollable-content">
                <div class="ai-content">
                  {#if filing.ai_summary || filing.ai_key_points || filing.ai_stakeholders}
                    <em>Complete AI response would include all structured fields below...</em><br/>
                    <strong>Note:</strong> Raw response is parsed into structured fields shown in next section.
                  {:else}
                    <em>No AI response available</em>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 4: AI ANALYSIS (EMAIL CONTENT) -->
          <div class="section">
            <h3>📧 AI Analysis - The Email Content</h3>
            
            {#if filing.ai_summary}
              <div class="ai-section">
                <h4>📝 Executive Summary</h4>
                <div class="scrollable-content">
                  <div class="ai-content">{filing.ai_summary}</div>
                </div>
              </div>
            {/if}

            {#if filing.ai_key_points}
              <div class="ai-section">
                <h4>🔑 Key Regulatory Points</h4>
                <div class="scrollable-content">
                  {#each parseKeyPoints(filing.ai_key_points) as point}
                    <div class="key-point">• {point}</div>
                  {:else}
                    <div class="ai-content">{filing.ai_key_points}</div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if filing.ai_stakeholders}
              <div class="ai-section">
                <h4>👥 Stakeholder Analysis</h4>
                <div class="scrollable-content">
                  <div class="ai-content">{filing.ai_stakeholders}</div>
                </div>
              </div>
            {/if}

            {#if filing.ai_regulatory_impact}
              <div class="ai-section">
                <h4>⚖️ Regulatory Impact Assessment</h4>
                <div class="scrollable-content">
                  <div class="ai-content">{filing.ai_regulatory_impact}</div>
                </div>
              </div>
            {/if}

            {#if filing.ai_document_analysis}
              <div class="ai-section">
                <h4>📊 Document Analysis</h4>
                <div class="scrollable-content">
                  <div class="ai-content">{filing.ai_document_analysis}</div>
                </div>
              </div>
            {/if}

            {#if filing.ai_confidence}
              <div class="ai-section">
                <h4>🎯 AI Confidence Level</h4>
                <div class="confidence-badge">{filing.ai_confidence}</div>
              </div>
            {/if}
          </div>

          <!-- SECTION 5: RAW DATA -->
          <div class="section">
            <h3>🔧 Raw Filing Data</h3>
            <div class="scrollable-content">
              <pre class="json-display">{formatJSON(filing.raw_data)}</pre>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  h1 {
    color: #2563eb;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #6b7280;
    margin-bottom: 2rem;
  }
  
  .loading, .error, .empty {
    text-align: center;
    padding: 2rem;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
  }
  
  .error {
    border-color: #ef4444;
    color: #ef4444;
  }
  
  .summary {
    background: #f0f9ff;
    border: 1px solid #7dd3fc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
  }
  
  .filings-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  }
  
  .filing-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .filing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .filing-header h3 {
    margin: 0;
    color: #1f2937;
  }
  
  .filing-id {
    font-family: monospace;
    font-size: 0.8rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .filing-info {
    margin-bottom: 1rem;
  }
  
  .info-row {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .info-row strong {
    color: #374151;
    min-width: 80px;
    display: inline-block;
  }
  
  .ai-summary, .key-points {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #10b981;
  }
  
  .ai-summary h4, .key-points h4 {
    margin: 0 0 0.5rem 0;
    color: #059669;
    font-size: 1rem;
  }
  
  .summary-text, .points-text {
    color: #374151;
    line-height: 1.5;
    font-size: 0.9rem;
  }
  
  .processing-info {
    margin-bottom: 1rem;
  }
  
  .badge {
    display: inline-block;
    background: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }
  
  .filing-footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem;
    text-align: right;
  }
  
  .filing-footer small {
    color: #6b7280;
  }

  /* New comprehensive layout styles */
  .filings-container {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .filing-comprehensive {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    border: 1px solid #e5e7eb;
    max-width: 100%;
  }

  .filing-comprehensive .filing-header {
    border-bottom: 3px solid #f3f4f6;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
  }

  .filing-comprehensive .filing-header h2 {
    margin: 0;
    color: #1f2937;
    font-size: 1.5rem;
  }

  .filing-comprehensive .filing-id {
    background: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: sans-serif;
  }

  .section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
  }

  .section h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .metadata-item {
    background: white;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .metadata-item.full-width {
    grid-column: 1 / -1;
  }

  .metadata-item strong {
    color: #374151;
    margin-right: 0.5rem;
  }

  .metadata-item a {
    color: #3b82f6;
    text-decoration: none;
    word-break: break-all;
  }

  .metadata-item a:hover {
    text-decoration: underline;
  }

  .processing-stats {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .ai-section {
    margin-bottom: 1.5rem;
  }

  .ai-section h4 {
    margin: 0 0 0.75rem 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .scrollable-content {
    max-height: 400px;
    overflow-y: auto;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .ai-content {
    line-height: 1.7;
    color: #374151;
    white-space: pre-wrap;
    font-size: 0.95rem;
  }

  .key-point {
    margin-bottom: 0.5rem;
    color: #374151;
    line-height: 1.6;
  }

  .json-display {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.4;
    max-height: 300px;
    overflow-y: auto;
  }

  .confidence-badge {
    display: inline-block;
    background: linear-gradient(45deg, #10b981, #059669);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .processing-stats .badge {
    background: #10b981;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* Scrollbar styling */
  .scrollable-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollable-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .scrollable-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .scrollable-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style> 