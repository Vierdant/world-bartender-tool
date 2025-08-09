<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { nanoid } from "nanoid";
    import type { Profile, RPHelper } from "$lib/types";
    import AnimatedModal from "$lib/components/UI/AnimatedModal.svelte";

    export let profile: Profile;
    export let onClose: () => void;
    export let show = false;

    const dispatch = createEventDispatcher();
    let helpers: RPHelper[] = [...(profile.rpHelpers || [])];
    let showVariablesHelp = false;

    // Available variables for RP helpers
    const availableVariables = [
        { variable: '{customerName}', description: 'Customer\'s name or "the customer" if not provided', example: 'John Doe' },
        { variable: '{customerId}', description: 'Customer\'s ID or -1 if not provided', example: '123' },
        { variable: '{customerTarget}', description: 'Use this for commands like /bpay and /to" for targeting', example: '45 or John or -1' },
        { variable: '{items}', description: 'Simple list of item names with proper grammar', example: 'Coffee, Sandwich and Pizza' },
        { variable: '{itemsWithQty}', description: 'Items with quantities.', example: '2x Coffee, 1x Sandwich and 1x Pizza' },
        { variable: '{total}', description: 'Total cost of the order with dollar sign', example: '$15' },
        { variable: '{totalAmount}', description: 'Total cost of the order without dollar sign', example: '15' },
        { variable: '{itemCount}', description: 'Total number of items ordered', example: '4' },
        { variable: '{orderTime}', description: 'How long ago the order was placed', example: '2m 15s' }
    ];

    function addSection() {
        helpers = [...helpers, { id: nanoid(), name: "New Section", commands: [] }];
    }

    function removeSection(id: string) {
        helpers = helpers.filter((h) => h.id !== id);
    }

    function addCommand(sectionId: string) {
        helpers = helpers.map((h) =>
            h.id === sectionId
                ? { ...h, commands: [...h.commands, ""] }
                : h
        );
    }

    function updateCommand(sectionId: string, index: number, value: string) {
        helpers = helpers.map((h) => {
            if (h.id === sectionId) {
                const updated = [...h.commands];
                updated[index] = value;
                return { ...h, commands: updated };
            }
            return h;
        });
    }

    function removeCommand(sectionId: string, index: number) {
        helpers = helpers.map((h) => {
            if (h.id === sectionId) {
                const updated = [...h.commands];
                updated.splice(index, 1);
                return { ...h, commands: updated };
            }
            return h;
        });
    }

    function handleClose() {
        onClose();
    }

    function save() {
        const newProfile = {
            ...profile,
            rpHelpers: helpers,
        };
        dispatch("save", newProfile);
        onClose();
    }
</script>

<AnimatedModal {show} maxWidth="max-w-2xl">
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <h2 class="text-xl font-bold text-(--text-color)">
                    Configure RP Helpers
                </h2>
            </div>
            <button
                on:click={handleClose}
                class="text-(--text-color-muted) hover:text-(--text-color) transition-colors cursor-pointer"
                aria-label="Close"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <div class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {#each helpers as helper, i (helper.id)}
                <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color)">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2 flex-1">
                            <svg class="w-4 h-4 text-(--accent-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <input
                                class="text-lg font-semibold w-full bg-transparent text-(--text-color) border-b border-(--border-color) focus:outline-none focus:border-(--accent-color) transition-colors"
                                bind:value={helper.name}
                                placeholder="Section Name"
                            />
                        </div>
                        <button
                            on:click={() => removeSection(helper.id)}
                            class="text-(--error-color) hover:text-red-700 transition-colors p-1 rounded cursor-pointer"
                            aria-label="Remove section"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-3">
                        {#each helper.commands as command, j}
                            <div class="flex gap-2 items-center">
                                <svg class="w-4 h-4 text-(--text-color-muted) flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                <input
                                    class="w-full px-3 py-2 rounded-lg border text-(--text-color) bg-(--body-color) border-(--border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-color) focus:border-transparent transition-colors"
                                    bind:value={command}
                                    on:input={(e) => updateCommand(helper.id, j, (e.currentTarget as HTMLInputElement).value)}
                                    placeholder={`e.g. passes the {items} to {customerName}`}
                                />
                                <button
                                    on:click={() => removeCommand(helper.id, j)}
                                    class="text-(--error-color) hover:text-red-700 transition-colors p-1 rounded cursor-pointer"
                                    aria-label="Remove command"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        {/each}

                        <button
                            on:click={() => addCommand(helper.id)}
                            class="text-(--info-color) text-sm cursor-pointer px-3 py-2 rounded-lg border-2 border-(--info-color) hover:bg-(--info-color) hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add Command
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Variables Help Section -->
        {#if showVariablesHelp}
            <div class="bg-(--field-color) p-4 rounded-lg border border-(--border-color) mt-4">
                <h3 class="font-semibold mb-3 text-(--text-color) flex items-center gap-2">
                    <svg class="w-4 h-4 text-(--info-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Available Variables
                </h3>
                <div class="grid grid-cols-1 gap-2 text-xs">
                    {#each availableVariables as variable}
                        <div class="flex justify-between items-center p-2 rounded bg-(--body-color)">
                            <div class="flex-1">
                                <code class="text-(--info-color) bg-(--field-color) px-1 rounded font-mono">
                                    {variable.variable}
                                </code>
                                <span class="text-(--text-color-muted) ml-2">{variable.description}</span>
                            </div>
                            <div class="text-(--text-color) font-medium ml-2 text-xs">
                                {variable.example}
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="mt-3 p-2 bg-(--body-color) rounded text-xs text-(--text-color-muted)">
                    <strong>Example:</strong> <code class="bg-(--field-color) px-1 rounded">/me passes the {`{itemsWithQty}`} to {`{customerTarget}`}</code>
                    <br/>
                    <strong>Result:</strong> "/me passes the 2x Coffee, 1x Sandwich and 1x Pizza to 123"
                    <br/>
                    <span class="text-(--text-color-muted)">Note: {`{customerTarget}`} uses ID if available, otherwise name, then "-1"</span>
                </div>
            </div>
        {/if}

        <div class="flex justify-between items-center pt-4 border-t border-(--border-color)">
            <div class="flex gap-2">
                <button
                    on:click={addSection}
                    class="text-(--accept-color) text-sm cursor-pointer px-4 py-2 rounded-lg border-2 border-(--accept-color) hover:bg-(--accept-color) hover:text-white transition-colors flex items-center gap-2"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Section
                </button>
                <button
                    on:click={() => showVariablesHelp = !showVariablesHelp}
                    class="text-(--info-color) text-sm cursor-pointer px-4 py-2 rounded-lg border-2 border-(--info-color) hover:bg-(--info-color) hover:text-white transition-colors flex items-center gap-2"
                    aria-label={showVariablesHelp ? "Hide variables help" : "Show variables help"}
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {showVariablesHelp ? "Hide Help" : "Variables Help"}
                </button>
            </div>
            <div class="space-x-3">
                <button
                    on:click={handleClose}
                    class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition-colors rounded-lg font-medium cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    on:click={save}
                    class="px-4 py-2 text-sm bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition-colors rounded-lg font-medium cursor-pointer"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
</AnimatedModal>