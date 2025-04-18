<script lang="ts">
	interface Props {
		tabs?: { title: string }[];
		tabChange?: (index: number) => void;
		children?: import('svelte').Snippet;
	}

	let {
		tabs = [],
		tabChange,
		children
	}: Props = $props();
	let activeTabIndex = $state(0);

	function switchTab(index: number) {
		activeTabIndex = index;
		tabChange?.(index);
	}
</script>

<div class="tab-group">
	<div class="tab-headers">
		{#each tabs as tab, index}
			<button
				class="tab-header"
				class:active={index === activeTabIndex}
				onclick={() => switchTab(index)}
			>
				{tab.title}
			</button>
		{/each}
	</div>
	<div class="tab-content">
		{@render children?.()}
	</div>
</div>

<style>
	.tab-group {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.tab-headers {
		display: flex;
		border-bottom: 1px solid #ddd;
		background: #f5f5f5;
	}

	.tab-header {
		padding: 0.5rem 1rem;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.9rem;
		color: #666;
		transition: all 0.2s ease;
	}

	.tab-header:hover {
		background: #eee;
	}

	.tab-header.active {
		background: white;
		color: #333;
		border-bottom: 2px solid #0066cc;
	}

	.tab-content {
		flex: 1;
		overflow: hidden;
	}
</style> 