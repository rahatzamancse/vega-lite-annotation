<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import SvelteMarkdown from 'svelte-markdown';

	const { autorunEnabled, runButtonClicked, onExampleLoad, generateShareableLink, isExampleModalOpen, toggleAutorun, onExampleModalChange } = $props<{
		autorunEnabled: boolean;
		runButtonClicked: () => void;
		onExampleLoad: (filename: string) => any;
		generateShareableLink: () => string;
		isExampleModalOpen: boolean;
		toggleAutorun: () => void;
		onExampleModalChange: (isOpen: boolean) => void;
	}>();

	let helpModalOpen = $state(false);
	let helpContent = $state('');
	let aboutModalOpen = $state(false);
	let aboutContent = $state('');
	let settingsOpen = $state(false);
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
				// { file: "00-base-piechart.json", name: "Piechart" },
				// { file: "00-base-areachart.json", name: "Areachart" },
			]
		},
		{
			name: "Text Annotations",
			examples: [
				{ file: "01-text-scatterplot.json", name: "Scatterplot with text annotations" },
				{ file: "01-text-barchart.json", name: "Barchart with text annotations" },
				{ file: "01-text-linechart.json", name: "Linechart with text annotations" },
			]
		},
		{
			name: 'Enclosure Annotations',
			examples: [
				{ file: "02-enclosure-scatterplot.json", name: "Scatterplot with enclosure annotations" },
				{ file: "02-enclosure-barchart.json", name: "Barchart with enclosure annotations" },
				{ file: "02-enclosure-linechart.json", name: "Linechart with enclosure annotations" },
			]
		},
		{
			name: 'Connector Annotations',
			examples: [
				{ file: "03-connector-scatterplot.json", name: "Scatterplot with connector annotations" },
				{ file: "03-connector-barchart.json", name: "Barchart with connector annotations" },
				{ file: "03-connector-linechart.json", name: "Linechart with connector annotations" },
			]
		},
		{
			name: 'Text Connector Ensemble Annotations',
			examples: [
				{ file: "04-text-connector-scatterplot.json", name: "Scatterplot with text connector annotations" },
				{ file: "04-text-connector-barchart.json", name: "Barchart with text connector annotations" },
				{ file: "04-text-connector-linechart.json", name: "Linechart with text connector annotations" },
			]
		},
		{
			name: 'Text Enclosure Ensemble Annotations',
			examples: [
				{ file: "05-text-enclosure-scatterplot.json", name: "Scatterplot with text enclosure annotations" },
				{ file: "05-text-enclosure-barchart.json", name: "Barchart with text enclosure annotations" },
				{ file: "05-text-enclosure-linechart.json", name: "Linechart with text enclosure annotations" },
			]
		},
		{
			name: 'Enclosure Connector Ensemble Annotations',
			examples: [
				{ file: "06-enclosure-connector-scatterplot.json", name: "Scatterplot with enclosure connector annotations" },
				{ file: "06-enclosure-connector-barchart.json", name: "Barchart with enclosure connector annotations" },
				{ file: "06-enclosure-connector-linechart.json", name: "Linechart with enclosure connector annotations" },
			]
		},
		{
			name: 'Text Enclosure Ensemble Connector Annotations',
			examples: [
				{ file: "07-text-enclosure-connector-scatterplot.json", name: "Scatterplot with text enclosure connector annotations" },
				{ file: "07-text-enclosure-connector-barchart.json", name: "Barchart with text enclosure connector annotations" },
				{ file: "07-text-enclosure-connector-linechart.json", name: "Linechart with text enclosure connector annotations" },
			]
		},
		{
			name: "Same Data, Different Visualizations",
			examples: [
				{ file: "diffs/horizontal-barchart.json", name: "Horizontal Barchart" },
				{ file: "diffs/vertical-barchart.json", name: "Vertical Barchart" },
				{ file: "diffs/scatterplot.json", name: "Scatterplot" },
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
		<button class="logo-container" onclick={() => window.location.href = '/'}>
			<span class="logo">📊</span>
			<span class="app-name">VL-Annotations</span>
		</button>
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
		<button class="examples-button" onclick={() => onExampleModalChange(true)}>Examples</button>
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
			class="github-button"
			onclick={() => window.open('https://github.com/rahatzamancse/vega-lite-annotation', '_blank')}
			>GitHub</button
		>
		<button
			class="help-button"
			onclick={async () => {
			helpContent = (await import('$lib/docs/help.md?raw')).default;
			helpModalOpen = true
		}}
			>Help</button
		>
		<button
			class="about-button"
			onclick={async () => {
			aboutContent = (await import('$lib/docs/about.md?raw')).default;
			aboutModalOpen = true
		}}
			>About</button
		>
		<!-- <button class="settings-button" onclick={() => (settingsOpen = !settingsOpen)}>Settings</button> -->
	</div>
</div>

<!-- Examples Modal -->
<Modal isOpen={isExampleModalOpen} onClose={() => onExampleModalChange(false)} title="Load Examples">
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
							onExampleModalChange(false);
						}}
						onkeydown={async (e) => {
							if (e.key === 'Enter') {
								await onExampleLoad(file);
								onExampleModalChange(false);
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

<!-- About Modal -->
<Modal isOpen={aboutModalOpen} onClose={() => (aboutModalOpen = false)} title="About VL-Annotations">
	<SvelteMarkdown source={aboutContent} />
</Modal>

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
		cursor: pointer;
		transition: background-color 0.2s ease;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
	}

	.logo-container:hover {
		background: #f8f8f8;
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
	.settings-button,
	.about-button,
	.github-button {
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
	.settings-button::before,
	.about-button::before,
	.github-button::before {
		font-size: 1.2rem;
	}

	.about-button::before {
		content: 'ℹ️';
	}

	.help-button::before {
		content: '❓';
	}

	.github-button::before {
		content: '';
		width: 1.2rem;
		height: 1.2rem;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z'/%3E%3C/svg%3E");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		display: inline-block;
	}

	.help-button:hover,
	.settings-button:hover,
	.about-button:hover,
	.github-button:hover {
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

	/* Markdown styling for modal content */
	:global(.modal-content) {
		line-height: 1.6;
		color: #333;
	}

	:global(.modal-content h1) {
		font-size: 1.8rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		color: #1a1a1a;
		border-bottom: 2px solid #e1e5e9;
		padding-bottom: 0.5rem;
	}

	:global(.modal-content h2) {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 2rem 0 1rem 0;
		color: #2c3e50;
		border-bottom: 1px solid #e1e5e9;
		padding-bottom: 0.3rem;
	}

	:global(.modal-content h3) {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 1.5rem 0 0.8rem 0;
		color: #34495e;
	}

	:global(.modal-content p) {
		margin: 0 0 1rem 0;
		text-align: justify;
		color: #444;
	}

	:global(.modal-content ul, .modal-content ol) {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	:global(.modal-content li) {
		margin: 0.3rem 0;
		color: #444;
	}

	:global(.modal-content strong) {
		font-weight: 600;
		color: #2c3e50;
	}

	:global(.modal-content em) {
		font-style: italic;
		color: #555;
	}

	:global(.modal-content a) {
		color: #3498db;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: all 0.2s ease;
	}

	:global(.modal-content a:hover) {
		color: #2980b9;
		border-bottom-color: #2980b9;
	}

	:global(.modal-content code) {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 3px;
		padding: 0.1rem 0.3rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		color: #e83e8c;
	}

	:global(.modal-content pre) {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 5px;
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.modal-content pre code) {
		background: none;
		border: none;
		padding: 0;
		color: #333;
	}

	:global(.modal-content blockquote) {
		border-left: 4px solid #3498db;
		background: #f8f9fa;
		margin: 1rem 0;
		padding: 0.8rem 1rem;
		font-style: italic;
		color: #555;
	}

	:global(.modal-content hr) {
		border: none;
		border-top: 1px solid #e1e5e9;
		margin: 2rem 0;
	}

	:global(.modal-content table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}

	:global(.modal-content th, .modal-content td) {
		border: 1px solid #e1e5e9;
		padding: 0.5rem 0.8rem;
		text-align: left;
	}

	:global(.modal-content th) {
		background: #f8f9fa;
		font-weight: 600;
		color: #2c3e50;
	}
</style>