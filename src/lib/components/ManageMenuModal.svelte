<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { MenuItem, MultistepEmotes } from "$lib/types";

  export let itemToEdit: MenuItem | null = null;

  const dispatch = createEventDispatcher();

  let name = "";
  let image = "";
  let price: number = 0;
  let stepsText = '';
  let isAdvanced = false;

  // Emote data structure
  let sectionData: { name: string; steps: string[] }[] = [
    { name: "", steps: [""] },
  ];

  $: stepsText = sectionData[0].steps.join('\n');

  // Type guard
  function isAdvancedEmotes(
    emotes: string[] | MultistepEmotes,
  ): emotes is MultistepEmotes {
    return (
      typeof emotes === "object" &&
      "advanced" in emotes &&
      (emotes as MultistepEmotes).advanced === true
    );
  }

  function updateSteps() {
    sectionData[0].steps = stepsText.split('\n');
  }

  onMount(() => {
    if (itemToEdit) {
      name = itemToEdit.name;
      image = itemToEdit.image ?? "";
      price = itemToEdit.price;
      sectionData = structuredClone(itemToEdit.emotes.sections);

      if (isAdvancedEmotes(itemToEdit.emotes)) {
        isAdvanced = true;
      } else {
        isAdvanced = false;
      }
    } else {
      // New item case
      isAdvanced = false;
      sectionData = [
        {
          name: "",
          steps: [""],
        },
      ];
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
      emotes: {
        advanced: isAdvanced ? true : false,
        sections: sectionData.filter((s) => s.steps.length > 0),
      },
      image: image.trim() || undefined,
    };

    dispatch("save", updatedItem);
  }
</script>

<!-- Modal Layout (unchanged, just reuses pre-filled fields) -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div
    class="bg-(--body-color) rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
  >
    <div
      class="overflow-auto custom-scrollbar scrollbar scrollbar-thin scrollbar-thumb-(--field-color) scrollbar-track-(--body-color) p-6 space-y-4 flex-1 min-h-0"
    >
      <h2 class="text-xl font-bold text-(--text-color)">
        {itemToEdit
          ? itemToEdit?.type != "section"
            ? "Edit Menu Item"
            : "Edit Section Name"
          : "Create New Menu Item"}
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

        <label class="flex items-center space-x-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            class="cursor-pointer"
            bind:checked={isAdvanced}
          />
          <span class="text-sm text-(--text-color)"
            >Advanced Multi-Step Item</span
          >
        </label>
        {#if isAdvanced}
          <div class="space-y-4">
            {#each sectionData as section, sIndex (sIndex)}
              {#if section?.steps}
                <div
                  class="border border-(--border-color) p-2 rounded bg-(--field-color) max-h-400"
                >
                  <div class="flex items-center justify-between">
                    <input
                      class="w-full px-3 py-1 border border-(--border-color) rounded bg-(--body-color) text-(--text-color)"
                      bind:value={section.name}
                      placeholder="Section name (e.g. Grill, Cook, Tricks)"
                    />
                    {#if sectionData.length != 1}
                      <button
                        class="ml-2 text-(--error-color) cursor-pointer"
                        on:click={() =>
                          (sectionData = sectionData.filter(
                            (_, i) => i !== sIndex,
                          ))}>✕</button
                      >
                    {/if}
                  </div>
                  <ul class="space-y-1 mt-2">
                    {#each section.steps as step, stepIndex (stepIndex)}
                      <li class="flex gap-2">
                        <input
                          class="w-full px-3 py-1 border border-(--border-color) rounded bg-(--body-color) text-(--text-color) ml-3"
                          bind:value={section.steps[stepIndex]}
                          placeholder="/me does something"
                        />
                        <button
                          class="text-(--error-color) cursor-pointer"
                          on:click={() =>
                            (sectionData[sIndex].steps = sectionData[
                              sIndex
                            ].steps.filter((_, i) => i !== stepIndex))}
                          >✕</button
                        >
                      </li>
                    {/each}
                    <button
                      class="text-(--accept-color) text-xs mt-2 cursor-pointer border-x-2 border-y-2 border-(--accept-color) p-1 rounded cursor-pointer"
                      on:click={() =>
                        (sectionData[sIndex].steps = [
                          ...sectionData[sIndex].steps,
                          "",
                        ])}
                    >
                      + Add Step
                    </button>
                  </ul>
                </div>
              {/if}
            {/each}
            <button
              class="text-green-600 text-sm cursor-pointer border-x-2 border-y-2 border-green-600 p-1 rounded cursor-pointer"
              on:click={() =>
                (sectionData = [...sectionData, { name: "", steps: [""] }])}
            >
              + Add Section
            </button>
          </div>
        {:else}
          <textarea
            bind:value={stepsText}
            on:input={updateSteps}
            class="w-full px-3 py-2 h-32 border border-(--border-color) rounded bg-(--field-color) text-(--text-color)"
            placeholder="/me prepares the drink"
          ></textarea>
        {/if}
      {/if}

      <div class="flex justify-end gap-2 pt-2">
        <button
          on:click={() => dispatch("close")}
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
</div>
