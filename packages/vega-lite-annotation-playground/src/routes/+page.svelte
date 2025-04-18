<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import Modal from '$lib/components/Modal.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import TabGroup from '$lib/components/TabGroup.svelte';
	
	// Library import
	import * as VLAnnotation from 'vega-lite-annotation-library';

	// load npm diff
	import * as Diff from 'diff';

	import LZString from 'lz-string';

	import * as vega from 'vega';
	const preloadedJsons = Object.entries(
		import.meta.glob<VLAnnotation.VLATopLevelSpec>('$lib/sample_inputs/*.json', {
			eager: true,
			import: 'default'
		})
	).map(([path, json]) => ({
		path,
		json,
		name: json.name || path.split('/').pop()?.split('.')[0]!,
		image: path.split('/').pop()?.split('.')[0] + '.png',
		filename: path.split('/').pop()?.split('.')[0]!
	}))
	
	const inputExampleGroups = [
		{
			name: "Base Visualizations",
			examples: [
				"00-base-scatterplot",
				"00-base-barchart",
				"00-base-linechart",
				"00-base-piechart",
				"00-base-areachart",
			]
		},
		{
			name: "Text Annotations",
			examples: [
				"01-text-scatterplot",
				"01-text-barchart",
				"01-text-linechart",
				"01-text-piechart",
				"01-text-areachart"
			]
		},
		{
			name: 'Enclosure Annotations',
			examples: [
				"02-enclosure-scatterplot",
				"02-enclosure-barchart",
				"02-enclosure-linechart",
				"02-enclosure-piechart",
				"02-enclosure-areachart"
			]
		},
		{
			name: 'Connector Annotations',
			examples: [
				"03-connector-scatterplot",
				"03-connector-barchart",
				"03-connector-linechart",
				"03-connector-piechart",
				"03-connector-areachart"
			]
		},
		{
			name: 'Text Connector Ensemble Annotations',
			examples: [
				"04-text-connector-scatterplot",
				"04-text-connector-barchart",
				"04-text-connector-linechart",
				"04-text-connector-piechart",
				"04-text-connector-areachart"
			]
		},
		{
			name: 'Text Enclosure Ensemble Annotations',
			examples: [
				"05-text-enclosure-scatterplot",
				"05-text-enclosure-barchart",
				"05-text-enclosure-linechart",
				"05-text-enclosure-piechart",
				"05-text-enclosure-areachart"
			]
		},
		{
			name: 'Enclosure Connector Ensemble Annotations',
			examples: [
				"06-enclosure-connector-scatterplot",
				"06-enclosure-connector-barchart",
				"06-enclosure-connector-linechart",
				"06-enclosure-connector-piechart",
				"06-enclosure-connector-areachart"
			]
		},
		{
			name: 'Text Enclosure Ensemble Connector Annotations',
			examples: [
				"07-text-enclosure-connector-scatterplot",
				"07-text-enclosure-connector-barchart",
				"07-text-enclosure-connector-linechart",
				"07-text-enclosure-connector-piechart",
				"07-text-enclosure-connector-areachart"
			]
		},
	]


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

	let decorationCollection: Monaco.editor.IEditorDecorationsCollection;

	let monaco: typeof Monaco;

	let vlVisualizationContainer: HTMLElement = $state()!;
	let vlLogContainer: HTMLElement = $state()!;
	let vegaDataContainer: HTMLElement = $state()!;

	let vegaData: any;
	let dataNames: string[] = [];
	let selectedDataName: string | null = null;
	let selectedData: any[] = [];

	let helpModalOpen = $state(false);
	let helpContent = $state('');
	let settingsOpen = $state(false);
	let examplesModalOpen = $state(false);
	let runDropdownOpen = $state(false);
	let autorunEnabled = $state(true);

	let leftPaneActiveTabIndex = $state(0);
	let rightPaneActiveTabIndex = $state(0);
	let bottomPaneActiveTabIndex = $state(0);
	let bottomRightPaneActiveTabIndex = $state(0);
	
	onMount(async () => {
		// (onMount() will only be executed in the browser, which is what we want)
		monaco = (await import('$lib/monaco')).default;
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			allowComments: false,
			schemas: [],
			enableSchemaRequest: true
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

		// Load the first example
		onLoadJson(preloadedJsons[0]);
		vegaSpec = await VLAnnotation.vlaToV(JSON.parse(vlAnnotationEditor.getValue()));
		renderVega(vegaSpec, vlVisualizationContainer);
	});

	$effect(() => {
		if (vegaEditor) {
			vegaEditor.setValue(vegaSpecString);
		}
		if (extendedVegaLiteEditor) {
			extendedVegaLiteEditor.setValue(vlnaSpecString);
		}
	});

	const renderVega = (vegaSpec: any, container: HTMLElement) => {
		const runtime = vega.parse(vegaSpec);
		const view = new vega.View(runtime)
			.renderer('svg') // or 'canvas'
			.initialize(container)
			.run();

		vegaData = view.getState({ data: vega.truthy });

		// Populate data names for dropdown
		dataNames = Object.keys(vegaData.data);
		selectedDataName = dataNames.length > 0 ? dataNames[0] : null;
		updateSelectedData();
	};

	const updateSelectedData = () => {
		if (selectedDataName) {
			selectedData = vegaData.data[selectedDataName];
		} else {
			selectedData = [];
		}
	};

	const displayError = (container: HTMLElement, error: any) => {
		container.textContent = `Error: ${error.message || error}`;
		container.style.display = 'block';
	};

	const clearError = (container: HTMLElement) => {
		container.textContent = '';
		container.style.display = 'none';
	};

	const runButtonClicked = async () => {
		const input = vlAnnotationEditor.getValue();
		

		try {
			const vlaSpec = JSON.parse(input) as VLAnnotation.VLATopLevelSpec;
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
			renderVega(vegaSpec, vlVisualizationContainer);
			clearError(vlLogContainer);
		} catch (error) {
			displayError(vlLogContainer, error);
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

	const onLoadJson = (json: { path: string, json: VLAnnotation.VLATopLevelSpec, name: string, image: string, filename: string }) => {
		const data = json.json;
		vlAnnotationEditor.setValue(JSON.stringify(data, null, 2));
	};

	const removeAnnotations = (vlaSpec: any) => {
		// TODO: Implement this
		return vlaSpec;
	};
</script>

<!-- Header -->
<div class="header">
	<div class="header-left">
		<div class="logo-container">
			<span class="logo">📊</span>
			<span class="app-name">VL-Annotations</span>
		</div>
		<div class="run-button-container">
			<button class="run-button" onclick={runButtonClicked}>
				<div class="run-button-content">
					<span class="run-text">Run</span>
					<span class="run-mode">{autorunEnabled ? 'Auto' : 'Manual'}</span>
				</div>
			</button>
			<button class="dropdown-icon" onclick={(e) => {
				e.stopPropagation();
				runDropdownOpen = !runDropdownOpen;
			}}>▼</button>
			{#if runDropdownOpen}
				<div 
					class="run-dropdown" 
					onclick={(e) => e.stopPropagation()} 
					aria-hidden={!runDropdownOpen}
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							runDropdownOpen = false;
						}
					}}>
					<button
						class="dropdown-item"
						onclick={() => {
							autorunEnabled = !autorunEnabled;
							runDropdownOpen = false;
						}}
						role="menuitem"
						tabindex="-1">
						{autorunEnabled ? 'Manual' : 'Auto'}
					</button>
				</div>
			{/if}
		</div>
		<button class="examples-button" onclick={() => (examplesModalOpen = true)}>Examples</button>
	</div>
	<div class="header-right">
		<button
			class="help-button"
			onclick={async () => {
			helpContent = (await import('$lib/docs/help.md?raw')).default;
			helpModalOpen = true
		}}
			>Help</button
		>
		<button class="settings-button" onclick={() => (settingsOpen = !settingsOpen)}>Settings</button>
	</div>
