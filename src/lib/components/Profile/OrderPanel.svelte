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
    import OrderActionButton from '$lib/components/UI/OrderActionButton.svelte';
    import { toasts } from '$lib/stores/toastStore';

    export let profile: Profile;

    // Loading states for order actions
    const loadingStates = {
        helpers: false,
        cancel: false,
        complete: false
    };

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
        
        // Return cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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

    async function handleCopyEmote(order: Order, itemId: string) {
        await copyEmote(order, itemId, profile.menu, order.customerName);
        // Update orders to trigger reactivity
        currentOrders.update((orders) => {
            const index = orders.findIndex((o) => o.id === order.id);
            if (index !== -1) {
                orders[index] = { ...orders[index] };
            }
            return [...orders];
        });
    }

    // Helper function to determine if the next step is an animation command
    function getNextStepInfo(order: Order, itemId: string): { isAnimation: boolean; stepText: string; progress: string } {
        const item = getItem(itemId);
        const orderItem = order.items.find((i) => i.id === itemId);
        
        if (!item || !orderItem || !item.emotes.advanced) {
            return { isAnimation: false, stepText: '', progress: '' };
        }

        const emoteSections = item.emotes.sections;
        if (!emoteSections.length) {
            return { isAnimation: false, stepText: '', progress: '' };
        }

        // Default to first section if not tracked yet
        let sectionIndex = orderItem._emoteSectionIndex ?? 0;
        let stepIndex = orderItem._emoteStepIndex ?? 0;

        const section = emoteSections[sectionIndex];
        if (!section || !section.steps.length) {
            return { isAnimation: false, stepText: '', progress: '' };
        }

        const step = section.steps[stepIndex];
        const isAnimation = step.startsWith('/anim') || step.startsWith('/customanim');
        
        const progress = `${stepIndex + 1}/${section.steps.length}`;
        
        return { isAnimation, stepText: step, progress };
    }

    // Animated order action handlers
    async function handleRPHelpers(order: Order) {
        selectedHelperOrder.set(order);
        showHelperModal.set(true);
    }

    async function handleCancelOrder(order: Order) {
        loadingStates.cancel = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
            orderToCancel.set(order);
            showCancelConfirm.set(true);
        } catch (error) {
            toasts.addToast({ message: 'Failed to cancel order', type: 'error' });
        } finally {
            loadingStates.cancel = false;
        }
    }

    async function handleCompleteOrder(order: Order) {
        loadingStates.complete = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
            completeOrder(order.id);
            toasts.addToast({ message: 'Order completed successfully!', type: 'success' });
            
            // Add success animation to the order element
            const orderElement = document.querySelector(`[data-order-id="${order.id}"]`);
            if (orderElement) {
                orderElement.classList.add('order-complete');
                setTimeout(() => {
                    orderElement.classList.remove('order-complete');
                }, 800);
            }
        } catch (error) {
            toasts.addToast({ message: 'Failed to complete order', type: 'error' });
        } finally {
            loadingStates.complete = false;
        }
    }
</script>

<div class="right-panel-wrapper">
    <button class="panel-toggle-button md:hidden cursor-pointer" on:click={togglePanel}>
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
                    <div data-order-id={order.id}>
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
                                class="ml-2 text-sm text-(--info-color) cursor-pointer"
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
                            class="flex items-center bg-(--info-color-dark) rounded text-sm text-(--info-color) mb-3 w-22 text-center pl-1 select-none"
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
                                            {#if getItem(item.id).emotes.advanced}
                                                {@const stepInfo = getNextStepInfo(order, item.id)}
                                                <button
                                                    on:click={() => handleCopyEmote(order, item.id)}
                                                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer {stepInfo.isAnimation ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'}"
                                                >
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                                    </svg>
                                                    {stepInfo.isAnimation ? 'Copy Anim' : 'Copy RP'}
                                                    {#if stepInfo.progress}
                                                        <span class="text-xs opacity-75 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">
                                                            {stepInfo.progress}
                                                        </span>
                                                    {/if}
                                                </button>
                                            {:else}
                                                <button
                                                    on:click={() => handleCopyEmote(order, item.id)}
                                                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                >
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                                    </svg>
                                                    Copy RP
                                                </button>
                                            {/if}
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
                        <div class="mt-4 flex justify-end gap-3">
                            <OrderActionButton 
                                type="helpers" 
                                loading={loadingStates.helpers}
                                on:click={() => handleRPHelpers(order)}
                            />
                            <OrderActionButton 
                                type="cancel" 
                                loading={loadingStates.cancel}
                                on:click={() => handleCancelOrder(order)}
                            />
                            <OrderActionButton 
                                type="complete" 
                                loading={loadingStates.complete}
                                on:click={() => handleCompleteOrder(order)}
                            />
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

{#if $selectedHelperOrder}
    <RpHelperModal
        order={$selectedHelperOrder}
        {profile}
        show={$showHelperModal}
        on:close={() => {
            showHelperModal.set(false);
        }}
    />
{/if}

{#if $editableOrder}
    <CustomerEditorModal
        order={$editableOrder}
        show={$showEditModal}
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

{#if $itemActionItem && $itemActionOrder}
    <ActionViewer
        item={$itemActionItem}
        order={$itemActionOrder}
        show={$showItemActionModal}
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
        background-color: var(--info-color);
        color: white;
    }

    .order-display {
        position: relative;
        z-index: 1;
    }

    /* Order completion animation - utility class for dynamic use */
    :global(.order-complete) {
        animation: orderComplete 0.8s ease-out;
    }

    @keyframes orderComplete {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.8;
        }
        100% {
            transform: scale(0.95);
            opacity: 0;
        }
    }

    /* Order cancellation animation - utility class for dynamic use */
    :global(.order-cancel) {
        animation: orderCancel 0.6s ease-out;
    }

    @keyframes orderCancel {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        30% {
            transform: scale(1.02) rotate(-1deg);
        }
        100% {
            transform: scale(0.9) rotate(-2deg);
            opacity: 0;
        }
    }

    /* Success pulse animation - utility class for dynamic use */
    :global(.success-pulse) {
        animation: successPulse 0.6s ease-out;
    }

    @keyframes successPulse {
        0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
        }
    }

    /* Error shake animation - utility class for dynamic use */
    :global(.error-shake) {
        animation: errorShake 0.5s ease-in-out;
    }

    @keyframes errorShake {
        0%, 100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        75% {
            transform: translateX(5px);
        }
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
