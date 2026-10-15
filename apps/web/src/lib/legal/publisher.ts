/**
 * Owner: E1 (web platform). Who runs the site, as /privacy and /terms name them.
 *
 * The publisher is an individual (docs/DECISIONS.md D-004), and their legal name never goes in code or in git
 * (D-004, and CLAUDE.md: real family details never go in code). It is read at build time from
 * PUBLISHER_LEGAL_NAME (Vercel, Production, Plain; docs/ops/WEBSITE_RUNBOOK.md section 2). Until it is set, the
 * pages show the clearly marked placeholder from legal-copy.ts and the build log says so.
 */
import { legalCopy } from './legal-copy';

const MAX_LENGTH = 120;
/** A name never needs markup, braces or brackets; a value with any of them is a mistake, so the placeholder shows. */
const NOT_A_NAME = /[<>{}[\]\u0000-\u001f\u007f]/;

export function resolvePublisherName(env: Readonly<Record<string, string | undefined>>): { name: string; isPlaceholder: boolean } {
  const value = (env.PUBLISHER_LEGAL_NAME ?? '').replace(/[ \t]+/g, ' ').trim();
  if (value && value.length <= MAX_LENGTH && !NOT_A_NAME.test(value)) return { name: value, isPlaceholder: false };
  return { name: legalCopy.publisherPlaceholder, isPlaceholder: true };
}

let warned = false;

/** The name to print. In a production build without the variable, warns once in the build log. */
export function publisherName(env: Readonly<Record<string, string | undefined>> = process.env): string {
  const { name, isPlaceholder } = resolvePublisherName(env);
  if (isPlaceholder && !warned && env.NODE_ENV === 'production') {
    warned = true;
    console.warn(`[legal] PUBLISHER_LEGAL_NAME is not set (or not a plain name): /privacy and /terms show "${name}" where the publisher's legal name goes.`);
  }
  return name;
}
