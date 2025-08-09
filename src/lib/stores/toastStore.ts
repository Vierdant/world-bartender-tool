import { writable } from 'svelte/store';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // in ms
};

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  const toastTimers = new Map<string, number>();

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    const duration = toast.duration || 3000;
    
    update((toasts) => {
      // Limit max toasts to prevent memory issues
      const maxToasts = 5;
      const newToasts = [...toasts, { id, ...toast }];
      return newToasts.length > maxToasts ? newToasts.slice(-maxToasts) : newToasts;
    });
    
    // Store timer for cleanup
    const timerId = setTimeout(() => {
      removeToast(id);
      toastTimers.delete(id);
    }, duration);
    
    toastTimers.set(id, timerId);
  }

  function removeToast(id: string) {
    // Clear timer if exists
    const timerId = toastTimers.get(id);
    if (timerId) {
      clearTimeout(timerId);
      toastTimers.delete(id);
    }
    
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function clearAllToasts() {
    // Clear all timers
    toastTimers.forEach(timerId => clearTimeout(timerId));
    toastTimers.clear();
    update(() => []);
  }

  return {
    subscribe,
    addToast,
    removeToast,
    clearAllToasts,
  };
}

export const toasts = createToastStore();