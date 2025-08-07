<!-- src/lib/components/RPHelperModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Order, MenuItem, Profile } from "$lib/types";
    import Toaster from "$lib/components/Toaster.svelte";
    import { toasts } from "$lib/stores/toastStore";

    export let order: Order;
    export let profile: Profile;

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
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-(--body-color) rounded-lg p-6 w-full max-w-xl shadow-lg">
        <h2 class="text-xl font-bold mb-4 text-(--text-color)">
            RP Helpers for {order.customerName || "the Customer"}
        </h2>

        <div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {#if profile.rpHelpers.length > 0}
                {#each profile.rpHelpers as section}
                    <div class="bg-(--field-color) p-4 rounded">
                        <h3 class="font-semibold mb-2 text-(--text-color)">
                            {section.name}
                        </h3>
                        <ul class="space-y-1">
                            {#each section.commands as command}
                                <li
                                    class="flex justify-between items-center border-t-1 border-(--border-color)"
                                >
                                    <span class="text-sm text-(--text-color)">
                                        {fillPlaceholders(command)}
                                    </span>
                                    <button
                                        class="text-(--accept-color) text-xs cursor-pointer"
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
                <div class="text-sm text-(--text-color) text-center">
                    No RP helpers configured.
                </div>
            {/if}
        </div>

        <div class="text-right mt-4">
            <button
                on:click={() => dispatch("close")}
                class="bg-(--accept-color) text-white px-4 py-2 rounded hover:bg-blue-500 text-sm cursor-pointer transition"
            >
                Close
            </button>
        </div>
    </div>
</div>
<Toaster/>