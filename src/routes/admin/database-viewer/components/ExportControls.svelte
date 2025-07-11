<script>
	export let tableName = '';
	export let filters = {};
	export let searchTerm = '';
	
	let exporting = false;
	let exportProgress = 0;

	async function handleExport() {
		if (!tableName) return;
		
		try {
			exporting = true;
			exportProgress = 0;
			
			// Build query parameters
			const params = new URLSearchParams();
			if (searchTerm) params.append('search', searchTerm);
			
			// Add filters
			Object.entries(filters).forEach(([key, value]) => {
				if (value) params.append(`filter_${key}`, value);
			});
			
			// Start export
			const response = await fetch(`/api/admin/database-viewer/${tableName}/export?${params}`);
			if (!response.ok) throw new Error('Export failed');
			
			exportProgress = 50;
			
			// Download the file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			
			exportProgress = 100;
			
			// Reset after a short delay
			setTimeout(() => {
				exporting = false;
				exportProgress = 0;
			}, 1000);
			
		} catch (err) {
			console.error('Export error:', err);
			exporting = false;
			exportProgress = 0;
			alert('Export failed: ' + err.message);
		}
	}

	// Get active filter count
	$: activeFilterCount = Object.keys(filters).length;
	$: hasFilters = activeFilterCount > 0 || searchTerm.length > 0;
</script>

<div class="export-controls">
	<div class="export-info">
		{#if hasFilters}
			<span class="filter-indicator">
				<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
					<path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
				</svg>
				Filtered export
			</span>
		{:else}
			<span class="full-export">Full table export</span>
		{/if}
	</div>

	<button 
		class="export-button"
		on:click={handleExport}
		disabled={exporting || !tableName}
		title="Export table data as CSV"
	>
		{#if exporting}
			<div class="export-progress">
				<svg class="spinner" width="16" height="16" viewBox="0 0 16 16">
					<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="37.7" stroke-dashoffset="37.7">
						<animate attributeName="stroke-dashoffset" values="37.7;0" dur="1s" repeatCount="indefinite"/>
					</circle>
				</svg>
				<span>Exporting...</span>
			</div>
		{:else}
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8.5 1.5A1.5 1.5 0 0 0 7 3v3.5a.5.5 0 0 1-1 0V3a2.5 2.5 0 0 1 5 0v3.5a.5.5 0 0 1-1 0V3a1.5 1.5 0 0 0-1.5-1.5z"/>
				<path d="M3 8.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
				<path d="M3 10.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
				<path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
			</svg>
			Export CSV
		{/if}
	</button>
</div>

<style>
	.export-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.export-info {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.filter-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-primary);
		font-weight: 500;
	}

	.full-export {
		color: var(--color-text-secondary);
	}

	.export-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background-color 0.2s, opacity 0.2s;
	}

	.export-button:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.export-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.export-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.export-controls {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.export-info {
			text-align: center;
		}

		.export-button {
			justify-content: center;
		}
	}
</style> 