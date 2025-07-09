<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Test configuration
  let testConfig = {
    docketNumber: '11-42',
    userEmail: 'test-user@example.com',
    userTier: 'pro',
    filingLimit: 5,
    simulateFailure: false
  };

  // Test results
  let testResults = {
    ecfsTest: null,
    emailTest: null,
    queueTest: null,
    fullPipelineTest: null,
    tierComparisonTest: null
  };

  // Loading states
  let loading = {
    ecfs: false,
    email: false,
    queue: false,
    pipeline: false,
    tierComparison: false
  };

  // Error states
  let errors = {
    ecfs: null,
    email: null,
    queue: null,
    pipeline: null,
    tierComparison: null
  };

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

  async function testECFSFetching() {
    loading.ecfs = true;
    errors.ecfs = null;
    testResults.ecfsTest = null;

    try {
      const response = await fetch('/api/admin/test-cron-worker/ecfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docketNumber: testConfig.docketNumber,
          limit: testConfig.filingLimit
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults.ecfsTest = result;
      } else {
        errors.ecfs = result.error || 'Test failed';
      }
    } catch (error) {
      errors.ecfs = error.message;
    } finally {
      loading.ecfs = false;
    }
  }

  async function testEmailGeneration() {
    loading.email = true;
    errors.email = null;
    testResults.emailTest = null;

    try {
      const response = await fetch('/api/admin/test-cron-worker/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: testConfig.userEmail,
          userTier: testConfig.userTier,
          docketNumber: testConfig.docketNumber
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults.emailTest = result;
      } else {
        errors.email = result.error || 'Test failed';
      }
    } catch (error) {
      errors.email = error.message;
    } finally {
      loading.email = false;
    }
  }

  async function testQueueProcessing() {
    loading.queue = true;
    errors.queue = null;
    testResults.queueTest = null;

    try {
      const response = await fetch('/api/admin/test-cron-worker/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: testConfig.userEmail,
          docketNumber: testConfig.docketNumber,
          simulateFailure: testConfig.simulateFailure
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults.queueTest = result;
      } else {
        errors.queue = result.error || 'Test failed';
      }
    } catch (error) {
      errors.queue = error.message;
    } finally {
      loading.queue = false;
    }
  }

  async function testFullPipeline() {
    loading.pipeline = true;
    errors.pipeline = null;
    testResults.fullPipelineTest = null;

    try {
      const response = await fetch('/api/admin/test-cron-worker/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docketNumber: testConfig.docketNumber,
          userEmail: testConfig.userEmail,
          userTier: testConfig.userTier,
          filingLimit: testConfig.filingLimit,
          simulateFailure: testConfig.simulateFailure
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults.fullPipelineTest = result;
      } else {
        errors.pipeline = result.error || 'Test failed';
      }
    } catch (error) {
      errors.pipeline = error.message;
    } finally {
      loading.pipeline = false;
    }
  }

  async function testTierComparison() {
    loading.tierComparison = true;
    errors.tierComparison = null;
    testResults.tierComparisonTest = null;

    try {
      const response = await fetch('/api/admin/test-cron-worker/tier-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: testConfig.userEmail,
          docketNumber: testConfig.docketNumber
        })
      });

      const result = await response.json();
      if (response.ok) {
        testResults.tierComparisonTest = result;
      } else {
        errors.tierComparison = result.error || 'Test failed';
      }
    } catch (error) {
      errors.tierComparison = error.message;
    } finally {
      loading.tierComparison = false;
    }
  }

  function clearAllResults() {
    testResults = {
      ecfsTest: null,
      emailTest: null,
      queueTest: null,
      fullPipelineTest: null,
      tierComparisonTest: null
    };
    errors = {
      ecfs: null,
      email: null,
      queue: null,
      pipeline: null,
      tierComparison: null
    };
  }
</script>

<svelte:head>
  <title>Cron-Worker Test Dashboard - SimpleDCC Admin</title>
</svelte:head>

