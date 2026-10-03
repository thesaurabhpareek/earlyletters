/**
 * The illustrative letter in the hero. Fictional family "Asha" (CLAUDE.md),
 * line taken from docs/design/CREATIVE.md (preview video "Tuesday").
 * TODO(C3): move into @scribe/content (site.en.ts heroLetter) so the copy
 * rules test covers it; this file will then import it.
 */
export const sampleLetter = {
  dateline: 'Month 9, Tuesday night',
  words: 'Asha, today you found the light switch. On, off, on, off. Your Nani was not amused.',
  signoff: 'From Papa',
  duration: '0:14',
} as const;
