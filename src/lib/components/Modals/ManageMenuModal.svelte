<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { MenuItem, MultistepEmotes } from "$lib/types";
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let itemToEdit: MenuItem | null = null;

  const dispatch = createEventDispatcher();

  let name = "";
  let image = "";
  let price: number = 0;
  let stepsText = '';
  let isAdvanced = false;
  let isSaving = false;
  
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

  async function save() {
    if (!name.trim()) return;

    isSaving = true;

    const { sanitizeInput } = await import('$lib/utils/validation');
    const sanitizedName = sanitizeInput(name);
    const sanitizedImage = sanitizeInput(image);

    const updatedItem: MenuItem = {
      id: itemToEdit?.id ?? crypto.randomUUID(),
      name: sanitizedName,
      type: itemToEdit?.type ?? "item",
      available: true,
      price: parseFloat(price.toFixed(2)),
      emotes: {
        advanced: isAdvanced ? true : false,
        sections: sectionData.filter((s) => s.steps.length > 0),
      },
      image: sanitizedImage || undefined,
    };

    dispatch("save", updatedItem);
    handleClose();
    
    setTimeout(() => {
      isSaving = false;
    }, 500);
  }

  function handleClose() {
    dispatch("close");
  }
</script>

<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="-1"
  on:keydown={(e) => e.key === 'Escape' && handleClose()}
  in:fade={{ duration: 200 }}
  out:fade={{ duration: 200 }}
