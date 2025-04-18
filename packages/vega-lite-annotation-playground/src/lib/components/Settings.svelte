<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    interface Props {
        isOpen?: boolean;
        onClose: () => void;
    }

    let { isOpen = false, onClose }: Props = $props();

    let renderer = $state('svg');
    let backgroundColor = $state('#ffffff');
    let logLevel = $state('Warn');
    let hoverMode = $state('Auto');
    let tooltipsEnabled = $state(true);
    let expressionInterpreterEnabled = $state(false);

    const dispatch = createEventDispatcher();

    function handleSettingChange(setting: string, value: any) {
        dispatch('settingChange', { setting, value });
    }
</script>

{#if isOpen}
    <div class="settings-sidebar" role="dialog" aria-label="Settings">
        <div class="settings-header">
            <h2>Settings</h2>
            <button class="close-button" onclick={onClose}>×</button>
        </div>
        <div class="settings-content">
            <div class="select-container">
                <span>Renderer:</span>
                <div class="radio-group">
                    <label>
                        <input 
                            type="radio" 
                            name="renderer" 
                            value="svg" 
                            bind:group={renderer}
                            onchange={() => handleSettingChange('renderer', renderer)}
                        >
                        SVG
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="renderer" 
                            value="canvas" 
                            bind:group={renderer}
                            onchange={() => handleSettingChange('renderer', renderer)}
                        >
                        Canvas
                    </label>
                </div>
            </div>
            <p class="settings-description">Set Vega renderer. Canvas creates pixel graphics. SVG creates vector graphics.</p>

            <div class="select-container">
                <span>Background Color:</span>
                <div>
                    <input 
                        type="color" 
                        bind:value={backgroundColor}
                        onchange={() => handleSettingChange('backgroundColor', backgroundColor)}
                    >
                </div>
            </div>
            <p class="settings-description">Background color of the visualization panel.</p>

            <div class="select-container">
                <span>Log Level:</span>
                <div class="dropdown-wrapper">
                    <select 
                        bind:value={logLevel}
                        onchange={() => handleSettingChange('logLevel', logLevel)}
                    >
                        <option value="Debug">Debug</option>
                        <option value="Info">Info</option>
                        <option value="Warn">Warn</option>
                        <option value="Error">Error</option>
                    </select>
                </div>
            </div>
            <p class="settings-description">Set log level for Vega.</p>

            <div class="select-container">
                <span>Hover:</span>
                <div class="dropdown-wrapper">
                    <select 
                        bind:value={hoverMode}
                        onchange={() => handleSettingChange('hoverMode', hoverMode)}
                    >
                        <option value="Auto">Auto</option>
                        <option value="Enable">Enable</option>
                        <option value="Disable">Disable</option>
                    </select>
                </div>
            </div>
            <p class="settings-description">Enable or disable hover event processing. In auto mode, Vega-Lite disables hover event processing.</p>

            <div class="checkbox-container">
                <label>
                    <input 
                        type="checkbox" 
                        bind:checked={tooltipsEnabled}
                        onchange={() => handleSettingChange('tooltips', tooltipsEnabled)}
                    >
                    Tooltips
                </label>
            </div>
            <p class="settings-description">Enable the default Vega Tooltip handler.</p>

            <div class="checkbox-container">
                <label>
                    <input 
                        type="checkbox" 
                        bind:checked={expressionInterpreterEnabled}
                        onchange={() => handleSettingChange('expressionInterpreter', expressionInterpreterEnabled)}
                    >
                    Expression Interpreter
                </label>
            </div>
            <p class="settings-description">Enables the Expression Interpreter, which is CSP compliant.</p>
        </div>
    </div>
{/if}

<style>
    .settings-sidebar {
        position: fixed;
        top: 3rem; /* Height of the header */
        right: 0;
        width: 300px;
        height: calc(100vh - 3rem); /* Subtract header height */
        background: white;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 999; /* Below header's z-index */
        display: flex;
        flex-direction: column;
        animation: slideIn 0.2s ease-out;
    }

    .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }

    .settings-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0.5rem;
        line-height: 1;
    }

    .close-button:hover {
        color: #333;
    }

    .settings-content {
        padding: 1.5rem;
        overflow-y: auto;
    }

    .select-container {
        margin-bottom: 1rem;
    }

    .select-container span {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 500;
    }

    .radio-group {
        display: flex;
        gap: 1rem;
    }

    .radio-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .dropdown-wrapper {
        width: 100%;
    }

    .dropdown-wrapper select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
    }

    .checkbox-container {
        margin-bottom: 1rem;
    }

    .checkbox-container label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .settings-description {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 1.5rem;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }
</style> 