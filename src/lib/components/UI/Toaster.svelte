<script lang="ts">
  import { toasts } from '$lib/stores/toastStore';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  // Import the removeToast method from the store
  const { removeToast } = toasts;

  let toastTimeouts: Map<string, number> = new Map();

  onMount(() => {
    return () => {
      // Clean up timeouts on component destroy
      toastTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  });

  function dismissToast(toastId: string) {
    // Clear timeout if it exists
    const timeout = toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.delete(toastId);
    }
    // Use the store's removeToast method
    removeToast(toastId);
  }

  function getToastIconType(type: string) {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  function getToastStyles(type: string) {
    const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm max-w-sm min-w-[320px]";
    const iconStyles = "flex-shrink-0 mt-0.5";
    
    switch (type) {
      case 'success':
        return {
          container: `${baseStyles} bg-green-500/90 border-green-400/50 text-white`,
          icon: `${iconStyles} text-green-100`
        };
      case 'error':
        return {
          container: `${baseStyles} bg-(--error-color)/90 border-(--error-color)/50 text-white`,
          icon: `${iconStyles} text-red-100`
        };
      default:
        return {
          container: `${baseStyles} bg-(--accept-color)/90 border-(--accept-color)/50 text-white`,
          icon: `${iconStyles} text-blue-100`
        };
    }
  }

  // Auto-dismiss toasts - optimized to avoid excessive timeout creation
  $: {
    $toasts.forEach(toast => {
      if (!toastTimeouts.has(toast.id) && !toast.duration) {
        const timeout = setTimeout(() => {
          dismissToast(toast.id);
        }, 5000);
        toastTimeouts.set(toast.id, timeout);
      }
    });
  }
</script>

<div class="fixed bottom-4 right-4 flex flex-col gap-3 z-[9999]">
  {#each $toasts as toast (toast.id)}
          <div
        class={getToastStyles(toast.type).container}
        transition:fly={{ y: 20, duration: 300, easing: quintOut }}
      >
      <!-- Icon -->
      <div class={getToastStyles(toast.type).icon}>
        {#if getToastIconType(toast.type) === 'success'}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        {:else if getToastIconType(toast.type) === 'error'}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        {/if}
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium leading-relaxed">
          {toast.message}
        </p>
      </div>
      
      <!-- Close Button -->
      <button
        on:click={() => dismissToast(toast.id)}
        class="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/20 transition-colors duration-200 group"
        aria-label="Dismiss notification"
      >
        <svg class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  {/each}
</div>
