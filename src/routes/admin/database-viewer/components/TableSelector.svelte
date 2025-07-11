<script>
  import { createEventDispatcher } from 'svelte';
  
  export let tables = [];
  export let selectedTable = null;
  
  const dispatch = createEventDispatcher();
  
  // Group tables by category based on your database architecture
  const tableCategories = {
    'User Management': ['users', 'admin_users', 'subscriptions'],
    'Filing Management': ['filings', 'active_dockets'],
    'Notification System': ['notification_queue', 'user_notifications'],
    'System Monitoring': ['system_logs', 'system_health_logs'],
    'System Tables': ['sqlite_sequence']
  };
  
  function handleTableSelect(tableName) {
    dispatch('select', tableName);
  }
  
  function getTableCategory(tableName) {
    for (const [category, tableList] of Object.entries(tableCategories)) {
      if (tableList.includes(tableName)) {
        return category;
      }
    }
    return 'Other';
  }
  
  function getTableIcon(tableName) {
    const icons = {
      'users': '👥',
      'admin_users': '🔐',
      'subscriptions': '📧',
      'filings': '📄',
      'active_dockets': '📊',
      'notification_queue': '📬',
      'user_notifications': '🔔',
      'system_logs': '📝',
      'system_health_logs': '🏥',
      'sqlite_sequence': '🔢'
    };
    return icons[tableName] || '🗄️';
  }
  
  // Group tables by category
  $: groupedTables = Object.entries(tableCategories).map(([category, tableList]) => ({
    category,
    tables: tables.filter(table => tableList.includes(table.name))
  })).filter(group => group.tables.length > 0);
</script>

<div class="table-selector">
  <h3 class="selector-title">Database Tables ({tables.length})</h3>
  
  {#each groupedTables as group}
    <div class="table-group">
      <h4 class="group-title">{group.category}</h4>
      <div class="table-grid">
        {#each group.tables as table}
          <button
            class="table-card {selectedTable === table.name ? 'selected' : ''}"
            on:click={() => handleTableSelect(table.name)}
          >
            <div class="table-icon">{getTableIcon(table.name)}</div>
            <div class="table-info">
              <div class="table-name">{table.name}</div>
              <div class="table-meta">
                {table.row_count || 0} rows
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/each}
  
  {#if tables.length === 0}
    <div class="empty-tables">
      <p>No tables found. Check database connection.</p>
    </div>
  {/if}
</div>

<style>
  .table-selector {
    width: 100%;
  }
  
  .selector-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--color-border);
    padding-bottom: var(--spacing-sm);
  }
  
  .table-group {
    margin-bottom: var(--spacing-lg);
  }
  
  .group-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .table-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-sm);
  }
  
  .table-card {
    display: flex;
    align-items: center;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-surface);
    cursor: pointer;
    transition: var(--transition-fast);
    text-align: left;
  }
  
  .table-card:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .table-card.selected {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
  }
  
  .table-card.selected .table-meta {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .table-icon {
    font-size: var(--font-size-xl);
    margin-right: var(--spacing-sm);
  }
  
  .table-info {
    flex: 1;
  }
  
  .table-name {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    margin-bottom: 2px;
  }
  
  .table-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .empty-tables {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-muted);
  }
  
  @media (max-width: 768px) {
    .table-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 