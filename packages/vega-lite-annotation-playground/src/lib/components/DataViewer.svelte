<script lang="ts">
	import { onMount } from 'svelte';
	import * as vega from 'vega';

	const { view }: { view: vega.View | null } = $props();

	// Define a type for the runtime structure we're accessing
	type VegaRuntime = {
		data: {
			[key: string]: {
				values?: {
					value: any[]
				}
			}
		}
	};

	let dataNames: string[] = $state([]);
	let selectedDataName: string | null = $state(null);
	let selectedData: any[] = $state([]);
	let loading = $state(false);
	let containerElement: HTMLElement | null = $state(null);

	// Pagination state
	let currentPage = $state(1);
	let pageSize = $state(50);
	let pageSizeOptions = $state([10, 25, 50, 100, 250]);
	let totalPages = $derived(Math.max(1, Math.ceil(selectedData.length / pageSize)));
	let visibleData = $derived(paginateData(selectedData, currentPage, pageSize));

	// Process the view object when it changes
	$effect(() => {
		if (view) {
			loadData();
		}
	});

	// Reset pagination when dataset changes
	$effect(() => {
		if (selectedDataName) {
			currentPage = 1;
		}
	});

	onMount(() => {
		// Set up a resize observer to handle table dimensions when tab becomes visible
		const resizeObserver = new ResizeObserver(() => {
			// If we have data and the container has size, make sure overflow works
			if (containerElement && containerElement.offsetHeight > 0 && selectedData.length > 0) {
				// Force a layout recalculation
				containerElement.style.display = 'none';
				void containerElement.offsetHeight; // Trigger reflow
				containerElement.style.display = '';
			}
		});
		
		if (containerElement) {
			resizeObserver.observe(containerElement);
		}
		
		// Also listen for tab changes via window resize event
		const handleResize = () => {
			if (containerElement && containerElement.offsetHeight > 0) {
				updateSelectedData();
			}
		};
		
		window.addEventListener('resize', handleResize);
		
		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', handleResize);
		};
	});

	async function loadData() {
		if (!view) return;

		loading = true;
		try {
			// Make sure the view has fully run before getting data
			await view.runAsync();

			// Access the internal runtime data structure with type assertion
			const runtime = (view as any)._runtime as VegaRuntime;
			if (runtime && runtime.data) {
				// Get all data set names
				dataNames = Object.keys(runtime.data);
				selectedDataName = dataNames.length > 0 ? dataNames[0] : null;
				updateSelectedData();
			}
		} catch (error) {
			console.error('Error loading data from view:', error);
		} finally {
			loading = false;
		}
	}

	function updateSelectedData() {
		if (!view || !selectedDataName) {
			selectedData = [];
			return;
		}

		try {
			// Get the data from the runtime with type assertion
			const runtime = (view as any)._runtime as VegaRuntime;
			if (!runtime || !runtime.data) {
				selectedData = [];
				return;
			}

			const dataSet = runtime.data[selectedDataName];

			// If the dataset has a 'values' property with an array, use that
			if (dataSet && dataSet.values && Array.isArray(dataSet.values.value)) {
				selectedData = dataSet.values.value.map((item: any) => ({...item}));
				
				// Reset to first page when data changes
				currentPage = 1;
			} else {
				selectedData = [];
			}
		} catch (error) {
			console.error('Error loading dataset:', error);
			selectedData = [];
		}
	}

	// Get the subset of data for the current page
	function paginateData(data: any[], page: number, itemsPerPage: number): any[] {
		const startIndex = (page - 1) * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, data.length);
		return data.slice(startIndex, endIndex);
	}

	// Page navigation functions
	function goToFirstPage() {
		currentPage = 1;
	}

	function goToPreviousPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToNextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function goToLastPage() {
		currentPage = totalPages;
	}

	function handlePageSizeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		pageSize = parseInt(select.value, 10);
		currentPage = 1; // Reset to first page when changing page size
	}

	// Safely format an object for display
	function safeFormat(value: any): string {
		if (value === null || value === undefined) {
			return '';
		}

		if (typeof value !== 'object') {
			return String(value);
		}

		try {
			return JSON.stringify(value, null, 2);
		} catch (e) {
			return '[Complex Object]';
		}
	}
