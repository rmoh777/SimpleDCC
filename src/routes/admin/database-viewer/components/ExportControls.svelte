<script>
  import { createEventDispatcher } from 'svelte';
  
  export let selectedTable = null;
  export let totalRecords = 0;
  
  const dispatch = createEventDispatcher();
  
  let isExporting = false;
  
  async function handleExport() {
    if (!selectedTable || isExporting) return;
    
    isExporting = true;
    try {
      dispatch('export');
    } finally {
      // Reset after a delay to show feedback
      setTimeout(() => {
        isExporting = false;
      }, 1000);
    }
  }
</script>

<div class="export-controls">
  <div class="export-info">
    <span class="export-count">
      {totalRecords} records available
    </span>
  </div>
  
  <button 
    class="export-btn {isExporting ? 'exporting' : ''}"
    on:click={handleExport}
    disabled={!selectedTable || isExporting}
  >
    {#if isExporting}
      <span class="export-spinner"></span>
      Exporting...
    {:else}
      <span class="export-icon">📥</span>
      Export CSV
    {/if}
  </button>
</div>

<style>
  .export-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .export-info {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
  
  .export-count {
    font-weight: var(--font-weight-medium);
  }
  
  .export-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-2) var(--spacing-4);
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: var(--transition-fast);
  }
  
  .export-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .export-btn.exporting {
    background: var(--color-primary-hover);
    cursor: wait;
  }
  
  .export-icon {
    font-size: var(--font-size-base);
  }
  
  .export-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .export-controls {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }
    
    .export-info {
      text-align: center;
    }
  }
</style> 