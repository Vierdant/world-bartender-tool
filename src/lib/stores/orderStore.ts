import { writable, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import type { Order, MenuItem } from '$lib/types';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { toasts } from './toastStore';

// Order state
export const currentOrders = writable<Order[]>([]);
export const activeOrderId = writable<string | null>(null);
export const archivedOrders = writable<Order[]>([]);

// Order creation state
export const newCustomerName = writable('');
export const newCustomerId = writable<number | null>(null);
export const itemQuantities = writable<Record<string, number>>({});

// Order tracking for advanced emotes
const lastUsedSectionIndex: Record<string, number> = {};

function getRandomSectionIndex(itemId: string, sectionCount: number): number {
    if (sectionCount <= 1) return 0;

    let newIndex: number;
    do {
        newIndex = Math.floor(Math.random() * sectionCount);
    } while (newIndex === lastUsedSectionIndex[itemId]);

    lastUsedSectionIndex[itemId] = newIndex;
    return newIndex;
}

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(template: string, context: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? '');
}

export function createOrder(menu: MenuItem[]) {
    const name = get(newCustomerName).trim();
    const quantities = get(itemQuantities);
    const idValue = get(newCustomerId);

    const items = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
            const item = menu.find((m) => m.id === id);
            const isAdvanced = item?.emotes?.advanced ?? false;
            const sectionCount = item?.emotes?.sections?.length ?? 0;
            const randomSectionIndex = isAdvanced
                ? getRandomSectionIndex(id, sectionCount)
                : 0;

            return {
                id,
                qty,
                ...(isAdvanced && {
                    _emoteSectionIndex: randomSectionIndex,
                    _emoteStepIndex: 0,
                }),
            };
        });

    if (items.length === 0) return;

    const newOrder: Order = {
        id: nanoid(),
        customerName: name || undefined,
        customerId: idValue !== null ? idValue : undefined,
        items,
        createdAt: Date.now(),
    };

    currentOrders.update((orders) => {
        activeOrderId.set(newOrder.id);
        return [...orders, newOrder];
    });

    // Reset form
    newCustomerName.set('');
    newCustomerId.set(null);
    itemQuantities.set({});
}

export function updateQty(itemId: string, qty: number) {
    itemQuantities.update((quantities) => ({
        ...quantities,
        [itemId]: qty,
    }));
}

export function completeOrder(orderId: string) {
    currentOrders.update((orders) => {
        const index = orders.findIndex((o) => o.id === orderId);
        if (index === -1) return orders;

        const [completedOrder] = orders.splice(index, 1);
        archivedOrders.update((archived) => [...archived, completedOrder]);

        if (get(activeOrderId) === orderId) {
            activeOrderId.set(orders.length > 0 ? orders[0].id : null);
        }

        return [...orders];
    });
}

export function restoreOrder(orderId: string) {
    archivedOrders.update((archived) => {
        const index = archived.findIndex((o) => o.id === orderId);
        if (index === -1) return archived;

        const [restoredOrder] = archived.splice(index, 1);
        currentOrders.update((orders) => [...orders, restoredOrder]);
        return [...archived];
    });
}

export function cancelOrder(orderId: string) {
    currentOrders.update((orders) => {
        return orders.filter((order) => order.id !== orderId);
    });

    if (get(activeOrderId) === orderId) {
        const remainingOrders = get(currentOrders);
        activeOrderId.set(
            remainingOrders.length > 0 ? remainingOrders[0].id : null,
        );
    }
}

export function updateOrderDetails(
    orderId: string,
    newName: string | null,
    newId: number | null,
) {
    currentOrders.update((orders) =>
        orders.map((order) =>
            order.id === orderId
                ? {
                      ...order,
                      customerName: newName || undefined,
                      customerId: newId || undefined,
                  }
                : order,
        ),
    );
}

export function copyEmote(order: Order, itemId: string, menu: MenuItem[], customerName?: string) {
    const item = menu.find((m) => m.id === itemId);
    if (!item) return;

    const orderItem = order.items.find((i) => i.id === itemId);
    if (!orderItem) return;

    const emoteSections = item.emotes.sections;
    let text = '';

    if (item.emotes.advanced) {
        // Default to first section if not tracked yet
        if (orderItem._emoteSectionIndex === undefined) {
            orderItem._emoteSectionIndex = 0;
            orderItem._emoteStepIndex = 0;
        }

        const section = emoteSections[orderItem._emoteSectionIndex];
        const step = section.steps[orderItem._emoteStepIndex ?? 0];

        text = interpolate(step, {
            name: customerName ?? 'the customer',
        });

        // Advance the step index
        orderItem._emoteStepIndex! += 1;

        // If we reached end of steps in current section, cycle to a new one
        if (orderItem._emoteStepIndex! >= section.steps.length) {
            const nextSectionIndex =
                (orderItem._emoteSectionIndex! + 1) % emoteSections.length;
            orderItem._emoteSectionIndex = nextSectionIndex;
            orderItem._emoteStepIndex = 0;
        }
    } else {
        // Not advanced: pick random step from first section
        const steps = item.emotes.sections[0]?.steps ?? [];
        const step = randomFrom(steps);
        text = interpolate(step, {
            name: customerName ?? 'the customer',
        });
    }

    writeText(text);
    toasts.addToast({ message: 'RP command copied', type: 'info' });
}

export function getTotal(order: Order, menu: MenuItem[]): number {
    return order.items.reduce((sum, item) => {
        const menuItem = menu.find((m) => m.id === item.id);
        return menuItem ? sum + menuItem.price * item.qty : sum;
    }, 0);
}

export function formatElapsed(tick: number, startTime?: number): string {
    if (!startTime) return 'Unknown';
    const elapsedMs = tick - startTime;
    const seconds = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return secs < 0 ? `0m 0s` : `${mins}m ${secs}s`;
}

export function clearAllOrders() {
    archivedOrders.set([]);
    currentOrders.set([]);
    activeOrderId.set(null);
    newCustomerName.set('');
    newCustomerId.set(null);
    itemQuantities.set({});
}
