<script lang="ts">
    import type { Profile, MenuItem } from '$lib/types';
    import { theme } from '$lib/stores/theme';
    import { 
        managingMenu, 
        itemBeingEdited, 
        draggedItemId, 
        draggedIndex, 
        insertPlaceholderAt, 
        isDragging,
        startDrag,
        handleMouseMove,
        handleMouseUp,
        cancelDrag,
        addNewSection,
        deleteMenuItem
    } from '$lib/stores/menuStore';
    import { 
        newCustomerName, 
        newCustomerId, 
        itemQuantities, 
        createOrder, 
        updateQty 
    } from '$lib/stores/orderStore';
    import { 
        showAddModal, 
        showDeleteConfirm, 
        showConfigureHelpersModal, 
        showArchivedModal,
        panelOpen
    } from '$lib/stores/uiStore';
    import ManageMenuModal from '$lib/components/Modals/ManageMenuModal.svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    export let profile: Profile;

    let currentTheme = 'light';
    theme.subscribe((value) => (currentTheme = value));

    $: quantities = $itemQuantities;
    
    // Make the component reactive to activeProfile changes
    import { activeProfile } from '$lib/stores/profile';
    $: currentProfile = $activeProfile || profile;

    async function handleCreateOrder() {
        await createOrder(currentProfile.menu);
    }

    // Animation states
    let isCreatingOrder = false;
    let hoveredItemId: string | null = null;
</script>

<div
    class="w-full max-w-180 bg-(--body-color) p-6 rounded-xl space-y-6 {$panelOpen ? 'hidden' : ''}"
