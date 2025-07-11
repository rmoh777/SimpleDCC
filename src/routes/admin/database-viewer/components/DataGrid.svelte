<script>
	import { createEventDispatcher } from 'svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import SmartTooltip from './SmartTooltip.svelte';

	export let data = [];
	export let schema = [];
	export let currentPage = 1;
	export let totalPages = 1;
	export let totalRows = 0;
	export let loading = false;

	const dispatch = createEventDispatcher();

	let sortColumn = '';
	let sortDirection = 'asc';

	// Tooltip state
	let tooltipVisible = false;
	let tooltipContent = '';
	let tooltipType = 'text';
	let tooltipX = 0;
	let tooltipY = 0;

	// Handle column sorting
	function handleSort(column) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		dispatch('sort', { column, direction: sortDirection });
	}

	// Handle pagination
	function handlePageChange(page) {
		if (page >= 1 && page <= totalPages) {
			dispatch('pageChange', { page });
		}
	}

	// Handle cell hover for tooltip
	function handleCellHover(event, rawValue, type) {
		if (!rawValue || rawValue === null || rawValue === undefined) return;
		
		// Only show tooltip for content that's truncated or complex
		const shouldShowTooltip = 
			type === 'json' ||
			type === 'timestamp' ||
			type === 'long-text' ||
			(typeof rawValue === 'string' && rawValue.length > 50);
		
		if (shouldShowTooltip) {
			tooltipContent = rawValue;
			tooltipType = type;
			tooltipX = event.clientX;
			tooltipY = event.clientY;
			tooltipVisible = true;
		}
	}

	function handleCellLeave() {
		tooltipVisible = false;
	}

	// Format cell data for display
	function formatCellData(value, columnName) {
		if (value === null || value === undefined) {
			return { display: '—', type: 'null' };
		}

		// Handle different data types
		if (typeof value === 'string') {
			// Check if it's a timestamp
			if (columnName.includes('_at') || columnName.includes('timestamp')) {
				const timestamp = parseInt(value);
				if (!isNaN(timestamp)) {
					return { 
						display: new Date(timestamp * 1000).toLocaleString(), 
						type: 'timestamp',
						raw: value 
					};
				}
			}

			// Check if it's JSON
			if (value.startsWith('{') || value.startsWith('[')) {
				try {
					const parsed = JSON.parse(value);
					return { 
						display: JSON.stringify(parsed, null, 2), 
						type: 'json',
						raw: value 
					};
				} catch {
					// Not valid JSON, treat as text
				}
			}

			// Long text truncation
			if (value.length > 100) {
				return { 
					display: value.substring(0, 100) + '...', 
					type: 'long-text',
					raw: value 
				};
			}

			return { display: value, type: 'text', raw: value };
		}

		// Numbers
		if (typeof value === 'number') {
			return { display: value.toLocaleString(), type: 'number', raw: value };
		}

		// Boolean
		if (typeof value === 'boolean') {
			return { display: value ? 'Yes' : 'No', type: 'boolean', raw: value };
		}

		// Fallback
		return { display: String(value), type: 'unknown', raw: value };
	}

	// Get column display name
	function getColumnDisplayName(columnName) {
		return columnName
			.replace(/_/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase());
	}

	// Generate page numbers for pagination
	function getPageNumbers() {
		const pages = [];
		const maxVisible = 7;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);
			
			// Calculate range around current page
			const start = Math.max(2, currentPage - 2);
			const end = Math.min(totalPages - 1, currentPage + 2);
			
			// Add ellipsis if needed
			if (start > 2) {
				pages.push('...');
			}
			
			// Add pages around current
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
			
			// Add ellipsis if needed
			if (end < totalPages - 1) {
				pages.push('...');
			}
			
			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}
		
		return pages;
	}

	$: pageNumbers = getPageNumbers();
</script>

