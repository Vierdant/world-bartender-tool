<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import type { CustomTheme, ThemeColors } from '$lib/types';
    import { theme, defaultTheme } from '$lib/stores/theme';
    
    export let show = false;
    export let currentCustomTheme: CustomTheme | null = null;
    
    const dispatch = createEventDispatcher();
    
    // Working copy of theme colors
    let workingTheme: CustomTheme = currentCustomTheme ? 
        structuredClone(currentCustomTheme) : 
        structuredClone(defaultTheme);
    
    let activeTab: 'light' | 'dark' = 'light';
    let currentThemeMode = 'light';
    
    // Subscribe to theme changes for preview
    const unsubscribe = theme.subscribe(value => currentThemeMode = value);
    
    // Color categories for better organization
    const colorCategories = [
        {
            name: 'Background Colors',
            colors: [
                { key: 'bodyColor', label: 'Body Background', description: 'Main page background' },
                { key: 'fieldColor', label: 'Field Background', description: 'Input fields and cards' },
                { key: 'secondaryColor', label: 'Secondary Background', description: 'Subtle backgrounds' },
                { key: 'secondaryColorHover', label: 'Secondary Hover', description: 'Hover state for secondary' }
            ]
        },
        {
            name: 'Text Colors',
            colors: [
                { key: 'textColor', label: 'Primary Text', description: 'Main text color' },
                { key: 'textColorMuted', label: 'Muted Text', description: 'Secondary text color' },
                { key: 'textColorAccent', label: 'Accent Text', description: 'Special text highlights' }
            ]
        },
        {
            name: 'Action Colors',
            colors: [
                { key: 'accentColor', label: 'Accent', description: 'Primary accent color' },
                { key: 'accentColorHover', label: 'Accent Hover', description: 'Accent hover state' },
                { key: 'accentColorDark', label: 'Accent Dark', description: 'Darker accent variant' }
            ]
        },
        {
            name: 'Status Colors',
            colors: [
                { key: 'acceptColor', label: 'Success', description: 'Success/accept actions' },
                { key: 'acceptColorDark', label: 'Success Dark', description: 'Darker success variant' },
                { key: 'errorColor', label: 'Error', description: 'Error/danger actions' },
                { key: 'errorColorDark', label: 'Error Dark', description: 'Darker error variant' },
                { key: 'infoColor', label: 'Info', description: 'Information/neutral actions' },
                { key: 'infoColorDark', label: 'Info Dark', description: 'Darker info variant' }
            ]
        },
        {
            name: 'Borders',
            colors: [
                { key: 'borderColor', label: 'Border', description: 'Default border color' }
            ]
        }
    ];
    
    function resetToDefault() {
        workingTheme = structuredClone(defaultTheme);
        // Remove custom theme entirely (null means use default theme)
        dispatch('save', null);
    }
    
    function saveTheme() {
        dispatch('save', workingTheme);
    }
    
    function closeModal() {
        dispatch('close');
    }
    
    // Convert hex to RGB for better color manipulation
    function hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // Generate lighter/darker variants
    function adjustBrightness(hex: string, percent: number) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        const adjust = (value: number) => {
            const adjusted = Math.round(value * (1 + percent / 100));
            return Math.max(0, Math.min(255, adjusted));
        };
        
        const r = adjust(rgb.r).toString(16).padStart(2, '0');
        const g = adjust(rgb.g).toString(16).padStart(2, '0');
        const b = adjust(rgb.b).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    }
    
    // Auto-generate hover and dark variants
    function updateColorWithVariants(colorKey: string, value: string) {
        workingTheme[activeTab][colorKey as keyof ThemeColors] = value;
        
        // Auto-generate hover variants
        if (colorKey === 'accentColor') {
            workingTheme[activeTab].accentColorHover = adjustBrightness(value, -10);
            workingTheme[activeTab].accentColorDark = adjustBrightness(value, -30);
        } else if (colorKey === 'acceptColor') {
            workingTheme[activeTab].acceptColorDark = adjustBrightness(value, -25);
        } else if (colorKey === 'errorColor') {
            workingTheme[activeTab].errorColorDark = adjustBrightness(value, -25);
        } else if (colorKey === 'infoColor') {
            workingTheme[activeTab].infoColorDark = adjustBrightness(value, -25);
        } else if (colorKey === 'secondaryColor') {
            workingTheme[activeTab].secondaryColorHover = adjustBrightness(value, -5);
        }
    }
