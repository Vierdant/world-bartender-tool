<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { Profile, Order, MenuItem } from '$lib/types';
    import { tick } from '$lib/stores/tick';
    import { 
        currentOrders, 
        activeOrderId, 
        copyEmote, 
        getTotal, 
        formatElapsed,
        completeOrder,
        cancelOrder,
        updateOrderDetails
    } from '$lib/stores/orderStore';
    import { 
        panelOpen, 
        togglePanel,
        showHelperModal,
        selectedHelperOrder,
        showCancelConfirm,
        orderToCancel,
        showEditModal,
        editableOrder,
        showItemActionModal,
        itemActionItem,
        itemActionOrder
    } from '$lib/stores/uiStore';
    import RpHelperModal from '$lib/components/Modals/RPHelperModal.svelte';
    import CustomerEditorModal from '$lib/components/Modals/CustomerEditorModal.svelte';
    import ActionViewer from '$lib/components/Modals/ActionViewer.svelte';

    export let profile: Profile;

    onMount(() => {
        // Add window resize listener to auto-close panel on larger screens
        const handleResize = () => {
            if (window.innerWidth > 762 && $panelOpen) {
                panelOpen.set(false);
            }
        };

        window.addEventListener('resize', handleResize);
        
        // Also check on mount in case the window is already large
        handleResize();
    });

    onDestroy(() => {
        // Clean up the event listener
        const handleResize = () => {
            if (window.innerWidth > 762 && $panelOpen) {
                panelOpen.set(false);
            }
        };
        window.removeEventListener('resize', handleResize);
    });

    function getItem(itemId: string): MenuItem {
        return profile.menu.find((m) => m.id === itemId) || profile.menu[0];
    }

    function openEmoteModal(order: Order, item: MenuItem | undefined) {
        if (item) {
            itemActionItem.set(item);
            itemActionOrder.set(order);
            showItemActionModal.set(true);
        }
    }

    function handleCopyEmote(order: Order, itemId: string) {
        copyEmote(order, itemId, profile.menu, order.customerName);
        // Update orders to trigger reactivity
        currentOrders.update((orders) => {
            const index = orders.findIndex((o) => o.id === order.id);
            if (index !== -1) {
                orders[index] = { ...orders[index] };
            }
            return [...orders];
        });
    }
</script>

