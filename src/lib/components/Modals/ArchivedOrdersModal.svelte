<script lang="ts">
    import { archivedOrders, restoreOrder } from "$lib/stores/orderStore";
import { activeProfile } from "$lib/stores/profile";
import { get } from "svelte/store";
import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    $: totalArchivedSales = $archivedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((orderSum, item) => {
            const menuItem = get(activeProfile)?.menu.find((m) => m.id === item.id);
            return menuItem ? orderSum + menuItem.price * item.qty : orderSum;
        }, 0);
    }, 0);


    export let onClose: () => void;
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
>
    <div
        class="bg-(--body-color) rounded-lg p-6 w-full max-w-lg shadow-lg"
    >
        <h2 class="text-xl font-bold text-(--text-color) mb-4">
            Archived Orders
        </h2>

        {#if $archivedOrders.length > 0}
            <ul class="space-y-4 max-h-[400px] overflow-y-auto">
                {#each $archivedOrders as order (order.id)}
                    <li
                        class="bg-(--field-color) p-4 rounded shadow text-sm"
                    >
                        <div class="flex justify-between items-center mb-1">
                            <div
                                class="font-semibold text-(--text-color)"
                            >
                                {order.customerName || "Unnamed Order"}
                            </div>
                            <button
                                class="text-(--accept-color) text-xs cursor-pointer"
                                on:click={() => restoreOrder(order.id)}
                            >
                                Restore
                            </button>
                        </div>

                        <ul
                            class="pl-4 list-disc text-(--text-color-muted) mb-2"
                        >
                            {#each order.items as item}
                                <li>
                                    {get(activeProfile)?.menu.find(
                                        (i) => i.id === item.id,
                                    )?.name || "Unknown Item"} × {item.qty}
                                </li>
                            {/each}
                        </ul>

                        <!-- Order total -->
                        <div
                            class="text-right text-sm font-semibold text-(--text-color)"
                        >
                            Total: $
                            {order.items
                                .reduce((sum, item) => {
                                    const menuItem = get(
                                        activeProfile,
                                    )?.menu.find((i) => i.id === item.id);
                                    return menuItem
                                        ? sum + menuItem.price * item.qty
                                        : sum;
                                }, 0)
                                .toFixed(0)}
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-(--text-color) text-center">
                No archived orders yet.
            </p>
        {/if}
<div class="mt-6 text-right text-base font-bold text-(--text-color) border-t-1 pt-4">
    Total Sales: ${totalArchivedSales.toFixed(0)}
</div>

        <div class="mt-6 text-right">
            
            <button
                on:click={onClose}
                class="bg-(--accept-color) text-white px-4 py-2 rounded hover:bg-blue-500 text-sm cursor-pointer transition"
            >
                Close
            </button>
        </div>
    </div>
</div>
