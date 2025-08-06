// tick.ts (new file in $lib/stores or local file)
import { writable } from "svelte/store";

export const tick = writable(Date.now());

setInterval(() => {
    tick.set(Date.now());
}, 1000); // update every second
