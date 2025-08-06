import { writable } from 'svelte/store';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // in ms
};

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    update((toasts) => [...toasts, { id, ...toast }]);
    setTimeout(() => removeToast(id), toast.duration || 3000);
  }

  function removeToast(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    addToast,
    removeToast,
  };
}

export const toasts = createToastStore();