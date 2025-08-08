<script lang="ts">
  import type { MenuItem, RPHelper } from "$lib/types";
  import { onMount, onDestroy } from "svelte";
  import { profiles } from "$lib/stores/profile";
  import { theme } from "$lib/stores/theme";
  import { goto } from "$app/navigation";
  import { v4 as uuid } from "uuid";
  import Toaster from "$lib/components/UI/Toaster.svelte";
  import { toasts } from "$lib/stores/toastStore";
  import ErrorBoundary from "$lib/components/UI/ErrorBoundary.svelte";
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';

  let profileList = $profiles;
  let showContextMenu = false;
  let showModal = false;
  let showHelpModal = false;
  let name = "";
  let image = "";
  let error = "";

  $: profileList = $profiles;

  let currentTheme = "dark";
  theme.subscribe((value) => (currentTheme = value));

  function toggleTheme() {
    theme.set(currentTheme === "light" ? "dark" : "light");
  }

  function toggleContextMenu() {
    showContextMenu = !showContextMenu;
  }

  function toggleHelpModal() {
    showHelpModal = !showHelpModal;
  }

  function handleClickOutside(event: MouseEvent) {
    const context = document.getElementById("context-menu-button");
    const help = document.getElementById("help-menu-button");
    if (
      !context?.contains(event.target as Node) &&
      !help?.contains(event.target as Node)
    ) {
      showContextMenu = false;
      showHelpModal = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  function createNewProfile() {
    showModal = true;
    name = "";
    image = "";
    error = "";
  }

  async function saveProfile() {
    if (!name.trim()) {
      error = "Name is required.";
      return;
    }

    const { validateImageUrl, sanitizeInput } = await import('$lib/utils/validation');
    const sanitizedName = sanitizeInput(name);
    const sanitizedImage = sanitizeInput(image);
    
    const imageValidation = validateImageUrl(sanitizedImage);
    if (!imageValidation.valid) {
      error = imageValidation.error!;
      return;
    }

    const newProfile = {
      id: uuid(),
      name: sanitizedName,
      image: sanitizedImage,
      menu: [] as MenuItem[],
      rpHelpers: [
        {
          name: "Example",
          commands: ["/me slides over drink"],
        },
      ] as RPHelper[],
    };

    profiles.update((current) => [...current, newProfile]);
    showModal = false;
  }

  function openProfile(profile: { id: any; name?: string; menu?: MenuItem[] }) {
    goto(`/profile/${profile.id}`);
  }

  async function importProfile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file
    const { validateFile, validateJSON, validateProfile } = await import('$lib/utils/validation');
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      toasts.addToast({ message: fileValidation.error!, type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        
        // Validate JSON
        const jsonValidation = validateJSON(jsonString);
        if (!jsonValidation.valid) {
          toasts.addToast({ message: jsonValidation.error!, type: "error" });
          return;
        }

        const parsed = JSON.parse(jsonString);
        const importedProfiles = Array.isArray(parsed) ? parsed : [parsed];

        const existingProfileIDs = new Set<string>();
        const existingMenuItemIDs = new Set<string>();

        profiles.update((currentProfiles) => {
          currentProfiles.forEach((profile) => {
            existingProfileIDs.add(profile.id);
            profile.menu.forEach((item: { id: string }) => {
              existingMenuItemIDs.add(item.id);
            });
          });
          return currentProfiles; // No change to store
        });

        const validProfiles = importedProfiles.filter((p) => {
          const profileValidation = validateProfile(p);
          if (!profileValidation.valid) {
            toasts.addToast({ message: profileValidation.error!, type: "error" });
            return false;
          }
          return true;
        });

        if (validProfiles.length === 0) {
          const error = "No valid profiles found in file.";
          toasts.addToast({ message: error, type: "error" });
          return;
        }

        for (const profile of validProfiles) {
          // Check if profile ID conflicts with existing profiles
          if (existingProfileIDs.has(profile.id)) {
            const error = `Profile ID conflict detected: ${profile.id}`;
            toasts.addToast({ message: error, type: "error" });
            return;
          }

          // Validate for duplicate menu IDs within the imported profile itself
          const internalMenuIDs = new Set<string>();
          for (const item of profile.menu) {
            if (internalMenuIDs.has(item.id)) {
              const error = `Duplicate Menu Item ID found in imported profile: ${item.id}`;
              toasts.addToast({ message: error, type: "error" });
              return;
            }
            internalMenuIDs.add(item.id);
          }

          // Validate against existing menu item IDs across other profiles
          for (const item of profile.menu) {
            if (existingMenuItemIDs.has(item.id)) {
              const error = `Menu Item ID conflict detected with existing data: ${item.id}`;
              toasts.addToast({ message: error, type: "error" });
              return;
            }
          }
        }

        // No conflicts found — Import profiles
        profiles.update((current) => [...current, ...validProfiles]);
        toasts.addToast({
          message: "Successfully imported the profile(s)",
          type: "success",
        });
      } catch (e) {
        const error = "Failed to parse JSON file.";
        toasts.addToast({ message: error, type: "error" });
      }
    };
    reader.readAsText(file);
  }

  function exportAllProfiles() {
    const dataStr = JSON.stringify($profiles, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profiles.json";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<!-- Enhanced Page Header -->
<div class="relative flex items-center justify-center mt-12 mb-8">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-(--text-color) mb-2 tracking-tight">
      Profile Manager
    </h1>
    <p class="text-(--text-color-muted) text-lg">
      Create and manage your bartender profiles
    </p>
  </div>
  
  <div class="absolute right-0 flex items-center gap-4 mr-8">
    <button
      on:click={toggleTheme}
      class="p-3 rounded-xl bg-(--field-color) border border-(--border-color) hover:bg-(--secondary-color-hover) transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
      aria-label="Toggle Theme"
    >
      {#if currentTheme === "light"}
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

      {#if showContextMenu}
        <div
          class="absolute right-0 mt-3 w-56 bg-(--field-color) border border-(--border-color) text-(--text-color) rounded-xl shadow-2xl z-50 backdrop-blur-sm"
          transition:fly={{ y: 10, duration: 200, easing: quintOut }}
        >
          <div class="p-2">
            <button
              class="w-full text-left px-4 py-3 hover:bg-(--accent-color) rounded-lg hover:text-black transition-all duration-200 cursor-pointer flex items-center gap-3 group"
              on:click={() =>
                document.getElementById("profile-import-input")?.click()}
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
              <span class="font-medium">Import Profile</span>
            </button>
            <button
              class="w-full text-left px-4 py-3 hover:bg-(--accent-color) rounded-lg hover:text-black transition-all duration-200 cursor-pointer flex items-center gap-3 group"
              on:click={exportAllProfiles}
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span class="font-medium">Export All Profiles</span>
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
    id="profile-import-input"
    type="file"
    accept=".json"
    class="hidden"
    on:change={importProfile}
  />
</div>

{#if showHelpModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-(--field-color) rounded-2xl p-8 shadow-2xl w-96 relative max-w-md" transition:scale={{ duration: 300, easing: elasticOut }}>
      <button
        class="absolute top-4 right-4 text-xl text-(--text-color-muted) hover:text-(--text-color) cursor-pointer transition-colors duration-200"
        on:click={toggleHelpModal}
      >
        ✕
      </button>

      <h2 class="text-2xl font-bold text-(--text-color) mb-6">Help & Support</h2>

      <div class="flex flex-col gap-4">
        <!-- Wikipedia Link -->
        <a
          href="https://github.com/Vierdant/world-bartender-tool/wiki"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 p-4 rounded-xl bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition-all duration-300 transform hover:scale-105 group shadow-lg"
        >
          <img src="github-icon.png" alt="Wiki" class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          <span class="font-semibold">Github Wiki</span>
        </a>

        <!-- Support Image -->
        <a
          href="https://ko-fi.com/vierdant"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 p-4 rounded-xl bg-(--error-color) text-white hover:bg-(--error-color-dark) transition-all duration-300 transform hover:scale-105 group shadow-lg"
        >
          <img src="coffee-icon.png" alt="Buy Coffee" class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          <span class="font-semibold">Buy me a coffee {":)"}</span>
        </a>

        <!-- Discord Link -->
        <a
          href="https://discord.gg/cnknQJDBer"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 p-4 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 group shadow-lg"
        >
          <img src="discord-icon.png" alt="Discord" class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          <span class="font-semibold">Join our Discord</span>
        </a>
      </div>
    </div>
  </div>
{/if}

{#if showModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div
      class="bg-(--body-color) rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-(--border-color)"
      transition:scale={{ duration: 300, easing: elasticOut }}
    >
      <h2 class="text-2xl font-bold text-(--text-color) mb-6">
        Create New Profile
      </h2>

      {#if error}
        <div class="mb-4 p-3 rounded-lg bg-(--error-color)/10 border border-(--error-color)/20">
          <p class="text-(--error-color) text-sm font-medium">{error}</p>
        </div>
      {/if}

      <div class="space-y-6">
        <div>
          <label for="profile-name-field" class="block text-(--text-color) mb-2 font-medium"
            >Profile Name</label
          >
          <input
            id="profile-name-field"
            type="text"
            bind:value={name}
            class="w-full px-4 py-3 rounded-xl border-2 border-(--border-color) bg-(--field-color) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
            placeholder="Cafe Vespucci"
          />
        </div>

        <div>
          <label
            for="profile-image-field"
            class="block text-(--text-color) mb-2 font-medium">Image URL</label
          >
          <input
            id="profile-image-field"
            type="text"
            bind:value={image}
            class="w-full px-4 py-3 rounded-xl border-2 border-(--border-color) bg-(--field-color) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
            placeholder="https://i.imgur.com/yGmS6e4.jpg"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-6">
          <button
            class="px-6 py-3 rounded-xl bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
            on:click={() => (showModal = false)}
          >
            Cancel
          </button>
          <button
            class="px-6 py-3 rounded-xl bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
            on:click={saveProfile}
          >
            Create Profile
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Enhanced Grid of Cards -->
<div class="flex flex-wrap justify-center gap-8 px-8 pb-12">
  {#each profileList as profile, index (profile.id)}
    <button
      class="relative w-64 h-80 bg-(--field-color) rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group border border-(--border-color)"
      on:click={() => openProfile(profile)}
      style="animation-delay: {index * 100}ms"
      in:fly={{ y: 50, duration: 600, delay: index * 100, easing: quintOut }}
    >
      <!-- Image with overlay -->
      <div class="absolute inset-0 overflow-hidden">
        <img
          src={profile.image}
          alt={profile.name}
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      
      <!-- Content overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-6">
        <div class="bg-black/40 backdrop-blur-sm rounded-lg p-4 -mb-2">
          <h3 class="text-xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
            {profile.name}
          </h3>
          <div class="flex items-center gap-2 text-white/90 text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <span>{profile.menu?.length || 0} items</span>
          </div>
        </div>
      </div>
      
      <!-- Hover effect overlay -->
      <div class="absolute inset-0 bg-(--accent-color)/0 group-hover:bg-(--accent-color)/10 transition-all duration-300"></div>
    </button>
  {/each}

  <!-- Enhanced Add Profile Card -->
  <button
    class="w-64 h-80 flex flex-col items-center justify-center rounded-2xl shadow-xl bg-(--field-color) border-2 border-dashed border-(--border-color) text-(--text-color-muted) hover:text-(--accent-color) hover:border-(--accent-color) hover:bg-(--accent-color)/5 transition-all duration-500 cursor-pointer group"
    on:click={createNewProfile}
    in:fly={{ y: 50, duration: 600, delay: profileList.length * 100, easing: quintOut }}
  >
    <div class="text-6xl font-light mb-4 group-hover:scale-125 transition-transform duration-300">
      +
    </div>
    <p class="text-lg font-medium">Create New Profile</p>
    <p class="text-sm text-(--text-color-muted) mt-2 text-center">
      Start building your bartender profile
    </p>
  </button>
</div>

<ErrorBoundary>
  <Toaster />
</ErrorBoundary>
