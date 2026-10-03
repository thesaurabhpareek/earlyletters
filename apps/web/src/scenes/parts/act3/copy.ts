/**
 * Owner: ACT3. Strings ACT3 needs that are not in src/content/site.ts yet.
 * The coordinator moves them into site.ts (suggested keys in comments); components read them from here until then.
 */
export const act3Copy = {
  /** site.skip: the "Skip the film" link, visible on keyboard focus. */
  skip: 'Skip the film',
  notify: {
    /** site.notify.hint: shown under the field label. */
    hint: 'Just your email address, nothing else.',
    /** site.notify.honeypotLabel: label of the hidden anti-bot field. People and screen readers never meet it. */
    honeypotLabel: 'Company',
    /** site.notify.errors: site.notify.error stays the message for an invalid address. */
    rateLimited: 'Too many tries just now. Please wait a minute and try again.',
    server: 'That did not go through on our side. Please try again in a moment.',
  },
  /** Shown only while the official App Store badge artwork is missing from public/brand/. */
  badgePlaceholder: 'App Store badge (placeholder)',
} as const;
