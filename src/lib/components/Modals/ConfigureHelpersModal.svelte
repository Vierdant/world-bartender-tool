<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { nanoid } from "nanoid";
    import type { Profile, RPHelper } from "$lib/types";

    export let profile: Profile;
    export let onClose: () => void;

    const dispatch = createEventDispatcher();
    let helpers: RPHelper[] = [...(profile.rpHelpers || [])];

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

    function save() {
        const newProfile = {
            ...profile,
            rpHelpers: helpers,
        };
        dispatch("save", newProfile);
        onClose();
    }
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-(--body-color) rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <h2 class="text-xl font-bold mb-4 text-(--text-color)">
            Configure RP Helpers
        </h2>

        <div class="space-y-6 max-h-[500px] overflow-y-auto pr-1">
            {#each helpers as helper, i (helper.id)}
                <div class="bg-(--field-color) p-4 rounded shadow">
                    <div class="flex justify-between items-center mb-2">
                        <input
                            class="text-lg font-semibold w-full bg-transparent text-(--text-color) border-b"
                            bind:value={helper.name}
                            placeholder="Section Name"
                        />
                        <button
                            on:click={() => removeSection(helper.id)}
                            class="text-(--error-color) text-m ml-2 cursor-pointer"
                        >
                            ✗
                        </button>
                    </div>

                    <div class="space-y-2">
                        {#each helper.commands as command, j}
                            <div class="flex gap-2">
                                <input
                                    class="w-full px-2 py-1 rounded border text-(--text-color) bg-(--body-color) border-(--border-color) text-sm"
                                    bind:value={command}
                                    on:input={(e) => updateCommand(helper.id, j, (e.currentTarget as HTMLInputElement).value)}
                                    placeholder="e.g. passes the !items to !name"
                                />
                                <button
                                    on:click={() => removeCommand(helper.id, j)}
                                    class="text-(--error-color) text-m ml-2 cursor-pointer"
                                >
                                    ✗
                                </button>
                            </div>
                        {/each}

                        <button
                            on:click={() => addCommand(helper.id)}
                            class="text-(--accept-color) text-xs mt-2 cursor-pointer border-x-2 border-y-2 border-(--accept-color) p-1 rounded"
                        >
                            Add Command
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <div class="flex justify-between items-center mt-6">
            <button
                on:click={addSection}
                class="text-green-600 text-sm cursor-pointer border-x-2 border-y-2 border-green-600 p-1 rounded"
            >
                Add Section
            </button>
            <div class="space-x-2">
                <button
                    on:click={onClose}
                    class="px-4 py-2 text-sm bg-(--secondary-color) text-black hover:bg-(--secondary-color-hover) transition rounded cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    on:click={save}
                    class="px-4 py-2 text-sm bg-(--accent-color) text-black hover:bg-(--accent-color-hover) transition rounded cursor-pointer"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
</div>