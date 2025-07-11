<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import TableSelector from './components/TableSelector.svelte';
  import DataGrid from './components/DataGrid.svelte';
  import FilterPanel from './components/FilterPanel.svelte';
  import ExportControls from './components/ExportControls.svelte';
  
  // State management
  let tables = [];
  let selectedTable = null;
  let tableData = [];
  let tableSchema = [];
  let loading = false;
  let error = null;
  
  // Pagination and filtering
  let currentPage = 1;
  let pageSize = 50;
  let totalRecords = 0;
  let totalPages = 0;
  let filters = {};
  let sortBy = null;
  let sortOrder = 'asc';
  let searchTerm = '';
  
  // Load available tables on component mount
  onMount(async () => {
    await loadTables();
    
    // Check if table is specified in URL
    const urlTable = $page.url.searchParams.get('table');
    if (urlTable && tables.find(t => t.name === urlTable)) {
      selectedTable = urlTable;
      await loadTableData();
    }
  });
  
  // Load list of available tables
  async function loadTables() {
    try {
      loading = true;
      const response = await fetch('/api/admin/database-viewer/tables');
      if (!response.ok) throw new Error('Failed to load tables');
      
      const data = await response.json();
      tables = data.tables;
    } catch (err) {
      error = err.message;
      console.error('Error loading tables:', err);
    } finally {
      loading = false;
    }
  }
  
  // Load data for selected table
  async function loadTableData() {
    if (!selectedTable) return;
    
    try {
      loading = true;
      error = null;
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) {
        params.append('sort', sortBy);
        params.append('order', sortOrder);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(`filter_${key}`, value);
      });
      
      // Load table data and schema in parallel
      const [dataResponse, schemaResponse] = await Promise.all([
        fetch(`/api/admin/database-viewer/${selectedTable}?${params}`),
        fetch(`/api/admin/database-viewer/${selectedTable}/schema`)
      ]);
      
      if (!dataResponse.ok || !schemaResponse.ok) {
        throw new Error('Failed to load table data');
      }
      
      const dataResult = await dataResponse.json();
      const schemaResult = await schemaResponse.json();
      
      tableData = dataResult.data;
      totalRecords = dataResult.total;
      totalPages = Math.ceil(totalRecords / pageSize);
      tableSchema = schemaResult.schema;
      
      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set('table', selectedTable);
      window.history.replaceState({}, '', url);
      
    } catch (err) {
      error = err.message;
      console.error('Error loading table data:', err);
    } finally {
      loading = false;
    }
  }
  
  // Handle table selection
  function handleTableSelect(tableName) {
    selectedTable = tableName;
    currentPage = 1;
    filters = {};
    searchTerm = '';
    sortBy = null;
    sortOrder = 'asc';
    loadTableData();
  }
  
  // Handle pagination
  function handlePageChange(newPage) {
    currentPage = newPage;
    loadTableData();
  }
  
  // Handle sorting
  function handleSort(column) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortOrder = 'asc';
    }
    currentPage = 1;
    loadTableData();
  }
  
  // Handle filtering
  function handleFilter(newFilters) {
    filters = newFilters;
    currentPage = 1;
    loadTableData();
  }
  
  // Handle search
  function handleSearch(term) {
    searchTerm = term;
    currentPage = 1;
    loadTableData();
  }
  
  // Handle CSV export
  async function handleExport() {
    if (!selectedTable) return;
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(`filter_${key}`, value);
      });
      
      const response = await fetch(`/api/admin/database-viewer/${selectedTable}/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      error = err.message;
      console.error('Export error:', err);
    }
  }
</script>

<svelte:head>
  <title>Database Viewer - SimpleDCC Admin</title>
</svelte:head>

<div class="database-viewer">
  <div class="viewer-header">
    <h1 class="viewer-title">Database Viewer</h1>
    <p class="viewer-description">
      Browse and export data from all 10 tables in your SimpleDCC database.
    </p>
  </div>
  
  <div class="viewer-content">
    <!-- Table Selector -->
    <div class="table-selector-section">
      <TableSelector 
        {tables}
        {selectedTable}
        on:select={(e) => handleTableSelect(e.detail)}
      />
    </div>
    
    {#if selectedTable}
      <div class="table-viewer-section">
        <!-- Controls Bar -->
        <div class="controls-bar">
          <div class="controls-left">
            <FilterPanel 
              {tableSchema}
              {filters}
              on:filter={(e) => handleFilter(e.detail)}
            />
            
            <div class="search-control">
              <input
                type="text"
                placeholder="Search all columns..."
                bind:value={searchTerm}
                on:input={() => handleSearch(searchTerm)}
                class="search-input"
              />
            </div>
          </div>
          
          <div class="controls-right">
            <ExportControls 
              {selectedTable}
              {totalRecords}
              on:export={handleExport}
            />
          </div>
        </div>
        
        <!-- Data Grid -->
        {#if loading}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading {selectedTable} data...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <p class="error-message">Error: {error}</p>
            <button class="retry-btn" on:click={loadTableData}>Retry</button>
          </div>
        {:else}
          <DataGrid 
            {tableData}
            {tableSchema}
            {currentPage}
            {totalPages}
            {totalRecords}
            {pageSize}
            {sortBy}
            {sortOrder}
            on:sort={(e) => handleSort(e.detail)}
            on:pageChange={(e) => handlePageChange(e.detail)}
          />
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">🗄️</div>
        <h3>Select a Table</h3>
        <p>Choose a table from the list above to view its data and schema.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .database-viewer {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }
  
  .viewer-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
  }
  
  .viewer-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .viewer-description {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  .viewer-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .table-selector-section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
  }
  
  .table-viewer-section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
  }
  
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background);
  }
  
  .controls-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .controls-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .search-control {
    position: relative;
  }
  
  .search-input {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    width: 300px;
    background: var(--color-surface);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-secondary);
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-md);
  }
  
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
  }
  
  .error-message {
    color: #dc2626;
    margin-bottom: var(--spacing-md);
  }
  
  .retry-btn {
    padding: var(--spacing-2) var(--spacing-4);
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  
  .retry-btn:hover {
    background: var(--color-primary-hover);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-secondary);
    text-align: center;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-state h3 {
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .controls-bar {
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: stretch;
    }
    
    .controls-left {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-input {
      width: 100%;
    }
  }
</style> 