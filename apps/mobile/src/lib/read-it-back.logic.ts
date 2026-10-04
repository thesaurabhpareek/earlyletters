/**
 * Letters whose words arrived after the letter was saved and have not been read back yet (D-086: words that
 * arrive later arrive exactly as said and are never fixed unread). A small list of letter ids, kept as one
 * setting; ids only, never words. Pure parts here so they are unit tested.
 */
export function parseIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function withId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? [...ids] : [...ids, id];
}

export function withoutId(ids: readonly string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}
