<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let cancel_text: string = "Cancel";
    export let confirm_text: string = "Confirm";
    export let type: string = "info";
    export let header: string;
    export let text: string;

    const dispatch = createEventDispatcher();

    let bgColor: string;
    let textColor: string;

    $: {
        if (type === "info") {
            bgColor = "var(--accept-color)";
            textColor = "white";
        } else if (type === "main") {
            bgColor = "var(--accent-color)";
            textColor = "black";
        } else {
            bgColor = "var(--error-color)";
            textColor = "white";
        }
    }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-(--body-color) p-6 rounded shadow-md w-[300px]">
        <h2 class="text-lg font-bold mb-4" style="color: {bgColor}">
            {header}
        </h2>
        <p class="mb-4 text-sm text-(--text-color)">
            {text}
        </p>
        <div class="flex justify-end gap-2">
            <button
                class="px-3 py-1 text-sm bg-(--secondary-color) text-black hover:opacity-70 transition rounded cursor-pointer"
                on:click={() => dispatch("abort")}
            >
                {cancel_text}
            </button>
            <!-- svelte-ignore a11y_mouse_events_have_key_events -->
            <button
                class="px-3 py-1 text-sm transition rounded cursor-pointer"
                style="background-color: {bgColor}; color: {textColor}"
                on:click={() => dispatch("confirm")}
                on:mouseover={(e) => e.currentTarget.style.opacity = "0.7"}
                on:mouseout={(e) => e.currentTarget.style.opacity = "1"}
            >
                {confirm_text}
            </button>
        </div>
    </div>
</div>