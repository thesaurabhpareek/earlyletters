// The words a consent sheet shows, assembled once, so the phone hashes exactly what the manifest hashes
// (NS-42-R7, PRIV-R21, BL-577; docs/tdd/new-scope/12-first-run-2.md 5.2). No new words: this joins sentences
// that already exist. The `{child}` placeholder stays unfilled, so a child's name never enters a hash input.
// PROPOSED composition (question FP-2-1): which sentences count as "the words shown" is counsel's to confirm.
import { authCopy } from './features/auth.en';
import { en } from './strings.en';

/** The language of every sheet at v1.0 (BRIEF decision 6). The phone sends this, never a literal of its own (FS-22). */
export const CONSENT_LOCALE = 'en';

/** `agreement-line` is the sentence the age-gate screen shows and the local rows hash: `beforeBegin.agree` (age-gate-screen.tsx, PRIV-R21). */
export type ConsentShownId = 'terms' | 'age' | 'sensitive' | 'agreement-line';

export function consentShownText(id: ConsentShownId): string {
  const t = authCopy.consent.terms;
  const s = en.sensitiveConsent;
  switch (id) {
    case 'terms':
      return [t.title, t.body, t.agreeLine].join('\n');
    case 'age':
      return authCopy.consent.age.body;
    case 'sensitive':
      return [s.title, s.body, s.use, s.declineHelp, s.changeLater].join('\n');
    case 'agreement-line':
      return en.beforeBegin.agree;
  }
}

export const CONSENT_SHOWN_IDS: readonly ConsentShownId[] = ['terms', 'age', 'sensitive', 'agreement-line'];
