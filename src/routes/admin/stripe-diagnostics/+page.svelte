<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Test configuration
  let testEmail = 'test@simpledcc.com';
  let adminSecret = '';
  let isAuthenticated = false;
  
  // Test state
  let isRunning = false;
  let currentStep = '';
  let testResults = [];
  let overallStatus = 'pending'; // pending, running, success, failed
  
  // Step results
  let stepResults = {
    emailValidation: null,
    envVariables: null,
    userOperations: null,
    stripeInit: null,
    stripeCustomer: null,
    stripePriceValidation: null,
    checkoutSession: null,
    webhookTest: null,
    fullIntegration: null
  };

  onMount(async () => {
    if (browser) {
      await checkAuth();
    }
  });

  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/auth/check');
      isAuthenticated = response.ok;
      if (!isAuthenticated) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/admin/login';
    }
  }

  async function runComprehensiveTest() {
    if (!testEmail || !adminSecret) {
      alert('Please provide test email and admin secret');
      return;
    }

    isRunning = true;
    overallStatus = 'running';
    testResults = [];
    currentStep = '';

    // Reset step results
    Object.keys(stepResults).forEach(key => {
      stepResults[key] = null;
    });

    try {
      // Step 1: Email Validation
      await runStep('emailValidation', 'Email Input & Validation', async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(testEmail);
        
        if (!isValid) {
          throw new Error('Invalid email format');
        }
        
        return {
          email: testEmail,
          valid: true,
          format: 'valid'
        };
      });

      // Step 2: Environment Variables Check
      await runStep('envVariables', 'Environment Variables Check', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/env-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Environment check failed');
        }
        
        return await response.json();
      });

      // Step 3: User Database Operations
      await runStep('userOperations', 'User Lookup/Creation', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/user-ops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'User operations failed');
        }
        
        return await response.json();
      });

      // Step 4: Stripe SDK Initialization
      await runStep('stripeInit', 'Stripe SDK Initialization', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/stripe-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Stripe initialization failed');
        }
        
        return await response.json();
      });

      // Step 5: Stripe Customer Creation/Retrieval
      await runStep('stripeCustomer', 'Stripe Customer Operations', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/stripe-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Stripe customer operations failed');
        }
        
        return await response.json();
      });

      // Step 6: Stripe Price Validation
      await runStep('stripePriceValidation', 'Stripe Price ID Validation', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/price-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Price validation failed');
        }
        
        return await response.json();
      });

      // Step 7: Checkout Session Creation
      await runStep('checkoutSession', 'Checkout Session Creation', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Checkout session creation failed');
        }
        
        return await response.json();
      });

      // Step 8: Webhook Testing
      await runStep('webhookTest', 'Webhook Endpoint Testing', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/webhook-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Webhook testing failed');
        }
        
        return await response.json();
      });

      // Step 9: Full Integration Test
      await runStep('fullIntegration', 'Complete Flow Integration Test', async () => {
        const response = await fetch('/api/admin/stripe-diagnostics/full-integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, adminSecret })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Full integration test failed');
        }
        
        return await response.json();
      });

      overallStatus = 'success';
      currentStep = 'All tests completed successfully!';

    } catch (error) {
      overallStatus = 'failed';
      currentStep = `Test failed: ${error.message}`;
      console.error('Comprehensive test failed:', error);
    } finally {
      isRunning = false;
    }
  }

  async function runStep(stepKey, stepName, stepFunction) {
    currentStep = `Running: ${stepName}`;
    
    try {
      const startTime = Date.now();
      const result = await stepFunction();
      const endTime = Date.now();
      
      stepResults[stepKey] = {
        status: 'success',
        stepName,
        duration: endTime - startTime,
        result,
        timestamp: new Date().toISOString()
      };
      
      testResults.push({
        step: stepName,
        status: 'success',
        duration: endTime - startTime,
        result
      });
      
    } catch (error) {
      stepResults[stepKey] = {
        status: 'failed',
        stepName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      testResults.push({
        step: stepName,
        status: 'failed',
        error: error.message
      });
      
      throw error; // Re-throw to stop the test sequence
    }
  }

  function getStepStatusClass(stepKey) {
    const result = stepResults[stepKey];
    if (!result) return 'pending';
    return result.status === 'success' ? 'success' : 'failed';
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
  }

  function downloadResults() {
    const dataStr = JSON.stringify({
      testEmail,
      overallStatus,
      testResults,
      stepResults,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stripe-diagnostics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Stripe Diagnostics - SimpleDCC Admin</title>
</svelte:head>

{#if isAuthenticated}
<div class="stripe-diagnostics">
  <div class="header">
    <h1>🔧 Stripe Flow Diagnostics</h1>
    <p>Comprehensive end-to-end testing of the complete Stripe integration flow</p>
  </div>

  <!-- Configuration Section -->
  <div class="config-section">
    <h2>Test Configuration</h2>
    <div class="config-form">
      <div class="form-group">
        <label for="testEmail">Test Email:</label>
        <input 
          id="testEmail"
          type="email" 
          bind:value={testEmail} 
          placeholder="test@simpledcc.com"
          disabled={isRunning}
        />
      </div>
      
      <div class="form-group">
        <label for="adminSecret">Admin Secret:</label>
        <input 
          id="adminSecret"
          type="password" 
          bind:value={adminSecret} 
          placeholder="Your admin secret"
          disabled={isRunning}
        />
      </div>
      
      <button 
        class="test-button" 
        on:click={runComprehensiveTest} 
        disabled={isRunning || !testEmail || !adminSecret}
      >
        {#if isRunning}
          🔄 Running Tests...
        {:else}
          🚀 Run Comprehensive Stripe Test
        {/if}
      </button>
    </div>
  </div>

  <!-- Current Status -->
  {#if isRunning || overallStatus !== 'pending'}
    <div class="status-section">
      <h2>Test Status</h2>
      <div class="status-indicator status-{overallStatus}">
        {#if overallStatus === 'running'}
          🔄 {currentStep}
        {:else if overallStatus === 'success'}
          ✅ All tests completed successfully!
        {:else if overallStatus === 'failed'}
          ❌ Test sequence failed: {currentStep}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Test Flow Steps -->
  <div class="steps-section">
    <h2>Test Flow Steps</h2>
    <div class="steps-grid">
      <div class="step-card step-{getStepStatusClass('emailValidation')}">
        <h3>1. Email Validation</h3>
        <p>Validate email format and input</p>
        {#if stepResults.emailValidation}
          <div class="step-result">
            Status: {stepResults.emailValidation.status}
            {#if stepResults.emailValidation.result}
              <button on:click={() => copyToClipboard(stepResults.emailValidation.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('envVariables')}">
        <h3>2. Environment Variables</h3>
        <p>Check all required Stripe environment variables</p>
        {#if stepResults.envVariables}
          <div class="step-result">
            Status: {stepResults.envVariables.status}
            {#if stepResults.envVariables.result}
              <button on:click={() => copyToClipboard(stepResults.envVariables.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('userOperations')}">
        <h3>3. User Database Operations</h3>
        <p>Test user lookup and creation in database</p>
        {#if stepResults.userOperations}
          <div class="step-result">
            Status: {stepResults.userOperations.status}
            {#if stepResults.userOperations.result}
              <button on:click={() => copyToClipboard(stepResults.userOperations.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('stripeInit')}">
        <h3>4. Stripe SDK Initialization</h3>
        <p>Test Stripe SDK initialization and basic connectivity</p>
        {#if stepResults.stripeInit}
          <div class="step-result">
            Status: {stepResults.stripeInit.status}
            {#if stepResults.stripeInit.result}
              <button on:click={() => copyToClipboard(stepResults.stripeInit.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('stripeCustomer')}">
        <h3>5. Stripe Customer Operations</h3>
        <p>Test customer creation/retrieval in Stripe</p>
        {#if stepResults.stripeCustomer}
          <div class="step-result">
            Status: {stepResults.stripeCustomer.status}
            {#if stepResults.stripeCustomer.result}
              <button on:click={() => copyToClipboard(stepResults.stripeCustomer.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('stripePriceValidation')}">
        <h3>6. Price ID Validation</h3>
        <p>Validate Stripe price ID and retrieve price details</p>
        {#if stepResults.stripePriceValidation}
          <div class="step-result">
            Status: {stepResults.stripePriceValidation.status}
            {#if stepResults.stripePriceValidation.result}
              <button on:click={() => copyToClipboard(stepResults.stripePriceValidation.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('checkoutSession')}">
        <h3>7. Checkout Session Creation</h3>
        <p>Test full checkout session creation (THE CRITICAL STEP)</p>
        {#if stepResults.checkoutSession}
          <div class="step-result">
            Status: {stepResults.checkoutSession.status}
            {#if stepResults.checkoutSession.result}
              <button on:click={() => copyToClipboard(stepResults.checkoutSession.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('webhookTest')}">
        <h3>8. Webhook Endpoint Testing</h3>
        <p>Test webhook endpoint availability and signature validation</p>
        {#if stepResults.webhookTest}
          <div class="step-result">
            Status: {stepResults.webhookTest.status}
            {#if stepResults.webhookTest.result}
              <button on:click={() => copyToClipboard(stepResults.webhookTest.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="step-card step-{getStepStatusClass('fullIntegration')}">
        <h3>9. Full Integration Test</h3>
        <p>Complete end-to-end flow simulation</p>
        {#if stepResults.fullIntegration}
          <div class="step-result">
            Status: {stepResults.fullIntegration.status}
            {#if stepResults.fullIntegration.result}
              <button on:click={() => copyToClipboard(stepResults.fullIntegration.result)}>Copy Result</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Detailed Results -->
  {#if testResults.length > 0}
    <div class="results-section">
      <h2>Detailed Test Results</h2>
      <div class="results-controls">
        <button on:click={downloadResults}>📥 Download Results</button>
        <button on:click={() => copyToClipboard(testResults)}>📋 Copy All Results</button>
      </div>
      
      <div class="results-list">
        {#each testResults as result, index}
          <div class="result-item result-{result.status}">
            <h4>{index + 1}. {result.step}</h4>
            <div class="result-details">
              <p><strong>Status:</strong> {result.status}</p>
              {#if result.duration}
                <p><strong>Duration:</strong> {result.duration}ms</p>
              {/if}
              {#if result.error}
                <p class="error"><strong>Error:</strong> {result.error}</p>
              {/if}
              {#if result.result}
                <details>
                  <summary>View Result Data</summary>
                  <pre>{JSON.stringify(result.result, null, 2)}</pre>
                </details>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
{/if}

<style>
  .stripe-diagnostics {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
  }

  .config-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }

  .config-form {
    display: flex;
    gap: 20px;
    align-items: end;
    flex-wrap: wrap;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-weight: 600;
    color: #333;
  }

  .form-group input {
    padding: 10px;
    border: 2px solid #e1e5e9;
    border-radius: 6px;
    font-size: 14px;
    min-width: 200px;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .test-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .test-button:hover:not(:disabled) {
    background: #5a67d8;
  }

  .test-button:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }

  .status-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }

  .status-indicator {
    padding: 15px;
    border-radius: 6px;
    font-weight: 600;
    text-align: center;
  }

  .status-running {
    background: #fef5e7;
    color: #d69e2e;
    border: 2px solid #f6e05e;
  }

  .status-success {
    background: #f0fff4;
    color: #38a169;
    border: 2px solid #68d391;
  }

  .status-failed {
    background: #fed7d7;
    color: #e53e3e;
    border: 2px solid #fc8181;
  }

  .steps-section {
    margin-bottom: 20px;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .step-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-left: 4px solid #e2e8f0;
  }

  .step-pending {
    border-left-color: #e2e8f0;
  }

  .step-success {
    border-left-color: #38a169;
  }

  .step-failed {
    border-left-color: #e53e3e;
  }

  .step-result {
    margin-top: 10px;
    padding: 10px;
    background: #f7fafc;
    border-radius: 4px;
  }

  .step-result button {
    background: #4299e1;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin-top: 5px;
  }

  .results-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .results-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .results-controls button {
    background: #4299e1;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .result-item {
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid;
  }

  .result-success {
    background: #f0fff4;
    border-left-color: #38a169;
  }

  .result-failed {
    background: #fed7d7;
    border-left-color: #e53e3e;
  }

  .result-details p {
    margin: 5px 0;
  }

  .error {
    color: #e53e3e;
    font-weight: 600;
  }

  details {
    margin-top: 10px;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #4299e1;
  }

  pre {
    background: #f7fafc;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    margin-top: 10px;
  }
</style> 