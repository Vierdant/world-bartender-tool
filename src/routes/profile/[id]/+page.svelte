<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { writable, get } from "svelte/store";
    import {
        activeProfile,
        currentOrders,
        profiles,
    } from "$lib/stores/profile";
    import { tick } from "$lib/stores/tick";
    import type { Profile, Order, MenuItem } from "$lib/types";
    import { nanoid } from "nanoid";
    import { writeText } from "@tauri-apps/plugin-clipboard-manager";
    import ManageMenuModal from "$lib/components/Modals/ManageMenuModal.svelte";
    import { archivedOrders } from "$lib/stores/profile";
    import { theme } from "$lib/stores/theme";
    import ArchivedOrdersModal from "$lib/components/Modals/ArchivedOrdersModal.svelte";
    import RpHelperModal from "$lib/components/Modals/RPHelperModal.svelte";
    import ConfigureHelpersModal from "$lib/components/Modals/ConfigureHelpersModal.svelte";
    import Toaster from "$lib/components/UI/Toaster.svelte";
    import ActionViewer from "$lib/components/Modals/ActionViewer.svelte";
    import CustomerEditorModal from "$lib/components/Modals/CustomerEditorModal.svelte";
    import ConfirmationScreen from "$lib/components/UI/ConfirmationScreen.svelte";
    import { toasts } from "$lib/stores/toastStore";
    import { goto } from "$app/navigation";

    export let data;
    export let profile: Profile = data.profile;

    const newCustomerName = writable("");
    const newCustomerId = writable<number | null>(null);
    const itemQuantities = writable<Record<string, number>>({});
    const activeOrderId = writable<string | null>(null);
    const managingMenu = writable(false);
    const showAddModal = writable(false);
    const showArchivedModal = writable(false);
    const showHelperModal = writable(false);
    const selectedHelperOrder = writable<Order | null>(null);
    const showConfigureHelpersModal = writable(false); // for configuring
    const showReturnConfirm = writable(false);
    const showDeleteConfirm = writable(false);
    const showCancelConfirm = writable(false);
    const orderToCancel = writable<Order | null>(null);
    const showEditModal = writable(false);
    const editableOrder = writable<Order | null>(null);
    const panelOpen = writable(false);
    const showItemActionModal = writable(false);
    const itemActionItem = writable<MenuItem | null>(null);
    const itemActionOrder = writable<Order | null>(null);
    const lastUsedSectionIndex: Record<string, number> = {};

    let itemBeingEdited: MenuItem | null = null;
    let draggedItemId: string | null = null;
    let draggedIndex = -1;
    let insertPlaceholderAt: number | null = null;
    let isDragging = false;
    let showContextMenu = false;
    let showHelpModal = false;

    $: quantities = $itemQuantities;

    onMount(() => {
        activeProfile.set(profile);
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", function (event) {
            if (
                event.key === "F5" ||
                (event.ctrlKey && event.key === "r") ||
                (event.metaKey && event.key === "r")
            ) {
                event.preventDefault();
            }
        })
        document.addEventListener("contextmenu", function (event) {
            event.preventDefault();
        });
    });

    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside);
        document.addEventListener("keydown", function (event) {
            if (
                event.key === "F5" ||
                (event.ctrlKey && event.key === "r") ||
                (event.metaKey && event.key === "r")
            ) {
                event.preventDefault();
            }
        });
        document.addEventListener("contextmenu", function (event) {
            event.preventDefault();
        });
    });

    let currentTheme = "light";
    theme.subscribe((value) => (currentTheme = value));

    function toggleTheme() {
        theme.set(currentTheme === "light" ? "dark" : "light");
    }

    function toggleContextMenu() {
        showContextMenu = !showContextMenu;
    }

    function togglePanel() {
        panelOpen.update((v) => !v);
    }

    function toggleHelpModal() {
        showHelpModal = !showHelpModal;
    }

    function openEmoteModal(order: Order, item: MenuItem | undefined) {
        if (item) {
            itemActionItem.set(item);
            itemActionOrder.set(order);
            showItemActionModal.set(true);
        }
    }

    function handleClickOutside(event: MouseEvent) {
        const context = document.getElementById("context-menu-button");
        const help = document.getElementById("help-menu-button");
        if (
            !context?.contains(event.target as Node) &&
            !help?.contains(event.target as Node)
        ) {
            showContextMenu = false;
            showHelpModal = false;
        }
    }

    function getRandomSectionIndex(
        itemId: string,
        sectionCount: number,
    ): number {
        if (sectionCount <= 1) return 0;

        let newIndex: number;
        do {
            newIndex = Math.floor(Math.random() * sectionCount);
        } while (newIndex === lastUsedSectionIndex[itemId]);

        lastUsedSectionIndex[itemId] = newIndex;
        return newIndex;
    }

    function createOrder() {
        const name = get(newCustomerName).trim();
        const quantities = get(itemQuantities);
        const idValue = get(newCustomerId);

        const items = Object.entries(quantities)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => {
                const item = getItem(id);
                const isAdvanced = item?.emotes?.advanced ?? false;

                const sectionCount = item?.emotes?.sections?.length ?? 0;

                const randomSectionIndex = isAdvanced
                    ? getRandomSectionIndex(id, sectionCount)
                    : 0;

                return {
                    id,
                    qty,
                    ...(isAdvanced && {
                        _emoteSectionIndex: randomSectionIndex,
                        _emoteStepIndex: 0,
                    }),
                };
            });

        if (items.length === 0) return;

        const newOrder: Order = {
            id: nanoid(),
            customerName: name || undefined,
            customerId: idValue !== null ? idValue : undefined,
            items,
            createdAt: Date.now(),
        };

        currentOrders.update((orders) => {
            activeOrderId.set(newOrder.id);
            return [...orders, newOrder];
        });

        newCustomerName.set("");
        newCustomerId.set(null);
        itemQuantities.set({});
    }

    function updateQty(itemId: string, qty: number) {
        itemQuantities.update((quantities) => ({
            ...quantities,
            [itemId]: qty,
        }));
    }

    function getItem(itemId: string): MenuItem {
        return profile.menu.find((m) => m.id === itemId) || profile.menu[0];
    }

    function getTotal(order: Order): number {
        return order.items.reduce((sum, item) => {
            const menuItem = getItem(item.id);
            return menuItem ? sum + menuItem.price * item.qty : sum;
        }, 0);
    }

    function randomFrom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function interpolate(
        template: string,
        context: Record<string, string>,
    ): string {
        return template.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? "");
    }

    function copyEmote(order: Order, itemId: string, customerName?: string) {
        const item = getItem(itemId);
        if (!item) return;

        const orderItem = order.items.find((i) => i.id === itemId);
        if (!orderItem) return;

        const emoteSections = item.emotes.sections;
        let text = "";

        if (item.emotes.advanced) {
            // Default to first section if not tracked yet
            if (orderItem._emoteSectionIndex === undefined) {
                orderItem._emoteSectionIndex = 0;
                orderItem._emoteStepIndex = 0;
            }

            const section = emoteSections[orderItem._emoteSectionIndex];
            const step = section.steps[orderItem._emoteStepIndex ?? 0];

            text = interpolate(step, {
                name: customerName ?? "the customer",
            });

            // Advance the step index
            orderItem._emoteStepIndex! += 1;

            // If we reached end of steps in current section, cycle to a new one
            if (orderItem._emoteStepIndex! >= section.steps.length) {
                const nextSectionIndex =
                    (orderItem._emoteSectionIndex! + 1) % emoteSections.length;
                orderItem._emoteSectionIndex = nextSectionIndex;
                orderItem._emoteStepIndex = 0;
            }
        } else {
            // Not advanced: pick random step from first section
            const steps = item.emotes.sections[0]?.steps ?? [];
            const step = randomFrom(steps);
            text = interpolate(step, {
                name: customerName ?? "the customer",
            });
        }

        writeText(text);
        toasts.addToast({ message: "RP command copied", type: "info" });
    }

    function completeOrder(orderId: string) {
        currentOrders.update((orders) => {
            const index = orders.findIndex((o) => o.id === orderId);
            if (index === -1) return orders;

            const [completedOrder] = orders.splice(index, 1);
            archivedOrders.update((archived) => [...archived, completedOrder]);

            if (get(activeOrderId) === orderId) {
                activeOrderId.set(orders.length > 0 ? orders[0].id : null);
            }

            return [...orders];
        });
    }

    function restoreOrder(orderId: string) {
        archivedOrders.update((archived) => {
            const index = archived.findIndex((o) => o.id === orderId);
            if (index === -1) return archived;

            const [restoredOrder] = archived.splice(index, 1);
            currentOrders.update((orders) => [...orders, restoredOrder]);
            return [...archived];
        });
    }

    function deleteProfile() {
        profiles.update((all) => all.filter((p) => p.id !== profile.id));
        activeProfile.set(null);
        window.location.href = "/";
    }

    function cancelOrder(orderId: string) {
        currentOrders.update((orders) => {
            return orders.filter((order) => order.id !== orderId);
        });

        if (get(activeOrderId) === orderId) {
            const remainingOrders = get(currentOrders);
            activeOrderId.set(
                remainingOrders.length > 0 ? remainingOrders[0].id : null,
            );
        }
    }

    function formatElapsed(tick: number, startTime?: number): string {
        if (!startTime) return "Unknown";
        const elapsedMs = tick - startTime;
        const seconds = Math.floor(elapsedMs / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return secs < 0 ? `0m 0s` : `${mins}m ${secs}s`;
    }

    function addNewSection() {
        const newSection: MenuItem = {
            id: nanoid(),
            name: "New Section",
            type: "section",
            available: true,
            price: 0.0,
            emotes: {
                advanced: false,
                sections: [],
            },
        };

        itemBeingEdited = newSection;
        showAddModal.set(true);
    }

    function updateOrderDetails(
        orderId: string,
        newName: string | null,
        newId: number | null,
    ) {
        currentOrders.update((orders) =>
            orders.map((order) =>
                order.id === orderId
                    ? {
                          ...order,
                          customerName: newName || undefined,
                          customerId: newId || undefined,
                      }
                    : order,
            ),
        );
    }

    function startDrag(
        event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement },
        id: string,
        index: number,
    ) {
        event.preventDefault();
        draggedItemId = id;
        draggedIndex = index;
        isDragging = true;
    }

    function handleMouseMove(event: { clientY: any }) {
        if (!isDragging) return;

        const listItems = Array.from(
            document.querySelectorAll('[role="listitem"]'),
        );
        const mouseY = event.clientY;

        let newInsertIndex = null;
        listItems.forEach((itemEl, idx) => {
            const rect = itemEl.getBoundingClientRect();
            if (mouseY > rect.top && mouseY < rect.bottom) {
                newInsertIndex = idx;
            }
        });

        if (newInsertIndex !== null && newInsertIndex !== draggedIndex) {
            insertPlaceholderAt = newInsertIndex;
        }
    }

    function handleMouseUp() {
        if (
            isDragging &&
            insertPlaceholderAt !== null &&
            insertPlaceholderAt !== draggedIndex
        ) {
            const updatedMenu = [...profile.menu];
            const [movedItem] = updatedMenu.splice(draggedIndex, 1);
            updatedMenu.splice(insertPlaceholderAt, 0, movedItem);

            const newProfile = { ...profile, menu: updatedMenu };

            profiles.update((p: Profile[]) =>
                p.map((prof) =>
                    prof.id === newProfile.id ? newProfile : prof,
                ),
            );

            profile = newProfile;
            activeProfile.set({ ...profile });
        }
        cancelDrag();
    }

    function cancelDrag() {
        draggedItemId = null;
        draggedIndex = -1;
        insertPlaceholderAt = null;
        isDragging = false;
    }

    function updateProfileFromFile(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProfile = JSON.parse(e.target?.result as string);
                if (
                    !importedProfile.id ||
                    !importedProfile.name ||
                    !importedProfile.image
                ) {
                    toasts.addToast({
                        message: "Invalid profile data",
                        type: "error",
                    });
                    return;
                }

                if (importedProfile.id !== profile.id) {
                    toasts.addToast({
                        message:
                            "Profile ID does not match the current profile",
                        type: "error",
                    });
                    return;
                }

                // 1. Validate duplicate menu IDs within the imported profile
                const menuIDs = new Set<string>();
                for (const item of importedProfile.menu) {
                    if (menuIDs.has(item.id)) {
                        toasts.addToast({
                            message: `Duplicate Menu Item ID found in imported profile: ${item.id}`,
                            type: "error",
                        });
                        return;
                    }
                    menuIDs.add(item.id);
                }

                // 2. Validate against existing profiles & menu items for conflicts
                let hasConflict = false;
                profiles.update((currentProfiles) => {
                    const otherMenuItemIDs = new Set<string>();

                    currentProfiles.forEach((p) => {
                        if (p.id !== profile.id) {
                            p.menu.forEach((item: { id: string }) => {
                                otherMenuItemIDs.add(item.id);
                            });
                        }
                    });

                    for (const item of importedProfile.menu) {
                        if (otherMenuItemIDs.has(item.id)) {
                            toasts.addToast({
                                message: `Menu Item ID conflict detected with existing data: ${item.id}`,
                                type: "error",
                            });
                            hasConflict = true;
                            break;
                        }
                    }

                    if (hasConflict) {
                        return currentProfiles; // Abort update
                    }

                    // No conflicts — Perform update
                    profile = importedProfile;
                    activeProfile.set(importedProfile);

                    return currentProfiles.map((p) =>
                        p.id === profile.id ? importedProfile : p,
                    );
                });

                if (!hasConflict) {
                    toasts.addToast({
                        message: "Profile updated successfully!",
                        type: "success",
                    });
                }
            } catch (err) {
                toasts.addToast({
                    message: "Failed to parse JSON file.",
                    type: "error",
                });
            }
        };
        reader.readAsText(file);
    }

    function exportCurrentProfile() {
        const dataStr = JSON.stringify(profile, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${profile.name.replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function updateProfile() {
        const newProfile = {
            id: profile.id,
            name: profile.name,
            image: profile.image,
            menu: profile.menu,
            rpHelpers: profile.rpHelpers,
        };

        profiles.update((profiles) =>
            profiles.map((profile) =>
                profile.id === newProfile.id
                    ? { ...profile, ...newProfile }
                    : profile,
            ),
        );

        profile = newProfile;

        activeProfile.set({ ...profile });
    }
</script>

<!-- Page Header -->
<div class="relative flex items-center justify-left ml-7 mt-8 mb-4">
    <button
        on:click={() => showReturnConfirm.set(true)}
        class="cursor-pointer bg-(--border-color) dark:bg-(--accent-color) dark:text-black px-2.5 py-1.5 rounded hover:bg-(--secondary-color-hover) dark:hover:bg-(--accent-color-hover) text-sm mr-5 transition"
    >
        {"<"}
    </button>
    <h1 class="text-3xl font-bold text-(--text-color) select-none">
        {profile.name}
    </h1>
    <div class="absolute right-0 flex items-center gap-5 mr-8">
        <button
            on:click={toggleTheme}
            class="absolute right-0 p-3 mr-14 rounded-full bg-black dark:bg-(--accent-color) transition-colors cursor-pointer"
            aria-label="Toggle Theme"
        >
            {#if currentTheme === "light"}
                <!-- Moon Icon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-(--field-color)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                    />
                </svg>
            {:else}
                <!-- Sun Icon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 3v1m0 16v1m8.485-8.485h-1M4.515 12H3m15.364 5.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            {/if}
        </button>
        <div class="relative">
            <button
                id="context-menu-button"
                on:click={toggleContextMenu}
                class="p-3 rounded-full bg-(--accent-color) transition-colors cursor-pointer"
                aria-label="Open Menu"
            >
                <!-- Dots Icon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6h.01M12 12h.01M12 18h.01"
                    />
                </svg>
            </button>

            {#if showContextMenu}
                <div
                    class="absolute right-0 mt-2 w-48 bg-(--field-color) border border-(--border-color) text-(--text-color) rounded-lg shadow-lg z-50"
                >
                    <button
                        class="w-full text-left px-4 py-2 hover:bg-(--accent-color) rounded hover:text-black transition"
                        on:click={() =>
                            document
                                .getElementById("profile-update-input")
                                ?.click()}
                    >
                        Update Profile
                    </button>
                    <button
                        class="w-full text-left px-4 py-2 hover:bg-(--accent-color) rounded hover:text-black transition"
                        on:click={exportCurrentProfile}
                    >
                        Export Profile
                    </button>
                </div>
            {/if}
        </div>

        <button
            id="help-menu-button"
            on:click={toggleHelpModal}
            class="absolute right-0 p-3 mr-28 rounded-full bg-black dark:bg-(--accent-color) transition-colors cursor-pointer"
            aria-label="Help"
        >
            <!-- Question Mark Icon -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-(--field-color)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 10h.01M12 18h.01M16 10h.01M12 14h.01M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"
                />
            </svg>
        </button>
    </div>

    <input
        id="profile-update-input"
        type="file"
        accept=".json"
        class="hidden"
        on:change={updateProfileFromFile}
    />
</div>

{#if showHelpModal}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
        <div class="bg-(--field-color) rounded-xl p-8 shadow-2xl w-96 relative">
            <button
                class="absolute top-3 right-3 text-xl text-(--text-color-muted) cursor-pointer"
                on:click={toggleHelpModal}
            >
                ✕
            </button>

            <h2 class="text-2xl font-semibold text-(--text-color) mb-4">
                Help & Support
            </h2>

            <div class="flex flex-col gap-4">
                <!-- Wikipedia Link -->
                <a
                    href="https://github.com/Vierdant/world-bartender-tool/wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-3 rounded-lg bg-(--accent-color) text-black hover:opacity-80 transition"
                >
                    <img src="../github-icon.png" alt="Wiki" class="w-6 h-6" />
                    <span>Github Wiki</span>
                </a>

                <!-- Support Image -->
                <a
                    href="https://ko-fi.com/vierdant"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-3 rounded-lg bg-(--error-color) text-white hover:opacity-80 transition"
                >
                    <img
                        src="../coffee-icon.png"
                        alt="Buy Coffee"
                        class="w-6 h-6"
                    />
                    <span>Buy me a coffee {":)"}</span>
                </a>

                <!-- Discord Link -->
                <a
                    href="https://discord.gg/cnknQJDBer"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-3 rounded-lg bg-indigo-500 text-white hover:opacity-80 transition"
                >
                    <img
                        src="../discord-icon.png"
                        alt="Discord"
                        class="w-6 h-6"
                    />
                    <span>Join our Discord</span>
                </a>
            </div>
        </div>
    </div>
{/if}

<div class="layout">
    <!-- Left Panel -->
    <div
        class="left-panel bg-(--body-color) p-4 rounded-lg space-y-6 {$panelOpen
            ? 'hidden'
            : ''}"
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
                on:click={createOrder}
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
            on:mouseup={handleMouseUp}
            on:mouseleave={cancelDrag}
        >
            {#each profile.menu as item, index (item.id)}
                <div class="flex items-center justify-between gap-2 group">
                    {#if $managingMenu}
                        <div
                            role="listitem"
                            class="flex justify-between items-center w-full text-white p-5 {item.type ===
                            'section'
                                ? 'pt-5 text-[1.25rem]'
                                : 'border-x-2 border-y-2 rounded border-(--border-color) shadow'} {draggedItemId ===
                            item.id
                                ? 'opacity-50'
                                : ''}"
                        >
                            {#if insertPlaceholderAt === index}
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

                            <!-- Right Side: Edit & Delete Buttons -->
                            <div class="flex gap-2">
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="cursor-grab pr-3 flex items-center"
                                    on:mousedown={(e) =>
                                        startDrag(e, item.id, index)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-(--text-color-muted)"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 10a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                    </svg>
                                </div>
                                <button
                                    on:click={() => {
                                        itemBeingEdited = item;
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
                                    on:click={() => {
                                        let menu = profile.menu.filter(
                                            (i) => i.id !== item.id,
                                        );
                                        profile.menu = menu;
                                        updateProfile();
                                    }}
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
                                    ${item.price.toFixed(2)}
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
            itemToEdit={itemBeingEdited}
            on:close={() => {
                itemBeingEdited = null;
                showAddModal.set(false);
            }}
            on:save={(e) => {
                const updatedItem = e.detail;
                const idx = profile.menu.findIndex(
                    (i) => i.id === updatedItem.id,
                );

                if (idx >= 0) {
                    profile.menu[idx] = updatedItem;
                } else {
                    profile.menu.push(updatedItem);
                }
                updateProfile();
            }}
        />
    {/if}

    {#if $showArchivedModal}
        <ArchivedOrdersModal
            onClose={() => showArchivedModal.set(false)}
            on:restoreOrder={(e) => restoreOrder(e.detail)}
        />
    {/if}

    {#if $showHelperModal && $selectedHelperOrder}
        <RpHelperModal
            order={$selectedHelperOrder}
            {profile}
            on:close={() => {
                showHelperModal.set(false);
            }}
        />
    {/if}

    {#if $showConfigureHelpersModal}
        <ConfigureHelpersModal
            {profile}
            onClose={() => showConfigureHelpersModal.set(false)}
            on:save={(e) => {
                const updatedProfile = e.detail;
                profiles.update((all) =>
                    all.map((p) =>
                        p.id === updatedProfile.id ? updatedProfile : p,
                    ),
                );
                profile = updatedProfile;
                activeProfile.set({ ...profile });
            }}
        />
    {/if}

    {#if $showReturnConfirm}
        <ConfirmationScreen
            type="main"
            header="Return to Landing Page?"
            text="Are you sure you want to leave this session?"
            on:abort={() => showReturnConfirm.set(false)}
            on:confirm={() => goto("/")}
        />
    {/if}

    {#if $showDeleteConfirm}
        <ConfirmationScreen
            type="error"
            header="Delete Profile?"
            text="This action is permanent and cannot be undone."
            confirm_text="Delete"
            on:abort={() => showDeleteConfirm.set(false)}
            on:confirm={deleteProfile}
        />
    {/if}

    {#if $showCancelConfirm && $orderToCancel}
        <ConfirmationScreen
            type="error"
            header="Cancel Order?"
            text="This order will be permanently deleted and not archived."
            on:abort={() => showCancelConfirm.set(false)}
            on:confirm={() => {
                cancelOrder($orderToCancel.id);
                showCancelConfirm.set(false);
                orderToCancel.set(null);
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
                                                    on:click={() => {
                                                        copyEmote(
                                                            order,
                                                            item.id,
                                                            order.customerName,
                                                        );
                                                        currentOrders.update(
                                                            (orders) => {
                                                                const index =
                                                                    orders.findIndex(
                                                                        (o) =>
                                                                            o.id ===
                                                                            order.id,
                                                                    );
                                                                if (
                                                                    index !== -1
                                                                ) {
                                                                    orders[
                                                                        index
                                                                    ] = {
                                                                        ...orders[
                                                                            index
                                                                        ],
                                                                        items: [
                                                                            ...orders[
                                                                                index
                                                                            ]
                                                                                .items,
                                                                        ],
                                                                    }; // clone the items array to trigger reactivity
                                                                }
                                                                return [
                                                                    ...orders,
                                                                ];
                                                            },
                                                        );
                                                    }}
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
                                Total: ${getTotal(order).toFixed(0)}
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
</div>
<Toaster />

<style>
    button:disabled {
        opacity: 0.5;
    }

    .layout {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 0rem 1.5rem 1.5rem 4rem;
    }

    .left-panel {
        width: 100%;
        max-width: 800px;
    }

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

    [role="listitem"] {
        transition: opacity 0.2s ease;
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
