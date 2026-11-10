/**
 * First-run words (docs/design/specs/FIRST-RUN-WORDS-10nov.md, journey spec PR #776). Red first: every key must
 * exist, the three-card deck must match the journey's ids, and the lines must keep the glossary and the promises
 * the build can keep. Rules that apply to all copy (dashes, quotes, emoji, AI words, buttons of 22 or fewer, "we")
 * run in rules.test.ts, which reads `features.firstRun` and `firstRunStories`.
 */
import { describe, expect, it } from 'vitest';
import { features, firstRunStories, onboardingStories, STORY_VISUALS } from '../src';

const fr = (features as unknown as { firstRun?: Record<string, unknown> }).firstRun ?? {};

function leaves(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}
const get = (path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], fr);

const KEYS = [
  'story.skipButton', 'story.nextButton', 'story.startButton', 'story.backA11y', 'story.skipA11y', 'story.nextA11y',
  'auth.title', 'auth.body', 'auth.newOrBack', 'auth.appleButton', 'auth.privacy',
  'auth.codeExpired', 'auth.codePaused', 'auth.offline', 'auth.didNotFinish', 'auth.invalidEmail', 'auth.waitAMoment',
  'auth.notAvailable', 'auth.emailAlreadyUsed', 'auth.accountDeleted', 'auth.unknown',
  'lock.tryAgain', 'lock.lockedOut',
];

describe('first-run words', () => {
  it.each(KEYS)('has %s', (key) => {
    expect(typeof get(key), key).toBe('string');
    expect((get(key) as string).length).toBeGreaterThan(0);
  });

  it('uses no banned character, no name, no gendered word', () => {
    for (const l of [...leaves(fr), ...leaves(firstRunStories)]) {
      expect(l.text, l.path).not.toMatch(/[—–‘’“”…]|\p{Extended_Pictographic}/u);
      expect(l.text, l.path).not.toMatch(/\b(he|she|him|her|his|hers|son|daughter|boy|girl)\b/i);
    }
  });

  it('says "sign in", never "log in", "sign up" or "Continue with"', () => {
    for (const l of [...leaves(fr), ...leaves(firstRunStories)]) expect(l.text, l.path).not.toMatch(/log ?in|sign ?up|create account|continue with/i);
  });

  it('never says a letter stays on this phone, and never implies a machine writes', () => {
    for (const l of [...leaves(fr), ...leaves(firstRunStories)]) {
      expect(l.text, l.path).not.toMatch(/stays? on (this|your) phone|only on this phone/i);
      expect(l.text, l.path).not.toMatch(/\b(AI|smart|magic|generate[sd]?|polish|perfect|enhance)\b/i);
    }
  });

  it('keeps first-run errors free of "Your letters are safe" (a new person has no letters)', () => {
    for (const l of leaves(fr)) expect(l.text, l.path).not.toMatch(/letters are safe/i);
  });

  it('keeps co-parent and invite claims out of the first-run words', () => {
    for (const l of [...leaves(fr), ...leaves(firstRunStories)]) expect(l.text, l.path).not.toMatch(/co-parent|other parent|invite|same book/i);
  });

  it('has one verb for the provider button', () => {
    expect(fr && (get('auth.appleButton') as string)).toBe('Sign in with Apple');
  });

  it('uses only the placeholders the rules allow', () => {
    for (const l of leaves(fr)) for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['app', 'email', 'child']).toContain(m[1]);
  });
});

describe('first-run story deck', () => {
  it('is three cards: talk.v1, exact.v3, voice.v1, in order', () => {
    expect(firstRunStories.map((c) => c.id)).toEqual(['story.talk.v1', 'story.exact.v3', 'story.voice.v1']);
    expect(firstRunStories.map((c) => c.order)).toEqual([1, 2, 3]);
  });
  it('reuses talk.v1 and voice.v1 unchanged, and never reuses an id for new wording', () => {
    for (const id of ['story.talk.v1', 'story.voice.v1']) {
      expect(firstRunStories.find((c) => c.id === id)).toEqual(onboardingStories.find((c) => c.id === id));
    }
    expect(onboardingStories.some((c) => c.id === 'story.exact.v3')).toBe(false);
  });
  it('fits the story schema and names no child, price, language count or co-parent', () => {
    for (const c of firstRunStories) {
      expect(c.id).toMatch(/^story\.[a-z-]+\.v\d+$/);
      expect(c.headline.length).toBeLessThanOrEqual(80);
      expect(c.line.length).toBeLessThanOrEqual(200);
      expect(STORY_VISUALS).toContain(c.visual);
      expect(`${c.headline} ${c.line}`).not.toMatch(/\{|co-parent|invite|other parent|free|\$|phone/i);
    }
  });
  it('makes no "exactly as you said" claim and keeps "never rewrite" in a never', () => {
    const c = firstRunStories[1];
    expect(c.headline).not.toMatch(/exactly/i);
    expect(c.line).toMatch(/never rewrite your words/i);
  });
});
