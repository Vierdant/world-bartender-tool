<script lang="ts">
  import type { MenuItem } from '$lib/types';
  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import { randomEmote } from '$lib/utils/emote';

  export let item: MenuItem;
  export let customerName: string;

  function copyEmote() {
    const output = randomEmote(item.emotes, { name: customerName });
    writeText(output);
  }
</script>

<div class="p-2 rounded shadow bg-white border">
  <strong>{item.name}</strong>
  <button on:click={copyEmote} class="text-sm text-blue-600 underline ml-2">
    Copy RP
  </button>
</div>