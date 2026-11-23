/**
 * PII-shaped string detection, shared by the allowlist (validate.ts) and the
 * crash reducer (crash.ts). No import, so there is no cycle.
 */
export const PII_PATTERNS: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // email
  /(?:\+?\d[\s().-]?){7,}/, // phone-like digit run
  /\bhttps?:\/\//i, // URL
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // uuid
  /\b\d{4}-\d{2}-\d{2}\b/, // ISO date (birthdays, due dates)
  /\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/, // other dates
  /eyJ[A-Za-z0-9_-]{10,}/, // JWT
  /\b[A-Za-z0-9_-]{32,}\b/, // long token-like blob
];

/**
 * True for strings that look like contact details, ids, tokens, dates or
 * prose. Enum values are snake_case, so anything with whitespace or capitals
 * is treated as free text by the caller before this runs.
 */
export function isPiiLike(value: string): boolean {
  return PII_PATTERNS.some((re) => re.test(value));
}