>
  <!-- Modal Content -->
  <div
    class="bg-(--body-color) border-2 border-(--border-color) rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
    role="document"
    in:scale={{ duration: 300, easing: quintOut, start: 0.9 }}
    out:scale={{ duration: 200, easing: quintOut, start: 1 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-(--border-color)">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-(--accent-color) rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
          </svg>
        </div>
        <div>
          <h2 id="modal-title" class="text-xl font-bold text-(--text-color)">
            {itemToEdit
              ? itemToEdit?.type != "section"
                ? "Edit Menu Item"
                : "Edit Section Name"
              : "Create New Menu Item"}
          </h2>
          <p class="text-sm text-(--text-color-muted)">
            {itemToEdit ? "Update the item details" : "Add a new item to your menu"}
          </p>
        </div>
      </div>
      
              <button
          on:click={handleClose}
          class="p-2 rounded-lg hover:bg-(--secondary-color) transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg class="w-5 h-5 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="overflow-auto flex-1 p-6 space-y-6">
      <!-- Basic Information -->
      <div class="space-y-4" in:fly={{ y: 20, duration: 300, delay: 100, easing: quintOut }}>
        <div>
          <label for="item-name" class="block text-sm font-medium text-(--text-color) mb-2">
            Item Name *
          </label>
          <input
            id="item-name"
            placeholder="Enter item name..."
            bind:value={name}
            class="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--field-color) text-(--text-color) placeholder-(--text-color-muted) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
          />
        </div>

        {#if itemToEdit?.type != "section"}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="item-image" class="block text-sm font-medium text-(--text-color) mb-2">
                Image URL (optional)
              </label>
              <input
                id="item-image"
                placeholder="https://example.com/image.jpg"
                bind:value={image}
                class="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--field-color) text-(--text-color) placeholder-(--text-color-muted) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label for="item-price" class="block text-sm font-medium text-(--text-color) mb-2">
                Price
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-color-muted)">$</span>
                <input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  bind:value={price}
                  class="w-full pl-8 pr-4 py-3 rounded-lg border border-(--border-color) bg-(--field-color) text-(--text-color) placeholder-(--text-color-muted) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

                     <!-- Advanced Toggle -->
           <div class="flex items-center justify-between p-4 bg-(--field-color) rounded-lg">
             <div class="flex items-center gap-3">
               <svg class="w-5 h-5 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
               </svg>
               <div>
                 <label for="advanced-toggle" class="text-sm font-medium text-(--text-color) cursor-pointer">
                   Advanced Multi-Step Item
                 </label>
                 <p class="text-xs text-(--text-color-muted)">
                   Create complex items with multiple sections and steps
                 </p>
               </div>
             </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                id="advanced-toggle"
                type="checkbox"
                class="sr-only peer"
                bind:checked={isAdvanced}
              />
              <div class="w-11 h-6 bg-(--border-color) peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-(--accent-color) rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-(--field-color) after:border-(--border-color) after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--accent-color)"></div>
            </label>
          </div>
        {/if}
      </div>

      <!-- Emotes Configuration -->
      {#if itemToEdit?.type != "section"}
        <div class="space-y-4" in:fly={{ y: 20, duration: 300, delay: 200, easing: quintOut }}>
          {#if isAdvanced}
            <!-- Advanced Multi-Step Configuration -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 class="text-lg font-semibold text-(--text-color) ">Multi-Step Sections</h3>
              </div>
              
                             {#each sectionData as section, sIndex (sIndex)}
                 {#if section?.steps}
                   <div class="bg-(--field-color) rounded-xl p-4 border border-(--border-color)" in:fly={{ y: 20, duration: 300, delay: sIndex * 50, easing: quintOut }}>
                     <div class="flex items-center justify-between mb-4">
                       <div class="flex-1">
                         <input
                           class="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--body-color) text-(--text-color) placeholder-(--text-color-muted) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
                           bind:value={section.name}
                           placeholder="Section name (e.g. Grill, Cook, Tricks)"
                         />
                       </div>
                       {#if sectionData.length != 1}
                         <button
                           class="ml-3 p-2 text-(--error-color) hover:text-(--error-color-dark) hover:bg-(--error-color)/10 rounded-lg transition-colors cursor-pointer"
                           on:click={() => (sectionData = sectionData.filter((_, i) => i !== sIndex))}
                           aria-label="Remove section"
                         >
                           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                           </svg>
                         </button>
                       {/if}
                     </div>
                     
                     <div class="space-y-2">
                       {#each section.steps as step, stepIndex (stepIndex)}
                         <div class="flex gap-2 items-center">
                           <div class="flex-1">
                             <input
                               class="w-full px-4 py-3 rounded-lg border border-(--border-color) bg-(--body-color) text-(--text-color) placeholder-(--text-color-muted) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200"
                               bind:value={section.steps[stepIndex]}
                               placeholder="/me does something"
                             />
                           </div>
                           <button
                             class="p-2 text-(--error-color) hover:text-(--error-color-dark) hover:bg-(--error-color)/10 rounded-lg transition-colors cursor-pointer"
                             on:click={() => (sectionData[sIndex].steps = sectionData[sIndex].steps.filter((_, i) => i !== stepIndex))}
                             aria-label="Remove step"
                           >
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                             </svg>
                           </button>
                         </div>
                       {/each}
                       
                       <button
                         class="w-full mt-3 text-(--info-color) hover:text-(--info-color-dark) border-2 border-(--info-color) hover:bg-(--info-color)/10 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                         on:click={() => (sectionData[sIndex].steps = [...sectionData[sIndex].steps, ""])}
                       >
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                         </svg>
                         Add Step
                       </button>
                     </div>
                   </div>
                 {/if}
               {/each}
               
               <button
                 class="w-full text-(--info-color) hover:text-(--info-color-dark) border-2 border-(--info-color) hover:bg-(--info-color)/10 px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                 on:click={() => (sectionData = [...sectionData, { name: "", steps: [""] }])}
               >
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                 </svg>
                 Add New Section
               </button>
            </div>
          {:else}
            <!-- Simple Steps Configuration -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-(--border-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-(--text-color)">Simple Steps</h3>
              </div>
              
              <div>
                <label for="emote-steps" class="block text-sm font-medium text-(--text-color) mb-2">
                  Emote Steps (one per line)
                </label>
                <textarea
                  id="emote-steps"
                  bind:value={stepsText}
                  on:input={updateSteps}
                  class="w-full px-4 py-3 h-32 rounded-lg border border-(--border-color) bg-(--field-color) text-(--text-color) focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="/me prepares the drink"
                ></textarea>
                <p class="text-xs text-(--text-color-muted) mt-1">
                  * Enter each emote on a new line
                </p>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t border-(--border-color) bg-(--body-color)">
      <button
        on:click={handleClose}
        class="px-6 py-3 text-sm font-medium text-(--text-color) bg-(--field-color) border border-(--border-color) rounded-lg hover:bg-(--border-color) transition-all duration-200 cursor-pointer"
      >
        Cancel
      </button>
      <button
        on:click={save}
        disabled={!name.trim() || isSaving}
        class="px-6 py-3 text-sm font-medium text-white bg-(--info-color) hover:bg-(--info-color-dark) rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if isSaving}
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Saving...</span>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{itemToEdit ? "Update" : "Create"}</span>
        {/if}
      </button>
    </div>
  </div>
</div>
