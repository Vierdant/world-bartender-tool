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
        showArchivedModal 
    } from '$lib/stores/uiStore';
    import ManageMenuModal from '$lib/components/Modals/ManageMenuModal.svelte';

    export let profile: Profile;

    let currentTheme = 'light';
    theme.subscribe((value) => (currentTheme = value));

    $: quantities = $itemQuantities;
    
    // Make the component reactive to activeProfile changes
    import { activeProfile } from '$lib/stores/profile';
    $: currentProfile = $activeProfile || profile;

    function handleCreateOrder() {
        createOrder(currentProfile.menu);
    }
</script>

<div
    class="w-full max-w-180 bg-(--body-color) p-4 rounded-lg space-y-6"
>
    <div class="flex justify-between items-center">
        <div class="flex gap-2">
            <button
                on:click={() => showDeleteConfirm.set(true)}
                class="bg-(--error-color) text-white px-3 py-3 rounded hover:bg-red-700 text-sm transition cursor-pointer"
                aria-label="delete button"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
                    viewBox="0 0 25 25"
                    ><path
                        d="M22.5 2h-20a.5.5 0 0 0 0 1H3l2.4 19.61A1.59 1.59 0 0 0 7 24h10.9a1.61 1.61 0 0 0 1.61-1.39L21.91 3h.59a.5.5 0 0 0 0-1zm-3.15 13.68-.67-.88.92-1.22zm-.74 6L16 18.29l2-2.66 1.09 1.43zm-12.28 0-.56-4.6 1.12-1.47 2 2.66zM4.22 4.44l1.89 2.49-1.36 1.86zM8.44 3l.28.37-2 2.72L4.38 3zm6.77 0-2.74 3.65L10 3.36l.23-.36zm5.35 0-2.21 2.91-1.9-2.84.05-.07zm-.72 8.65a.46.46 0 0 0-.07.07L18.05 14l-2.29-3 2.53-3.32L20 10.23zm-4.71-1.51-2-2.67 2.71-3.56 1.86 2.85zm-10 1.43-.16-1.33 1.78-2.48L9.19 11l-2.27 3-1.74-2.3zm2.23-4.65 2-2.72 2.49 3.27-2 2.67zm5.11 1.38 2 2.66-2 2.67-2-2.67zm-7.14 5.19 1 1.27-.69.92zm2.22 1.27 2.26-3 2 2.66-2.26 3zm4.92.52 2.3 3-2.26 3-2.3-3zm.63-.83 2-2.66 2.29 3-2 2.67zm7.1-5.74L18.93 6.8l1.79-2.36zM6.68 22.88l2.9-3.81 2.3 3-.69.91H7a.65.65 0 0 1-.32-.1zm5.83 0 .06.08h-.13zm1.32.08-.69-.91 2.26-3 2.86 3.76a.62.62 0 0 1-.36.12z"
                        style="fill:#ffffff"
                    /></svg
                >
            </button>

            <button
                on:click={() => showConfigureHelpersModal.set(true)}
                class="bg-(--body-color) text-(--accent-color-hover) border-(--accent-color-hover) dark:text-(--accent-color) dark:border-(--accent-color) border-x-2 border-y-2 px-3 py-1 rounded hover:bg-(--accent-color) hover:text-black text-sm transition cursor-pointer"
            >
                Configure Helpers
            </button>

            <button
                on:click={() => managingMenu.update((v) => !v)}
                class="bg-(--body-color) text-(--accept-color) border-(--accept-color) border-x-2 border-y-2 px-3 py-1 rounded hover:bg-(--accept-color) hover:text-black text-sm transition cursor-pointer"
            >
                {$managingMenu ? "Done" : "Manage Menu"}
            </button>
            <button
                on:click={() => showArchivedModal.set(true)}
                class="bg-(--body-color) text-(--text-color) border-(--text-color) hover:text-(--body-color) dark:text-(--secondary-color) dark:border-(--secondary-color) border-x-2 border-y-2 px-3 py-1 rounded hover:bg-(--text-color) dark:hover:bg-(--secondary-color) dark:hover:text-black text-sm transition cursor-pointer"
            >
                Archived Orders
            </button>
            {#if $managingMenu}
                <div
                    class="w-px h-9 bg-(--text-color) dark:bg-(--secondary-color)"
                ></div>
                <div
                    class="text-center flex items-center justify-center gap-4"
                >
                    <button
                        on:click={() => showAddModal.set(true)}
                        class="bg-(--body-color) text-(--accent-color-hover) border-(--accent-color-hover) dark:text-(--accent-color) dark:border-(--accent-color) border-x-2 border-y-2 px-3 py-1 rounded hover:bg-(--accent-color) hover:text-black text-sm transition cursor-pointer"
                    >
                        + New Item
                    </button>

                    <!-- Vertical Divider -->

                    <button
                        on:click={() => addNewSection()}
                        class="bg-(--body-color) text-(--accept-color) border-(--accept-color) border-x-2 border-y-2 px-3 py-1 rounded hover:bg-(--accept-color) hover:text-black text-sm transition cursor-pointer"
                    >
                        + New Section
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <div class="flex gap-2">
        <input
            placeholder="Customer name (optional)"
            bind:value={$newCustomerName}
            class="w-full px-3 py-2 rounded border border-(--border-color) bg-(--field-color) text-sm text-(--text-color-muted) dark:text-(--text-color)"
        />
        <input
            placeholder="ID (optional)"
            type="number"
            class="w-28 px-3 py-2 rounded border border-(--border-color) bg-(--field-color) text-sm text-(--text-color-muted) dark:text-(--text-color)"
            bind:value={$newCustomerId}
            min="0"
        />
        <button
            on:click={handleCreateOrder}
            class="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 text-[1.5rem] transition flex items-center justify-center cursor-pointer"
            aria-label="Create Order"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
        </button>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        role="list"
        class="space-y-3 max-h-[800px] overflow-y-auto pr-1 relative"
        on:mousemove={handleMouseMove}
                 on:mouseup={() => handleMouseUp(currentProfile)}
        on:mouseleave={cancelDrag}
    >
                 {#each currentProfile.menu as item, index (item.id)}
            <div class="flex items-center justify-between gap-2 group">
                {#if $managingMenu}
                    <div
                        role="listitem"
                        class="flex justify-between items-center w-full text-white p-5 {item.type ===
                        'section'
                            ? 'pt-5 text-[1.25rem]'
                            : 'border-x-2 border-y-2 rounded border-(--border-color) shadow'} {$draggedItemId ===
                        item.id
                            ? 'opacity-50'
                            : ''}"
                    >
                        {#if $insertPlaceholderAt === index}
                            <div
                                class="absolute left-0 right-0 w-5 rounded h-1 bg-blue-500 transition"
                            ></div>
                        {/if}
                        <!-- Left Side: Image + Name/Section -->
                        <div class="flex items-center w-2/3">
                            {#if item.type != "section"}
                                <div class="w-8 h-8 mr-5 mt-1">
                                    <img
                                        src={item.image ||
                                            (currentTheme === "dark"
                                                ? "https://i.imgur.com/BSioLsH.png"
                                                : "https://i.imgur.com/JaaJz6k.png")}
                                        alt="product"
                                        class="w-full h-full object-cover rounded"
                                    />
                                </div>
                            {/if}

                            <span
                                class="truncate text-left text-(--text-color) font-medium"
                            >
                                {item.name}
                                {#if item.type === "section"}
                                    <div
                                        class="mt-1 border-t border-gray-600 w-full"
                                    ></div>
                                {/if}
                            </span>
                        </div>

                        <!-- Right Side: Drag Handle, Edit & Delete Buttons -->
                        <div class="flex gap-2 items-center">
                            <!-- Drag Handle -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="cursor-grab px-2 py-1 hover:bg-(--border-color) rounded transition-colors {$isDragging && $draggedItemId === item.id ? 'bg-(--accent-color) text-black' : ''}"
                                on:mousedown={(e) =>
                                    startDrag(e, item.id, index)}
                                title="Drag to reorder"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="w-4 h-4 {$isDragging && $draggedItemId === item.id ? 'text-black' : 'text-(--text-color-muted)'}"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 10a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                </svg>
                            </div>
                            
                            <button
                                on:click={() => {
                                    itemBeingEdited.set(item);
                                    showAddModal.set(true);
                                }}
                                class="bg-(--accept-color-dark) text-(--accept-color) px-3 py-3 rounded hover:bg-blue-700 text-sm transition flex items-center justify-center cursor-pointer"
                                aria-label="Edit Item"
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

                            <button
                                class="bg-(--error-color-dark) text-(--error-color) px-3 py-3 rounded hover:bg-red-700 text-sm transition flex items-center justify-center cursor-pointer"
                                aria-label="Delete Item"
                                on:click={() => deleteMenuItem(item.id)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="w-3 h-3"
                                    viewBox="0 0 25 25"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M22.5 2h-20a.5.5 0 0 0 0 1H3l2.4 19.61A1.59 1.59 0 0 0 7 24h10.9a1.61 1.61 0 0 0 1.61-1.39L21.91 3h.59a.5.5 0 0 0 0-1zm-3.15 13.68-.67-.88.92-1.22zm-.74 6L16 18.29l2-2.66 1.09 1.43zm-12.28 0-.56-4.6 1.12-1.47 2 2.66zM4.22 4.44l1.89 2.49-1.36 1.86zM8.44 3l.28.37-2 2.72L4.38 3zm6.77 0-2.74 3.65L10 3.36l.23-.36zm5.35 0-2.21 2.91-1.9-2.84.05-.07zm-.72 8.65a.46.46 0 0 0-.07.07L18.05 14l-2.29-3 2.53-3.32L20 10.23zm-4.71-1.51-2-2.67 2.71-3.56 1.86 2.85zm-10 1.43-.16-1.33 1.78-2.48L9.19 11l-2.27 3-1.74-2.3zm2.23-4.65 2-2.72 2.49 3.27-2 2.67zm5.11 1.38 2 2.66-2 2.67-2-2.67zm-7.14 5.19 1 1.27-.69.92zm2.22 1.27 2.26-3 2 2.66-2.26 3zm4.92.52 2.3 3-2.26 3-2.3-3zm.63-.83 2-2.66 2.29 3-2 2.67zm7.1-5.74L18.93 6.8l1.79-2.36zM6.68 22.88l2.9-3.81 2.3 3-.69.91H7a.65.65 0 0 1-.32-.1zm5.83 0 .06.08h-.13zm1.32.08-.69-.91 2.26-3 2.86 3.76a.62.62 0 0 1-.36.12z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                {:else}
                    <div
                        class="flex justify-between items-center w-full text-white p-5 {item.type ===
                        'section'
                            ? 'pt-5 text-[1.25rem]'
                            : 'border-x-2 border-y-2 rounded border-(--border-color) shadow'}"
                    >
                        <!-- Item name -->
                        {#if item.type != "section"}
                            {#if currentTheme === "dark"}
                                <div class="w-8 h-8 mr-5 mt-1 select-none">
                                    <img
                                        src={item.image ||
                                            "https://i.imgur.com/BSioLsH.png"}
                                        alt="product"
                                    />
                                </div>
                            {:else}
                                <div class="w-8 h-8 mr-5 mt-1 select-none">
                                    <img
                                        src={item.image ||
                                            "https://i.imgur.com/JaaJz6k.png"}
                                        alt="product"
                                    />
                                </div>
                            {/if}
                        {/if}

                        <span
                            class="truncate text-left text-(--text-color) font-medium w-1/3"
                            >{item.name}
                            {#if item.type === "section"}
                                <div
                                    class="mt-1 border-t border-gray-600 w-full"
                                ></div>
                            {/if}
                        </span>

                        <!-- Quantity controls (column) -->
                        {#if item.type != "section"}
                            <div
                                class="flex flex-row items-center gap-1 w-1/3"
                            >
                                <button
                                    disabled={(quantities[item.id] || 0) <
                                        1}
                                    aria-label="remove item"
                                    class="w-8 h-8 px-2 py-1 bg-(--secondary-color) hover:bg-(--secondary-color-hover) text-[1rem] text-black rounded text-center flex items-center justify-center transition cursor-pointer"
                                    on:click={() =>
                                        updateQty(
                                            item.id,
                                            Math.max(
                                                0,
                                                quantities[item.id] - 1 ||
                                                    0,
                                            ),
                                        )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-10 h-10"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M19 13H5v-2h14v2z" />
                                    </svg>
                                </button>
                                <span
                                    class="min-w-[20px] text-center text-(--text-color) select-none"
                                >
                                    {quantities[item.id] || 0}
                                </span>
                                <button
                                    class="w-8 h-8 px-2 py-1 bg-(--accent-color) hover:bg-(--accent-color-hover) text-[1rem] text-black rounded text-center flex items-center justify-center transition cursor-pointer"
                                    aria-label="add item"
                                    on:click={() =>
                                        updateQty(
                                            item.id,
                                            (quantities[item.id] || 0) + 1,
                                        )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <!-- Price -->
                            <span
                                class="text-sm text-(--text-color-muted) w-1/3 text-right"
                            >
                                ${item.price.toFixed(0)}
                            </span>
                        {/if}
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
                         const idx = currentProfile.menu.findIndex(
                 (i) => i.id === updatedItem.id,
             );

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