<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { MenuItem } from '$lib/types';

  export let itemToEdit: MenuItem | null = null;

  const dispatch = createEventDispatcher();

  let name = '';
  let image = '';
  let price: number = 0;
  let emotes = '';

  onMount(() => {
    if (itemToEdit) {
      name = itemToEdit.name;
      image = itemToEdit.image ?? '';
      price = itemToEdit.price;
      emotes = itemToEdit.emotes.join('\n');
    }
  });

  function save() {
    if (!name.trim()) return;

    const updatedItem: MenuItem = {
      id: itemToEdit?.id ?? crypto.randomUUID(),
      name: name.trim(),
      type: itemToEdit?.type ?? "item",
      available: true,
      price: parseFloat(price.toFixed(2)),
      emotes: emotes
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean),
      image: image.trim() || undefined
    };

    dispatch('save', updatedItem);
  }
</script>

<!-- Modal Layout (unchanged, just reuses pre-filled fields) -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-(--body-color) p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
    <h2 class="text-xl font-bold text-(--text-color)">
      {itemToEdit ? (itemToEdit?.type != "section" ? 'Edit Menu Item' : 'Edit Section Name') : 'Create New Menu Item'}
    </h2>

    <input
      placeholder="Item Name"
      bind:value={name}
      class="w-full px-3 py-2 border border-(--border-color) rounded bg-(--field-color) text-(--text-color)"
    />

    {#if itemToEdit?.type != "section"}
      <input
        placeholder="Image URL (optional)"
        bind:value={image}
        class="w-full px-3 py-2 border border-(--border-color) rounded bg-(--field-color) text-(--text-color)"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        bind:value={price}
        class="w-full px-3 py-2 border border-(--border-color) rounded bg-(--field-color) text-(--text-color)"
      />

      <textarea
        placeholder="/me prepartion lines (one per line)"
        bind:value={emotes}
        rows="4"
        class="w-full px-3 py-2 border border-(--border-color) rounded bg-(--field-color) text-(--text-color)"
      ></textarea>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
      <button
        on:click={() => dispatch('close')}
        class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition rounded cursor-pointer"
      >
        Cancel
      </button>
      <button
        on:click={save}
        class="px-4 py-2 text-sm bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition rounded cursor-pointer"
      >
        Create
      </button>
    </div>
  </div>
</div>
