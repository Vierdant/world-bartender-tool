<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let order: Order;

    const dispatch = createEventDispatcher();
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-(--body-color) p-6 rounded shadow-md w-[300px]">
        <h2 class="text-lg font-bold mb-4 text-(--text-color)">
            Edit Customer Details
        </h2>
        <div class="mb-4">
            <label
                for="edit-order-name"
                class="text-(--text-color) block text-sm mb-1"
                >Customer Name</label
            >
            <input
                id="edit-order-name"
                class="w-full px-2 py-1 bg-(--field-color) rounded border border-(--border-color) text-(--text-color) text-sm"
                bind:value={order.customerName}
            />
        </div>
        <div class="mb-4">
            <label
                for="edit-order-id"
                class="text-(--text-color) block text-sm mb-1"
                >Customer Name</label
            >
            <input
                id="edit-order-id"
                class="w-full px-2 py-1 bg-(--field-color) rounded border border-(--border-color) text-(--text-color) text-sm"
                type="number"
                bind:value={order.customerId}
            />
        </div>
        <div class="flex justify-end gap-2">
            <button
                class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition rounded cursor-pointer"
                on:click={() => dispatch('close')}
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 transition rounded cursor-pointer"
                on:click={() => dispatch('save', order) }
            >
                Save
            </button>
        </div>
    </div>
</div>
