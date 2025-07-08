<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let isRunning = false;
  let results = null;
  let error = null;

  onMount(() => {
    // Check if user is authenticated
    checkAuth();
  });

  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/auth/check');
      if (!response.ok) {
        goto('/admin/login');
      }
    } catch (err) {
      goto('/admin/login');
    }
  }

  async function runSchemaFix() {
    if (isRunning) return;
    
    isRunning = true;
    error = null;
    results = null;

    try {
      console.log('🔧 Starting manual AI columns fix...');
      
      const response = await fetch('/api/admin/database/fix-ai-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        results = data;
        console.log('✅ Schema fix completed:', data);
      } else {
        error = data.error || data.details || 'Schema fix failed';
        console.error('❌ Schema fix failed:', data);
      }

    } catch (err) {
      error = `Network error: ${err.message}`;
      console.error('❌ Schema fix network error:', err);
    } finally {
      isRunning = false;
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'added': return '✅';
      case 'already_exists': return '🔄';
      case 'error': return '❌';
      default: return '⚪';
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'added': return 'text-green-600';
      case 'already_exists': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Database Schema Fix</h1>
    <p class="text-gray-600">Manually add missing AI columns to fix production database schema</p>
  </div>

  <!-- Breadcrumb -->
  <nav class="mb-6">
    <div class="flex items-center space-x-2 text-sm text-gray-500">
      <a href="/admin" class="hover:text-gray-700">Admin</a>
      <span>›</span>
      <a href="/admin/database/migrate" class="hover:text-gray-700">Database</a>
      <span>›</span>
      <span class="text-gray-900">AI Columns Fix</span>
    </div>
  </nav>

  <!-- Problem Description -->
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-yellow-800">Schema Mismatch Detected</h3>
        <div class="mt-2 text-sm text-yellow-700">
          <p>Your production database is missing AI columns that exist in your development environment. This causes:</p>
          <ul class="mt-1 list-disc list-inside">
            <li>Database viewer failures with "no such column: ai_enhanced" errors</li>
            <li>AI processing results not being saved properly</li>
            <li>Inconsistent data between local and production environments</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Fix Action -->
  <div class="bg-white shadow rounded-lg p-6 mb-6">
    <h2 class="text-lg font-medium text-gray-900 mb-4">Manual Schema Fix</h2>
    
    <p class="text-gray-600 mb-4">
      This will add the following AI columns to your production database:
    </p>
    
    <div class="bg-gray-50 rounded-lg p-4 mb-4">
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
        <li>• ai_enhanced (BOOLEAN)</li>
        <li>• ai_key_points (TEXT)</li>
        <li>• ai_stakeholders (TEXT)</li>
        <li>• ai_regulatory_impact (TEXT)</li>
        <li>• ai_document_analysis (TEXT)</li>
        <li>• ai_confidence (REAL)</li>
        <li>• documents_processed (INTEGER)</li>
      </ul>
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-500">
        <strong>Safe operation:</strong> Uses ALTER TABLE ADD COLUMN (no data loss)
      </div>
      
      <button
        on:click={runSchemaFix}
        disabled={isRunning}
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {#if isRunning}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Fixing Schema...
        {:else}
          🔧 Fix AI Columns Schema
        {/if}
      </button>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Schema Fix Failed</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Results Display -->
  {#if results}
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Schema Fix Results</h2>
      
      <!-- Success/Failure Summary -->
      <div class="mb-6 p-4 rounded-lg {results.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 {results.success ? 'text-green-400' : 'text-yellow-400'}" viewBox="0 0 20 20" fill="currentColor">
              {#if results.success}
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              {:else}
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              {/if}
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium {results.success ? 'text-green-800' : 'text-yellow-800'}">
              {results.message}
            </h3>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">{results.summary.columns_added}</div>
          <div class="text-sm text-gray-600">Columns Added</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-blue-600">{results.summary.columns_already_existed}</div>
          <div class="text-sm text-gray-600">Already Existed</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-red-600">{results.summary.columns_failed}</div>
          <div class="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      <!-- Detailed Results -->
      <div class="mb-6">
        <h3 class="text-md font-medium text-gray-900 mb-3">Column-by-Column Results</h3>
        <div class="space-y-2">
          {#each results.detailed_results as result}
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <span class="text-lg mr-3">{getStatusIcon(result.status)}</span>
                <span class="font-mono text-sm">{result.column}</span>
              </div>
              <span class="text-sm {getStatusColor(result.status)}">{result.message}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Schema Verification -->
      {#if results.schema_verification}
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-900 mb-3">Schema Verification</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total columns after fix:</strong> {results.schema_verification.total_columns_after_fix}
              </div>
              <div>
                <strong>All AI columns present:</strong> 
                <span class="{results.schema_verification.all_ai_columns_present ? 'text-green-600' : 'text-red-600'}">
                  {results.schema_verification.all_ai_columns_present ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              {#if results.schema_verification.missing_columns_remaining.length > 0}
                <div class="md:col-span-2">
                  <strong>Still missing:</strong> 
                  <span class="text-red-600">{results.schema_verification.missing_columns_remaining.join(', ')}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Test Query Results -->
      {#if results.test_query_result}
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-900 mb-3">Database Test Query</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            {#if results.test_query_result.error}
              <div class="text-red-600">❌ Test query failed: {results.test_query_result.error}</div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Total filings:</strong> {results.test_query_result.total}</div>
                <div><strong>AI enhanced:</strong> {results.test_query_result.ai_enhanced_count}</div>
                <div><strong>Docs processed:</strong> {results.test_query_result.docs_processed_count}</div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Next Steps -->
      {#if results.next_steps}
        <div>
          <h3 class="text-md font-medium text-gray-900 mb-3">Next Steps</h3>
          <ul class="space-y-2">
            {#each results.next_steps as step}
              <li class="flex items-center">
                <span class="mr-2">{step.startsWith('✅') ? '✅' : '📝'}</span>
                <span class="text-sm">{step.replace(/^[✅❌📝]\s*/, '')}</span>
              </li>
            {/each}
          </ul>
          
          {#if results.success}
            <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-green-800 text-sm">
                <strong>🎉 Schema fix successful!</strong> You can now test the database viewer:
              </p>
              <div class="mt-2">
                <a 
                  href="/test-database-view" 
                  target="_blank"
                  class="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  🔍 Test Database Viewer
                </a>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Custom styles for better spacing and readability */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 