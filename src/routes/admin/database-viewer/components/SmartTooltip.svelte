<script>
	import { onMount } from 'svelte';

	export let content = '';
	export let type = 'text';
	export let visible = false;
	export let x = 0;
	export let y = 0;

	let tooltipElement;
	let tooltipWidth = 0;
	let tooltipHeight = 0;

	// Format content based on type
	function formatContent(content, type) {
		if (!content) return '';
		
		switch (type) {
			case 'json':
				try {
					const parsed = JSON.parse(content);
					return JSON.stringify(parsed, null, 2);
				} catch {
					return content;
				}
			case 'timestamp':
				const timestamp = parseInt(content);
				if (!isNaN(timestamp)) {
					const date = new Date(timestamp * 1000);
					return `${date.toLocaleString()}\n\nRaw value: ${content}`;
				}
				return content;
			case 'long-text':
			case 'text':
			default:
				return content;
		}
	}

	// Smart positioning to keep tooltip on screen
	function getTooltipPosition(mouseX, mouseY) {
		if (!tooltipElement) return { x: mouseX, y: mouseY };

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const offset = 10;

		let tooltipX = mouseX + offset;
		let tooltipY = mouseY + offset;

		// Adjust horizontal position if tooltip would go off-screen
		if (tooltipX + tooltipWidth > viewportWidth) {
			tooltipX = mouseX - tooltipWidth - offset;
		}

		// Adjust vertical position if tooltip would go off-screen
		if (tooltipY + tooltipHeight > viewportHeight) {
			tooltipY = mouseY - tooltipHeight - offset;
		}

		// Ensure tooltip doesn't go above or left of viewport
		tooltipX = Math.max(offset, tooltipX);
		tooltipY = Math.max(offset, tooltipY);

		return { x: tooltipX, y: tooltipY };
	}

	$: formattedContent = formatContent(content, type);
	$: if (tooltipElement && visible) {
		tooltipWidth = tooltipElement.offsetWidth;
		tooltipHeight = tooltipElement.offsetHeight;
	}
	$: position = getTooltipPosition(x, y);
</script>

{#if visible && formattedContent}
	<div
		bind:this={tooltipElement}
		class="smart-tooltip {type}"
		style="left: {position.x}px; top: {position.y}px;"
	>
		{#if type === 'json'}
			<div class="tooltip-header">
				<span class="tooltip-type">JSON Data</span>
			</div>
			<pre class="tooltip-content json-content">{formattedContent}</pre>
		{:else if type === 'timestamp'}
			<div class="tooltip-header">
				<span class="tooltip-type">Timestamp</span>
			</div>
			<pre class="tooltip-content timestamp-content">{formattedContent}</pre>
		{:else if type === 'long-text'}
			<div class="tooltip-header">
				<span class="tooltip-type">Full Text</span>
			</div>
			<div class="tooltip-content text-content">{formattedContent}</div>
		{:else}
			<div class="tooltip-content text-content">{formattedContent}</div>
		{/if}
	</div>
{/if}

<style>
	.smart-tooltip {
		position: fixed;
		z-index: 1000;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		max-width: 400px;
		max-height: 300px;
		overflow: hidden;
		font-size: 0.875rem;
		pointer-events: none;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.tooltip-header {
		padding: 0.5rem 0.75rem;
		background: var(--color-background);
		border-bottom: 1px solid var(--color-border);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.tooltip-type {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tooltip-content {
		padding: 0.75rem;
		overflow-y: auto;
		max-height: 240px;
		color: var(--color-text);
		line-height: 1.4;
	}

	.json-content {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.8125rem;
		background: var(--color-background);
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.timestamp-content {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.8125rem;
		margin: 0;
		white-space: pre-wrap;
	}

	.text-content {
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	/* Scrollbar styling */
	.tooltip-content::-webkit-scrollbar {
		width: 6px;
	}

	.tooltip-content::-webkit-scrollbar-track {
		background: var(--color-background);
		border-radius: 3px;
	}

	.tooltip-content::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 3px;
	}

	.tooltip-content::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary);
	}

	/* Type-specific styling */
	.smart-tooltip.json {
		border-left: 3px solid #10b981;
	}

	.smart-tooltip.timestamp {
		border-left: 3px solid #3b82f6;
	}

	.smart-tooltip.long-text {
		border-left: 3px solid #f59e0b;
	}

	.smart-tooltip.null {
		border-left: 3px solid #6b7280;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.smart-tooltip {
			max-width: 300px;
			max-height: 200px;
			font-size: 0.8125rem;
		}

		.tooltip-content {
			max-height: 140px;
			padding: 0.5rem;
		}
	}
</style> 