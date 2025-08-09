// Optimized tick store with reduced frequency and better performance
import { readable } from "svelte/store";

// Use readable store with cleanup and reduce frequency
export const tick = readable(Date.now(), (set) => {
    const interval = setInterval(() => {
        set(Date.now());
    }, 5000); // Reduced from 1s to 5s to reduce CPU usage

    return () => clearInterval(interval);
});

// Create a high-frequency tick for animations only when needed
export const animationTick = readable(0, (set) => {
    let frame: number;
    let startTime = Date.now();

    const update = () => {
        set(Date.now() - startTime);
        frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frame);
});
