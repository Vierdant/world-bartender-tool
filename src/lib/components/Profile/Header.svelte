<script lang="ts">
    import type { Profile } from '$lib/types';
    import { theme } from '$lib/stores/theme';
    import { showContextMenu, showHelpModal, toggleTheme, toggleContextMenu, toggleHelpModal } from '$lib/stores/uiStore';
    import { exportCurrentProfile, updateProfileFromFile } from '$lib/stores/menuStore';
    import { showReturnConfirm } from '$lib/stores/uiStore';
    import { goto } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import AnimatedModal from '$lib/components/UI/AnimatedModal.svelte';

    export let profile: Profile;

    let currentThemeValue = 'light';
    theme.subscribe((value) => (currentThemeValue = value));

    onMount(() => {
       document.addEventListener("click", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside);
    });

    function handleClickOutside(event: MouseEvent) {
        const context = document.getElementById('context-menu-button');
        const help = document.getElementById('help-menu-button');
        const helpModal = document.querySelector('[data-modal="help"]');
        
        if (
            !context?.contains(event.target as Node) &&
            !help?.contains(event.target as Node) &&
            !helpModal?.contains(event.target as Node)
        ) {
            showContextMenu.set(false);
            showHelpModal.set(false);
        }
    }
</script>

<!-- Enhanced Page Header -->
<div class="relative flex items-center justify-left ml-7 mt-8 mb-4">
    <button
        on:click={() => showReturnConfirm.set(true)}
        class="cursor-pointer bg-(--field-color) border border-(--border-color) hover:bg-(--secondary-color-hover) px-3 py-2 rounded-xl text-sm mr-5 transition-all duration-300 group shadow-lg hover:shadow-xl text-(--text-color) hover:text-black"
    >
        <span class="group-hover:scale-110 transition-transform duration-200">{"<"}</span>
    </button>
    <h1 class="text-3xl font-bold text-(--text-color) select-none">
        {profile.name}
    </h1>
    <div class="absolute right-0 flex items-center gap-4 mr-8">
        <button
            on:click={toggleTheme}
            class="p-3 rounded-xl bg-(--field-color) border border-(--border-color) hover:bg-(--secondary-color-hover) transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            aria-label="Toggle Theme"
        >
            {#if currentThemeValue === "light"}
                <!-- Moon Icon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-(--text-color) group-hover:scale-110 transition-transform duration-200"
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
                    class="h-6 w-6 text-(--text-color) group-hover:scale-110 transition-transform duration-200"
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
                class="p-3 rounded-xl bg-(--accent-color) hover:bg-(--accent-color-hover) transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
                aria-label="Open Menu"
            >
                <!-- Dots Icon -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 text-black group-hover:scale-110 transition-transform duration-200"
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

            {#if $showContextMenu}
                <div
                    class="absolute right-0 mt-3 w-56 bg-(--field-color) border border-(--border-color) text-(--text-color) rounded-xl shadow-2xl z-50 backdrop-blur-sm"
                >
                    <div class="p-2">
                        <button
                            class="w-full text-left px-4 py-3 hover:bg-(--accent-color) rounded-lg hover:text-black transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                            on:click={() =>
                                document
                                    .getElementById("profile-update-input")
                                    ?.click()}
                        >
                            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                            <span class="font-medium">Update Profile</span>
                        </button>
                        <button
                            class="w-full text-left px-4 py-3 hover:bg-(--accent-color) rounded-lg hover:text-black transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                            on:click={exportCurrentProfile}
                        >
                            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="font-medium">Export Profile</span>
                        </button>
                    </div>
                </div>
            {/if}
        </div>
        
        <button
            id="help-menu-button"
            on:click={toggleHelpModal}
            class="p-3 rounded-xl bg-(--field-color) border border-(--border-color) hover:bg-(--secondary-color-hover) transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            aria-label="Help"
        >
            <!-- Question Mark Icon -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-(--text-color) group-hover:scale-110 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

<AnimatedModal 
    show={$showHelpModal} 
    maxWidth="max-w-md"
    on:close={toggleHelpModal}
    dataAttributes={{ modal: "help" }}
>
    <div class="relative">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-(--accent-color) rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-(--text-color)">
                        Help & Support
                    </h2>
                    <p class="text-sm text-(--text-color-muted)">
                        Get help and connect with the community
                    </p>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="space-y-4">
            <!-- Documentation Section -->
            <div class="bg-(--field-color) rounded-lg p-4 border border-(--border-color)">
                <h3 class="text-sm font-semibold text-(--text-color) mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Documentation
                </h3>
                <a
                    href="https://github.com/Vierdant/world-bartender-tool/wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-3 rounded-lg bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer group"
                >
                    <img src="../../../github-icon.png" alt="Wiki" class="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <div class="flex-1">
                        <div class="font-medium">GitHub Wiki</div>
                        <div class="text-xs opacity-80">Complete documentation & guides</div>
                    </div>
                    <svg class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>

            <!-- Community Section -->
            <div class="bg-(--field-color) rounded-lg p-4 border border-(--border-color)">
                <h3 class="text-sm font-semibold text-(--text-color) mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Community
                </h3>
                <div class="space-y-2">
                    <a
                        href="https://discord.gg/cnknQJDBer"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-3 p-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                        <img src="../../../discord-icon.png" alt="Discord" class="w-5 h-5 transition-transform group-hover:rotate-12" />
                        <div class="flex-1">
                            <div class="font-medium">Join Discord</div>
                            <div class="text-xs opacity-80">Connect with other users</div>
                        </div>
                        <svg class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Support Section -->
            <div class="bg-(--field-color) rounded-lg p-4 border border-(--border-color)">
                <h3 class="text-sm font-semibold text-(--text-color) mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-(--error-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    Support the Project
                </h3>
                <a
                    href="https://ko-fi.com/vierdant"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-3 rounded-lg bg-(--error-color) text-white hover:bg-(--error-color-dark) transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer group"
                >
                    <img src="../../../coffee-icon.png" alt="Buy Coffee" class="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <div class="flex-1">
                        <div class="font-medium">Buy me a coffee</div>
                        <div class="text-xs opacity-80">Support development {":)"}</div>
                    </div>
                    <svg class="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>

            <!-- Quick Tips -->
            <div class="bg-(--field-color) rounded-lg p-4 border border-(--border-color)">
                <h3 class="text-sm font-semibold text-(--text-color) mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    Quick Tips
                </h3>
                <div class="space-y-2 text-xs text-(--text-color-muted)">
                    <div class="flex items-start gap-2">
                        <div class="w-1.5 h-1.5 bg-(--accent-color) rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Use <kbd class="px-1.5 py-0.5 bg-(--border-color) rounded text-xs">!name</kbd> and <kbd class="px-1.5 py-0.5 bg-(--border-color) rounded text-xs">!id</kbd> in actions/emotes to get customer's name if available.</span>
                    </div>
                    <div class="flex items-start gap-2">
                        <div class="w-1.5 h-1.5 bg-(--accent-color) rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Drag items to reorder them in manage mode</span>
                    </div>
                    <div class="flex items-start gap-2">
                        <div class="w-1.5 h-1.5 bg-(--accent-color) rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Create advanced multi-step items for complex recipes</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</AnimatedModal>