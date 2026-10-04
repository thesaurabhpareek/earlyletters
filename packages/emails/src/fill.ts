import { brand } from '@scribe/brand';

export type Values = Record<string, string | number>;

/** Fills `{key}` placeholders. `{app}` and `{email}` always come from packages/brand. Unknown keys stay visible so tests catch them. */
export function fill(text: string, values: Values = {}): string {
  const all: Values = { app: brand.name, email: brand.support.email, ...values };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in all ? String(all[k]) : m));
}