>
    <!-- Header Controls -->
    <div class="flex flex-wrap gap-3 items-center justify-between" in:fly={{ y: -20, duration: 300, easing: quintOut }}>
        <div class="flex flex-wrap gap-2">
            <!-- Delete Profile Button -->
            <button
                on:click={() => showDeleteConfirm.set(true)}
                class="group bg-(--error-color) hover:bg-(--error-color-dark) text-white px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate"
                aria-label="Delete Profile"
            >
                <svg class="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span class="text-sm font-medium">Delete</span>
            </button>

            <!-- Configure Helpers Button -->
            <button
                on:click={() => showConfigureHelpersModal.set(true)}
                class="group bg-(--accent-color) hover:bg-(--accent-color-hover) text-white px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate"
            >
                <svg class="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <span class="text-sm font-medium">Set Helpers</span>
            </button>

            <!-- Manage Menu Button -->
            <button
                on:click={() => managingMenu.update((v) => !v)}
                class="group bg-(--accept-color) hover:bg-(--accept-color-dark) text-white px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate"
            >
                <svg class="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
                <span class="text-sm font-medium">{$managingMenu ? "Close Manager" : "Manage Menu"}</span>
            </button>

            <!-- Archived Orders Button -->
            <button
                on:click={() => showArchivedModal.set(true)}
                class="group bg-(--field-color) hover:bg-(--border-color) text-(--text-color) px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate"
            >
                <svg class="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <span class="text-sm font-medium">Archived</span>
            </button>
        </div>

        <!-- Management Controls -->
        {#if $managingMenu}
            <div class="flex gap-2" in:fly={{ x: 20, duration: 300, easing: quintOut }}>
                <button
                    on:click={() => showAddModal.set(true)}
                    class="group bg-(--body-color) hover:bg-(--accept-color) border-2 border-(--accept-color) text-(--accept-color) px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate hover:text-white"
                >
                    <svg class="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span class="text-sm font-medium">New Item</span>
                </button>

                <button
                    on:click={() => addNewSection()}
                    class="group bg-(--body-color) hover:bg-(--accept-color) border-2 border-(--accept-color) text-(--accept-color) px-4 py-2.5 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl btn-animate hover:text-white"
                >
                    <svg class="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <span class="text-sm font-medium">New Section</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- Order Creation Section -->
    <div class="bg-(--body-color) p-4" in:fly={{ y: 20, duration: 300, easing: quintOut }}>
        <div class="flex flex-col sm:flex-row gap-3">
            <input
                placeholder="Customer name (optional)"
                bind:value={$newCustomerName}
                class="flex-1 px-4 py-3 rounded border border-(--border-color) bg-(--field-color) border-(--border-color) text-(--text-color) placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200 input-focus form-input"
            />
            <input
                placeholder="ID (optional)"
                type="number"
                class="w-35 px-4 py-3 rounded border border-(--border-color) bg-(--field-color) border-(--border-color) text-(--text-color) placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200 input-focus form-input"
                bind:value={$newCustomerId}
                min="0"
            />
            <button
                on:click={async () => {
                    isCreatingOrder = true;
                    await handleCreateOrder();
                    setTimeout(() => isCreatingOrder = false, 500);
                }}
                class="group bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded transition-all duration-200 transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed btn-animate"
                disabled={isCreatingOrder}
                aria-label="Create Order"
            >
                {#if isCreatingOrder}
                    <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span class="text-sm font-medium">Creating...</span>
                {:else}
                    <svg class="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span class="text-sm font-medium">Create Order</span>
                {/if}
            </button>
        </div>
    </div>

    <!-- Menu Items List -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        role="list"
        aria-label="Menu items list"
        class="space-y-3 max-h-[600px] overflow-y-auto pr-2 relative custom-scrollbar"
        on:mousemove={handleMouseMove}
        on:mouseup={() => handleMouseUp(currentProfile)}
        on:mouseleave={cancelDrag}
    >
        {#each currentProfile.menu as item, index (item.id)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
                class="group relative transition-all duration-200"
                on:mouseenter={() => hoveredItemId = item.id}
                on:mouseleave={() => hoveredItemId = null}
                in:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
                out:fly={{ y: -20, duration: 200, easing: quintOut }}
            >
                {#if $managingMenu}
                    <!-- Management Mode -->
                    <div
                        role="listitem"
                                                 class="relative {item.type === 'section' ? 'bg-(--body-color)' : 'bg-(--field-color) rounded-xl border border-(--border-color)'} shadow-sm transition-all duration-200 {$draggedItemId === item.id ? 'drag-active' : ''}"
                    >
                        {#if $insertPlaceholderAt === index}
                            <div class="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full drag-placeholder"></div>
                        {/if}
                        
                        <div class="p-4">
                            <div class="flex items-center justify-between">
                                <!-- Left Side: Image + Name -->
                                <div class="flex items-center flex-1 min-w-0">
                                    {#if item.type != "section"}
                                        <div class="w-12 h-12 mr-4 flex-shrink-0">
                                            <img
                                                src={item.image || (currentTheme === "dark" ? "https://i.imgur.com/BSioLsH.png" : "https://i.imgur.com/JaaJz6k.png")}
                                                alt="product"
                                                class="w-full h-full object-cover rounded shadow-sm"
                                            />
                                        </div>
                                    {/if}

                                    <div class="flex-1 min-w-0">
                                        <span class="block text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </span>
                                        {#if item.type === "section"}
                                            <div class="mt-2 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Right Side: Action Buttons -->
                                <div class="flex items-center gap-2 ml-4">
                                    <!-- Drag Handle -->
                                    <div
                                        class="p-2 rounded hover:bg-(--secondary-color) transition-colors cursor-grab active:cursor-grabbing {$isDragging && $draggedItemId === item.id ? 'bg-(--accent-color)' : ''}"
                                        on:mousedown={(e) => startDrag(e, item.id, index)}
                                        title="Drag to reorder"
                                    >
                                        <svg class="w-4 h-4 text-(--text-color-muted) {$isDragging && $draggedItemId === item.id ? 'text-(--accent-color)' : ''}" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 10a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </div>
                                    
                                    <!-- Edit Button -->
                                    <button
                                        on:click={() => {
                                            itemBeingEdited.set(item);
                                            showAddModal.set(true);
                                        }}
                                        class="group p-2 rounded bg-(--accept-color)/10 hover:bg-(--accept-color)/20 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                                        aria-label="Edit Item"
                                    >
                                        <svg class="w-4 h-4 text-(--accept-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                    </button>

                                    <!-- Delete Button -->
                                    <button
                                        class="group p-2 rounded bg-(--error-color)/10 hover:bg-(--error-color)/20 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                                        aria-label="Delete Item"
                                        on:click={() => deleteMenuItem(item.id)}
                                    >
                                        <svg class="w-4 h-4 text-(--error-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <!-- Order Mode -->
                    <div
                        class="relative {item.type === 'section' ? 'bg-(--body-color)' : 'bg-(--field-color) rounded-xl border border-(--border-color)'} shadow-sm transition-all duration-200"
                    >
                        <div class="p-4">
                            <div class="flex items-center justify-between">
                                <!-- Left Side: Image + Name -->
                                <div class="flex items-center flex-1 min-w-0">
                                    {#if item.type != "section"}
                                        <div class="w-12 h-12 mr-4 flex-shrink-0">
                                            <img
                                                src={item.image || (currentTheme === "dark" ? "https://i.imgur.com/BSioLsH.png" : "https://i.imgur.com/JaaJz6k.png")}
                                                alt="product"
                                                class="w-full h-full object-cover rounded shadow-sm"
                                            />
                                        </div>
                                    {/if}

                                    <div class="flex-1 min-w-0">
                                        <span class="block text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </span>
                                        {#if item.type === "section"}
                                            <div class="mt-2 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Right Side: Quantity Controls + Price -->
                                {#if item.type != "section"}
                                    <div class="flex items-center gap-4 ml-4">
                                        <!-- Quantity Controls -->
                                        <div class="flex items-center gap-2 bg-(--body-color) rounded p-1">
                                            <button
                                                disabled={(quantities[item.id] || 0) < 1}
                                                aria-label="Remove item"
                                                class="w-8 h-8 flex items-center justify-center bg-(--field-color) hover:bg-(--secondary-color-hover) text-(--text-color-muted) rounded-md transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                on:click={() => updateQty(item.id, Math.max(0, quantities[item.id] - 1 || 0))}
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                                </svg>
                                            </button>
                                            
                                            <span class="min-w-[2rem] text-center text-lg font-semibold text-(--text-color) select-none">
                                                {quantities[item.id] || 0}
                                            </span>
                                            
                                            <button
                                                class="w-8 h-8 flex items-center justify-center bg-(--accent-color) hover:bg-(--accent-color-dark) text-black rounded-md transition-all duration-200 transform hover:scale-110 cursor-pointer"
                                                aria-label="Add item"
                                                on:click={() => updateQty(item.id, (quantities[item.id] || 0) + 1)}
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                </svg>
                                            </button>
                                        </div>

                                                                                 <!-- Price -->
                                         <div class="text-right">
                                             <span class="text-lg font-bold text-(--text-color)">
                                                 ${item.price.toFixed(0)}
                                             </span>
                                         </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>

{#if $showAddModal}
    <ManageMenuModal
        itemToEdit={$itemBeingEdited}
        on:close={() => {
            itemBeingEdited.set(null);
            showAddModal.set(false);
        }}
        on:save={(e) => {
            const updatedItem = e.detail;
            const idx = currentProfile.menu.findIndex((i) => i.id === updatedItem.id);

            if (idx >= 0) {
                currentProfile.menu[idx] = updatedItem;
            } else {
                currentProfile.menu.push(updatedItem);
            }
            // Update profile through store
            import('$lib/stores/menuStore').then(({ updateProfile }) => {
                updateProfile();
            });
        }}
    />
{/if}

<style>
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgb(156 163 175) transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgb(156 163 175);
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgb(107 114 128);
    }
</style>