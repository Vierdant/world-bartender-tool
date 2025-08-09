import { writable } from 'svelte/store';
import type { Order, MenuItem } from '$lib/types';
import { theme } from './theme';

// Modal states
export const showAddModal = writable(false);
export const showArchivedModal = writable(false);
export const showHelperModal = writable(false);
export const showConfigureHelpersModal = writable(false);
export const showReturnConfirm = writable(false);
export const showDeleteConfirm = writable(false);
export const showCancelConfirm = writable(false);
export const showEditModal = writable(false);
export const showItemActionModal = writable(false);
export const showHelpModal = writable(false);
export const showThemeModal = writable(false);

// Context menu state
export const showContextMenu = writable(false);

// Panel state
export const panelOpen = writable(false);

// Modal data
export const selectedHelperOrder = writable<Order | null>(null);
export const orderToCancel = writable<Order | null>(null);
export const editableOrder = writable<Order | null>(null);
export const itemActionItem = writable<MenuItem | null>(null);
export const itemActionOrder = writable<Order | null>(null);



export function toggleTheme() {
    theme.update(themeValue => themeValue === 'light' ? 'dark' : 'light');
}

export function toggleContextMenu() {
    showContextMenu.update(v => !v);
}

export function togglePanel() {
    panelOpen.update(v => !v);
}

export function toggleHelpModal() {
    showHelpModal.update(v => !v);
}

export function toggleThemeModal() {
    showThemeModal.update(v => !v);
}

export function closeAllModals() {
    showAddModal.set(false);
    showArchivedModal.set(false);
    showHelperModal.set(false);
    showConfigureHelpersModal.set(false);
    showReturnConfirm.set(false);
    showDeleteConfirm.set(false);
    showCancelConfirm.set(false);
    showEditModal.set(false);
    showItemActionModal.set(false);
    showHelpModal.set(false);
    showThemeModal.set(false);
    showContextMenu.set(false);
}
