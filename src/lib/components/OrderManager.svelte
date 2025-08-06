<script lang="ts">
  import { activeProfile, currentOrders } from '$lib/stores/profile';
  import type { Order, MenuItem } from '$lib/types';
  import { nanoid } from 'nanoid';
  import { writable, get } from 'svelte/store';
  import { randomEmote } from '$lib/utils/emote';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import { fly, fade } from 'svelte/transition';

  const newCustomerName = writable('');
  const itemQuantities = writable<Record<string, number>>({});
  const collapsedOrders = writable<Record<string, boolean>>({});

  function createOrder() {
    const name = get(newCustomerName).trim();
    const quantities = get(itemQuantities);
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, qty }));

    if (items.length === 0) return;

    const newOrder: Order = {
      id: nanoid(),
      customerName: name || undefined,
      items
    };

    currentOrders.update(o => [...o, newOrder]);
    newCustomerName.set('');
    itemQuantities.set({});
  }

  function completeOrder(id: string) {
    currentOrders.update(o => o.filter(order => order.id !== id));
  }

  function getItem(itemId: string): MenuItem | undefined {
    return get(activeProfile)?.menu.find(m => m.id === itemId);
  }

  function copyEmote(itemId: string, customerName?: string) {
    const item = getItem(itemId);
    if (!item) return;
    const text = randomEmote(item.emotes, { name: customerName ?? '' });
    writeText(text);
  }

  function toggleCollapse(id: string) {
    collapsedOrders.update(state => ({ ...state, [id]: !state[id] }));
  }
</script>

{#if $activeProfile}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#2b2d31] p-6 rounded-lg shadow-lg text-[#b9bbbe] max-w-6xl mx-auto mt-6">

    <!-- LEFT: Order Creation -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-white">Create New Order</h2>
      
      <input
        placeholder="Customer Name (optional)"
        bind:value={$newCustomerName}
        class="bg-[#1e1f22] border border-[#3f4147] px-3 py-2 rounded text-white w-full"
      />

      <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {#each $activeProfile.menu.filter(i => i.available) as item}
          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-2 w-full">
              <input
                type="number"
                min="0"
                bind:value={$itemQuantities[item.id]}
                class="w-20 bg-[#1e1f22] border border-[#3f4147] px-2 py-1 rounded text-white"
              />
              <span class="truncate">{item.name}</span>
            </label>
            {#if item.price}
              <span class="text-sm text-green-400">${item.price.toFixed(2)}</span>
            {/if}
          </div>
        {/each}
      </div>

      <button
        on:click={createOrder}
        class="w-full bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition"
      >
        ➕ Add Order
      </button>
    </div>

    <!-- RIGHT: Current Orders -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-white">Current Orders</h2>

      {#each $currentOrders as order (order.id)}
        <div class="bg-[#1e1f22] border border-[#3f4147] rounded p-3" transition:fly={{ y: 10 }}>
          <div class="flex justify-between items-center mb-2">
            <strong class="text-white truncate">{order.customerName || 'Unnamed Order'}</strong>
            <div class="flex gap-2">
              <button
                on:click={() => toggleCollapse(order.id)}
                class="text-sm text-yellow-400 hover:text-yellow-300"
              >
                {#if $collapsedOrders[order.id]}▼ Expand{:else}▲ Collapse{/if}
              </button>
              <button
                on:click={() => completeOrder(order.id)}
                class="text-sm text-green-400 hover:text-green-300"
              >
                ✓ Complete
              </button>
            </div>
          </div>

          {#if !$collapsedOrders[order.id]}
            <ul class="ml-4 list-disc text-sm space-y-1" transition:fade>
              {#each order.items as orderItem}
                {#if getItem(orderItem.id)}
                  <li class="flex justify-between items-center gap-2">
                    <span>{getItem(orderItem.id)?.name} × {orderItem.qty}</span>
                    <button
                      on:click={() => copyEmote(orderItem.id, order.customerName)}
                      class="text-xs text-[#5865f2] hover:underline"
                    >
                      📋 Copy RP
                    </button>
                  </li>
                {/if}
              {/each}
            </ul>
          {/if}
        </div>
      {/each}

      {#if $currentOrders.length === 0}
        <p class="text-center text-sm text-[#888] mt-6">No active orders.</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="text-white mt-4 text-center">Select a profile to manage orders.</div>
{/if}
