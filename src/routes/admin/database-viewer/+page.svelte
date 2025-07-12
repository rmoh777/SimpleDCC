<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import DataGrid from './components/DataGrid.svelte';
	import FilterPanel from './components/FilterPanel.svelte';
	import ExportControls from './components/ExportControls.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	// State management
	let tables = [];
	let selectedTable = null;
	let tableData = [];
	let tableSchema = [];
	let loading = false;
	let error = null;

	// Pagination and filtering
	let currentPage = 1;
	let totalPages = 1;
	let totalRows = 0;
	let searchTerm = '';
	let sortColumn = '';
	let sortDirection = 'asc';
	let filters = {};

	// Refresh and auto-refresh state
	let refreshing = false;
	let autoRefresh = false;
	let autoRefreshInterval = 30; // seconds
	let autoRefreshTimer = null;
	let lastRefreshTime = null;

	// Sidebar state
	let expandedSections = {
		userManagement: true,
		filingManagement: true,
		notificationSystem: true,
		systemMonitoring: true
	};

	// Table categories
	const tableCategories = {
		userManagement: {
			title: 'User Management',
			icon: '👥',
			tables: ['users', 'admin_users', 'subscriptions']
		},
		filingManagement: {
			title: 'Filing Management', 
			icon: '📁',
			tables: ['filings', 'active_dockets']
		},
		notificationSystem: {
			title: 'Notification System',
			icon: '📧',
			tables: ['notification_queue', 'user_notifications']
		},
		systemMonitoring: {
			title: 'System Monitoring',
			icon: '📊',
			tables: ['system_logs', 'system_health_logs']
		}
	};

	// Table metadata
	const tableMetadata = {
		users: { name: 'Users', description: 'Primary user accounts', icon: '👤' },
		admin_users: { name: 'Admin Users', description: 'Admin authentication', icon: '🔐' },
		subscriptions: { name: 'Subscriptions', description: 'User docket subscriptions', icon: '📋' },
		filings: { name: 'Filings', description: 'FCC filing storage', icon: '📄' },
		active_dockets: { name: 'Active Dockets', description: 'Docket monitoring', icon: '📂' },
		notification_queue: { name: 'Notification Queue', description: 'Email notification queue', icon: '📤' },
		user_notifications: { name: 'User Notifications', description: 'Notification tracking', icon: '🔔' },
		system_logs: { name: 'System Logs', description: 'Application logging', icon: '📝' },
		system_health_logs: { name: 'System Health', description: 'Health monitoring', icon: '💚' }
	};

	// Auto-refresh options
	const refreshIntervals = [
		{ value: 15, label: '15 seconds' },
		{ value: 30, label: '30 seconds' },
		{ value: 60, label: '1 minute' },
		{ value: 120, label: '2 minutes' },
		{ value: 300, label: '5 minutes' }
	];

	// State persistence
	const STATE_KEY = 'simpledcc-db-viewer-state';

	function saveState() {
		const state = {
			selectedTable,
			currentPage,
			searchTerm,
			sortColumn,
			sortDirection,
			filters,
			expandedSections,
			autoRefresh,
			autoRefreshInterval,
			timestamp: Date.now()
		};
		try {
			localStorage.setItem(STATE_KEY, JSON.stringify(state));
		} catch (e) {
			console.warn('Failed to save state to localStorage:', e);
		}
	}

	function loadState() {
		try {
			const saved = localStorage.getItem(STATE_KEY);
			if (saved) {
				const state = JSON.parse(saved);
				// Only restore state if it's less than 24 hours old
				if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
					selectedTable = state.selectedTable || null;
					currentPage = state.currentPage || 1;
					searchTerm = state.searchTerm || '';
					sortColumn = state.sortColumn || '';
					sortDirection = state.sortDirection || 'asc';
					filters = state.filters || {};
					expandedSections = { ...expandedSections, ...state.expandedSections };
					autoRefresh = state.autoRefresh || false;
					autoRefreshInterval = state.autoRefreshInterval || 30;
					return true;
				}
			}
		} catch (e) {
			console.warn('Failed to load state from localStorage:', e);
		}
		return false;
	}

	function clearState() {
		try {
			localStorage.removeItem(STATE_KEY);
		} catch (e) {
			console.warn('Failed to clear state from localStorage:', e);
		}
		// Reset to defaults
		selectedTable = null;
		currentPage = 1;
		searchTerm = '';
		sortColumn = '';
		sortDirection = 'asc';
		filters = {};
		expandedSections = {
			userManagement: true,
			filingManagement: true,
			notificationSystem: true,
			systemMonitoring: true
		};
		autoRefresh = false;
		autoRefreshInterval = 30;
	}

	// Auto-refresh functionality
	function startAutoRefresh() {
		if (autoRefreshTimer) {
			clearInterval(autoRefreshTimer);
		}
		if (autoRefresh && selectedTable) {
			autoRefreshTimer = setInterval(() => {
				refreshTableData();
			}, autoRefreshInterval * 1000);
		}
	}

	function stopAutoRefresh() {
		if (autoRefreshTimer) {
			clearInterval(autoRefreshTimer);
			autoRefreshTimer = null;
		}
	}

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh) {
			startAutoRefresh();
		} else {
			stopAutoRefresh();
		}
		saveState();
	}

	function changeRefreshInterval(interval) {
		autoRefreshInterval = interval;
		if (autoRefresh) {
			startAutoRefresh(); // Restart with new interval
		}
		saveState();
	}

	onMount(async () => {
		// Load saved state first
		const stateLoaded = loadState();
		
		// Load tables
		await loadTables();
		
		// If we have a saved selected table, load its data
		if (stateLoaded && selectedTable) {
			await Promise.all([
				loadTableData(),
				loadTableSchema()
			]);
			
			// Start auto-refresh if it was enabled
			if (autoRefresh) {
				startAutoRefresh();
			}
		}
	});

	onDestroy(() => {
		stopAutoRefresh();
	});

	// Save state whenever key values change
	$: if (selectedTable || currentPage || searchTerm || sortColumn || sortDirection || Object.keys(filters).length) {
		saveState();
	}

	async function loadTables() {
		try {
			loading = true;
			const response = await fetch('/api/admin/database-viewer/tables');
			if (!response.ok) throw new Error('Failed to load tables');
			
			const data = await response.json();
			tables = data.tables || [];
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function selectTable(tableName) {
		if (selectedTable === tableName) return;
		
		// Stop auto-refresh when switching tables
		stopAutoRefresh();
		
		selectedTable = tableName;
		currentPage = 1;
		searchTerm = '';
		sortColumn = '';
		sortDirection = 'asc';
		filters = {};
		
		await Promise.all([
			loadTableData(),
			loadTableSchema()
		]);
		
		// Restart auto-refresh if it was enabled
		if (autoRefresh) {
			startAutoRefresh();
		}
		
		saveState();
	}

	async function loadTableData() {
		try {
			refreshing = true;
			const params = new URLSearchParams({
				page: currentPage.toString(),
				search: searchTerm,
				sort: sortColumn,
				direction: sortDirection,
				...filters
			});

			const response = await fetch(`/api/admin/database-viewer/${selectedTable}?${params}`);
			if (!response.ok) throw new Error('Failed to load table data');
			
			const data = await response.json();
			tableData = data.data || [];
			totalPages = data.totalPages || 1;
			totalRows = data.total || 0;
			lastRefreshTime = new Date();
		} catch (err) {
			error = err.message;
		} finally {
			refreshing = false;
		}
	}

	async function loadTableSchema() {
		try {
			const response = await fetch(`/api/admin/database-viewer/${selectedTable}/schema`);
			if (!response.ok) throw new Error('Failed to load table schema');
			
			const data = await response.json();
			tableSchema = data.schema || [];
		} catch (err) {
			console.error('Failed to load schema:', err);
		}
	}

	async function refreshTableData() {
		if (!selectedTable || refreshing) return;
		await loadTableData();
	}

	async function refreshAll() {
		stopAutoRefresh();
		await loadTables();
		if (selectedTable) {
			await Promise.all([
				loadTableData(),
				loadTableSchema()
			]);
		}
		if (autoRefresh) {
			startAutoRefresh();
		}
	}

	function toggleSection(section) {
		expandedSections[section] = !expandedSections[section];
		saveState();
	}

	function getTableRowCount(tableName) {
		const table = tables.find(t => t.name === tableName);
		return table?.row_count || 0;
	}

	// Event handlers
	function handleSearch(event) {
		searchTerm = event.detail.searchTerm;
		currentPage = 1;
		loadTableData();
	}

	function handleSort(event) {
		sortColumn = event.detail.column;
		sortDirection = event.detail.direction;
		currentPage = 1;
		loadTableData();
	}

	function handleFilter(event) {
		filters = event.detail.filters;
		currentPage = 1;
		loadTableData();
	}

	function handlePageChange(event) {
		currentPage = event.detail.page;
		loadTableData();
	}

	// Format last refresh time
	function formatLastRefresh(time) {
		if (!time) return 'Never';
		const now = new Date();
		const diff = Math.floor((now - time) / 1000);
		
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		return time.toLocaleTimeString();
	}
</script>

<div class="database-viewer">
	<div class="sidebar">
		<div class="sidebar-header">
			<h2>Database Tables</h2>
			<p class="subtitle">SimpleDCC Database</p>
		</div>

		<div class="sidebar-content">
			{#each Object.entries(tableCategories) as [sectionKey, section]}
				<div class="table-section">
					<button 
						class="section-header"
						on:click={() => toggleSection(sectionKey)}
						aria-expanded={expandedSections[sectionKey]}
					>
						<span class="section-icon">{section.icon}</span>
						<span class="section-title">{section.title}</span>
						<span class="expand-icon" class:expanded={expandedSections[sectionKey]}>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
								<path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"/>
							</svg>
						</span>
					</button>

					{#if expandedSections[sectionKey]}
						<div class="section-tables">
							{#each section.tables as tableName}
								{@const metadata = tableMetadata[tableName]}
								{@const rowCount = getTableRowCount(tableName)}
								<button 
									class="table-item"
									class:selected={selectedTable === tableName}
									on:click={() => selectTable(tableName)}
								>
									<div class="table-info">
										<span class="table-icon">{metadata.icon}</span>
										<div class="table-details">
											<span class="table-name">{metadata.name}</span>
											<span class="table-description">{metadata.description}</span>
										</div>
									</div>
									<span class="row-count">{rowCount.toLocaleString()}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="sidebar-footer">
			<button class="reset-state-button" on:click={clearState} title="Reset to default state">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
					<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
				</svg>
				Reset View
			</button>
		</div>
	</div>

	<div class="main-content">
		{#if loading && !selectedTable}
			<div class="loading-state">
				<LoadingSpinner />
				<p>Loading database tables...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<h3>Error Loading Database</h3>
				<p>{error}</p>
				<button on:click={loadTables} class="retry-button">Retry</button>
			</div>
		{:else if !selectedTable}
			<div class="welcome-state">
				<div class="welcome-content">
					<h2>Database Viewer</h2>
					<p>Select a table from the sidebar to view its data and schema.</p>
					<div class="stats-grid">
						<div class="stat-card">
							<span class="stat-number">{tables.length}</span>
							<span class="stat-label">Total Tables</span>
						</div>
						<div class="stat-card">
							<span class="stat-number">{tables.reduce((sum, t) => sum + (t.row_count || 0), 0).toLocaleString()}</span>
							<span class="stat-label">Total Records</span>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="table-view">
				<div class="table-header">
					<div class="table-title">
						<span class="table-icon">{tableMetadata[selectedTable]?.icon}</span>
						<div>
							<h2>{tableMetadata[selectedTable]?.name}</h2>
							<p class="table-description">{tableMetadata[selectedTable]?.description}</p>
						</div>
					</div>
					<div class="table-stats">
						<span class="stat">
							<strong>{totalRows.toLocaleString()}</strong> records
						</span>
						<span class="stat">
							<strong>{tableSchema.length}</strong> columns
						</span>
					</div>
				</div>

				<div class="table-controls">
					<div class="controls-left">
						<FilterPanel 
							{tableSchema}
							on:search={handleSearch}
							on:filter={handleFilter}
						/>
					</div>
					
					<div class="controls-right">
						<div class="refresh-controls">
							<div class="refresh-info">
								{#if lastRefreshTime}
									<span class="last-refresh">
										Updated {formatLastRefresh(lastRefreshTime)}
									</span>
								{/if}
								{#if autoRefresh}
									<span class="auto-refresh-indicator">
										<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
											<circle cx="6" cy="6" r="2"/>
										</svg>
										Auto-refresh on
									</span>
								{/if}
							</div>
							
							<div class="refresh-buttons">
								<button 
									class="refresh-button"
									on:click={refreshTableData}
									disabled={refreshing}
									title="Refresh current table data"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class:spinning={refreshing}>
										<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
										<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
									</svg>
									{refreshing ? 'Refreshing...' : 'Refresh'}
								</button>
								
								<div class="auto-refresh-controls">
									<button 
										class="auto-refresh-toggle"
										class:active={autoRefresh}
										on:click={toggleAutoRefresh}
										title="Toggle auto-refresh"
									>
										<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
											<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
											<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
										</svg>
										Auto
									</button>
									
									{#if autoRefresh}
										<select 
											bind:value={autoRefreshInterval}
											on:change={(e) => changeRefreshInterval(parseInt(e.target.value))}
											class="refresh-interval-select"
										>
											{#each refreshIntervals as interval}
												<option value={interval.value}>{interval.label}</option>
											{/each}
										</select>
									{/if}
								</div>
							</div>
						</div>
						
						<ExportControls 
							tableName={selectedTable}
							{filters}
							{searchTerm}
						/>
					</div>
				</div>

				<div class="table-data">
					<DataGrid 
						data={tableData}
						schema={tableSchema}
						{currentPage}
						{totalPages}
						{totalRows}
						loading={refreshing}
						on:sort={handleSort}
						on:pageChange={handlePageChange}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.database-viewer {
		display: flex;
		height: 100vh;
		background: var(--color-background);
	}

	/* Sidebar Styles */
	.sidebar {
		width: 320px;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.sidebar-header h2 {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 0;
	}

	.table-section {
		margin-bottom: 0.5rem;
	}

	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.section-header:hover {
		background: var(--color-surface-hover);
	}

	.section-icon {
		font-size: 1rem;
	}

	.section-title {
		flex: 1;
		text-align: left;
	}

	.expand-icon {
		transition: transform 0.2s;
		color: var(--color-text-secondary);
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	.section-tables {
		padding-left: 1rem;
	}

	.table-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
		border-left: 3px solid transparent;
	}

	.table-item:hover {
		background: var(--color-surface-hover);
	}

	.table-item.selected {
		background: var(--color-primary-surface);
		border-left-color: var(--color-primary);
	}

	.table-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.table-icon {
		font-size: 1.125rem;
	}

	.table-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}

	.table-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.table-description {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.row-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.reset-state-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		transition: all 0.2s;
	}

	.reset-state-button:hover {
		background: var(--color-surface-hover);
		color: var(--color-text);
	}

	/* Main Content Styles */
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.loading-state, .error-state, .welcome-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.welcome-content h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.welcome-content p {
		margin: 0 0 2rem 0;
		color: var(--color-text-secondary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		max-width: 400px;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.retry-button {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 1rem;
	}

	/* Table View Styles */
	.table-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.table-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.table-title {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.table-title .table-icon {
		font-size: 1.5rem;
	}

	.table-title h2 {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.table-title .table-description {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.table-stats {
		display: flex;
		gap: 1.5rem;
	}

	.stat {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.table-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background: var(--color-background);
		border-bottom: 1px solid var(--color-border);
	}

	.controls-left {
		flex: 1;
	}

	.controls-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.refresh-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.refresh-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.last-refresh {
		font-weight: 500;
	}

	.auto-refresh-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-primary);
		font-weight: 500;
	}

	.auto-refresh-indicator svg {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.refresh-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}

	.refresh-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-button svg.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.auto-refresh-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.auto-refresh-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.auto-refresh-toggle:hover {
		background: var(--color-surface-hover);
	}

	.auto-refresh-toggle.active {
		background: var(--color-primary-surface);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.refresh-interval-select {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.table-data {
		flex: 1;
		overflow: hidden;
		padding: 0 2rem 2rem 2rem;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.sidebar {
			width: 280px;
		}
		
		.table-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.table-controls {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.controls-right {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.refresh-controls {
			align-items: stretch;
		}
	}

	@media (max-width: 768px) {
		.database-viewer {
			flex-direction: column;
			height: auto;
		}
		
		.sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}
		
		.main-content {
			min-height: 70vh;
		}
	}
</style> 