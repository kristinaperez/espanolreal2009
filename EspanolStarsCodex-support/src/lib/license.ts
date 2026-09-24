const MAX_KEY_LENGTH = 32;
const GROUP = 4;

export function normalizeKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, MAX_KEY_LENGTH);
}

export function formatKey(input: string): string {
  const clean = normalizeKey(input);
  return (clean.match(new RegExp(`.{1,${GROUP}}`, "g")) ?? []).join("-");
}