<div class="right-panel-wrapper">
    <button class="panel-toggle-button md:hidden" on:click={togglePanel}>
        {$panelOpen ? "Close" : "Orders"}
    </button>
    <!-- Right Panel -->
    <div
        class="right-panel order-display bg-(--field-color) p-6 rounded-lg shadow min-h-[600px] md:static"
        class:open={$panelOpen}
    >
        <!-- Order Tabs -->
        <div class="order-tabs">
            {#each $currentOrders as order, i (order.id)}
                <button
                    on:click={() => activeOrderId.set(order.id)}
                    class="cursor-pointer {$panelOpen ? 'open' : ''}"
                    class:active={$activeOrderId === order.id}
                    style="top: calc({i} * 60px);"
                >
                    {order.customerName || "Order"}
                </button>
            {/each}
        </div>

        <!-- Active Order Display -->
        {#if $currentOrders.length > 0}
            {#if $activeOrderId}
                {#each $currentOrders.filter((o) => o.id === $activeOrderId) as order}
                    <div>
                        <h2
                            class="text-xl font-bold text-(--text-color) mb-4"
                        >
                            {order.customerName || "Unnamed Order"}
                            {#if order.customerId !== undefined}
                                <span
                                    class="text-sm text-(--text-color-muted) ml-2"
                                    >(ID: {order.customerId})</span
                                >
                            {/if}
                            <button
                                class="ml-2 text-sm text-(--accept-color) cursor-pointer"
                                aria-label="edit-customer-data-order"
                                on:click={() => {
                                    editableOrder.set({ ...order });
                                    if ($panelOpen) {
                                        togglePanel();
                                    }
                                    showEditModal.set(true);
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                                    />
                                </svg>
                            </button>
                        </h2>

                        <div
                            class="flex items-center bg-(--accept-color-dark) rounded text-sm text-(--accept-color) mb-3 w-22 text-center pl-1 select-none"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {formatElapsed($tick, order.createdAt)}
                        </div>

                        <ul class="space-y-2 mb-4">
                            {#each order.items as item}
                                {#if getItem(item.id)}
                                    <li
                                        class="flex justify-between items-center text-(--text-color) border-t-1 border-(--border-color)"
                                    >
                                        <div>
                                            ▪ {getItem(item.id)?.name} × {item.qty}
                                        </div>
                                        <div class="flex gap-3">
                                            <button
                                                on:click={() =>
                                                    openEmoteModal(
                                                        order,
                                                        getItem(item.id),
                                                    )}
                                                class="text-sm text-(--text-color-muted) hover:underline cursor-pointer"
                                            >
                                                View List
                                            </button>
                                            <button
                                                on:click={() => handleCopyEmote(order, item.id)}
                                                class="text-sm text-blue-400 hover:underline cursor-pointer"
                                            >
                                                Copy RP
                                                {#if getItem(item.id).emotes.advanced}
                                                    [
                                                    {(order.items.find(
                                                        (i) =>
                                                            i.id ===
                                                            item.id,
                                                    )?._emoteStepIndex ??
                                                        0) +
                                                        1 <
                                                    getItem(item.id).emotes
                                                        .sections[
                                                        order.items.find(
                                                            (i) =>
                                                                i.id ===
                                                                item.id,
                                                        )
                                                            ?._emoteSectionIndex ??
                                                            0
                                                    ].steps.length
                                                        ? `${(order.items.find((i) => i.id === item.id)?._emoteStepIndex ?? 0) + 1}/${getItem(item.id).emotes.sections[order.items.find((i) => i.id === item.id)?._emoteSectionIndex ?? 0].steps.length}`
                                                        : `${(order.items.find((i) => i.id === item.id)?._emoteStepIndex ?? 0) + 1}/${getItem(item.id).emotes.sections[order.items.find((i) => i.id === item.id)?._emoteSectionIndex ?? 0].steps.length}`}
                                                    ]
                                                {/if}
                                            </button>
                                        </div>
                                    </li>
                                {/if}
                            {/each}
                        </ul>

                        <div
                            class="mt-6 text-right text-lg font-semibold text-(--text-color)"
                        >
                            Total: ${getTotal(order, profile.menu).toFixed(0)}
                        </div>
                        <div class="mt-2 text-right">
                            <button
                                on:click={() => {
                                    selectedHelperOrder.set(order);
                                    showHelperModal.set(true);
                                }}
                                class="ml-2 bg-(--accent-color) text-black px-4 py-2 rounded hover:bg-(--accent-color-hover) text-sm transition cursor-pointer"
                            >
                                RP Helpers
                            </button>
                            <button
                                on:click={() => {
                                    orderToCancel.set(order);
                                    showCancelConfirm.set(true);
                                }}
                                class="ml-2 bg-(--error-color) text-white px-4 py-2 rounded hover:bg-red-600 text-sm transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                on:click={() => completeOrder(order.id)}
                                class="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm transition cursor-pointer"
                            >
                                Complete
                            </button>
                        </div>
                    </div>
                {/each}
            {/if}
        {:else}
            <div class="text-gray-500 dark:text-gray-400 text-center mt-16">
                No active orders.
            </div>
        {/if}
    </div>
</div>

{#if $showHelperModal && $selectedHelperOrder}
    <RpHelperModal
        order={$selectedHelperOrder}
        {profile}
        on:close={() => {
            showHelperModal.set(false);
        }}
    />
{/if}

{#if $showEditModal && $editableOrder}
    <CustomerEditorModal
        order={$editableOrder}
        on:close={() => showEditModal.set(false)}
        on:save={() => {
            updateOrderDetails(
                $editableOrder.id,
                $editableOrder.customerName || null,
                $editableOrder.customerId || null,
            );
            showEditModal.set(false);
        }}
    />
{/if}

{#if $showItemActionModal && $itemActionItem && $itemActionOrder}
    <ActionViewer
        item={$itemActionItem}
        order={$itemActionOrder}
        on:close={() => {
            showItemActionModal.set(false);
        }}
    />
{/if}

<style>
    .right-panel-wrapper {
        flex: 1;
        position: relative;
        max-width: 600px;
    }

    .right-panel {
        transition: transform 0.3s ease-in-out;
    }

    .order-tabs {
        position: absolute;
        left: 0;
        top: 15%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        pointer-events: none;
    }

    .order-tabs button {
        position: absolute;
        right: 0;
        width: 60px;
        height: 40px;
        margin-top: -20px;
        border-radius: 5px 0px 0px 5px;
        background-color: var(--border-color);
        color: var(--text-color);
        font-size: 0.75rem;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
        padding-left: 8px;
        transition:
            width 0.3s ease,
            background-color 0.3s ease,
            color 0.3s ease;
        z-index: 5;
        pointer-events: auto;
    }

    .order-tabs button:hover {
        width: 80px;
        background-color: var(--field-color);
    }

    .order-tabs button.active {
        width: 100px;
        background-color: var(--accept-color);
        color: white;
    }

    .order-display {
        position: relative;
        z-index: 1;
    }

    @media (max-width: 762px) {
        .right-panel-wrapper {
            position: absolute;
            right: 0;
        }

        .right-panel {
            position: absolute;
            top: 0;
            right: 0;
            min-width: 400px;
            max-width: 600px;
            height: 100%;
            z-index: 50;
            transform: translateX(100%);
        }

        .right-panel.open {
            transform: translateX(0%);
        }

        .panel-toggle-button {
            position: fixed;
            right: 0;
            top: 80%;
            transform: translateY(-50%);
            z-index: 60;
            background: var(--accent-color);
            color: black;
            padding: 10px;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            cursor: pointer;
        }

        .order-tabs {
            top: 25%;
        }

        .order-tabs button {
            width: 0px;
        }

        .order-tabs button.open {
            width: 80px;
        }

        .order-tabs button.active {
            width: 0px;
        }

        .order-tabs button.active.open {
            width: 100px;
        }
    }
</style>
