<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import TabGroup from '$lib/components/TabGroup.svelte';
	import SceneGraph from '$lib/components/SceneGraph.svelte';
	import DataViewer from '$lib/components/DataViewer.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	
	// Library import
	import * as VLAnnotation from 'vega-lite-annotation-library';
	
	import { loadJsonFile } from '$lib/utils';

	// load npm diff
	import * as Diff from 'diff';

	import LZString from 'lz-string';

	import * as vega from 'vega';

	
	const DEFAULT_EXAMPLE = 'realexamples-hospitalizations';

	// Constants for storage
	const STORAGE_KEY = 'vega-lite-annotation-editor-content';

	let vlAnnotationEditor: Monaco.editor.IStandaloneCodeEditor = $state()!;
	let vlAnnotationEditorContainer: HTMLElement = $state()!;
	let vegaEditor: Monaco.editor.IStandaloneCodeEditor = $state()!;
	let vegaEditorContainer: HTMLElement = $state()!;
	let configEditor: Monaco.editor.IStandaloneCodeEditor;
	let configEditorContainer: HTMLElement = $state()!;
	let extendedVegaLiteEditor: Monaco.editor.IStandaloneCodeEditor = $state()!;
	let extendedVegaLiteEditorContainer: HTMLElement = $state()!;

	let vlnaSpec: VLAnnotation.VLANormalizedSpec = $state({} as VLAnnotation.VLANormalizedSpec);
	let vegaSpec: vega.Spec = $state({} as vega.Spec);
	const vegaSpecString = $derived(JSON.stringify(vegaSpec, null, 2));
	const vlnaSpecString = $derived(JSON.stringify(vlnaSpec, null, 2));
	let isExampleModalOpen = $state(false);
	let decorationCollection: Monaco.editor.IEditorDecorationsCollection;

	let monaco: typeof Monaco;

	let vlVisualizationContainer: HTMLElement = $state()!;
	let vlLogContainer: HTMLElement = $state()!;
	let occupancyMatrixEditorContainer: HTMLElement = $state()!;
	let currentView: vega.View | null = $state(null);

	let autorunEnabled = $state(true);

	let leftPaneActiveTabIndex = $state(0);
	let rightPaneActiveTabIndex = $state(0);
	let bottomPaneActiveTabIndex = $state(0);
	let bottomRightPaneActiveTabIndex = $state(0);
	
	let sceneGraphData: vega.Scene | null = $state(null);
	
	const onExampleModalChange = (isOpen: boolean) => {
		isExampleModalOpen = isOpen;
	}


	onMount(async () => {
		// (onMount() will only be executed in the browser, which is what we want)
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

		// Register JSON5 as a language that uses JSON
		monaco.languages.register({
			id: 'json5',
			extensions: ['.json5'],
			aliases: ['JSON5', 'json5'],
			mimetypes: ['application/json5']
		});
		
		// Use JSON mode for JSON5 files
		monaco.languages.onLanguage('json5', () => {
			monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				allowComments: true,
				comments: 'ignore',
				trailingCommas: 'ignore',
				schemas: [],
				enableSchemaRequest: true
			});
		});

		const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
			// theme: 'vs-dark',
			wordWrap: 'on',
			automaticLayout: true,
			scrollBeyondLastLine: false,
			minimap: { enabled: false }
		};

		// monaco instance is ready
		vlAnnotationEditor = monaco.editor.create(vlAnnotationEditorContainer, editorOptions);
		vegaEditor = monaco.editor.create(vegaEditorContainer, { ...editorOptions, readOnly: true });
		configEditor = monaco.editor.create(configEditorContainer, editorOptions);
		extendedVegaLiteEditor = monaco.editor.create(extendedVegaLiteEditorContainer, { ...editorOptions, readOnly: true });
		
		vlAnnotationEditor.setModel(monaco.editor.createModel('', 'json'));
		vegaEditor.setModel(monaco.editor.createModel('', 'json'));
		configEditor.setModel(monaco.editor.createModel('{}', 'json'));
		extendedVegaLiteEditor.setModel(monaco.editor.createModel('', 'json'));

		decorationCollection = vegaEditor.createDecorationsCollection();

		// Add change listener for autorun
		vlAnnotationEditor.onDidChangeModelContent(async () => {
			if (autorunEnabled) {
				await runButtonClicked();
			}
		});

		// Load content - first check URL params, then localStorage
		let initialContent = '';
		let shouldOpenExamplesModal = false;
		
		// Check URL parameters for compressed content
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const compressedSpec = urlParams.get('spec');
			shouldOpenExamplesModal = urlParams.get('examples') === 'true';
			
			if (compressedSpec) {
				try {
					// Decompress the content
					initialContent = LZString.decompressFromEncodedURIComponent(compressedSpec);
					console.log('Loaded content from URL parameter');
				} catch (error) {
					console.error('Error decompressing URL parameter:', error);
				}
			} else if (typeof localStorage !== 'undefined') {
				// If no URL parameter, try to load from localStorage
				const savedContent = localStorage.getItem(STORAGE_KEY);
				if (savedContent) {
					initialContent = savedContent;
					console.log('Loaded content from local storage');
				}
			}
		}
		
		// Set the saved content if available, otherwise load the default example
		if (initialContent) {
			vlAnnotationEditor.setValue(initialContent);
			if (autorunEnabled) {
				runButtonClicked();
			}
		} else {
			onLoadJson(await loadJsonFile(DEFAULT_EXAMPLE));
		}
		
		// Open examples modal if requested via URL parameter
		if (shouldOpenExamplesModal) {
			isExampleModalOpen = true;
		}
	});

	$effect(() => {
		if (vegaEditor) {
			vegaEditor.setValue(vegaSpecString);
		}
		if (extendedVegaLiteEditor) {
			extendedVegaLiteEditor.setValue(vlnaSpecString);
		}
	});

	const displayError = (error: any) => {
		vlLogContainer.textContent = `Error: ${error.message || error}`;
	};
	
	const clearLog = () => {
		vlLogContainer.textContent = '';
	}
	
	const populateOccupancyMatrix = (occupancyMatrix: boolean[][]) => {
			// Create a more readable visualization of the occupancy matrix
			const matrixHTML = document.createElement('div');
			matrixHTML.className = 'occupancy-matrix-visualization';
			
			// Create a container for the matrix
			const matrixContainer = document.createElement('div');
			matrixContainer.style.fontFamily = 'monospace';
			matrixContainer.style.lineHeight = '1';
			matrixContainer.style.whiteSpace = 'pre';
			
			// Generate the matrix visualization with colors
			const matrixContent = occupancyMatrix.map((row: boolean[]) => {
				return row.map((cell: boolean) => 
					cell ? '<span style="color: #e74c3c;">██</span>' : '<span style="color: #ecf0f1;">░░</span>'
				).join('');
			}).join('<br>');
			
			matrixContainer.innerHTML = matrixContent;
			matrixHTML.appendChild(matrixContainer);
			
			// Add a legend
			const legend = document.createElement('div');
			legend.style.marginTop = '10px';
			legend.style.display = 'flex';
			legend.style.gap = '15px';
			
			const occupiedItem = document.createElement('div');
			occupiedItem.innerHTML = '<span style="color: #e74c3c;">██</span> Occupied';
			occupiedItem.style.display = 'flex';
			occupiedItem.style.alignItems = 'center';
			occupiedItem.style.gap = '5px';
			
			const emptyItem = document.createElement('div');
			emptyItem.innerHTML = '<span style="color: #ecf0f1;">░░</span> Empty';
			emptyItem.style.display = 'flex';
			emptyItem.style.alignItems = 'center';
			emptyItem.style.gap = '5px';
			
			legend.appendChild(occupiedItem);
			legend.appendChild(emptyItem);
			matrixHTML.appendChild(legend);
			
			// Add dimensions info
			const dimensions = document.createElement('div');
			dimensions.style.marginTop = '5px';
			dimensions.style.fontSize = '0.8em';
			dimensions.style.color = '#7f8c8d';
			dimensions.textContent = `Dimensions: ${occupancyMatrix.length}×${occupancyMatrix[0]?.length || 0}`;
			matrixHTML.appendChild(dimensions);
			
			occupancyMatrixEditorContainer.innerHTML = '';
			occupancyMatrixEditorContainer.appendChild(matrixHTML);
	}

	const runButtonClicked = async () => {
		const input = vlAnnotationEditor.getValue();
		
		// Save to localStorage whenever the visualization is run
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, input);
		}
		
		try {
			// Try to safely evaluate the input as a JavaScript object (for JSON5 support)
			// This is safe because we're not using eval() directly
			let vlaSpec;
			try {
				// First try standard JSON parse
				vlaSpec = JSON.parse(input);
			} catch (jsonError) {
				// If that fails, try evaluating it as a JavaScript object (for JSON5)
				// Use a safer approach with Function constructor
				try {
					vlaSpec = (new Function(`return (${input});`))();
				} catch (jsError: any) {
					throw new Error(`Failed to parse input: ${jsError.message}`);
				}
			}
			
			vlnaSpec = VLAnnotation.VLANormalize(vlaSpec);
			vegaSpec = await VLAnnotation.vlaToV(vlaSpec);
			const vegaSpecWithoutAnnotations = JSON.stringify(VLAnnotation.vlnaToV_noAnnotations(vlnaSpec), null, 2);

			// Get diff between vString and vWithoutAnnotationString
			const diffResult = Diff.diffLines(vegaSpecWithoutAnnotations, vegaSpecString, {
				ignoreWhitespace: true
			});
			const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
			let currentLine = 1;
			diffResult.forEach((part) => {
				if (part.added && part.count) {
					decorations.push({
						range: new monaco.Range(currentLine, 1, currentLine + part.count, 1),
						options: {
							isWholeLine: true,
							className: 'vega-diffs'
						}
					});
				}
				currentLine += part.count || 0;
			});
			decorationCollection.set(decorations);
			
			// Render the visualization and store the view
			const runtime = vega.parse(vegaSpec);
			const view = new vega.View(runtime)
				.renderer('svg')
				.initialize(vlVisualizationContainer);
				
			await view.runAsync();
			currentView = view;
			
			const occupancyMatrix = await VLAnnotation.createOccupancyMatrix(vegaSpec);
			populateOccupancyMatrix(occupancyMatrix);
			const sceneGraph = await VLAnnotation.vegaSpecToSceneGraph(vegaSpec);
			sceneGraphData = sceneGraph;
			clearLog();
		} catch (error) {
			displayError(error);
			console.error(error);
		}
	};
	
	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		vlAnnotationEditor?.dispose();
		vegaEditor?.dispose();
		configEditor?.dispose();
		extendedVegaLiteEditor?.dispose();
	});

	const onLoadJson = async (json: { path: string, json: VLAnnotation.VLATopLevelSpec, name: string, image: string, filename: string }) => {
		const data = json.json;
		vlAnnotationEditor.setValue(JSON.stringify(data, null, 2));
		
		// Set the language mode based on file extension
		const fileExtension = json.path.split('.').pop()?.toLowerCase();
		if (fileExtension === 'json5') {
			monaco.editor.setModelLanguage(vlAnnotationEditor.getModel()!, 'json5');
		} else {
			monaco.editor.setModelLanguage(vlAnnotationEditor.getModel()!, 'json');
		}
		
		// Automatically run the example
		if (autorunEnabled) {
			runButtonClicked();
		}
	};

	const removeAnnotations = (vlaSpec: any) => {
		// TODO: Implement this
		return vlaSpec;
	};

	// Add a function to generate a shareable link
	const generateShareableLink = () => {
		const vlaSpec = vlAnnotationEditor.getValue();
		const compressedSpec = LZString.compressToEncodedURIComponent(vlaSpec);
		const url = new URL(window.location.href);
		url.search = `?spec=${compressedSpec}`;
		return url.toString();
	};

	const onExampleLoad = async (filename: string) => {
		const json = await loadJsonFile(filename);
		onLoadJson(json);
		isExampleModalOpen = false;
	}
	
	const toggleAutorun = () => {
		autorunEnabled = !autorunEnabled;
	}
