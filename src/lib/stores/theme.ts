// src/stores/theme.ts
import { writable, derived } from 'svelte/store';
import type { CustomTheme, ThemeColors } from '$lib/types';

export const theme = writable<'light' | 'dark'>('dark');
export const activeCustomTheme = writable<CustomTheme | null>(null);

// Default theme colors
export const defaultTheme: CustomTheme = {
    light: {
        bodyColor: '#f8f9fa',
        fieldColor: '#ffffff',
        borderColor: '#dee2e6',
        textColor: '#212529',
        textColorMuted: '#6c757d',
        textColorAccent: '#e1aa00',
        secondaryColor: '#e9ecef',
        secondaryColorHover: '#dee2e6',
        accentColor: '#ffc107',
        accentColorHover: '#ffb300',
        accentColorDark: '#856404',
        errorColor: '#dc3545',
        errorColorDark: '#721c24',
        infoColor: '#2d8be2',
        infoColorDark: '#1e3f5e',
        acceptColor: '#63c72a',
        acceptColorDark: '#45881e'
    },
    dark: {
        bodyColor: '#242424',
        fieldColor: '#2e2e2e',
        borderColor: '#424242',
        textColor: '#c9c9c9',
        textColorMuted: '#707070',
        textColorAccent: '#e1aa00',
        secondaryColor: '#e9ecef',
        secondaryColorHover: '#dee2e6',
        accentColor: '#ffc107',
        accentColorHover: '#ffb300',
        accentColorDark: '#856404',
        errorColor: '#dc3545',
        errorColorDark: '#721c24',
        infoColor: '#2d8be2',
        infoColorDark: '#1e3f5e',
        acceptColor: '#63c72a',
        acceptColorDark: '#45881e'
    }
};

// Computed theme colors based on current theme and custom theme
export const currentThemeColors = derived(
    [theme, activeCustomTheme],
    ([$theme, $activeCustomTheme]) => {
        const colors = $activeCustomTheme ? $activeCustomTheme[$theme] : defaultTheme[$theme];
        return colors;
    }
);

// Apply theme colors to CSS variables
function applyThemeColors(colors: ThemeColors) {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--body-color', colors.bodyColor);
        root.style.setProperty('--field-color', colors.fieldColor);
        root.style.setProperty('--border-color', colors.borderColor);
        root.style.setProperty('--text-color', colors.textColor);
        root.style.setProperty('--text-color-muted', colors.textColorMuted);
        root.style.setProperty('--text-color-accent', colors.textColorAccent);
        root.style.setProperty('--secondary-color', colors.secondaryColor);
        root.style.setProperty('--secondary-color-hover', colors.secondaryColorHover);
        root.style.setProperty('--accent-color', colors.accentColor);
        root.style.setProperty('--accent-color-hover', colors.accentColorHover);
        root.style.setProperty('--accent-color-dark', colors.accentColorDark);
        root.style.setProperty('--error-color', colors.errorColor);
        root.style.setProperty('--error-color-dark', colors.errorColorDark);
        root.style.setProperty('--info-color', colors.infoColor);
        root.style.setProperty('--info-color-dark', colors.infoColorDark);
        root.style.setProperty('--accept-color', colors.acceptColor);
        root.style.setProperty('--accept-color-dark', colors.acceptColorDark);
    }
}

// Initialize theme from local storage
if (typeof localStorage !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
        theme.set(storedTheme);
    }
}

// Subscribe to theme changes
theme.subscribe((value) => {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', value === 'dark');
        localStorage.setItem('theme', value);
    }
});

// Subscribe to theme color changes
currentThemeColors.subscribe((colors) => {
    applyThemeColors(colors);
});

// Function to set custom theme for a profile
export function setProfileCustomTheme(customTheme: CustomTheme | null) {
    activeCustomTheme.set(customTheme);
}

// Function to reset to default theme
export function resetToDefaultTheme() {
    activeCustomTheme.set(null);
}