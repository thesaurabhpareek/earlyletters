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

/** Services named in the old drafts that the website's code does not use. */
export const NOT_USED_SERVICES = /\b(PostHog|Sentry|RevenueCat|AWS|Amazon|Google|Anthropic|Stripe|Supabase|PowerSync|Groq|DeepInfra|Cloudflare|Apple)\b/;

/** Off the site for now: their content moves into Privacy, or waits for a build with accounts. */
export const REMOVED_ROUTES = ['/health-privacy', '/subprocessors', '/delete-account'];
