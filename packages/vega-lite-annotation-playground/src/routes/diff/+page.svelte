<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import * as vega from 'vega';
	import Navigation from '$lib/components/Navigation.svelte';
	import LZString from 'lz-string';
	import { loadJsonFile } from '$lib/utils';
	import * as VLAnnotation from 'vega-lite-annotation-library';

	let monaco: typeof Monaco;
	let diffEditor: Monaco.editor.IStandaloneDiffEditor = $state()!;
	let diffEditorContainer: HTMLElement = $state()!;
	
	let originalVisualizationContainer: HTMLElement = $state()!;
	let modifiedVisualizationContainer: HTMLElement = $state()!;
	
	let autorunEnabled = $state(true);
	let isExampleModalOpen = $state(false);

	// Constants for storage
	const STORAGE_KEY_ORIGINAL = 'vega-lite-annotation-diff-content-original';
	const STORAGE_KEY_MODIFIED = 'vega-lite-annotation-diff-content-modified';
	

	const runOriginalContent = async (content: string) => {
		try {
			// Parse the JSON content
			let originalSpec;
			try {
				// First try standard JSON parse
				originalSpec = JSON.parse(content);
			} catch (jsonError) {
				// If that fails, try evaluating it as a JavaScript object (for JSON5)
				originalSpec = (new Function(`return (${content});`))();
			}
			
			const originalVegaSpec = await VLAnnotation.vlaToV(originalSpec);

			// Render the visualization and store the view
			const originalRuntime = vega.parse(originalVegaSpec);
			const originalView = new vega.View(originalRuntime)
				.renderer('svg')
				.initialize(originalVisualizationContainer);
				
			await originalView.runAsync();
		} catch (error) {
			console.error('Error updating original visualization:', error);
		}
	};

	const runModifiedContent = async (content: string) => {
		try {
			// Parse the JSON content
			let modifiedSpec;
			try {
				// First try standard JSON parse
				modifiedSpec = JSON.parse(content);
			} catch (jsonError) {
				// If that fails, try evaluating it as a JavaScript object (for JSON5)
				modifiedSpec = (new Function(`return (${content});`))();
			}
			
			const modifiedVegaSpec = await VLAnnotation.vlaToV(modifiedSpec);

			// Render the visualization and store the view
			const modifiedRuntime = vega.parse(modifiedVegaSpec);
			const modifiedView = new vega.View(modifiedRuntime)
				.renderer('svg')
				.initialize(modifiedVisualizationContainer);
				
			await modifiedView.runAsync();
		} catch (error) {
			console.error('Error updating modified visualization:', error);
		}
	};

	const runButtonClicked = async () => {
		console.log("runButtonClicked");
		// Get the JSON content from both editors
		const originalContent = diffEditor.getOriginalEditor().getValue();
		const modifiedContent = diffEditor.getModifiedEditor().getValue();

		// Save to localStorage whenever the visualization is run
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY_ORIGINAL, originalContent);
			localStorage.setItem(STORAGE_KEY_MODIFIED, modifiedContent);
		}

		await Promise.all([
			runOriginalContent(originalContent),
			runModifiedContent(modifiedContent)
		]);
	};

	const onExampleLoad = async (filename: string) => {
		try {
			// Load the JSON file
			const json = await loadJsonFile(filename);
			
			// Set the modified editor with the loaded JSON
			const modifiedModel = diffEditor.getModifiedEditor().getModel();
			if (modifiedModel) {
				modifiedModel.setValue(JSON.stringify(json.json, null, 2));
			}
			
			// Set the language mode based on file extension
			const fileExtension = json.path.split('.').pop()?.toLowerCase();
			if (fileExtension === 'json5') {
				monaco.editor.setModelLanguage(modifiedModel!, 'json5');
			} else {
				monaco.editor.setModelLanguage(modifiedModel!, 'json');
			}
			
			// Automatically run if enabled
			if (autorunEnabled) {
				runButtonClicked();
			}
			
			// Close the example modal if it's open
			isExampleModalOpen = false;
		} catch (error) {
			console.error('Error loading example:', error);
		}
	}

	const generateShareableLink = () => {
		const originalSpec = diffEditor.getOriginalEditor().getValue();
		const modifiedSpec = diffEditor.getModifiedEditor().getValue();
		const compressedOriginalSpec = LZString.compressToEncodedURIComponent(originalSpec);
		const compressedModifiedSpec = LZString.compressToEncodedURIComponent(modifiedSpec);
		const url = new URL(window.location.href);
		url.search = `?original=${compressedOriginalSpec}&modified=${compressedModifiedSpec}`;
		return url.toString();
	}

	const toggleAutorun = () => {
		autorunEnabled = !autorunEnabled;
	}

	onMount(async () => {
		// Load Monaco editor
		monaco = (await import('$lib/monaco')).default;
		
		// Configure Monaco for JSON and JSON5 support
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			allowComments: true,
			comments: 'ignore',
			trailingCommas: 'ignore',
			schemas: [],
			enableSchemaRequest: true
		});

		// Create diff editor
		diffEditor = monaco.editor.createDiffEditor(diffEditorContainer, {
			enableSplitViewResizing: false,
			renderSideBySide: true,
			originalEditable: true,
			automaticLayout: true,
			wordWrap: 'on',
			scrollBeyondLastLine: false,
			minimap: { enabled: false }
		});

		// Set initial empty models
		const originalModel = monaco.editor.createModel('', 'json');
		const modifiedModel = monaco.editor.createModel('', 'json');
		diffEditor.setModel({
			original: originalModel,
			modified: modifiedModel
		});
		
		// Add change listener for autorun
		diffEditor.getModifiedEditor().onDidChangeModelContent(async () => {
			if (autorunEnabled) {
				const content = diffEditor.getModifiedEditor().getValue();
				await runModifiedContent(content);
			}
		});
		diffEditor.getOriginalEditor().onDidChangeModelContent(async () => {
			if (autorunEnabled) {
				const content = diffEditor.getOriginalEditor().getValue();
				await runOriginalContent(content);
			}
		});

		// Load content - first check URL params, then localStorage
		let originalContent = '';
		let modifiedContent = '';
		
		// Check URL parameters for compressed content
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const compressedOriginalSpec = urlParams.get('original');
			const compressedModifiedSpec = urlParams.get('modified');
			
			if (compressedOriginalSpec && compressedModifiedSpec) {
				try {
					// Decompress the content
					originalContent = LZString.decompressFromEncodedURIComponent(compressedOriginalSpec);
					modifiedContent = LZString.decompressFromEncodedURIComponent(compressedModifiedSpec);
					console.log('Loaded content from URL parameters');
				} catch (error) {
					console.error('Error decompressing URL parameters:', error);
				}
			} else if (typeof localStorage !== 'undefined') {
				// If no URL parameters, try to load from localStorage
				const savedOriginalContent = localStorage.getItem(STORAGE_KEY_ORIGINAL);
				const savedModifiedContent = localStorage.getItem(STORAGE_KEY_MODIFIED);
				if (savedOriginalContent && savedModifiedContent) {
					originalContent = savedOriginalContent;
					modifiedContent = savedModifiedContent;
					console.log('Loaded content from local storage');
				}
			}
		}
		
		// If no content loaded from URL or localStorage, load default sample files
		if (!originalContent || !modifiedContent) {
			try {
				const [scatterplotResponse, barchartResponse] = await Promise.all([
					fetch('/sample_inputs/diffs/scatterplot.json'),
					fetch('/sample_inputs/diffs/vertical-barchart.json')
				]);
				
				if (scatterplotResponse.ok && barchartResponse.ok) {
					const scatterplotData = await scatterplotResponse.json();
					const barchartData = await barchartResponse.json();
					
					originalContent = JSON.stringify(scatterplotData, null, 2);
					modifiedContent = JSON.stringify(barchartData, null, 2);
					console.log('Loaded default sample files');
				}
			} catch (error) {
				console.error('Error loading default sample files:', error);
			}
		}
		
		// Set the saved content if available
		if (originalContent && modifiedContent) {
			diffEditor.getOriginalEditor().setValue(originalContent);
			diffEditor.getModifiedEditor().setValue(modifiedContent);
			if (autorunEnabled) {
				runButtonClicked();
			}
		}
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		diffEditor?.dispose();
	});
