/**
 * BL-777 (CPrivO-20; LEGAL-REQ-051, LEGAL-REQ-044): the line VoiceOver speaks as Erase everything finishes
 * (`copy.settings.erase.doneA11y`, announced by apps/mobile/src/app/settings/erase.tsx) says no more than the screen.
 * It names only what was erased, and nothing the screen says stays: the spoken language (`speechStays`), saved exports
 * and device backups (`backups`), and plan reminders (CCO-6). The wording is PROPOSED and is the founder's under D-144.
 */
import { describe, expect, it } from 'vitest';
import { en } from '../src';

const e = en.settings.erase;

describe('[BL-777][LEGAL-REQ-051] the VoiceOver line after Erase everything', () => {
  it('is the council line, word for word (CPrivO-20)', () => {
    expect(e.doneA11y).toBe('Your books, letters, recordings and settings are erased from this phone.');
  });

  it('names what the body says is erased: books, letters, recordings and settings', () => {
    for (const word of ['book', 'letter', 'recording', 'settings']) {
      expect(e.doneA11y, word).toMatch(new RegExp(`\\b${word}`, 'i'));
      expect(e.body, word).toMatch(new RegExp(`\\b${word}`, 'i'));
    }
  });

  it('names nothing that stays: the speech or language model, exports, backups or reminders', () => {
    const STAYS = /\b(?:speech|spoken|language|model|pack|export\w*|backups?|iCloud|reminders?|everything|all)\b/i;
    expect(e.doneA11y).not.toMatch(STAYS);
  });

  it('is not the old line that claimed everything on the phone was erased', () => {
    expect(e.doneA11y).not.toBe('Everything on this phone is erased.');
  });
});
