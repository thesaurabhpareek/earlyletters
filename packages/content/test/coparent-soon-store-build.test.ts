/**
 * BL-882: the one coming-soon state a store build with server features on shows on every co-parent surface.
 * The general rules (no dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or streak words; no "we")
 * are enforced over this file by rules.test.ts and server-surfaces-family.test.ts; these lines pin what is specific
 * to this state. COUNSEL-READ: lead and settingsRowHelp mention the other parent and are not cleared.
 */
import { describe, expect, it } from 'vitest';
import { familyCopy } from '../src';

const s = familyCopy.soon.storeBuild;

describe('[BL-882] soon.storeBuild', () => {
  it('has exactly a title, a lead and a settings footer: no button, no hint, no date', () => {
    expect(Object.keys(s).sort()).toEqual(['lead', 'settingsRowHelp', 'title']);
    for (const text of Object.values(s)) {
      expect(text).not.toMatch(/\d/);
      expect(text).not.toMatch(/tell me|notify|remind|beta|\bsoon\b.*\b(20\d\d|week|month|today|tomorrow)\b/i);
    }
  });

  it('uses {child}, never a name, and the glossary words: co-parent in settings, the other parent in prose', () => {
    expect(s.lead).toContain("{child}'s other parent");
    expect(s.settingsRowHelp).toContain('co-parent');
    for (const text of Object.values(s)) expect(text).not.toMatch(/\b(partner|spouse|coparent|member|grandparent|family)\b/i);
  });

  it('says nothing about who writes the words, and nothing that counts or scolds', () => {
    for (const text of Object.values(s)) expect(text).not.toMatch(/\b(AI|assistant|writes for you|streak|missed|behind|only \d|left)\b/i);
  });

  it('does not claim letters stay on the phone, which is not true once sign-in and sync are in the build', () => {
    for (const text of Object.values(s)) expect(text).not.toMatch(/stay on this phone|only on this phone/i);
  });
});