</div>

<!-- Help Modal -->
<Modal isOpen={helpModalOpen} onClose={() => (helpModalOpen = false)} title="Help Documentation">
	<SvelteMarkdown source={helpContent} />
</Modal>

<!-- Examples Modal -->
<Modal isOpen={examplesModalOpen} onClose={() => (examplesModalOpen = false)} title="Load Examples">
	<div class="examples-container">
		{#each inputExampleGroups as { name, examples }}
			<h2>{name}</h2>
			<div class="examples-grid">
				{#each examples as example}
					{@const json = preloadedJsons.find(json => json.filename === example)!}
					{#if json}
						<div 
							class="example-item" 
							role="button" 
							tabindex="0" 
							onclick={() => {
								onLoadJson(json);
								examplesModalOpen = false;
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									onLoadJson(json);
									examplesModalOpen = false;
								}
							}}>
								<img src="/sample_inputs/{json.image}" alt={json.name} />
								<span class="example-label">{json.name}</span>
						</div>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</Modal>

<!-- Settings Right Panel -->
<Settings
	isOpen={settingsOpen}
	onClose={() => (settingsOpen = false)}
	on:settingChange={({ detail }) => {
		const { setting, value } = detail;
		console.log('Setting changed:', setting, value);
		// TODO: Implement setting changes
	}}
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
			<Pane>
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
			<Pane>
				<TabGroup tabs={[{ title: 'Log' }, { title: 'Data' }]} tabChange={(index) => bottomRightPaneActiveTabIndex = index}>
					<div class="log-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 0} bind:this={vlLogContainer}><p>Logs</p></div>
					<div class="data-container tab-content" class:hidden={bottomRightPaneActiveTabIndex !== 1} bind:this={vegaDataContainer}><p>Data</p></div>
				</TabGroup>
			</Pane>
		</Splitpanes>
	</Pane>
</Splitpanes>


<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0;
		background-color: white;
		height: 3rem;
		width: 100%;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1000;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.header-left {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.logo-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 1rem;
		height: 100%;
	}

	.logo {
		font-size: 1.2rem;
	}

	.app-name {
		font-weight: 500;
		color: #333;
		font-size: 1rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		height: 100%;
	}

	.run-button-container {
		position: relative;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.run-button {
		padding: 0 0.5rem;
		border: none;
		border-radius: 0;
		background: white;
		cursor: pointer;
		height: 100%;
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		color: #333;
		transition: background-color 0.2s ease;
	}

	.run-button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.run-text {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.run-text::before {
		content: '▶';
	}

	.run-mode {
		font-size: 0.7rem;
		color: #666;
		font-weight: 500;
	}

	.dropdown-icon {
		padding: 0 0.25rem;
		border: none;
		border-radius: 0;
		background: white;
		cursor: pointer;
		height: 100%;
		display: flex;
		align-items: center;
		font-size: 0.7rem;
		color: #666;
		transition: background-color 0.2s ease;
	}

	.run-button:hover,
	.dropdown-icon:hover {
		background: #f8f8f8;
	}

	.run-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		min-width: 100px;
		padding: 0.25rem;
	}

	.dropdown-item {
		padding: 0.5rem 1rem;
		cursor: pointer;
		user-select: none;
		font-size: 0.9rem;
		color: #333;
		text-align: left;
		width: 100%;
		border: none;
		background: none;
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}

	.dropdown-item:hover {
		background: #f0f0f0;
	}

	.dropdown-item:focus {
		outline: 2px solid #0066cc;
		outline-offset: -2px;
	}

	.examples-button {
		padding: 0 1rem;
		border: none;
		border-radius: 0;
		background: white;
		cursor: pointer;
		height: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #333;
		transition: background-color 0.2s ease;
	}

	.examples-button::before {
		content: '📚';
	}

	.help-button,
	.settings-button {
		padding: 0 1rem;
		border: none;
		border-radius: 0;
		background: white;
		cursor: pointer;
		height: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #333;
		transition: background-color 0.2s ease;
	}

	.help-button::before,
	.settings-button::before {
		font-size: 1.2rem;
	}

	.help-button:hover,
	.settings-button:hover {
		background: #f8f8f8;
	}

	/* Add padding to the main content to account for fixed header */
	:global(body) {
		padding-top: 3rem;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.examples-container {
		padding: 1rem;
	}

	.examples-container h2 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		color: #333;
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.example-item {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.example-item:hover {
		background: #f8f8f8;
		border-color: #0066cc;
	}

	.example-item img {
		width: 100%;
		height: auto;
		border-radius: 2px;
	}

	.example-label {
		font-size: 0.9rem;
		color: #333;
		text-align: center;
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
