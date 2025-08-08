<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    export let show = false;
    export let closeOnBackdrop = true;
    export let maxWidth = 'max-w-xl';
    export let padding = 'p-6';
    export let dataAttributes: Record<string, string> = {};

    const dispatch = createEventDispatcher();

    function handleBackdropClick(event: MouseEvent) {
        if (closeOnBackdrop && event.target === event.currentTarget) {
            dispatch('close');
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            dispatch('close');
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

{#if show}
    <div 
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        on:click={handleBackdropClick}
        transition:fade={{ duration: 200 }}
        {...Object.fromEntries(Object.entries(dataAttributes).map(([key, value]) => [`data-${key}`, value]))}
    >
        <div 
            class="bg-(--body-color) rounded-lg {padding} w-full {maxWidth} shadow-2xl border border-(--border-color)"
            transition:scale={{ duration: 300, easing: quintOut }}
        >
            <slot />
        </div>
    </div>
{/if}