</script>

<Navigation 
	{autorunEnabled}
	{runButtonClicked}
	{onExampleLoad}
	{generateShareableLink}
	{isExampleModalOpen}
	{toggleAutorun}
	{onExampleModalChange}
/>

<!-- Main Splitpanes -->
<Splitpanes style="height: calc(100vh - 4rem)">
	<Pane minSize={40}>
		<Splitpanes horizontal={true}>
			<Pane>
				<TabGroup tabs={[{ title: 'VL-Annotation Editor' }, { title: 'Config' }]} tabChange={(index) => leftPaneActiveTabIndex = index}>
					<div class="editor-container tab-content" class:hidden={leftPaneActiveTabIndex !== 0}>
						<div class="editor-wrapper">
							<div class="vl-annotation-editor" bind:this={vlAnnotationEditorContainer}></div>
							<button
								class="vega-editor-btn"
								onclick={() => {
									const vlaSpec = vlAnnotationEditor.getValue();
									const vlSpec = removeAnnotations(JSON.parse(vlaSpec));
									const compressedVlaSpec = LZString.compressToEncodedURIComponent(
										JSON.stringify(vlSpec, null, 2)
									);
									window.open(`https://vega.github.io/editor/#/url/vegalite/${compressedVlaSpec}`, '_blank');
								}}>Go to Vega-Lite Editor</button
							>
						</div>
					</div>
					<div class="editor-container tab-content" class:hidden={leftPaneActiveTabIndex !== 1}>
						<div class="config-editor" bind:this={configEditorContainer}></div>
					</div>
				</TabGroup>
			</Pane>
			<Pane size={30}>
				<TabGroup tabs={[{ title: 'Vega Editor' }, { title: 'Extended Vega-Lite Spec' }]} tabChange={(index) => rightPaneActiveTabIndex = index}>
					<div class="editor-wrapper tab-content" class:hidden={rightPaneActiveTabIndex !== 0}>
						<div class="vega-annotation-editor" bind:this={vegaEditorContainer}></div>
						<button
							class="vega-editor-btn"
							onclick={() => {
								const vegaSpec = vegaEditor.getValue();
								const compressedVegaSpec = LZString.compressToEncodedURIComponent(vegaSpec);
								window.open(`https://vega.github.io/editor/#/url/vega/${compressedVegaSpec}`, '_blank');
							}}>Go to Vega Editor</button
						>
					</div>
					<div class="editor-wrapper tab-content" class:hidden={rightPaneActiveTabIndex !== 1}>
						<div class="extended-vega-lite-editor" bind:this={extendedVegaLiteEditorContainer}></div>
					</div>
				</TabGroup>
			</Pane>
		</Splitpanes>
	</Pane>
	<Pane>
		<Splitpanes horizontal={true}>
			<Pane minSize={15}>
				<TabGroup tabs={[{ title: 'Visualization' }]} tabChange={(index) => bottomPaneActiveTabIndex = index}>
					<div class="visualization-container tab-content" class:hidden={bottomPaneActiveTabIndex !== 0} bind:this={vlVisualizationContainer}></div>
				</TabGroup>
			</Pane>
			<Pane size={20}>
				<TabGroup tabs={[
					{ title: 'Log' },
					{ title: 'Data' },
					{ title: 'Occupancy Matrix' },
					{ title: 'Scene Graph' },
				]} tabChange={(index) => { bottomRightPaneActiveTabIndex = index }}>
					<div class="log-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 0} bind:this={vlLogContainer}><p>Logs</p></div>
					<div class="data-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 1}>
						<DataViewer view={currentView} />
					</div>
					<div class="occupancy-matrix-editor-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 2} bind:this={occupancyMatrixEditorContainer}></div>
					<div class="scene-graph-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 3}>
						{#if sceneGraphData}
							<SceneGraph sceneGraph={sceneGraphData} />
						{:else}
							<div class="empty-state">
								<p>Scene Graph will appear here after running the visualization</p>
							</div>
						{/if}
					</div>
				</TabGroup>
			</Pane>
		</Splitpanes>
	</Pane>
</Splitpanes>


<style>

	/* Add padding to the main content to account for fixed header */
	:global(body) {
		padding-top: 3rem;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.editor-container {
		height: 100%;
	}

	.editor-wrapper {
		position: relative;
		height: 100%;
	}

	.tab-content.hidden {
		display: none;
	}

	.vega-editor-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.vega-editor-btn:hover {
		background: #f8f8f8;
	}

	.vl-annotation-editor,
	.config-editor,
	.vega-annotation-editor,
	.extended-vega-lite-editor {
		height: 100%;
		width: 100%;
	}


	.visualization-container {
		height: 100%;
		width: 100%;
		padding: 1rem;
		overflow: auto;
	}

	:global(.vega-diffs) {
		background-color: rgba(0, 102, 204, 0.1);
	}
</style>
