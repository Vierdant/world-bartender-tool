<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    
    type T = $$Generic;
    
    export let items: T[] = [];
    export let itemHeight: number = 50;
    export let containerHeight: number = 400;
    export let overscan: number = 5;
    
    const dispatch = createEventDispatcher();
    
    let container: HTMLDivElement;
    let scrollTop = 0;
    let containerWidth = 0;
    
    // Calculate visible range
    $: visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    $: visibleEnd = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
    $: visibleItems = items.slice(visibleStart, visibleEnd).map((item, index) => ({
        item,
        index: visibleStart + index
    }));
    
    // Total height of all items
    $: totalHeight = items.length * itemHeight;
    
    // Offset for visible items
    $: offsetY = visibleStart * itemHeight;
    
    let resizeObserver: ResizeObserver;
    
    onMount(() => {
        // Setup resize observer for container width
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    containerWidth = entry.contentRect.width;
                }
            });
            
            if (container) {
                resizeObserver.observe(container);
            }
        }
    });
    
    onDestroy(() => {
        resizeObserver?.disconnect();
    });
    
    function handleScroll() {
        scrollTop = container.scrollTop;
        dispatch('scroll', { scrollTop, visibleStart, visibleEnd });
    }
    
    // Throttled scroll handler for better performance
    let scrollTimer: number;
    function throttledScroll() {
        if (scrollTimer) return;
        
        scrollTimer = requestAnimationFrame(() => {
            handleScroll();
            scrollTimer = 0;
        });
    }
    
    // Scroll to specific item
    export function scrollToItem(index: number) {
        if (!container) return;
        
        const targetScrollTop = index * itemHeight;
        container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    }
    
    // Get item at specific position
    export function getItemAt(clientY: number): { item: T; index: number } | null {
        const rect = container.getBoundingClientRect();
        const relativeY = clientY - rect.top + scrollTop;
        const index = Math.floor(relativeY / itemHeight);
        
        if (index >= 0 && index < items.length) {
            return { item: items[index], index };
        }
        
        return null;
    }
</script>

<div 
    class="virtual-list-container scroll-optimized contain-layout"
    style="height: {containerHeight}px; overflow: auto;"
    bind:this={container}
    on:scroll={throttledScroll}
>
    <div 
        class="virtual-list-spacer"
        style="height: {totalHeight}px; position: relative;"
    >
        <div 
            class="virtual-list-items"
            style="transform: translateY({offsetY}px); will-change: transform;"
        >
            {#each visibleItems as { item, index } (index)}
                <div 
                    class="virtual-list-item gpu-accelerated"
                    style="height: {itemHeight}px; width: 100%;"
                    data-index={index}
                >
                    <slot {item} {index} />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .virtual-list-container {
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
    }
    
    .virtual-list-spacer {
        position: relative;
        width: 100%;
    }
    
    .virtual-list-items {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        will-change: transform;
    }
    
    .virtual-list-item {
        position: relative;
        will-change: transform;
        contain: layout style paint;
    }
</style>
