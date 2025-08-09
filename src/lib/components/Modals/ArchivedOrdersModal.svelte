<script lang="ts">
    import { archivedOrders, restoreOrder } from "$lib/stores/orderStore";
    import { activeProfile } from "$lib/stores/profile";
    import { get } from "svelte/store";
    import { createEventDispatcher } from "svelte";
    import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";
    import { toasts } from "$lib/stores/toastStore";

    export let onClose: () => void;
    export let show = false;

    const dispatch = createEventDispatcher();

    $: totalArchivedSales = $archivedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((orderSum, item) => {
            const menuItem = get(activeProfile)?.menu.find((m) => m.id === item.id);
            return menuItem ? orderSum + menuItem.price * item.qty : orderSum;
        }, 0);
    }, 0);

    function handleClose() {
        onClose();
    }

    function handleRestore(orderId: string) {
        restoreOrder(orderId);
        toasts.addToast({ message: 'Order restored successfully', type: 'success' });
    }
</script>

<AnimatedModal {show} maxWidth="max-w-lg" on:close={handleClose}>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h2 class="text-xl font-bold text-(--text-color)">
                    Archived Orders
                </h2>
            </div>
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

        {#if $archivedOrders.length > 0}
            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {#each $archivedOrders as order (order.id)}
                    <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color) transition-colors">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <div class="font-semibold text-(--text-color)">
                                    {order.customerName || "Unnamed Order"}
                                </div>
                            </div>
                            <button
                                class="text-(--info-color) text-xs cursor-pointer px-2 py-1 rounded hover:bg-(--info-color) hover:text-white transition-colors"
                                on:click={() => handleRestore(order.id)}
                            >
                                Restore
                            </button>
                        </div>

                        <div class="space-y-2 mb-3">
                            {#each order.items as item}
                                <div class="flex justify-between items-center text-sm">
                                    <div class="flex items-center gap-2">
                                        <svg class="w-3 h-3 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span class="text-(--text-color-muted)">
                                            {get(activeProfile)?.menu.find((i) => i.id === item.id)?.name || "Unknown Item"} × {item.qty}
                                        </span>
                                    </div>
                                    <span class="text-xs text-(--text-color-muted)">
                                        ${(get(activeProfile)?.menu.find((i) => i.id === item.id)?.price || 0) * item.qty}
                                    </span>
                                </div>
                            {/each}
                        </div>

                        <!-- Order total -->
                        <div class="flex justify-between items-center pt-2 border-t border-(--border-color)">
                            <span class="text-sm font-medium text-(--text-color)">Order Total:</span>
                            <span class="text-sm font-bold text-(--text-color)">
                                ${order.items
                                    .reduce((sum, item) => {
                                        const menuItem = get(activeProfile)?.menu.find((i) => i.id === item.id);
                                        return menuItem ? sum + menuItem.price * item.qty : sum;
                                    }, 0)
                                    .toFixed(0)}
                            </span>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="text-center py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p class="text-(--text-color-muted) text-sm">
                    No archived orders yet.
                </p>
            </div>
        {/if}

        {#if $archivedOrders.length > 0}
            <div class="flex justify-between items-center pt-4 border-t border-(--border-color)">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <span class="text-base font-bold text-(--text-color)">
                        Total Sales: ${totalArchivedSales.toFixed(0)}
                    </span>
                </div>
                <button
                    on:click={handleClose}
                    class="bg-(--info-color) text-white px-6 py-2 rounded-lg hover:bg-(--info-color-dark) transition-colors font-medium cursor-pointer"
                >
                    Close
                </button>
            </div>
        {:else}
            <div class="flex justify-end pt-4 border-t border-(--border-color)">
                <button
                    on:click={handleClose}
                    class="bg-(--info-color) text-white px-6 py-2 rounded-lg hover:bg-(--info-color-dark) transition-colors font-medium cursor-pointer"
                >
                    Close
                </button>
            </div>
        {/if}
    </div>
</AnimatedModal>
