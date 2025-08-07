<!-- src/lib/components/RPHelperModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Order, MenuItem, Profile } from "$lib/types";
  import Toaster from "$lib/components/Toaster.svelte";
  import { toasts } from "$lib/stores/toastStore";

  export let item: MenuItem;
  export let order: Order;

  const dispatch = createEventDispatcher();
  

  function fillPlaceholders(template: string): string {
    return template
      .replace("!name", order.customerName || "the customer")
      .replace("!id", order.customerId + "" || " ");
  }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-(--body-color) rounded-lg p-6 w-full max-w-xl shadow-lg">
    <h2 class="text-xl font-bold mb-4 text-(--text-color)">
      Actions for {item.name}
    </h2>

    <div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
      {#if item.emotes.sections.length > 0}
        {#if item.emotes.advanced}
          {#each item.emotes.sections as section}
            <div class="bg-(--field-color) p-4 rounded">
              <h3 class="font-semibold mb-2 text-(--text-color)">
                {section.name}
              </h3>
              <ul class="space-y-1">
                {#each section.steps as step}
                  <li
                    class="flex justify-between items-center border-t-1 border-(--border-color)"
                  >
                    <span class="text-sm text-(--text-color)">
                      {fillPlaceholders(step)}
                    </span>
                    <button
                      class="text-(--accept-color) text-xs cursor-pointer"
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
          <div class="bg-(--field-color) p-4 rounded">
            <h3 class="font-semibold mb-2 text-(--text-color)">
              {item.emotes.sections[0].name}
            </h3>
            <ul class="space-y-1">
              {#each item.emotes.sections[0].steps as step}
                <li
                  class="flex justify-between items-center border-t-1 border-(--border-color)"
                >
                  <span class="text-sm text-(--text-color)">
                    {fillPlaceholders(step)}
                  </span>
                  <button
                    class="text-(--accept-color) text-xs cursor-pointer"
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
        <div class="text-sm text-(--text-color) text-center">
          No Actions configured.
        </div>
      {/if}
    </div>

    <div class="text-right mt-4">
      <button
        on:click={() => dispatch("close")}
        class="bg-(--accept-color) text-white px-4 py-2 rounded hover:bg-blue-500 text-sm cursor-pointer transition"
      >
        Close
      </button>
    </div>
  </div>
</div>
<Toaster />
