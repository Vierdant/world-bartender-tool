<script lang="ts">
  import type { MenuItem, RPHelper } from "$lib/types";
  import { onMount, onDestroy } from "svelte";
  import { profiles } from "$lib/stores/profile";
  import { theme } from "$lib/stores/theme";
  import { goto } from "$app/navigation";
  import { v4 as uuid } from "uuid";
  import Toaster from "$lib/components/Toaster.svelte";
  import { toasts } from "$lib/stores/toastStore";

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

  function saveProfile() {
    if (!name.trim()) {
      error = "Name is required.";
      return;
    }

    const imagePattern = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i;
    if (!imagePattern.test(image.trim())) {
      error = "Please enter a valid image URL ending in an image extension.";
      return;
    }

    const newProfile = {
      id: uuid(),
      name,
      image,
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

  function importProfile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
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

        const validProfiles = importedProfiles.filter(
          (p) => p.id && p.name && p.image,
        );

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

<!-- Page Header -->
<div class="relative flex items-center justify-center mt-8 mb-4">
  <h1 class="text-3xl font-bold text-(--text-color)">Profile Manager</h1>
  <div class="absolute right-0 flex items-center gap-5 mr-8">
    <button
      on:click={toggleTheme}
      class="absolute right-0 p-3 mr-14 rounded-full bg-black dark:bg-(--accent-color) transition-colors cursor-pointer"
      aria-label="Toggle Theme"
    >
      {#if currentTheme === "light"}
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

      {#if showContextMenu}
        <div
          class="absolute right-0 mt-2 w-48 bg-(--field-color) border border-(--border-color) text-(--text-color) rounded-lg shadow-lg z-50"
        >
          <button
            class="w-full text-left px-4 py-2 hover:bg-(--accent-color) rounded hover:text-black transition cursor-pointer"
            on:click={() =>
              document.getElementById("profile-import-input")?.click()}
          >
            Import Profile
          </button>
          <button
            class="w-full text-left px-4 py-2 hover:bg-(--accent-color) rounded hover:text-black transition cursor-pointer"
            on:click={exportAllProfiles}
          >
            Export All Profiles
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
    id="profile-import-input"
    type="file"
    accept=".json"
    class="hidden"
    on:change={importProfile}
  />
</div>

{#if showHelpModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-(--field-color) rounded-xl p-8 shadow-2xl w-96 relative">
      <button
        class="absolute top-3 right-3 text-xl text-(--text-color-muted) cursor-pointer"
        on:click={toggleHelpModal}
      >
        ✕
      </button>

      <h2 class="text-2xl font-semibold text-(--text-color) mb-4">Help & Support</h2>

      <div class="flex flex-col gap-4">
        <!-- Wikipedia Link -->
        <a
          href="https://github.com/Vierdant/world-bartender-tool/wiki"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 rounded-lg bg-(--accent-color) text-black hover:opacity-80 transition"
        >
          <img src="github-icon.png" alt="Wiki" class="w-6 h-6" />
          <span>Github Wiki</span>
        </a>

        <!-- Support Image -->
        <a
          href="https://ko-fi.com/vierdant"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 rounded-lg bg-(--error-color) text-white hover:opacity-80 transition"
        >
          <img src="coffee-icon.png" alt="Buy Coffee" class="w-6 h-6" />
          <span>Buy me a coffee {":)"}</span>
        </a>

        <!-- Discord Link -->
        <a
          href="https://discord.gg/cnknQJDBer"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 rounded-lg bg-indigo-500 text-white hover:opacity-80 transition"
        >
          <img src="discord-icon.png" alt="Discord" class="w-6 h-6" />
          <span>Join our Discord</span>
        </a>
      </div>
    </div>
  </div>
{/if}


{#if showModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div
      class="bg-(--body-color) rounded-xl shadow-lg p-6 w-full max-w-md relative"
    >
      <h2 class="text-xl font-semibold text-(--text-color) mb-4">
        Create New Profile
      </h2>

      {#if error}
        <p class="text-(--error-color) text-sm mb-2">{error}</p>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="profile-name-field" class="block text-(--text-color) mb-1"
            >Name</label
          >
          <input
            id="profile-name-field"
            type="text"
            bind:value={name}
            class="w-full px-4 py-2 rounded-md border-2 border-(--border-color) bg-(--field-color) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--accent-color)"
            placeholder="Cafe Vespucci"
          />
        </div>

        <div>
          <label
            for="profile-image-field"
            class="block text-(--text-color) mb-1">Image URL</label
          >
          <input
            id="profile-image-field"
            type="text"
            bind:value={image}
            class="w-full px-4 py-2 rounded-md border-2 border-(--border-color) bg-(--field-color) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--accent-color)"
            placeholder="https://i.imgur.com/yGmS6e4.jpg"
          />
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <button
            class="px-4 py-2 rounded-md bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition cursor-pointer"
            on:click={() => (showModal = false)}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-md bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition cursor-pointer"
            on:click={saveProfile}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Grid of Cards -->
<div class="flex flex-wrap justify-left gap-6 pl-20 pr-20">
  {#each profileList as profile (profile.id)}
    <button
      class="relative w-52 h-80 bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
      on:click={() => openProfile(profile)}
    >
      <img
        src={profile.image || "/placeholder.jpg"}
        alt={profile.name}
        class="absolute top-0 w-full h-full object-cover"
      />
      <div
        class="absolute bottom-0 w-full bg-(--accent-color) text-black text-center font-semibold py-3 px-4"
      >
        {profile.name}
      </div>
    </button>
  {/each}

  <!-- Add Profile Card -->
  <button
    class="w-52 h-80 flex items-center justify-center rounded-2xl shadow-xl bg-(--body-color) border-x-8 border-y-8 border-(--border-color) text-(--border-color) text-[4rem] font-semibold text-xl cursor-pointer hover:scale-105 transition-transform cursor-pointer"
    on:click={createNewProfile}
  >
    +
  </button>
</div>
<Toaster />
