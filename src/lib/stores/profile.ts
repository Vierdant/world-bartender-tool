import { writable } from 'svelte/store';
import type { Profile, Order } from '../types';
import { loadProfiles, saveProfiles } from '$lib/utils/platform';

export const profiles = writable<Profile[]>([]);
export const activeProfile = writable<Profile | null>(null);
export const currentOrders = writable<Order[]>([]);
export const archivedOrders = writable<Order[]>([]);

let loaded = false;

// Load profiles on startup
loadProfiles().then((loadedProfiles) => {
  profiles.set(loadedProfiles);
  loaded = true;
});

// Only persist once loading has completed
profiles.subscribe((value) => {
  if (loaded) {
    saveProfiles(value);
  }
});