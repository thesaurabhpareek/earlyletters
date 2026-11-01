/**
 * Owner: E1 (web platform). Who runs the site, as /privacy and /terms name them.
 *
 * The publisher is an individual (docs/DECISIONS.md D-004), and their legal name never goes in code or in git
 * (D-004, and CLAUDE.md: real family details never go in code). It is read at build time from
 * PUBLISHER_LEGAL_NAME (Vercel, Production, Plain; docs/ops/WEBSITE_RUNBOOK.md section 3). When it is not set, or is
 * not a plain name, the pages say "run by its founder" and "we" means "the founder" (legal-copy.ts): no placeholder
 * ever renders, the build never fails, and the build log says so.
 */
import { legalCopy } from './legal-copy';
import type { Publisher } from './types';

const MAX_LENGTH = 120;
/** A name never needs markup, braces or brackets; a value with any of them is a mistake, so the fallback is used. */
const NOT_A_NAME = /[<>{}[\]\u0000-\u001f\u007f]/;

export function resolvePublisher(env: Readonly<Record<string, string | undefined>>): Publisher & { isFallback: boolean } {
  const value = (env.PUBLISHER_LEGAL_NAME ?? '').replace(/[ \t]+/g, ' ').trim();
  if (value && value.length <= MAX_LENGTH && !NOT_A_NAME.test(value)) return { subject: value, reference: value, isFallback: false };
  return { ...legalCopy.publisherFallback, isFallback: true };
}

let warned = false;

/** Who runs the site, as the pages print it. In a production build without the variable, warns once in the build log. */
export function publisher(env: Readonly<Record<string, string | undefined>> = process.env): Publisher {
  const { subject, reference, isFallback } = resolvePublisher(env);
  if (isFallback && !warned && env.NODE_ENV === 'production') {
    warned = true;
    console.warn(`[legal] PUBLISHER_LEGAL_NAME is not set (or not a plain name): /privacy and /terms say the site is run by "${subject}".`);
  }
  return { subject, reference };
}