<div class="test-dashboard">
  <header class="test-header">
    <h1>🔧 Cron-Worker Test Dashboard</h1>
    <p>Test the complete data processing pipeline: ECFS → Queue → Email Generation</p>
  </header>

  <!-- Test Configuration -->
  <Card>
    <div slot="header">
      <h2>⚙️ Test Configuration</h2>
    </div>
    
    <div class="config-form">
      <div class="form-row">
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
          <label for="userEmail">Test User Email</label>
          <input 
            id="userEmail"
            bind:value={testConfig.userEmail} 
            placeholder="test-user@example.com"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="userTier">User Tier</label>
          <select id="userTier" bind:value={testConfig.userTier} class="form-select">
            <option value="free">Free</option>
            <option value="trial">Trial</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filingLimit">Filing Limit</label>
          <input 
            id="filingLimit"
            type="number" 
            bind:value={testConfig.filingLimit} 
            min="1" 
            max="20"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              bind:checked={testConfig.simulateFailure}
            />
            Simulate Failure (for error testing)
          </label>
        </div>
        
        <div class="form-group">
          <Button variant="secondary" on:click={clearAllResults}>
            Clear All Results
          </Button>
        </div>
      </div>
    </div>
  </Card>

  <!-- Test Actions -->
  <div class="test-actions">
    <Card>
      <div slot="header">
        <h3>🌐 ECFS Data Fetching</h3>
      </div>
      
      <p>Test fetching latest filings from the FCC ECFS API</p>
      
      <div class="action-button">
        <Button 
          on:click={testECFSFetching} 
          disabled={loading.ecfs}
          variant="primary"
        >
          {#if loading.ecfs}
            <LoadingSpinner size="sm" /> Testing ECFS...
          {:else}
            Test ECFS Fetching
          {/if}
        </Button>
      </div>

      {#if errors.ecfs}
        <div class="error-box">❌ {errors.ecfs}</div>
      {/if}

      {#if testResults.ecfsTest}
        <div class="result-box">
          <h4>✅ ECFS Test Results</h4>
          <div class="result-stats">
            <span class="stat">📄 {testResults.ecfsTest.filingsFound} filings found</span>
            <span class="stat">🎯 Docket: {testResults.ecfsTest.docketNumber}</span>
            <span class="stat">⏱️ {testResults.ecfsTest.duration}ms</span>
          </div>
          {#if testResults.ecfsTest.sampleFiling}
            <div class="sample-data">
              <strong>Sample Filing:</strong> {testResults.ecfsTest.sampleFiling.title}
            </div>
          {/if}
        </div>
      {/if}
    </Card>

    <Card>
      <div slot="header">
        <h3>📧 Email Generation</h3>
      </div>
      
      <p>Test tier-based email template generation</p>
      
      <div class="action-button">
        <Button 
          on:click={testEmailGeneration} 
          disabled={loading.email}
          variant="primary"
        >
          {#if loading.email}
            <LoadingSpinner size="sm" /> Generating Email...
          {:else}
            Test Email Generation
          {/if}
        </Button>
      </div>

      {#if errors.email}
        <div class="error-box">❌ {errors.email}</div>
      {/if}

      {#if testResults.emailTest}
        <div class="result-box">
          <h4>✅ Email Test Results</h4>
          <div class="result-stats">
            <span class="stat">👤 Tier: {testResults.emailTest.userTier}</span>
            <span class="stat">📝 HTML: {testResults.emailTest.htmlLength} chars</span>
            <span class="stat">📄 Text: {testResults.emailTest.textLength} chars</span>
          </div>
          <div class="email-preview">
            <strong>Subject:</strong> {testResults.emailTest.subject}
          </div>
          {#if testResults.emailTest.tierFeatures}
            <div class="tier-features">
              <strong>Tier Features:</strong>
              {#each testResults.emailTest.tierFeatures as feature}
                <span class="feature-tag">{feature}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </Card>

    <Card>
      <div slot="header">
        <h3>📬 Queue Processing</h3>
      </div>
      
      <p>Test notification queue creation and processing</p>
      
      <div class="action-button">
        <Button 
          on:click={testQueueProcessing} 
          disabled={loading.queue}
          variant="primary"
        >
          {#if loading.queue}
            <LoadingSpinner size="sm" /> Processing Queue...
          {:else}
            Test Queue Processing
          {/if}
        </Button>
      </div>

      {#if errors.queue}
        <div class="error-box">❌ {errors.queue}</div>
      {/if}

      {#if testResults.queueTest}
        <div class="result-box">
          <h4>✅ Queue Test Results</h4>
          <div class="result-stats">
            <span class="stat">🔄 Processed: {testResults.queueTest.processed}</span>
            <span class="stat">✅ Sent: {testResults.queueTest.sent}</span>
            <span class="stat">❌ Failed: {testResults.queueTest.failed}</span>
          </div>
          {#if testResults.queueTest.queueId}
            <div class="queue-info">
              <strong>Queue Entry ID:</strong> {testResults.queueTest.queueId}
            </div>
          {/if}
        </div>
      {/if}
    </Card>
  </div>

  <!-- Advanced Tests -->
  <div class="advanced-tests">
    <Card>
      <div slot="header">
        <h3>🚀 Full Pipeline Test</h3>
      </div>
      
      <p>Run the complete end-to-end pipeline: ECFS → Queue → Email</p>
      
      <div class="action-button">
        <Button 
          on:click={testFullPipeline} 
          disabled={loading.pipeline}
          variant="success"
        >
          {#if loading.pipeline}
            <LoadingSpinner size="sm" /> Running Pipeline...
          {:else}
            Run Full Pipeline Test
          {/if}
        </Button>
      </div>

      {#if errors.pipeline}
        <div class="error-box">❌ {errors.pipeline}</div>
      {/if}

      {#if testResults.fullPipelineTest}
        <div class="result-box">
          <h4>✅ Full Pipeline Results</h4>
          <div class="pipeline-summary">
            {#each testResults.fullPipelineTest.steps as step, index}
              <div class="step-result" class:step-success={step.success} class:step-error={!step.success}>
                <span class="step-number">{index + 1}</span>
                <span class="step-name">{step.name}</span>
                <span class="step-status">{step.success ? '✅' : '❌'}</span>
                {#if step.duration}
                  <span class="step-duration">{step.duration}ms</span>
                {/if}
              </div>
            {/each}
          </div>
          {#if testResults.fullPipelineTest.summary}
            <div class="pipeline-summary-text">
              {testResults.fullPipelineTest.summary}
            </div>
          {/if}
        </div>
      {/if}
    </Card>

    <Card>
      <div slot="header">
        <h3>🎭 Tier Comparison Test</h3>
      </div>
      
      <p>Compare email generation across all user tiers</p>
      
      <div class="action-button">
        <Button 
          on:click={testTierComparison} 
          disabled={loading.tierComparison}
          variant="primary"
        >
          {#if loading.tierComparison}
            <LoadingSpinner size="sm" /> Comparing Tiers...
          {:else}
            Test Tier Comparison
          {/if}
        </Button>
      </div>

      {#if errors.tierComparison}
        <div class="error-box">❌ {errors.tierComparison}</div>
      {/if}

      {#if testResults.tierComparisonTest}
        <div class="result-box">
          <h4>✅ Tier Comparison Results</h4>
          <div class="tier-comparison">
            {#each testResults.tierComparisonTest.tiers as tier}
              <div class="tier-result">
                <h5>{tier.name.toUpperCase()} Tier</h5>
                <div class="tier-stats">
                  <span>HTML: {tier.htmlLength} chars</span>
                  <span>Features: {tier.features.length}</span>
                </div>
                <div class="tier-features">
                  {#each tier.features as feature}
                    <span class="feature-tag {tier.name}">{feature}</span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </Card>
  </div>
</div>

<style>
  .test-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .test-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .test-header h1 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
  }

  .test-header p {
    color: #6b7280;
    font-size: 1.1rem;
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .form-input, .form-select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .checkbox-group {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-group label {
    margin: 0;
    font-weight: normal;
  }

  .test-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }

  .advanced-tests {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .action-button {
    margin: 1rem 0;
  }

  .error-box {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .result-box {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .result-box h4 {
    margin: 0 0 1rem 0;
    color: #065f46;
  }

  .result-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stat {
    background-color: #ecfdf5;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .sample-data, .email-preview, .queue-info {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: #ffffff;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .tier-features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .feature-tag {
    background-color: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .feature-tag.free {
    background-color: #fef3c7;
    color: #92400e;
  }

  .feature-tag.trial {
    background-color: #ddd6fe;
    color: #7c3aed;
  }

  .feature-tag.pro {
    background-color: #d1fae5;
    color: #065f46;
  }

  .pipeline-summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .step-result {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
  }

  .step-success {
    background-color: #f0fdf4;
  }

  .step-error {
    background-color: #fef2f2;
  }

  .step-number {
    background-color: #374151;
    color: white;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .step-name {
    font-weight: 500;
  }

  .step-duration {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .tier-comparison {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .tier-result {
    padding: 1rem;
    background-color: #ffffff;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .tier-result h5 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .tier-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .pipeline-summary-text {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    white-space: pre-line;
  }
</style> 