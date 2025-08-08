<!-- src/lib/components/RPHelperModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Order, MenuItem, Profile } from "$lib/types";
    import Toaster from "$lib/components/UI/Toaster.svelte";
    import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";
    import { toasts } from "$lib/stores/toastStore";

    export let order: Order;
    export let profile: Profile;
    export let show = false;

    const dispatch = createEventDispatcher();

    function getItem(id: string): MenuItem | undefined {
        return profile.menu.find((item) => item.id === id);
    }

    function formatItems(): string {
        return order.items
            .map((item) => {
                const menuItem = getItem(item.id);
                return menuItem ? `${menuItem.name}` : "";
            })
            .filter(Boolean)
            .join(" and ");
    }

    function fillPlaceholders(template: string): string {
        return template
            .replace("!items", formatItems())
            .replace("!name", order.customerName || "the customer")
            .replace("!id", order.customerId + "" || " ");
    }

    function handleClose() {
        dispatch("close");
    }
</script>

<AnimatedModal {show} on:close={handleClose}>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-(--text-color)">
                RP Helpers for {order.customerName || "the Customer"}
            </h2>
            <button
                on:click={handleClose}
                class="text-(--text-color-muted) hover:text-(--text-color) transition-colors cursor-pointer"
                aria-label="Close"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {#if profile.rpHelpers.length > 0}
                {#each profile.rpHelpers as section}
                    <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color)">
                        <h3 class="font-semibold mb-3 text-(--text-color) flex items-center gap-2">
                            <svg class="w-4 h-4 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            {section.name}
                        </h3>
                        <ul class="space-y-2">
                            {#each section.commands as command}
                                <li class="flex justify-between items-center p-2 rounded bg-(--body-color) transition-colors">
                                    <span class="text-sm text-(--text-color) flex-1">
                                        {fillPlaceholders(command)}
                                    </span>
                                    <button
                                        class="text-(--accept-color) text-xs cursor-pointer px-2 py-1 rounded hover:bg-(--accept-color) hover:text-white transition-colors"
                                        on:click={() => {
                                            navigator.clipboard.writeText(
                                                fillPlaceholders(command),
                                            );
                                            toasts.addToast({
                                                message: "RP command copied",
                                                type: "info",
                                            });
                                        }}
                                    >
                                        Copy
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            {:else}
                <div class="text-sm text-(--text-color-muted) text-center py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    No RP helpers configured.
                </div>
            {/if}
        </div>

        <div class="flex justify-end pt-4 border-t border-(--border-color)">
            <button
                on:click={handleClose}
                class="bg-(--accept-color) text-white px-6 py-2 rounded-lg hover:bg-(--accept-color-dark) transition-colors font-medium cursor-pointer"
            >
                Close
            </button>
        </div>
    </div>
</AnimatedModal>

<Toaster/>