<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LZString from 'lz-string';
    import hospitalizationsExample from '$lib/sample_inputs/realexamples-hospitalizations.json';

	onMount(() => {
		const teaserCode = hospitalizationsExample;

		// Compress the code and redirect
		const compressedSpec = LZString.compressToEncodedURIComponent(JSON.stringify(teaserCode, null, 2));
		goto(`/?spec=${compressedSpec}`);
	});
</script>

<div class="loading">
	Loading Visualization...
</div>

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		font-size: 1.2rem;
		color: #666;
	}
</style> 