</script>

{#if show}
    <!-- Modal Backdrop -->
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 200 }}
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
        role="dialog"
        aria-labelledby="theme-modal-title"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- Modal Content -->
        <div 
            class="bg-(--body-color) border border-(--border-color) rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            transition:fly={{ y: 20, duration: 300, easing: quintOut }}
            role="document"
        >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-(--border-color)">
                <div>
                    <h2 id="theme-modal-title" class="text-2xl font-bold text-(--text-color)">Theme Customization</h2>
                    <p class="text-sm text-(--text-color-muted) mt-1">Personalize your profile's appearance</p>
                </div>
                <button
                    on:click={closeModal}
                    class="p-2 rounded-lg bg-(--field-color) hover:bg-(--secondary-color) border border-(--border-color) text-(--text-color-muted) hover:text-(--text-color) transition-all duration-200 cursor-pointer"
                    aria-label="Close theme customization"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Theme Mode Tabs -->
            <div class="flex border-b border-(--border-color) bg-(--field-color)">
                <button
                    class="flex-1 py-4 px-6 text-center font-medium transition-all duration-200 {activeTab === 'light' ? 'text-(--accent-color) border-b-2 border-(--accent-color) bg-(--body-color)' : 'text-(--text-color-muted) hover:text-(--text-color) hover:bg-(--secondary-color)'}"
                    on:click={() => activeTab = 'light'}
                >
                    <div class="flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        Light Mode
                    </div>
                </button>
                <button
                    class="flex-1 py-4 px-6 text-center font-medium transition-all duration-200 {activeTab === 'dark' ? 'text-(--accent-color) border-b-2 border-(--accent-color) bg-(--body-color)' : 'text-(--text-color-muted) hover:text-(--text-color) hover:bg-(--secondary-color)'}"
                    on:click={() => activeTab = 'dark'}
                >
                    <div class="flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        </svg>
                        Dark Mode
                    </div>
                </button>
            </div>
            
            <!-- Content -->
            <div class="flex h-[60vh]">
                <!-- Color Customization Panel -->
                <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div class="space-y-8">
                        {#each colorCategories as category}
                            <div>
                                <h3 class="text-lg font-semibold text-(--text-color) mb-4 flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full bg-(--accent-color)"></div>
                                    {category.name}
                                </h3>
                                <div class="grid gap-4">
                                    {#each category.colors as colorInfo}
                                        <div class="flex items-center justify-between p-4 bg-(--field-color) border border-(--border-color) rounded-xl hover:bg-(--secondary-color) transition-all duration-200">
                                            <div class="flex-1">
                                                                                <label for="color-{colorInfo.key}-{activeTab}" class="block text-sm font-medium text-(--text-color) mb-1">
                                    {colorInfo.label}
                                </label>
                                                <p class="text-xs text-(--text-color-muted)">{colorInfo.description}</p>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                                                <div 
                                    class="w-12 h-12 rounded-lg border-2 border-(--border-color) shadow-inner"
                                    style="background-color: {workingTheme[activeTab][colorInfo.key as keyof ThemeColors]}"
                                ></div>
                                                                                <input
                                    id="color-{colorInfo.key}-{activeTab}"
                                    type="color"
                                    value={workingTheme[activeTab][colorInfo.key as keyof ThemeColors]}
                                    on:input={(e) => updateColorWithVariants(colorInfo.key, e.currentTarget.value)}
                                    class="w-16 h-12 rounded-lg border-2 border-(--border-color) cursor-pointer bg-transparent"
                                />
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <!-- Live Preview Panel -->
                <div class="w-80 border-l border-(--border-color) bg-(--field-color) p-6 overflow-y-auto custom-scrollbar">
                    <h3 class="text-lg font-semibold text-(--text-color) mb-4">Live Preview</h3>
                    
                    <!-- Preview Cards -->
                    <div class="space-y-4">
                        <!-- Sample Card 1 -->
                        <div class="p-4 rounded-xl border-2" style="background-color: {workingTheme[activeTab].bodyColor}; border-color: {workingTheme[activeTab].borderColor}">
                            <h4 class="font-semibold mb-2" style="color: {workingTheme[activeTab].textColor}">Sample Card</h4>
                            <p class="text-sm mb-3" style="color: {workingTheme[activeTab].textColorMuted}">This is how your content will look with the current theme</p>
                            <button 
                                class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                style="background-color: {workingTheme[activeTab].accentColor}; color: #000"
                            >
                                Accent Button
                            </button>
                        </div>
                        
                        <!-- Sample Card 2 -->
                        <div class="p-4 rounded-xl" style="background-color: {workingTheme[activeTab].bodyColor}">
                            <div class="flex gap-2 mb-3">
                                <button 
                                    class="px-3 py-1.5 rounded text-xs font-medium"
                                    style="background-color: {workingTheme[activeTab].acceptColor}; color: white"
                                >
                                    Success
                                </button>
                                <button 
                                    class="px-3 py-1.5 rounded text-xs font-medium"
                                    style="background-color: {workingTheme[activeTab].errorColor}; color: white"
                                >
                                    Error
                                </button>
                                <button 
                                    class="px-3 py-1.5 rounded text-xs font-medium"
                                    style="background-color: {workingTheme[activeTab].infoColor}; color: white"
                                >
                                    Info
                                </button>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Sample input field"
                                class="w-full px-3 py-2 rounded border-2 text-sm"
                                style="background-color: {workingTheme[activeTab].fieldColor}; border-color: {workingTheme[activeTab].borderColor}; color: {workingTheme[activeTab].textColor}"
                            />
                        </div>
                        
                        <!-- Color Palette -->
                        <div class="p-4 rounded-xl border" style="background-color: {workingTheme[activeTab].bodyColor}; border-color: {workingTheme[activeTab].borderColor}">
                            <h5 class="text-sm font-medium mb-3" style="color: {workingTheme[activeTab].textColor}">Color Palette</h5>
                            <div class="grid grid-cols-4 gap-2">
                                {#each Object.entries(workingTheme[activeTab]) as [key, color]}
                                    <div 
                                        class="w-full h-8 rounded border"
                                        style="background-color: {color}; border-color: {workingTheme[activeTab].borderColor}"
                                        title={key}
                                    ></div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-between p-6 border-t border-(--border-color) bg-(--field-color)">
                <button
                    on:click={resetToDefault}
                    class="px-4 py-2 rounded-lg bg-(--secondary-color) hover:bg-(--secondary-color-hover) text-black text-sm font-medium transition-all duration-200 cursor-pointer"
                >
                    Reset to Default
                </button>
                
                <div class="flex gap-3">
                    <button
                        on:click={closeModal}
                        class="px-6 py-2 rounded-lg bg-(--field-color) hover:bg-(--secondary-color) border border-(--border-color) text-(--text-color) text-sm font-medium transition-all duration-200 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={saveTheme}
                        class="px-6 py-2 rounded-lg bg-(--accent-color) hover:bg-(--accent-color-hover) text-black text-sm font-medium transition-all duration-200 cursor-pointer"
                    >
                        Save Theme
                    </button>
                </div>
            </div>
        </div>
    </div>
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
