<script>
  import { createEventDispatcher } from 'svelte';
  
  export let tableSchema = [];
  export let filters = {};
  
  const dispatch = createEventDispatcher();
  
  let showFilters = false;
  let localFilters = { ...filters };
  
  function toggleFilters() {
    showFilters = !showFilters;
  }
  
  function applyFilters() {
    dispatch('filter', localFilters);
  }
  
  function clearFilters() {
    localFilters = {};
    dispatch('filter', {});
  }
  
  function getFilterableColumns() {
    return tableSchema.filter(column => {
      // Filter out very large text columns and binary data
      return !column.name.includes('raw_data') && 
             !column.name.includes('documents') && 
             column.type !== 'BLOB';
    });
  }
  
  function getFilterType(column) {
    if (column.name.includes('_at') || column.name.includes('timestamp')) {
      return 'date';
    }
    if (column.type === 'INTEGER' || column.type === 'REAL') {
      return 'number';
    }
    return 'text';
  }
  
  $: activeFilterCount = Object.values(localFilters).filter(v => v && v.trim()).length;
</script>

<div class="filter-panel">
  <button class="filter-toggle" on:click={toggleFilters}>
    <span class="filter-icon">🔍</span>
    Filters
    {#if activeFilterCount > 0}
      <span class="filter-count">{activeFilterCount}</span>
    {/if}
    <span class="toggle-icon">{showFilters ? '▲' : '▼'}</span>
  </button>
  
  {#if showFilters}
    <div class="filter-dropdown">
      <div class="filter-header">
        <h4>Filter Columns</h4>
        <div class="filter-actions">
          <button class="apply-btn" on:click={applyFilters}>Apply</button>
          <button class="clear-btn" on:click={clearFilters}>Clear All</button>
        </div>
      </div>
      
      <div class="filter-grid">
        {#each getFilterableColumns() as column}
          <div class="filter-field">
            <label class="filter-label">
              {column.name}
              <span class="column-type">({column.type})</span>
            </label>
            
            {#if getFilterType(column) === 'date'}
              <input
                type="date"
                bind:value={localFilters[column.name]}
                class="filter-input"
                placeholder="Filter by {column.name}"
              />
            {:else if getFilterType(column) === 'number'}
              <input
                type="number"
                bind:value={localFilters[column.name]}
                class="filter-input"
                placeholder="Filter by {column.name}"
              />
            {:else}
              <input
                type="text"
                bind:value={localFilters[column.name]}
                class="filter-input"
                placeholder="Filter by {column.name}"
              />
            {/if}
          </div>
        {/each}
      </div>
      
      {#if getFilterableColumns().length === 0}
        <div class="no-filters">
          <p>No filterable columns available for this table.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .filter-panel {
    position: relative;
  }
  
  .filter-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-surface);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: var(--transition-fast);
  }
  
  .filter-toggle:hover {
    background: var(--color-background);
    border-color: var(--color-primary);
  }
  
  .filter-icon {
    font-size: var(--font-size-sm);
  }
  
  .filter-count {
    background: var(--color-primary);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }
  
  .toggle-icon {
    margin-left: auto;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    min-width: 400px;
    max-width: 600px;
    max-height: 400px;
    overflow-y: auto;
    margin-top: var(--spacing-xs);
  }
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background);
  }
  
  .filter-header h4 {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .filter-actions {
    display: flex;
    gap: var(--spacing-xs);
  }
  
  .apply-btn, .clear-btn {
    padding: var(--spacing-1) var(--spacing-2);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: var(--transition-fast);
  }
  
  .apply-btn {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .apply-btn:hover {
    background: var(--color-primary-hover);
  }
  
  .clear-btn {
    background: var(--color-surface);
    color: var(--color-text-secondary);
  }
  
  .clear-btn:hover {
    background: var(--color-background);
  }
  
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }
  
  .filter-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .filter-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .column-type {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-normal);
  }
  
  .filter-input {
    padding: var(--spacing-1) var(--spacing-2);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    background: var(--color-surface);
  }
  
  .filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
  }
  
  .no-filters {
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--color-text-muted);
  }
  
  @media (max-width: 768px) {
    .filter-dropdown {
      min-width: 300px;
      max-width: 90vw;
    }
    
    .filter-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 