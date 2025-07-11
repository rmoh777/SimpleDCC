<script>
	import { createEventDispatcher } from 'svelte';

	export let tableSchema = [];
	
	const dispatch = createEventDispatcher();
	
	let searchTerm = '';
	let filters = {};
	let showFilters = false;

	// Handle search input
	function handleSearch() {
		dispatch('search', { searchTerm });
	}

	// Handle filter changes
	function handleFilterChange(column, value) {
		if (value === '' || value === null) {
			delete filters[column];
		} else {
			filters[column] = value;
		}
		filters = { ...filters };
		dispatch('filter', { filters });
	}

	// Clear all filters
	function clearFilters() {
		filters = {};
		searchTerm = '';
		dispatch('search', { searchTerm });
		dispatch('filter', { filters });
	}

	// Get unique values for a column (for dropdown filters)
	function getColumnType(column) {
		if (!column.type) return 'text';
		const type = column.type.toLowerCase();
		if (type.includes('integer') || type.includes('real')) return 'number';
		if (type.includes('text') || type.includes('varchar')) return 'text';
		if (type.includes('datetime') || type.includes('timestamp')) return 'date';
		return 'text';
	}

	// Count active filters
	$: activeFilterCount = Object.keys(filters).length;
</script>

<div class="filter-panel">
	<div class="search-section">
		<div class="search-input-wrapper">
			<svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
			</svg>
			<input
				type="text"
				placeholder="Search all columns..."
				bind:value={searchTerm}
				on:input={handleSearch}
				class="search-input"
			/>
			{#if searchTerm}
				<button 
					class="clear-search"
					on:click={() => { searchTerm = ''; handleSearch(); }}
					title="Clear search"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
						<path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="filter-section">
		<button 
			class="filter-toggle"
			on:click={() => showFilters = !showFilters}
			class:active={showFilters || activeFilterCount > 0}
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
			</svg>
			Filters
			{#if activeFilterCount > 0}
				<span class="filter-count">{activeFilterCount}</span>
			{/if}
		</button>

		{#if activeFilterCount > 0}
			<button class="clear-filters" on:click={clearFilters}>
				Clear All
			</button>
		{/if}
	</div>

	{#if showFilters && tableSchema.length > 0}
		<div class="filter-dropdown">
			<div class="filter-grid">
				{#each tableSchema as column}
					{@const columnType = getColumnType(column)}
					<div class="filter-item">
						<label class="filter-label">
							{column.name}
							<span class="column-type">({column.type})</span>
						</label>
						
						{#if columnType === 'number'}
							<input
								type="number"
								placeholder="Filter by {column.name}..."
								value={filters[column.name] || ''}
								on:input={(e) => handleFilterChange(column.name, e.target.value)}
								class="filter-input"
							/>
						{:else if columnType === 'date'}
							<input
								type="date"
								value={filters[column.name] || ''}
								on:input={(e) => handleFilterChange(column.name, e.target.value)}
								class="filter-input"
							/>
						{:else}
							<input
								type="text"
								placeholder="Filter by {column.name}..."
								value={filters[column.name] || ''}
								on:input={(e) => handleFilterChange(column.name, e.target.value)}
								class="filter-input"
							/>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
	}

	.search-section {
		flex: 1;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		max-width: 400px;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		color: var(--color-text-secondary);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 0.875rem;
		background: var(--color-surface);
		color: var(--color-text);
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.clear-search {
		position: absolute;
		right: 0.5rem;
		padding: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		border-radius: 4px;
		transition: color 0.2s, background-color 0.2s;
	}

	.clear-search:hover {
		color: var(--color-text);
		background: var(--color-surface-hover);
	}

	.filter-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filter-toggle {
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

	.filter-toggle:hover {
		background: var(--color-surface-hover);
	}

	.filter-toggle.active {
		background: var(--color-primary-surface);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.filter-count {
		background: var(--color-primary);
		color: white;
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 10px;
		font-weight: 500;
		min-width: 1.25rem;
		text-align: center;
	}

	.clear-filters {
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		transition: all 0.2s;
	}

	.clear-filters:hover {
		background: var(--color-surface-hover);
		color: var(--color-text);
	}

	.filter-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 10;
		max-height: 400px;
		overflow-y: auto;
		margin-top: 0.5rem;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		padding: 1rem;
	}

	.filter-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.column-type {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 400;
	}

	.filter-input {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 0.875rem;
		background: var(--color-background);
		color: var(--color-text);
		transition: border-color 0.2s;
	}

	.filter-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.filter-panel {
			flex-direction: column;
			align-items: stretch;
		}

		.search-input-wrapper {
			max-width: none;
		}

		.filter-section {
			justify-content: space-between;
		}

		.filter-grid {
			grid-template-columns: 1fr;
		}
	}
</style> 