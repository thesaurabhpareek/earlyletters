/**
 * Placeholder filling for email copy.
 *
 * Copy in @scribe/content uses `{name}` placeholders. A template fills the ones
 * it has values for and leaves the rest literal, so the rendered HTML can still
 * be filled by the sender (Resend from an Edge Function) or swapped for Go
 * template variables by scripts/export-supabase.ts.
 */
export type EmailValues = Partial<Record<string, string>>;

const PLACEHOLDER = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

export function fill(text: string, values: EmailValues = {}): string {
  return text.replace(PLACEHOLDER, (whole, key: string) => {
    const v = values[key];
    return v === undefined ? whole : v;
  });
}

/** Every placeholder name a piece of copy uses, sorted and de-duplicated. */
export function placeholders(texts: Array<string | undefined>): string[] {
  const found = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const m of t.matchAll(PLACEHOLDER)) found.add(m[1]!);
  }
  return [...found].sort();
}

/** `"{signInUrl}"` to `"signInUrl"`; tolerates a bare name. */
export function varName(token: string): string {
  return token.replace(/^\{|\}$/g, '');
}