<div class="data-grid">
	{#if loading}
		<div class="loading-state">
			<LoadingSpinner />
			<p>Loading table data...</p>
		</div>
	{:else if data.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📭</div>
			<h3>No Data Found</h3>
			<p>This table appears to be empty or no records match your current filters.</p>
		</div>
	{:else}
		<div class="table-container">
			<table class="data-table">
				<thead>
					<tr>
						{#each schema as column}
							<th class="column-header">
								<button 
									class="sort-button"
									class:active={sortColumn === column.name}
									on:click={() => handleSort(column.name)}
								>
									<span class="column-name">
										{getColumnDisplayName(column.name)}
									</span>
									<span class="sort-indicator">
										{#if sortColumn === column.name}
											{#if sortDirection === 'asc'}
												<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
													<path d="M6 2l4 4H2l4-4z"/>
												</svg>
											{:else}
												<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
													<path d="M6 10L2 6h8l-4 4z"/>
												</svg>
											{/if}
										{:else}
											<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
												<path d="M6 2l4 4H2l4-4z"/>
											</svg>
										{/if}
									</span>
								</button>
								<div class="column-type">{column.type}</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data as row, rowIndex}
						<tr class="data-row">
							{#each schema as column}
								{@const cellData = formatCellData(row[column.name], column.name)}
								<td 
									class="data-cell {cellData.type}"
									on:mouseenter={(e) => handleCellHover(e, cellData.raw, cellData.type)}
									on:mouseleave={handleCellLeave}
								>
									{#if cellData.type === 'json'}
										<details class="json-details">
											<summary class="json-summary">JSON Data</summary>
											<pre class="json-content">{cellData.display}</pre>
										</details>
									{:else if cellData.type === 'long-text'}
										<span class="truncated-text">
											{cellData.display}
										</span>
									{:else if cellData.type === 'null'}
										<span class="null-value">
											{cellData.display}
										</span>
									{:else}
										<span class="cell-content">
											{cellData.display}
										</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				<div class="pagination-info">
					<span>
						Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalRows)} of {totalRows.toLocaleString()} records
					</span>
				</div>
				
				<div class="pagination-controls">
					<button 
						class="page-button"
						disabled={currentPage === 1}
						on:click={() => handlePageChange(currentPage - 1)}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
						</svg>
						Previous
					</button>
					
					{#each pageNumbers as page}
						{#if page === '...'}
							<span class="page-ellipsis">...</span>
						{:else}
							<button 
								class="page-button"
								class:active={page === currentPage}
								on:click={() => handlePageChange(page)}
							>
								{page}
							</button>
						{/if}
					{/each}
					
					<button 
						class="page-button"
						disabled={currentPage === totalPages}
						on:click={() => handlePageChange(currentPage + 1)}
					>
						Next
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Smart Tooltip -->
<SmartTooltip 
	{tooltipVisible}
	content={tooltipContent}
	type={tooltipType}
	x={tooltipX}
	y={tooltipY}
	bind:visible={tooltipVisible}
/>

<style>
	.data-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
	}

	.loading-state, .empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
	}

	.table-container {
		flex: 1;
		overflow: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.column-header {
		background: var(--color-background);
		border-bottom: 2px solid var(--color-border);
		padding: 0;
		text-align: left;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.sort-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text);
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.sort-button:hover {
		background: var(--color-surface-hover);
	}

	.sort-button.active {
		color: var(--color-primary);
	}

	.column-name {
		flex: 1;
		text-align: left;
	}

	.sort-indicator {
		margin-left: 0.5rem;
		display: flex;
		align-items: center;
	}

	.column-type {
		padding: 0 0.75rem 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 400;
	}

	.data-row {
		border-bottom: 1px solid var(--color-border);
		transition: background-color 0.2s;
	}

	.data-row:hover {
		background: var(--color-surface-hover);
	}

	.data-cell {
		padding: 0.75rem;
		vertical-align: top;
		max-width: 300px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.data-cell:hover {
		background: rgba(var(--color-primary-rgb), 0.05);
	}

	.data-cell.null {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.data-cell.number {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.data-cell.boolean {
		text-align: center;
	}

	.data-cell.timestamp {
		font-family: monospace;
		font-size: 0.8125rem;
	}

	.cell-content {
		word-break: break-word;
		display: block;
	}

	.truncated-text {
		color: var(--color-text-secondary);
		cursor: help;
		display: block;
		position: relative;
	}

	.truncated-text::after {
		content: " 🔍";
		opacity: 0.5;
		font-size: 0.75rem;
	}

	.null-value {
		color: var(--color-text-secondary);
		font-style: italic;
		opacity: 0.7;
	}

	.json-details {
		max-width: 100%;
	}

	.json-summary {
		cursor: pointer;
		color: var(--color-primary);
		font-weight: 500;
		font-size: 0.8125rem;
		position: relative;
	}

	.json-summary::after {
		content: " 🔍";
		opacity: 0.5;
		font-size: 0.75rem;
	}

	.json-content {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.75rem;
		overflow-x: auto;
		white-space: pre-wrap;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-background);
	}

	.pagination-info {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.page-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.page-button:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}

	.page-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-button.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.page-ellipsis {
		padding: 0.5rem 0.25rem;
		color: var(--color-text-secondary);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.data-table {
			font-size: 0.8125rem;
		}

		.data-cell {
			padding: 0.5rem;
			max-width: 200px;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
		}

		.pagination-controls {
			flex-wrap: wrap;
			justify-content: center;
		}

		.page-button {
			padding: 0.375rem 0.5rem;
			font-size: 0.8125rem;
		}
	}
</style> 