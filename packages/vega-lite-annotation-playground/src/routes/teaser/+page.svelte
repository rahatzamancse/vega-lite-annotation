<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LZString from 'lz-string';
	import { loadJsonFile } from '$lib/utils';

	onMount(async () => {
		const teaserCode = await loadJsonFile('realexamples-hospitalizations.json');
		
		console.log(teaserCode);

		// Compress the code and redirect
		const compressedSpec = LZString.compressToEncodedURIComponent(JSON.stringify(teaserCode.json, null, 2));
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