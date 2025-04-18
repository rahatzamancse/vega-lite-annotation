<script lang="ts">
    import { onMount } from 'svelte';
    
    interface Props {
        isOpen?: boolean;
        onClose: () => void;
        title?: string;
        children?: import('svelte').Snippet;
    }

    let {
        isOpen = false,
        onClose,
        title = '',
        children
    }: Props = $props();

    let backdropElement: HTMLDivElement = $state()!;

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === backdropElement) {
            onClose();
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

{#if isOpen}
    <div class="backdrop" bind:this={backdropElement} onclick={handleBackdropClick} role="presentation">
        <div class="modal">
            <div class="modal-header">
                <h2>{title}</h2>
                <button class="close-button" onclick={onClose}>×</button>
            </div>
            <div class="modal-content">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    }

    .modal {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: modalFadeIn 0.2s ease-out;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
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

    .modal-content {
        padding: 1.5rem;
    }

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style> 