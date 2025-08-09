<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fly, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    export let type: 'helpers' | 'cancel' | 'complete' = 'helpers';
    export let disabled = false;
    export let loading = false;

    const dispatch = createEventDispatcher();

    const buttonConfig = {
        helpers: {
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
            text: 'Helpers',
            classes: 'bg-(--info-color) hover:bg-blue-500 text-white border-blue-600',
            iconClasses: 'text-blue-200'
        },
        cancel: {
            icon: 'M6 18L18 6M6 6l12 12',
            text: 'Cancel',
            classes: 'bg-(--error-color) hover:bg-red-600 text-white border-red-600',
            iconClasses: 'text-red-200'
        },
        complete: {
            icon: 'M5 13l4 4L19 7',
            text: 'Complete',
            classes: 'bg-(--accept-color) hover:bg-(--accept-color-dark) text-white border-(--accept-color-dark)',
            iconClasses: 'text-green-200'
        }
    };

    const config = buttonConfig[type];

    function handleClick(event: MouseEvent) {
        if (!disabled && !loading) {
            dispatch('click', event);
        }
    }
</script>

<button
    on:click={handleClick}
    disabled={disabled || loading}
    class="inline-flex items-center gap-2 px-3 py-2 max-h-10 rounded font-medium transition-all duration-200 cursor-pointer {config.classes} {disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} shadow-lg hover:shadow-xl"
    in:fly={{ y: 20, duration: 300, delay: 100 }}
    out:scale={{ duration: 200, easing: quintOut }}
>
    {#if loading}
        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    {:else}
        <svg class="w-4 h-4 {config.iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={config.icon}></path>
        </svg>
    {/if}
    <span>{config.text}</span>
</button>
