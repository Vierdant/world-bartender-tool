// src/routes/profile/[id]/+page.ts
import type { PageLoad } from './$types';
import { loadProfiles } from '$lib/utils/platform';
import type { Profile } from '$lib/types';

export const load: PageLoad = async ({ params }) => {
  const profiles: Profile[] = await loadProfiles();
  const profile = profiles.find((p) => p.id === params.id);

  if (!profile) {
    throw new Error(`Profile with id "${params.id}" not found`);
  }

  return { profile };
};
