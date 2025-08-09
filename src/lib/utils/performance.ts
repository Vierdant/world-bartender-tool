// Performance utilities for the application

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: number;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
    func: T
): (...args: Parameters<T>) => void {
    let rafId: number;
    let scheduled = false;
    
    return (...args: Parameters<T>) => {
        if (scheduled) return;
        
        scheduled = true;
        rafId = requestAnimationFrame(() => {
            func(...args);
            scheduled = false;
        });
    };
}

/**
 * Lazy load a module dynamically
 */
export async function lazyLoad<T>(
    moduleLoader: () => Promise<{ default: T }>
): Promise<T> {
    try {
        const module = await moduleLoader();
        return module.default;
    } catch (error) {
        console.error('Failed to lazy load module:', error);
        throw error;
    }
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
    name: string,
    fn: () => T | Promise<T>
): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
}

/**
 * Create a performance observer for monitoring
 */
export function createPerformanceObserver(
    entryTypes: string[],
    callback: (entries: PerformanceEntry[]) => void
): PerformanceObserver | null {
    if (typeof PerformanceObserver === 'undefined') {
        return null;
    }
    
    const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
    });
    
    try {
        observer.observe({ entryTypes });
        return observer;
    } catch (error) {
        console.warn('Performance observer not supported:', error);
        return null;
    }
}

/**
 * Optimize images by creating responsive sources
 */
export function createResponsiveImageSources(
    baseSrc: string,
    sizes: number[] = [320, 640, 960, 1280]
): { src: string; srcset: string; sizes: string } {
    const extension = baseSrc.split('.').pop() || 'jpg';
    const baseName = baseSrc.replace(`.${extension}`, '');
    
    const srcset = sizes
        .map(size => `${baseName}_${size}w.${extension} ${size}w`)
        .join(', ');
    
    const sizesAttr = sizes
        .map((size, index) => {
            if (index === sizes.length - 1) return `${size}px`;
            return `(max-width: ${size}px) ${size}px`;
        })
        .join(', ');
    
    return {
        src: `${baseName}_${sizes[0]}w.${extension}`,
        srcset,
        sizes: sizesAttr
    };
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device performance tier (rough estimation)
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (hardwareConcurrency >= 8 && memory >= 8) {
        return 'high';
    } else if (hardwareConcurrency >= 4 && memory >= 4) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Adaptive loading based on connection quality
 */
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection;
    
    if (!connection) return 'medium';
    
    const { effectiveType, downlink } = connection;
    
    if (effectiveType === '4g' && downlink > 1.5) {
        return 'fast';
    } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 1.5)) {
        return 'medium';
    } else {
        return 'slow';
    }
}

/**
 * Intersection Observer factory with sensible defaults
 */
export function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') {
        return null;
    }
    
    const defaultOptions: IntersectionObserverInit = {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
    };
    
    return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
} | null {
    const memory = (performance as any).memory;
    
    if (!memory) return null;
    
    return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
}
