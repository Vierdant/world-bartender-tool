<script lang="ts">
  import { activeProfile } from '$lib/stores/profile';
  import { get, writable } from 'svelte/store';
  import { nanoid } from 'nanoid';
  import type { MenuItem } from '$lib/types';

  let newItemName = '';
  let newItemEmotes = '';
  let newPrice = "";
  const error = writable('');

  function addItem() {
    const trimmedName = newItemName.trim();
    const emotes = newItemEmotes.split('\n').map(e => e.trim()).filter(Boolean);
    if (!trimmedName || emotes.length === 0) {
      error.set('Name and at least one emote are required.');
      return;
    }

    const newItem: MenuItem = {
      id: nanoid(),
      name: trimmedName,
      type: "item",
      available: true,
      price: 0.0,
      emotes
    };

    activeProfile.update(profile => {
      if (!profile) return profile;
      profile.menu = [...profile.menu, newItem];
      return { ...profile };
    });
    
    const price = parseFloat(newPrice);
    if (!isNaN(price)) newItem.price = price;

    newItemName = '';
    newItemEmotes = '';
    error.set('');
  }

  function toggleAvailability(itemId: string) {
    activeProfile.update(profile => {
      if (!profile) return profile;
      profile.menu = profile.menu.map(item =>
        item.id === itemId ? { ...item, available: !item.available } : item
      );
      return { ...profile };
    });
  }

  function deleteItem(itemId: string) {
    activeProfile.update(profile => {
      if (!profile) return profile;
      profile.menu = profile.menu.filter(item => item.id !== itemId);
      return { ...profile };
    });
  }
</script>

{#if $activeProfile}
  <div class="bg-[#2b2d31] p-4 rounded-lg shadow-lg text-[#b9bbbe] max-w-2xl mx-auto mt-6">
    <h2 class="text-xl font-bold text-white mb-4">Menu Editor: {$activeProfile.name}</h2>

    <!-- Add New Item -->
    <div class="mb-6">
      <input
        placeholder="Item Name"
        bind:value={newItemName}
        class="bg-[#1e1f22] border border-[#3f4147] px-3 py-2 rounded text-white w-full mb-2"
      />
      <textarea
        placeholder="One /me emote per line"
        bind:value={newItemEmotes}
        class="bg-[#1e1f22] border border-[#3f4147] px-3 py-2 rounded text-white w-full h-24"
      ></textarea>
      {#if $error}
        <div class="text-red-400 mt-1">{$error}</div>
      {/if}
      <button
        on:click={addItem}
        class="mt-2 bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4]"
      >
        Add Item
      </button>
      <input
  type="number"
  bind:value={newPrice}
  placeholder="Price (optional)"
  class="bg-[#1e1f22] border border-[#3f4147] px-3 py-2 rounded text-white w-full mb-2"
/>
    </div>

    <!-- Item List -->
    <div class="space-y-3">
      {#each $activeProfile.menu as item (item.id)}
        <div class="bg-[#1e1f22] border border-[#3f4147] rounded p-3 flex justify-between items-start">
          <div class="w-full">
            <div class="flex items-center justify-between mb-1">
              <strong class="text-white">{item.name}</strong>
              <button
                on:click={() => deleteItem(item.id)}
                class="text-red-500 text-sm hover:text-red-300"
              >
                ✕
              </button>
            </div>
            <div class="text-sm text-[#b9bbbe]">
              {item.emotes.length} emote{item.emotes.length > 1 ? 's' : ''}
            </div>
            <label class="text-xs mt-2 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.available}
                on:change={() => toggleAvailability(item.id)}
              />
              Available
            </label>
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="text-white mt-4 text-center">Select a profile to edit its menu.</div>
{/if}