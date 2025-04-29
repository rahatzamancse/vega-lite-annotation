<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import SvelteMarkdown from 'svelte-markdown';

	const { autorunEnabled, runButtonClicked, onExampleLoad, generateShareableLink, isExampleModalOpen, toggleAutorun } = $props<{
		autorunEnabled: boolean;
		runButtonClicked: () => void;
		onExampleLoad: (filename: string) => any;
		generateShareableLink: () => string;
		isExampleModalOpen: boolean;
		toggleAutorun: () => void;
	}>();

	let helpModalOpen = $state(false);
	let helpContent = $state('');
	let settingsOpen = $state(false);
	let examplesModalOpen = $state(false);
	let runDropdownOpen = $state(false);

	const inputExampleGroups = [
		{
			name: "Real Work Examples",
			examples: [
				{ file: "realexamples-hospitalizations.json", name: "COVID Hospitalizations" },
			]
		},
		{
			name: "Base Visualizations",
			examples: [
				{ file: "00-base-scatterplot.json", name: "Scatterplot" },
				{ file: "00-base-barchart.json", name: "Barchart" },
				{ file: "00-base-linechart.json", name: "Linechart" },
				{ file: "00-base-piechart.json", name: "Piechart" },
				{ file: "00-base-areachart.json", name: "Areachart" },
			]
		},
		{
			name: "Text Annotations",
			examples: [
				{ file: "01-text-scatterplot.json", name: "Scatterplot with text annotations" },
				{ file: "01-text-barchart.json", name: "Barchart with text annotations" },
			]
		},
		{
			name: 'Enclosure Annotations',
			examples: [
				{ file: "02-enclosure-scatterplot.json", name: "Scatterplot with enclosure annotations" },
				{ file: "02-enclosure-barchart.json", name: "Barchart with enclosure annotations" },
			]
		},
		{
			name: 'Connector Annotations',
			examples: [
				{ file: "03-connector-scatterplot.json", name: "Scatterplot with connector annotations" },
				{ file: "03-connector-barchart.json", name: "Barchart with connector annotations" },
			]
		},
		{
			name: 'Text Connector Ensemble Annotations',
			examples: [
				{ file: "04-text-connector-scatterplot.json", name: "Scatterplot with text connector annotations" },
				{ file: "04-text-connector-barchart.json", name: "Barchart with text connector annotations" },
			]
		},
		{
			name: 'Text Enclosure Ensemble Annotations',
			examples: [
				{ file: "05-text-enclosure-scatterplot.json", name: "Scatterplot with text enclosure annotations" },
				{ file: "05-text-enclosure-barchart.json", name: "Barchart with text enclosure annotations" },
			]
		},
		{
			name: 'Enclosure Connector Ensemble Annotations',
			examples: [
				{ file: "06-enclosure-connector-scatterplot.json", name: "Scatterplot with enclosure connector annotations" },
				{ file: "06-enclosure-connector-barchart.json", name: "Barchart with enclosure connector annotations" },
			]
		},
		{
			name: 'Text Enclosure Ensemble Connector Annotations',
			examples: [
				{ file: "07-text-enclosure-connector-scatterplot.json", name: "Scatterplot with text enclosure connector annotations" },
				{ file: "07-text-enclosure-connector-barchart.json", name: "Barchart with text enclosure connector annotations" },
			]
		},
		{
			name: 'Other Examples',
			examples: [
				{ file: "more-examples/barchart.json", name: "Barchart" },
				{ file: "more-examples/waterfall.json", name: "Waterfall" },
				{ file: "more-examples/scatterplot.json", name: "Scatterplot" },
				{ file: "more-examples/piechart.json", name: "Piechart" },
			]
		},
	]
    
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
							toggleAutorun();
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
		<button 
			class="share-button" 
			onclick={() => {
				const shareUrl = generateShareableLink();
				navigator.clipboard.writeText(shareUrl);
				alert('Shareable link copied to clipboard!');
			}}
		>Share</button>
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
		<!-- <button class="settings-button" onclick={() => (settingsOpen = !settingsOpen)}>Settings</button> -->
	</div>
</div>

<!-- Examples Modal -->
<Modal isOpen={examplesModalOpen} onClose={() => (examplesModalOpen = false)} title="Load Examples">
	<div class="examples-container">
		{#each inputExampleGroups as { name, examples }}
			<h2>{name}</h2>
			<div class="examples-grid">
				{#each examples as { file, name }}
					<div 
						class="example-item" 
						role="button" 
						tabindex="0" 
						onclick={async () => {
							await onExampleLoad(file);
							examplesModalOpen = false;
						}}
						onkeydown={async (e) => {
							if (e.key === 'Enter') {
								await onExampleLoad(file);
								examplesModalOpen = false;
							}
						}}>
							{console.log(`/sample_inputs/images/${file.replace(/\.json$/, '.png')}`)}
							<img src="/sample_inputs/images/{file.replace(/\.json$/, '.png')}" alt={name} />
							<span class="example-label">{name}</span>
					</div>
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

<!-- Help Modal -->
<Modal isOpen={helpModalOpen} onClose={() => (helpModalOpen = false)} title="Help Documentation">
	<SvelteMarkdown source={helpContent} />
</Modal>


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
	.share-button {
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

	.share-button::before {
		content: '🔗';
	}

	.share-button:hover {
		background: #f8f8f8;
	}


	.examples-container {
		padding: 1rem;
	}

	.examples-container h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		color: #333;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #ddd;
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.example-item {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: none;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.example-item:hover {
		background: #f8f8f8;
	}

	.example-item img {
		width: 140px;
		height: 100px;
		object-fit: contain;
		border-radius: 2px;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #eee;
	}

	.example-label {
		font-size: 0.9rem;
		color: #333;
		text-align: center;
		width: 100%;
	}
</style>