<script lang="ts">
    import type { Profile } from '$lib/types';
    import { theme } from '$lib/stores/theme';
    import { showContextMenu, showHelpModal, toggleTheme, toggleContextMenu, toggleHelpModal } from '$lib/stores/uiStore';
    import { exportCurrentProfile, updateProfileFromFile } from '$lib/stores/menuStore';
    import { showReturnConfirm } from '$lib/stores/uiStore';
    import { goto } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';

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
        if (
            !context?.contains(event.target as Node) &&
            !help?.contains(event.target as Node)
        ) {
            showContextMenu.set(false);
            showHelpModal.set(false);
        }
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
            {#if currentThemeValue === "light"}
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

            {#if $showContextMenu}
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

{#if $showHelpModal}
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
                    <img src="../../../github-icon.png" alt="Wiki" class="w-6 h-6" />
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
                        src="../../../coffee-icon.png"
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
                        src="../../../discord-icon.png"
                        alt="Discord"
                        class="w-6 h-6"
                    />
                    <span>Join our Discord</span>
                </a>
            </div>
        </div>
    </div>
{/if}