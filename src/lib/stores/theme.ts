// src/stores/theme.ts
import { writable } from 'svelte/store';

export const theme = writable<'light' | 'dark'>('dark');

// Initialize theme from local storage (optional)
if (typeof localStorage !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
        theme.set(storedTheme);
    }
}

theme.subscribe((value) => {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', value === 'dark');
        localStorage.setItem('theme', value);
    }
});