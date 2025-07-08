<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  let migrationStatus = 'idle'; // 'idle', 'checking', 'running', 'success', 'error'
  let migrationResult = null;
  let schemaCheck = null;
  let isLoading = false;
  let error = null;

  onMount(() => {
    checkDatabaseSchema();
  });

  async function checkDatabaseSchema() {
    migrationStatus = 'checking';
    isLoading = true;
    error = null;

    try {
      const response = await fetch('/api/admin/database/schema-check', {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Schema check failed: ${response.status}`);
      }

      schemaCheck = await response.json();
      migrationStatus = schemaCheck.isValid ? 'success' : 'idle';
      
    } catch (err) {
      console.error('Schema check failed:', err);
      error = err.message;
      migrationStatus = 'error';
    } finally {
      isLoading = false;
    }
  }

  async function runMigration() {
    migrationStatus = 'running';
    isLoading = true;
    error = null;
    migrationResult = null;

    try {
      const response = await fetch('/api/admin/database/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.status}`);
      }

      migrationResult = await response.json();
      
      if (migrationResult.success) {
        migrationStatus = 'success';
        // Refresh schema check
        await checkDatabaseSchema();
      } else {
        migrationStatus = 'error';
        error = migrationResult.error || 'Migration failed';
      }
      
    } catch (err) {
      console.error('Migration failed:', err);
      error = err.message;
      migrationStatus = 'error';
    } finally {
      isLoading = false;
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'checking': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⚡';
      case 'checking': return '🔍';
      default: return '⏸️';
    }
  }
</script>

<svelte:head>
  <title>Database Migration - SimpleDCC Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Database Migration</h1>
    <p class="text-gray-600">Manage database schema and run migrations for ECFS integration</p>
  </div>

  <!-- Migration Status Card -->
  <Card class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold flex items-center gap-2">
        {getStatusIcon(migrationStatus)}
        Migration Status
      </h2>
      <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(migrationStatus)}">
        {migrationStatus.charAt(0).toUpperCase() + migrationStatus.slice(1)}
      </span>
    </div>

    {#if isLoading}
      <div class="flex items-center gap-3 py-4">
        <LoadingSpinner size="sm" />
        <span class="text-gray-600">
          {migrationStatus === 'checking' ? 'Checking database schema...' : 'Running migration...'}
        </span>
      </div>
    {/if}

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-red-600 font-medium">❌ Error</span>
        </div>
        <p class="text-red-700 text-sm">{error}</p>
      </div>
    {/if}

    {#if schemaCheck && !isLoading}
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">Database Tables</h3>
            <div class="text-sm text-gray-600">
              <p><strong>Found:</strong> {schemaCheck.existingTables?.length || 0} tables</p>
              <p><strong>Missing:</strong> {schemaCheck.missingTables?.length || 0} tables</p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">Schema Status</h3>
            <div class="flex items-center gap-2">
              {#if schemaCheck.isValid}
                <span class="text-green-600">✅ Schema is up to date</span>
              {:else}
                <span class="text-yellow-600">⚠️ Migration required</span>
              {/if}
            </div>
          </div>
        </div>

        {#if schemaCheck.existingTables?.length > 0}
          <div>
            <h3 class="font-medium text-gray-900 mb-2">Existing Tables</h3>
            <div class="flex flex-wrap gap-2">
              {#each schemaCheck.existingTables as table}
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {table}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        {#if schemaCheck.missingTables?.length > 0}
          <div>
            <h3 class="font-medium text-gray-900 mb-2">Missing Tables</h3>
            <div class="flex flex-wrap gap-2">
              {#each schemaCheck.missingTables as table}
                <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                  {table}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </Card>

  <!-- Migration Actions -->
  <Card class="mb-6">
    <h2 class="text-xl font-semibold mb-4">Migration Actions</h2>
    
    <div class="space-y-4">
      <div class="flex gap-4">
        <Button 
          variant="secondary" 
          on:click={checkDatabaseSchema}
          disabled={isLoading}
        >
          🔍 Check Schema
        </Button>

        <Button 
          variant="primary" 
          on:click={runMigration}
          disabled={isLoading || (schemaCheck?.isValid && migrationStatus === 'success')}
        >
          {#if migrationStatus === 'running'}
            ⚡ Running Migration...
          {:else if schemaCheck?.isValid}
            ✅ Schema Up to Date
          {:else}
            🚀 Run Migration
          {/if}
        </Button>
      </div>

      <div class="text-sm text-gray-600">
        <p><strong>Safe to run:</strong> Migrations use "CREATE TABLE IF NOT EXISTS" and will not damage existing data.</p>
        <p><strong>What it does:</strong> Creates missing tables for ECFS integration, system logs, and monitoring.</p>
      </div>
    </div>
  </Card>

  <!-- Schema Fix Tools -->
  <Card class="mb-6">
    <h2 class="text-xl font-semibold mb-4">🔧 Schema Fix Tools</h2>
    
    <div class="space-y-4">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-yellow-600">⚠️</span>
          <h3 class="font-medium text-yellow-800">Production Schema Issues?</h3>
        </div>
        <p class="text-sm text-yellow-700 mb-3">
          If you're seeing "no such column: ai_enhanced" errors or database viewer failures, 
          your production database may be missing AI columns that exist in development.
        </p>
        <div class="flex gap-2">
          <a 
            href="/admin/database/fix-ai-columns" 
            class="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
          >
            🔧 Fix AI Columns Schema
          </a>
          <a 
            href="/test-database-view" 
            target="_blank"
            class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            🔍 Test Database Viewer
          </a>
        </div>
      </div>

      <div class="text-sm text-gray-600">
        <p><strong>When to use:</strong> When local development works but production gives column errors.</p>
        <p><strong>What it does:</strong> Manually adds missing AI columns (ai_enhanced, ai_key_points, etc.) to production database.</p>
      </div>
    </div>
  </Card>

  <!-- Migration Results -->
  {#if migrationResult}
    <Card>
      <h2 class="text-xl font-semibold mb-4">Migration Results</h2>
      
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          {#if migrationResult.success}
            <span class="text-green-600 font-medium">✅ Migration Successful</span>
          {:else}
            <span class="text-red-600 font-medium">❌ Migration Failed</span>
          {/if}
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">Details</h3>
          <p class="text-sm text-gray-700 mb-3">{migrationResult.message}</p>
          
          {#if migrationResult.details?.tablesCreated?.length > 0}
            <div class="mb-3">
              <h4 class="font-medium text-gray-800 text-sm mb-1">Tables Created:</h4>
              <div class="flex flex-wrap gap-1">
                {#each migrationResult.details.tablesCreated as table}
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {table}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          {#if migrationResult.details?.columnsAdded?.length > 0}
            <div class="mb-3">
              <h4 class="font-medium text-gray-800 text-sm mb-1">Columns Added:</h4>
              <div class="flex flex-wrap gap-1">
                {#each migrationResult.details.columnsAdded as column}
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {column}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          {#if migrationResult.details?.timestamp}
            <p class="text-xs text-gray-500">
              Completed: {new Date(migrationResult.details.timestamp).toLocaleString()}
            </p>
          {/if}
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  /* Additional custom styles if needed */
  .max-w-4xl {
    max-width: 56rem;
  }
</style> 