<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { activeProfile } from "$lib/stores/profile";
    import { theme } from "$lib/stores/theme";
    import { cancelOrder, clearAllOrders } from "$lib/stores/orderStore";
    import { 
        showReturnConfirm, 
        showDeleteConfirm,
        showConfigureHelpersModal, 
        showArchivedModal,
        showCancelConfirm,
        orderToCancel
    } from '$lib/stores/uiStore';

    import type { Profile } from "$lib/types";
    import { goto } from "$app/navigation";
    import { profiles } from "$lib/stores/profile";
    import { toasts } from "$lib/stores/toastStore";
    import Toaster from "$lib/components/UI/Toaster.svelte";
    import ConfirmationScreen from "$lib/components/UI/ConfirmationScreen.svelte";
    import ArchivedOrdersModal from "$lib/components/Modals/ArchivedOrdersModal.svelte";
    import ConfigureHelpersModal from "$lib/components/Modals/ConfigureHelpersModal.svelte";
    import Header from "$lib/components/Profile/Header.svelte";
    import MenuPanel from "$lib/components/Profile/MenuPanel.svelte";
    import OrderPanel from "$lib/components/Profile/OrderPanel.svelte";

    export let data;
    export let profile: Profile = data.profile;

    onMount(() => {
        activeProfile.set(profile);
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

    let currentThemeValue = "light";
    theme.subscribe((value) => (currentThemeValue = value));

    function deleteProfile() {
        profiles.update((all) => all.filter((p) => p.id !== profile.id));
        activeProfile.set(null);
        window.location.href = "/";
    }

    function handleReturn() {
        showReturnConfirm.set(false);
        clearAllOrders();
        goto("/");
    }
</script>

<Header {profile} />

<div class="layout">
    <MenuPanel {profile} />
    <OrderPanel {profile} />
</div>

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

{#if $showArchivedModal}
    <ArchivedOrdersModal
        onClose={() => showArchivedModal.set(false)}
    />
{/if}

{#if $showReturnConfirm}
    <ConfirmationScreen
        type="main"
        header="Return to Landing Page?"
        text="Are you sure you want to leave this session?"
        on:abort={() => showReturnConfirm.set(false)}
        on:confirm={handleReturn}
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

<Toaster />

<style>
    .layout {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 0rem 1.5rem 1.5rem 4rem;
    }
</style>
