export function parseEmote(emote: string, variables: Record<string, string>) {
  return emote.replace(/!(\w+)/g, (_, key) => variables[key] || '');
}

export function randomEmote(emotes: string[], variables: Record<string, string>) {
  if (!emotes || emotes.length === 0) return '';
  const chosen = emotes[Math.floor(Math.random() * emotes.length)];
  return parseEmote(chosen, variables);
}