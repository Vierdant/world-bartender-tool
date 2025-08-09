<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";

    export let cancel_text: string = "Cancel";
    export let confirm_text: string = "Confirm";
    export let type: string = "info";
    export let header: string;
    export let text: string;
    export let show = false;

    const dispatch = createEventDispatcher();

    let bgColor: string;
    let textColor: string;
    let iconPath: string;
    let iconColor: string;

    $: {
        if (type === "info") {
            bgColor = "var(--info-color)";
            textColor = "white";
            iconPath = "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
            iconColor = "text-(--accept-color)";
        } else if (type === "main") {
            bgColor = "var(--accent-color)";
            textColor = "black";
            iconPath = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z";
            iconColor = "text-yellow-500";
        } else {
            bgColor = "var(--error-color)";
            textColor = "white";
            iconPath = "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
            iconColor = "text-red-500";
        }
    }

    function handleAbort() {
        dispatch("abort");
    }

    function handleConfirm() {
        dispatch("confirm");
    }
</script>

<AnimatedModal {show} maxWidth="max-w-sm" on:close={handleAbort}>
    <div class="space-y-4">
        <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
                <svg class="w-8 h-8 {iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath}></path>
                </svg>
            </div>
            <div class="flex-1">
                <h2 class="text-lg font-bold text-(--text-color)">
                    {header}
                </h2>
            </div>
            <button
                on:click={handleAbort}
                class="text-(--text-color-muted) hover:text-(--text-color) transition-colors cursor-pointer"
                aria-label="Close"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <div class="pl-11">
            <p class="text-sm text-(--text-color-muted) leading-relaxed">
                {text}
            </p>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-(--border-color)">
            <button
                class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition-colors rounded-lg font-medium cursor-pointer"
                on:click={handleAbort}
            >
                {cancel_text}
            </button>
            <button
                class="px-4 py-2 text-sm transition-colors rounded-lg font-medium hover:opacity-90 cursor-pointer"
                style="background-color: {bgColor}; color: {textColor}"
                on:click={handleConfirm}
            >
                {confirm_text}
            </button>
        </div>
    </div>
</AnimatedModal>