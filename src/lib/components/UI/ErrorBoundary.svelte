<script lang="ts">
    import { onMount } from 'svelte';
    import { toasts } from '$lib/stores/toastStore';

    let hasError = false;
    let error: Error | null = null;

    onMount(() => {
        // Global error handler
        const handleError = (event: ErrorEvent) => {
            hasError = true;
            error = event.error;
            console.error('Error caught by boundary:', event.error);
            toasts.addToast({ 
                message: 'Something went wrong. Please try refreshing the page.', 
                type: 'error' 
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', (event) => {
            hasError = true;
            error = new Error(event.reason);
            console.error('Unhandled promise rejection:', event.reason);
            toasts.addToast({ 
                message: 'Something went wrong. Please try refreshing the page.', 
                type: 'error' 
            });
        });

        return () => {
            window.removeEventListener('error', handleError);
        };
    });
</script>

{#if hasError}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-(--body-color) p-6 rounded-lg shadow-lg max-w-md">
            <h2 class="text-xl font-bold text-(--text-color) mb-4">
                Something went wrong
            </h2>
            <p class="text-(--text-color-muted) mb-4">
                An error occurred while loading this component. Please try refreshing the page.
            </p>
            <button
                on:click={() => window.location.reload()}
                class="bg-(--accent-color) text-black px-4 py-2 rounded hover:bg-(--accent-color-hover) transition cursor-pointer"
            >
                Refresh Page
            </button>
        </div>
    </div>
{:else}
    <slot />
{/if}
