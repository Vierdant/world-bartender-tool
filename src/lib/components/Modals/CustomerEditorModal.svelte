<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Order } from "$lib/types";
    import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";

    export let order: Order;
    export let show = false;

    const dispatch = createEventDispatcher();

    function handleClose() {
        dispatch('close');
    }

    function handleSave() {
        dispatch('save', order);
    }
</script>

<AnimatedModal {show} maxWidth="max-w-sm" on:close={handleClose}>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-(--text-color)">
                Edit Customer Details
            </h2>
            <button
                on:click={handleClose}
                class="text-(--text-color-muted) hover:text-(--text-color) transition-colors cursor-pointer"
                aria-label="Close"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <div class="space-y-4">
            <div>
                <label
                    for="edit-order-name"
                    class="text-(--text-color) block text-sm font-medium mb-2"
                >
                    Customer Name
                </label>
                <input
                    id="edit-order-name"
                    class="w-full px-3 py-2 bg-(--field-color) rounded-lg border border-(--border-color) text-(--text-color) text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent"
                    bind:value={order.customerName}
                    placeholder="Enter customer name"
                />
            </div>
            <div>
                <label
                    for="edit-order-id"
                    class="text-(--text-color) block text-sm font-medium mb-2"
                >
                    Customer ID
                </label>
                <input
                    id="edit-order-id"
                    class="w-full px-3 py-2 bg-(--field-color) rounded-lg border border-(--border-color) text-(--text-color) text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent"
                    type="number"
                    bind:value={order.customerId}
                    placeholder="Enter customer ID"
                />
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-(--border-color)">
            <button
                class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition-colors rounded-lg font-medium cursor-pointer"
                on:click={handleClose}
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 text-sm bg-(--accept-color) text-white hover:bg-(--accept-color-dark) transition-colors rounded-lg font-medium cursor-pointer"
                on:click={handleSave}
            >
                Save
            </button>
        </div>
    </div>
</AnimatedModal>