</script>

<div class="data-viewer">
	{#if loading}
		<div class="loading">Loading data...</div>
	{:else if !view}
		<div class="empty-state">
			<p>No visualization data available. Run the visualization first.</p>
		</div>
	{:else if dataNames.length === 0}
		<div class="empty-state">
			<p>No datasets found in the visualization.</p>
		</div>
	{:else}
		<div class="data-controls">
			<label for="data-selector">Dataset:</label>
			<select id="data-selector" bind:value={selectedDataName} onchange={updateSelectedData}>
				{#each dataNames as name}
					<option value={name}>{name}</option>
				{/each}
			</select>

			<div class="data-info">
				{#if selectedData.length > 0}
					<span class="row-count">{selectedData.length} rows</span>
				{/if}
			</div>
		</div>

		{#if selectedData.length > 0}
			<div class="data-table-container" bind:this={containerElement}>
				<table class="data-table">
					<thead>
						<tr>
							{#each Object.keys(visibleData[0] || {}) as header}
								<th>{header}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each visibleData as row}
							<tr>
								{#each Object.keys(row) as key}
									<td>
										{safeFormat(row[key])}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="pagination-controls">
				<div class="pagination-info">
					Showing page {currentPage} of {totalPages}
					({(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, selectedData.length)} 
					of {selectedData.length} rows)
				</div>
				
				<div class="pagination-buttons">
					<button 
						class="pagination-button" 
						disabled={currentPage === 1} 
						onclick={goToFirstPage}
						title="First page"
					>
						&laquo;
					</button>
					<button 
						class="pagination-button" 
						disabled={currentPage === 1} 
						onclick={goToPreviousPage}
						title="Previous page"
					>
						&lsaquo;
					</button>
					
					<div class="page-indicator">
						{currentPage} / {totalPages}
					</div>
					
					<button 
						class="pagination-button" 
						disabled={currentPage === totalPages} 
						onclick={goToNextPage}
						title="Next page"
					>
						&rsaquo;
					</button>
					<button 
						class="pagination-button" 
						disabled={currentPage === totalPages} 
						onclick={goToLastPage}
						title="Last page"
					>
						&raquo;
					</button>
				</div>
				
				<div class="page-size-selector">
					<label for="page-size">Rows per page:</label>
					<select id="page-size" value={pageSize} onchange={handlePageSizeChange}>
						{#each pageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<p>No data in selected dataset.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.data-viewer {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.loading,
	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #666;
	}

	.data-controls {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		gap: 0.5rem;
		border-bottom: 1px solid #eee;
		flex-shrink: 0;
	}

	select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background-color: white;
	}

	.data-info {
		margin-left: auto;
		font-size: 0.8rem;
		color: #666;
	}

	.data-table-container {
		flex: 1;
		overflow: auto;
		padding: 0.5rem;
		min-height: 0;
		max-height: 100%;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		table-layout: fixed;
	}

	.data-table th,
	.data-table td {
		padding: 0.4rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid #eee;
		word-break: break-word;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.data-table th {
		background-color: #f8f8f8;
		position: sticky;
		top: 0;
		z-index: 1;
		font-weight: 500;
	}

	.data-table tr:hover {
		background-color: #f5f5f5;
	}

	/* Pagination styles */
	.pagination-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		border-top: 1px solid #eee;
		flex-shrink: 0;
		background-color: #f8f8f8;
		font-size: 0.85rem;
	}

	.pagination-info {
		color: #666;
		flex: 1;
	}

	.pagination-buttons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pagination-button {
		border: 1px solid #ddd;
		background-color: white;
		border-radius: 4px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-weight: bold;
		color: #333;
	}

	.pagination-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination-button:hover:not(:disabled) {
		background-color: #f0f0f0;
	}

	.page-indicator {
		padding: 0 0.5rem;
		font-weight: 500;
	}

	.page-size-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: flex-end;
	}

	.page-size-selector select {
		width: 4rem;
	}
</style>
