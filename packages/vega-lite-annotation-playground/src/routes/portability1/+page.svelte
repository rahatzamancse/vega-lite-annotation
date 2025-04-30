<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadJsonFile } from '$lib/utils';
	import LZString from 'lz-string';

	onMount(async () => {
		try {
			const original = await loadJsonFile('diffs/scatterplot.json');
			const modified = await loadJsonFile('diffs/vertical-barchart.json');

			const encodedOriginal = LZString.compressToEncodedURIComponent(JSON.stringify(original.json, null, 2));
			const encodedModified = LZString.compressToEncodedURIComponent(JSON.stringify(modified.json, null, 2));

			goto(`/diff?original=${encodedOriginal}&modified=${encodedModified}`);
		} catch (error) {
			console.error('Failed to load JSON files:', error);
		}
	});
</script>

<div>Loading JSON files and redirecting to diff view...</div>
