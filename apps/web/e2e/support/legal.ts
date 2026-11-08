/**
 * What a published legal page must never show, written out here on their own rather than imported from the site,
 * so the check holds even if the site's code changed: the marks of a counsel draft, internal references, and the
 * names of services the website's code does not use. Also the routes taken off the site for now.
 */
export const DRAFT_MARKS: { name: string; pattern: RegExp }[] = [
  { name: 'a placeholder token such as {PUBLISHER_LEGAL_NAME}', pattern: /\{[A-Z_]+\}/ },
  { name: 'a counsel tag [CN-', pattern: /\[CN-/ },
  { name: 'a counsel tag [HN-', pattern: /\[HN-/ },
  { name: 'a counsel note [COUNSEL', pattern: /\[COUNSEL/ },
  { name: 'a todo tag [TODO', pattern: /\[TODO/ },
  { name: 'a todo call TODO(', pattern: /TODO\(/ },
  { name: 'the drafting notice', pattern: /Drafting notice/ },
  { name: 'the notes for counsel appendix', pattern: /Appendix A\. Notes for counsel/ },
  { name: 'COUNSEL MUST CONFIRM', pattern: /COUNSEL MUST CONFIRM/ },
];

/** Decision, ADR, backlog and requirement ids, and counsel or drafting words: they live in the repo, never on a page. */
export const INTERNAL_MARKS: RegExp[] = [/\bD-\d{2,3}\b/, /\bADR\b/, /\bBL-\d+/, /\b[A-Z]+-REQ-\d+/, /\b(CN|HN)-\d/, /counsel/i, /\bTODO\b/, /\bdraft/i];

/**
 * sha256 of the raw 0.9.0 files, from the body of PR 616 (BL-565, the table for APPLY step 8.2). The app records these
 * in policy_versions.content_sha256; the site must serve exactly these bytes at /legal/<doc>/0.9.0.md.
 * (The 0.9.0 texts name Supabase, GitHub, Cloudflare R2, Apple and others on purpose: they describe the app too, so the old
 * "no service the site does not use" pin is gone. The code-level pins for the website's own claims are in test/legal.test.ts.)
 */
export const PUBLISHED_SHA256 = {
  terms: '8da3bd2c3704df292302fc4ad42eb26712b142bb87e5cde3e2ad6e656c5b0af1',
  privacy: 'bcfd060320c89e46feda4f10dc7cc4cdc7905898e72c4ce51c5ce1247bbfd284',
} as const;

/** Off the site for now: their content moves into Privacy, or waits for a build with accounts. */
export const REMOVED_ROUTES = ['/health-privacy', '/subprocessors', '/delete-account'];
