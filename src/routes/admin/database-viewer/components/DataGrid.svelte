<script>
  import { createEventDispatcher } from 'svelte';
  
  export let tableData = [];
  export let tableSchema = [];
  export let currentPage = 1;
  export let totalPages = 0;
  export let totalRecords = 0;
  export let pageSize = 50;
  export let sortBy = null;
  export let sortOrder = 'asc';
  
  const dispatch = createEventDispatcher();
  
  function handleSort(column) {
    dispatch('sort', column);
  }
  
  function handlePageChange(page) {
    dispatch('pageChange', page);
  }
  
  function formatValue(value, column) {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Handle JSON columns
    if (column.type === 'TEXT' && (column.name.includes('details') || column.name.includes('data') || column.name.includes('documents'))) {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
    
    // Handle timestamps
    if (column.name.includes('_at') || column.name.includes('timestamp')) {
      if (typeof value === 'number') {
        return new Date(value * 1000).toLocaleString();
      }
    }
    
    // Handle long text
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return value;
  }
  
  function getColumnType(column) {
    if (column.name.includes('_at') || column.name.includes('timestamp')) {
      return 'timestamp';
    }
    if (column.name.includes('details') || column.name.includes('data') || column.name.includes('documents')) {
      return 'json';
    }
    return column.type?.toLowerCase() || 'text';
  }
  
  // Generate page numbers for pagination
  $: pageNumbers = (() => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  })();
</script>

<div class="data-grid">
  <!-- Table Header -->
  <div class="grid-header">
    <div class="grid-info">
      <span class="record-count">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
      </span>
    </div>
  </div>
  
  <!-- Table -->
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          {#each tableSchema as column}
            <th class="column-header {getColumnType(column)}">
              <button 
                class="sort-button {sortBy === column.name ? 'active' : ''}"
                on:click={() => handleSort(column.name)}
              >
                <span class="column-name">{column.name}</span>
                <span class="column-type">({column.type})</span>
                {#if sortBy === column.name}
                  <span class="sort-icon">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                {:else}
                  <span class="sort-icon">↕</span>
                {/if}
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each tableData as row, index}
          <tr class="data-row">
            {#each tableSchema as column}
              <td class="data-cell {getColumnType(column)}">
                <div class="cell-content">
                  {formatValue(row[column.name], column)}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    
    {#if tableData.length === 0}
      <div class="empty-data">
        <p>No data found in this table.</p>
      </div>
    {/if}
  </div>
  
  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="pagination">
      <button 
        class="page-btn"
        disabled={currentPage === 1}
        on:click={() => handlePageChange(currentPage - 1)}
      >
        ← Previous
      </button>
      
      {#each pageNumbers as page}
        {#if page === '...'}
          <span class="page-ellipsis">...</span>
        {:else}
          <button 
            class="page-btn {currentPage === page ? 'active' : ''}"
            on:click={() => handlePageChange(page)}
          >
            {page}
          </button>
        {/if}
      {/each}
      
      <button 
        class="page-btn"
        disabled={currentPage === totalPages}
        on:click={() => handlePageChange(currentPage + 1)}
      >
        Next →
      </button>
    </div>
  {/if}
</div>

<style>
  .data-grid {
    width: 100%;
  }
  
  .grid-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background);
  }
  
  .record-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
  
  .table-container {
    overflow-x: auto;
    max-height: 600px;
    overflow-y: auto;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  
  .column-header {
    position: sticky;
    top: 0;
    background: var(--color-surface);
    border-bottom: 2px solid var(--color-border);
    padding: 0;
    text-align: left;
    z-index: 10;
  }
  
  .sort-button {
    width: 100%;
    padding: var(--spacing-sm);
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    transition: var(--transition-fast);
  }
  
  .sort-button:hover {
    background: var(--color-background);
  }
  
  .sort-button.active {
    background: var(--color-primary-light);
  }
  
  .column-name {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .column-type {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .sort-icon {
    margin-left: auto;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  
  .data-row:nth-child(even) {
    background: var(--color-background);
  }
  
  .data-row:hover {
    background: var(--color-primary-light);
  }
  
  .data-cell {
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
    max-width: 200px;
  }
  
  .data-cell.json {
    max-width: 300px;
  }
  
  .data-cell.timestamp {
    white-space: nowrap;
  }
  
  .cell-content {
    word-wrap: break-word;
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
  }
  
  .empty-data {
    text-align: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-muted);
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    background: var(--color-background);
  }
  
  .page-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: var(--transition-fast);
  }
  
  .page-btn:hover:not(:disabled) {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
  }
  
  .page-btn.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-ellipsis {
    padding: var(--spacing-xs) var(--spacing-sm);
    color: var(--color-text-muted);
  }
  
  @media (max-width: 768px) {
    .data-cell {
      max-width: 150px;
      font-size: var(--font-size-xs);
    }
    
    .pagination {
      flex-wrap: wrap;
    }
  }
</style> 