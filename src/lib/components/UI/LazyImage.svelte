<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    export let src: string;
    export let alt: string = '';
    export let placeholder: string = '';
    export let className: string = '';
    export let loading: 'lazy' | 'eager' = 'lazy';
    export let threshold: number = 0.1;
    export let fallback: string = '';
    
    let img: HTMLImageElement;
    let loaded = false;
    let error = false;
    let observer: IntersectionObserver;
    let actualSrc = '';
    
    onMount(() => {
        if (loading === 'eager') {
            loadImage();
            return;
        }
        
        // Setup intersection observer for lazy loading
        if (typeof IntersectionObserver !== 'undefined') {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            loadImage();
                            observer.unobserve(img);
                        }
                    });
                },
                { threshold }
            );
            
            if (img) {
                observer.observe(img);
            }
        } else {
            // Fallback for browsers without IntersectionObserver
            loadImage();
        }
    });
    
    onDestroy(() => {
        observer?.disconnect();
    });
    
    function loadImage() {
        if (actualSrc || !src) return;
        
        actualSrc = src;
        
        // Preload the image
        const preloadImg = new Image();
        preloadImg.onload = () => {
            loaded = true;
            error = false;
        };
        preloadImg.onerror = () => {
            error = true;
            loaded = false;
            if (fallback) {
                actualSrc = fallback;
                // Try loading fallback
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                    loaded = true;
                    error = false;
                };
                fallbackImg.src = fallback;
            }
        };
        preloadImg.src = src;
    }
    
    function handleLoad() {
        loaded = true;
        error = false;
    }
    
    function handleError() {
        error = true;
        loaded = false;
        if (fallback && actualSrc !== fallback) {
            actualSrc = fallback;
        }
    }
</script>

<div class="lazy-image-container {className}" class:loaded class:error>
    {#if !loaded && !error && placeholder}
        <div class="lazy-image-placeholder performance-optimized">
            <img 
                src={placeholder} 
                {alt}
                class="placeholder-img"
                loading="eager"
            />
        </div>
    {/if}
    
    <img
        bind:this={img}
        src={actualSrc}
        {alt}
        class="lazy-image performance-optimized"
        class:visible={loaded && !error}
        on:load={handleLoad}
        on:error={handleError}
        loading={loading}
        decoding="async"
    />
    
    {#if error && !fallback}
        <div class="lazy-image-error">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke-width="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke-width="2"/>
            </svg>
            <span class="error-text">Failed to load image</span>
        </div>
    {/if}
</div>

<style>
    .lazy-image-container {
        position: relative;
        display: inline-block;
        overflow: hidden;
        background-color: #f0f0f0;
        transition: opacity 0.3s ease;
    }
    
    .lazy-image-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
    }
    
    .placeholder-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(2px);
        opacity: 0.7;
    }
    
    .lazy-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.3s ease;
        will-change: opacity;
    }
    
    .lazy-image.visible {
        opacity: 1;
    }
    
    .lazy-image-container.loaded .lazy-image-placeholder {
        opacity: 0;
        pointer-events: none;
    }
    
    .lazy-image-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        color: #666;
        font-size: 0.875rem;
    }
    
    .error-icon {
        width: 2rem;
        height: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }
    
    .error-text {
        text-align: center;
        font-size: 0.75rem;
        opacity: 0.7;
    }
    
    /* Dark theme support */
    :global(.dark) .lazy-image-container {
        background-color: #2a2a2a;
    }
    
    :global(.dark) .lazy-image-error {
        background-color: #1a1a1a;
        color: #ccc;
    }
</style>