</script>

<Navigation
	{autorunEnabled}
	{runButtonClicked}
	{onExampleLoad}
	{generateShareableLink}
	{isExampleModalOpen}
	{toggleAutorun}
/>

<div class="container">
	<div class="editor-section">
		<div class="diff-editor-container" bind:this={diffEditorContainer}></div>
	</div>
	<div class="visualization-row">
		<div class="visualization-container">
			<h3>Original Visualization</h3>
			<div class="visualization" bind:this={originalVisualizationContainer}></div>
		</div>
		<div class="visualization-container">
			<h3>Modified Visualization</h3>
			<div class="visualization" bind:this={modifiedVisualizationContainer}></div>
		</div>
	</div>
</div>

<style>

	/* Add padding to the main content to account for fixed header */
	:global(body) {
		padding-top: 3rem;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
	}

	.editor-section {
		flex: 1;
		min-height: 40%;
		width: 100%;
	}

	.diff-editor-container {
		height: 100%;
		width: 100%;
	}

	.visualization-row {
		display: flex;
		flex-direction: row;
		height: 50%;
		width: 100%;
		gap: 1rem;
		padding: 1rem;
	}

	.visualization-container {
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f8f8f8;
		border-radius: 4px;
		padding: 1rem;
	}

	.visualization-container h3 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.visualization {
		flex: 1;
		width: 100%;
		overflow: auto;
		background: white;
		border-radius: 4px;
	}
</style> 