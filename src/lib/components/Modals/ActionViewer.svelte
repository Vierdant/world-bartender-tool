<!-- src/lib/components/ActionViewer.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Order, MenuItem } from "$lib/types";
  import Toaster from "$lib/components/UI/Toaster.svelte";
  import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";
  import { toasts } from "$lib/stores/toastStore";

  export let item: MenuItem;
  export let order: Order;
  export let show = false;

  const dispatch = createEventDispatcher();
  
  function fillPlaceholders(template: string): string {
    return template
      .replace("!name", order.customerName || "the customer")
      .replace("!id", order.customerId + "" || " ");
  }

  function handleClose() {
    dispatch("close");
  }
</script>

<AnimatedModal {show} on:close={handleClose}>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-(--text-color)">
        Actions for {item.name}
      </h2>
      <button
        on:click={handleClose}
        class="text-(--text-color-muted) hover:text-(--text-color) transition-colors cursor-pointer"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
      {#if item.emotes.sections.length > 0}
        {#if item.emotes.advanced}
          {#each item.emotes.sections as section}
            <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color)">
              <h3 class="font-semibold mb-3 text-(--text-color) flex items-center gap-2">
                <svg class="w-4 h-4 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                {section.name}
              </h3>
              <ul class="space-y-2">
                {#each section.steps as step}
                  <li class="flex justify-between items-center p-2 rounded bg-(--body-color) transition-colors">
                    <span class="text-sm text-(--text-color) flex-1">
                      {fillPlaceholders(step)}
                    </span>
                    <button
                      class="text-(--info-color) text-xs cursor-pointer px-2 py-1 rounded hover:bg-(--info-color) hover:text-white transition-colors"
                      on:click={() => {
                        navigator.clipboard.writeText(fillPlaceholders(step));
                        toasts.addToast({
                          message: "RP command copied",
                          type: "info",
                        });
                      }}
                    >
                      Copy
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        {:else}
          <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color)">
            <h3 class="font-semibold mb-3 text-(--text-color) flex items-center gap-2">
              <svg class="w-4 h-4 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              {item.emotes.sections[0].name}
            </h3>
            <ul class="space-y-2">
              {#each item.emotes.sections[0].steps as step}
                <li class="flex justify-between items-center p-2 rounded bg-(--body-color) hover:bg-(--secondary-color) transition-colors">
                  <span class="text-sm text-(--text-color) flex-1">
                    {fillPlaceholders(step)}
                  </span>
                  <button
                    class="text-(--info-color) text-xs cursor-pointer px-2 py-1 rounded hover:bg-(--info-color) hover:text-white transition-colors"
                    on:click={() => {
                      navigator.clipboard.writeText(fillPlaceholders(step));
                      toasts.addToast({
                        message: "RP command copied",
                        type: "info",
                      });
                    }}
                  >
                    Copy
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {:else}
        <div class="text-sm text-(--text-color-muted) text-center py-8">
          <svg class="w-12 h-12 mx-auto mb-4 text-(--text-color-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          No Actions configured.
        </div>
      {/if}
    </div>

    <div class="flex justify-end pt-4 border-t border-(--border-color)">
              <button
          on:click={handleClose}
          class="bg-(--info-color) text-white px-6 py-2 rounded-lg hover:bg-(--info-color-dark) transition-colors font-medium cursor-pointer"
        >
          Close
        </button>
    </div>
  </div>
</AnimatedModal>

<Toaster/>
