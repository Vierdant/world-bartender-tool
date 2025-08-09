import { writable, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import type { Profile, MenuItem } from '$lib/types';
import { profiles, activeProfile } from './profile';
import { toasts } from './toastStore';
import { showAddModal } from './uiStore';

// Menu management state
export const managingMenu = writable(false);
export const itemBeingEdited = writable<MenuItem | null>(null);

// Drag and drop state
export const draggedItemId = writable<string | null>(null);
export const draggedIndex = writable(-1);
export const insertPlaceholderAt = writable<number | null>(null);
export const isDragging = writable(false);

export function addNewSection() {
    const newSection: MenuItem = {
        id: nanoid(),
        name: 'New Section',
        type: 'section',
        available: true,
        price: 0.0,
        emotes: {
            advanced: false,
            sections: [],
        },
    };

    itemBeingEdited.set(newSection);
    showAddModal.set(true);
}

export function startDrag(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }, id: string, index: number) {
    event.preventDefault();
    draggedItemId.set(id);
    draggedIndex.set(index);
    isDragging.set(true);
}

export function handleMouseMove(event: { clientY: any }) {
    if (!get(isDragging)) return;

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

    if (newInsertIndex !== null && newInsertIndex !== get(draggedIndex)) {
        insertPlaceholderAt.set(newInsertIndex);
    }
}

export function handleMouseUp(profile: Profile) {
    const insertIndex = get(insertPlaceholderAt);
    if (
        get(isDragging) &&
        insertIndex !== null &&
        insertIndex !== get(draggedIndex)
    ) {
        const updatedMenu = [...profile.menu];
        const [movedItem] = updatedMenu.splice(get(draggedIndex), 1);
        updatedMenu.splice(insertIndex, 0, movedItem);

        const newProfile = { ...profile, menu: updatedMenu };

        profiles.update((p: Profile[]) =>
            p.map((prof) =>
                prof.id === newProfile.id ? newProfile : prof,
            ),
        );
        
        activeProfile.set({ ...newProfile });
    }
    cancelDrag();
}

export function cancelDrag() {
    draggedItemId.set(null);
    draggedIndex.set(-1);
    insertPlaceholderAt.set(null);
    isDragging.set(false);
}

export function updateProfile() {
    const currentProfile = get(activeProfile);
    if (!currentProfile) return;

    const newProfile = {
        id: currentProfile.id,
        name: currentProfile.name,
        image: currentProfile.image,
        menu: currentProfile.menu,
        rpHelpers: currentProfile.rpHelpers,
        customTheme: currentProfile.customTheme,
    };

    profiles.update((profiles) =>
        profiles.map((profile) =>
            profile.id === newProfile.id
                ? { ...profile, ...newProfile }
                : profile,
        ),
    );

    activeProfile.set({ ...newProfile });
}

export function deleteMenuItem(itemId: string) {
    const currentProfile = get(activeProfile);
    if (!currentProfile) return;

    const menu = currentProfile.menu.filter((i) => i.id !== itemId);
    const updatedProfile = { ...currentProfile, menu };
    
    profiles.update((all) =>
        all.map((p) =>
            p.id === updatedProfile.id ? updatedProfile : p,
        ),
    );
    
    activeProfile.set(updatedProfile);
}

export async function updateProfileFromFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file
    const { validateFile, validateJSON, validateProfile } = await import('$lib/utils/validation');
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
        toasts.addToast({ message: fileValidation.error!, type: 'error' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonString = e.target?.result as string;
            
            // Validate JSON
            const jsonValidation = validateJSON(jsonString);
            if (!jsonValidation.valid) {
                toasts.addToast({ message: jsonValidation.error!, type: 'error' });
                return;
            }

            const importedProfile = JSON.parse(jsonString);
            // Validate profile structure
            const profileValidation = validateProfile(importedProfile);
            if (!profileValidation.valid) {
                toasts.addToast({
                    message: profileValidation.error!,
                    type: 'error',
                });
                return;
            }

            const currentProfile = get(activeProfile);
            if (!currentProfile || importedProfile.id !== currentProfile.id) {
                toasts.addToast({
                    message: 'Profile ID does not match the current profile',
                    type: 'error',
                });
                return;
            }

            // 1. Validate duplicate menu IDs within the imported profile
            const menuIDs = new Set<string>();
            for (const item of importedProfile.menu) {
                if (menuIDs.has(item.id)) {
                    toasts.addToast({
                        message: `Duplicate Menu Item ID found in imported profile: ${item.id}`,
                        type: 'error',
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
                    if (p.id !== currentProfile.id) {
                        p.menu.forEach((item: { id: string }) => {
                            otherMenuItemIDs.add(item.id);
                        });
                    }
                });

                for (const item of importedProfile.menu) {
                    if (otherMenuItemIDs.has(item.id)) {
                        toasts.addToast({
                            message: `Menu Item ID conflict detected with existing data: ${item.id}`,
                            type: 'error',
                        });
                        hasConflict = true;
                        break;
                    }
                }

                if (hasConflict) {
                    return currentProfiles; // Abort update
                }

                // No conflicts — Perform update
                activeProfile.set(importedProfile);
                
                // Apply custom theme if imported profile has one
                if (importedProfile.customTheme) {
                    import('$lib/stores/theme').then(({ setProfileCustomTheme }) => {
                        setProfileCustomTheme(importedProfile.customTheme);
                    });
                } else {
                    import('$lib/stores/theme').then(({ resetToDefaultTheme }) => {
                        resetToDefaultTheme();
                    });
                }

                return currentProfiles.map((p) =>
                    p.id === currentProfile.id ? importedProfile : p,
                );
            });

            if (!hasConflict) {
                toasts.addToast({
                    message: 'Profile updated successfully!',
                    type: 'success',
                });
            }
        } catch (err) {
            toasts.addToast({
                message: 'Failed to parse JSON file.',
                type: 'error',
            });
        }
    };
    reader.readAsText(file);
}

export function exportCurrentProfile() {
    const currentProfile = get(activeProfile);
    if (!currentProfile) return;

    const dataStr = JSON.stringify(currentProfile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProfile.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
