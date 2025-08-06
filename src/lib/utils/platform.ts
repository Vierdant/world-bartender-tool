import type { Profile } from '$lib/types';

export const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

let store: any = null;

// Initialize store (Tauri only)
export async function initStore() {
  if (isTauri && !store) {
    const { LazyStore } = await import('@tauri-apps/plugin-store');
    store = new LazyStore('.wbt.data.dat');
  }
}

// Clipboard Support
export async function copyToClipboard(text: string) {
  if (isTauri) {
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    await writeText(text);
  } else {
    await navigator.clipboard.writeText(text);
  }
}

// Load profiles from Tauri or localStorage
export async function loadProfiles(): Promise<Profile[]> {
  if (isTauri) {
    await initStore();
    const profiles = await store.get('profiles');
    return profiles || [];
  } else {
    const raw = localStorage.getItem('profiles');
    return raw ? JSON.parse(raw) : [];
  }
}


// Save profiles to Tauri or localStorage
export async function saveProfiles(profiles: Profile[]): Promise<void> {
  if (isTauri) {
    await initStore();
    await store.set('profiles', profiles);
    await store.save();
  } else {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  }
}