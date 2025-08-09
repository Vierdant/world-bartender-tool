// Animation utilities for high-performance animations

/**
 * Animation manager for coordinating multiple animations
 */
export class AnimationManager {
    private animations = new Map<string, number>();
    private isRunning = false;
    private callbacks = new Set<() => void>();

    /**
     * Add animation callback
     */
    add(id: string, callback: () => void): void {
        this.callbacks.add(callback);
        
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Remove animation callback
     */
    remove(id: string): void {
        const rafId = this.animations.get(id);
        if (rafId) {
            cancelAnimationFrame(rafId);
            this.animations.delete(id);
        }

        if (this.animations.size === 0) {
            this.stop();
        }
    }

    /**
     * Start animation loop
     */
    private start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.tick();
    }

    /**
     * Stop animation loop
     */
    private stop(): void {
        this.isRunning = false;
        this.callbacks.clear();
    }

    /**
     * Animation frame tick
     */
    private tick(): void {
        if (!this.isRunning) return;

        this.callbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Animation callback error:', error);
            }
        });

        if (this.isRunning) {
            requestAnimationFrame(() => this.tick());
        }
    }
}

/**
 * Easing functions for smooth animations
 */
export const easing = {
    linear: (t: number): number => t,
    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => --t * t * t + 1,
    easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t: number): number => t * t * t * t,
    easeOutQuart: (t: number): number => 1 - --t * t * t * t,
    easeInOutQuart: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
};

/**
 * Spring animation configuration
 */
interface SpringConfig {
    stiffness: number;
    damping: number;
    mass: number;
    velocity: number;
}

/**
 * Spring animation class
 */
export class Spring {
    private current: number;
    private target: number;
    private velocity: number;
    private config: SpringConfig;
    private isAnimating = false;
    private rafId: number | null = null;
    private callbacks = new Set<(value: number) => void>();

    constructor(
        initialValue: number,
        config: Partial<SpringConfig> = {}
    ) {
        this.current = initialValue;
        this.target = initialValue;
        this.velocity = 0;
        this.config = {
            stiffness: 100,
            damping: 10,
            mass: 1,
            velocity: 0,
            ...config
        };
    }

    /**
     * Set target value
     */
    set(target: number): void {
        this.target = target;
        if (!this.isAnimating) {
            this.start();
        }
    }

    /**
     * Get current value
     */
    get(): number {
        return this.current;
    }

    /**
     * Subscribe to value changes
     */
    subscribe(callback: (value: number) => void): () => void {
        this.callbacks.add(callback);
        callback(this.current);
        
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Start animation
     */
    private start(): void {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.tick();
    }

    /**
     * Stop animation
     */
    stop(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.isAnimating = false;
    }

    /**
     * Animation tick
     */
    private tick(): void {
        if (!this.isAnimating) return;

        const { stiffness, damping, mass } = this.config;
        const deltaTime = 1 / 60; // Assume 60fps

        // Spring physics calculation
        const force = -stiffness * (this.current - this.target);
        const dampingForce = -damping * this.velocity;
        const acceleration = (force + dampingForce) / mass;

        this.velocity += acceleration * deltaTime;
        this.current += this.velocity * deltaTime;

        // Check if spring has settled
        const isSettled = Math.abs(this.current - this.target) < 0.01 && Math.abs(this.velocity) < 0.01;

        if (isSettled) {
            this.current = this.target;
            this.velocity = 0;
            this.isAnimating = false;
        }

        // Notify subscribers
        this.callbacks.forEach(callback => callback(this.current));

        if (this.isAnimating) {
            this.rafId = requestAnimationFrame(() => this.tick());
        }
    }
}

/**
 * Tween animation class
 */
export class Tween {
    private startValue: number;
    private endValue: number;
    private duration: number;
    private easingFn: (t: number) => number;
    private startTime: number | null = null;
    private isActive = false;
    private rafId: number | null = null;
    private callbacks = new Set<(value: number) => void>();
    private completeCallbacks = new Set<() => void>();

    constructor(
        from: number,
        to: number,
        duration: number,
        easingFunction: (t: number) => number = easing.easeInOutQuad
    ) {
        this.startValue = from;
        this.endValue = to;
        this.duration = duration;
        this.easingFn = easingFunction;
    }

    /**
     * Start the tween
     */
    start(): void {
        if (this.isActive) return;
        
        this.isActive = true;
        this.startTime = performance.now();
        this.tick();
    }

    /**
     * Stop the tween
     */
    stop(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.isActive = false;
        this.startTime = null;
    }

    /**
     * Subscribe to value updates
     */
    onUpdate(callback: (value: number) => void): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Subscribe to completion
     */
    onComplete(callback: () => void): () => void {
        this.completeCallbacks.add(callback);
        return () => this.completeCallbacks.delete(callback);
    }

    /**
     * Animation tick
     */
    private tick(): void {
        if (!this.isActive || !this.startTime) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        const easedProgress = this.easingFn(progress);
        const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;

        // Notify update callbacks
        this.callbacks.forEach(callback => callback(currentValue));

        if (progress >= 1) {
            // Animation complete
            this.isActive = false;
            this.completeCallbacks.forEach(callback => callback());
        } else {
            this.rafId = requestAnimationFrame(() => this.tick());
        }
    }
}

/**
 * Global animation manager instance
 */
export const animationManager = new AnimationManager();

/**
 * Create optimized CSS transition
 */
export function createOptimizedTransition(
    element: HTMLElement,
    property: string,
    duration: number,
    easingFunction: string = 'cubic-bezier(0.4, 0, 0.2, 1)'
): void {
    element.style.willChange = property;
    element.style.transition = `${property} ${duration}ms ${easingFunction}`;
    
    // Remove will-change after transition
    const handleTransitionEnd = () => {
        element.style.willChange = 'auto';
        element.removeEventListener('transitionend', handleTransitionEnd);
    };
    
    element.addEventListener('transitionend', handleTransitionEnd);
}

/**
 * Batch DOM reads and writes for better performance
 */
export class DOMBatcher {
    private readCallbacks: (() => void)[] = [];
    private writeCallbacks: (() => void)[] = [];
    private scheduled = false;

    /**
     * Queue a DOM read operation
     */
    read(callback: () => void): void {
        this.readCallbacks.push(callback);
        this.schedule();
    }

    /**
     * Queue a DOM write operation
     */
    write(callback: () => void): void {
        this.writeCallbacks.push(callback);
        this.schedule();
    }

    /**
     * Schedule the batch to run
     */
    private schedule(): void {
        if (this.scheduled) return;
        
        this.scheduled = true;
        requestAnimationFrame(() => {
            this.flush();
        });
    }

    /**
     * Execute all batched operations
     */
    private flush(): void {
        // Execute all reads first
        const reads = this.readCallbacks.splice(0);
        reads.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('DOM read error:', error);
            }
        });

        // Then execute all writes
        const writes = this.writeCallbacks.splice(0);
        writes.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('DOM write error:', error);
            }
        });

        this.scheduled = false;
    }
}

/**
 * Global DOM batcher instance
 */
export const domBatcher = new DOMBatcher();
