<script lang="ts">
  import { toasts } from '$lib/stores/toastStore';
  import { fly } from 'svelte/transition';
</script>

<div class="fixed bottom-4 right-4 flex flex-col gap-3 z-[9999]">
  {#each $toasts as toast (toast.id)}
    <div
      class={`px-4 py-3 rounded-lg shadow-md text-white text-sm max-w-xs ${
        toast.type === 'success' ? 'bg-green-500/50' :
        toast.type === 'error' ? 'bg-(--error-color)/50' : 'bg-(--accept-color)/50'
      }`}
      transition:fly="{{ y: 20, duration: 300 }}"
    >
      {toast.message}
    </div>
  {/each}
</div>
