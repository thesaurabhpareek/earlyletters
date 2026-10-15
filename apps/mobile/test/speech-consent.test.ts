/// <reference types="node" />
/**
 * Consent to download the speech model (D-087, debate Q-015 3.3): nothing downloads until the person taps;
 * existing phones keep working; the size follows the phone's tier; the ask never lies about space.
 * Pure rules are tested directly; the wiring is checked in the source (the screens run on a phone).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { speechConsentCopy, wordsCopy } from '@scribe/content';
import { speechPlan } from '../src/lib/models/catalog';
import {
  askKind,
  autoStartAllowed,
  hasRoomFor,
  neededBytes,
  parseChoice,
  planConsentMigration,
  reserveFor,
  showReviewAsk,
} from '../src/lib/models/speech-consent.logic';
import { LARGE_PACK_RESERVE_BYTES, SMALL_PACK_RESERVE_BYTES } from '../src/lib/packs/engine';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

describe('only a yes starts a download by itself', () => {
  it('unset and later start nothing; yes starts', () => {
    expect(autoStartAllowed(null)).toBe(false);
    expect(autoStartAllowed('later')).toBe(false);
    expect(autoStartAllowed('yes')).toBe(true);
  });

  it('any stored value that is not yes or later is unset', () => {
    expect(parseChoice('yes')).toBe('yes');
    expect(parseChoice('later')).toBe('later');
    for (const v of [null, undefined, '', 'YES', 'true', '1', 'no']) expect(parseChoice(v as string | null | undefined)).toBeNull();
  });
});

describe('existing phones migrate once; a fresh install stays unset', () => {
  const base = { stored: null, migrated: false, languageChosen: false, modelInstalled: false };

  it('a language already chosen means yes', () => {
    expect(planConsentMigration({ ...base, languageChosen: true })).toEqual({ choice: 'yes', markMigrated: true });
  });

  it('a model already installed means yes', () => {
    expect(planConsentMigration({ ...base, modelInstalled: true })).toEqual({ choice: 'yes', markMigrated: true });
  });

  it('a fresh install has neither: nothing is chosen, and the migration is marked done', () => {
    expect(planConsentMigration(base)).toEqual({ choice: null, markMigrated: true });
  });

  it('runs once: a language picked in first run is never read as old consent on the next launch', () => {
    expect(planConsentMigration({ ...base, migrated: true, languageChosen: true })).toBeNull();
  });

  it('never overrides an answer the person already gave', () => {
    expect(planConsentMigration({ ...base, stored: 'later', languageChosen: true })).toEqual({ choice: null, markMigrated: true });
    expect(planConsentMigration({ ...base, stored: 'yes', languageChosen: true })).toEqual({ choice: null, markMigrated: true });
  });
});

describe('the ask and free space', () => {
  const large = 190_085_487;

  it('uses the engine reserve: 1 GB after a large model, 20 MB after a small one', () => {
    expect(reserveFor(574_041_195)).toBe(LARGE_PACK_RESERVE_BYTES);
    expect(reserveFor(190_085_487)).toBe(LARGE_PACK_RESERVE_BYTES);
    expect(reserveFor(885_098)).toBe(SMALL_PACK_RESERVE_BYTES);
    expect(neededBytes(574_041_195)).toBe(574_041_195 + 1_000_000_000);
  });

  it('low space: below size plus reserve shows the space line and no button', () => {
    const size = 574_041_195;
    expect(askKind(size, size + 1_000_000_000 - 1)).toBe('low_space');
    expect(askKind(size, size + 1_000_000_000)).toBe('ask');
    expect(askKind(size, 0)).toBe('low_space');
    expect(hasRoomFor(large, 2_000_000_000)).toBe(true);
  });

  it('unknown free space is not a reason to hide the button (the engine checks before it writes)', () => {
    expect(askKind(574_041_195, null)).toBe('ask');
  });

  it('the size comes from the plan for this tier: the compact tier is the smaller model', () => {
    const full = speechPlan(['en'], 'full', () => true).bytes;
    const compact = speechPlan(['en'], 'compact', () => true).bytes;
    expect(compact).toBeLessThan(full);
    // The 190 MB model (plus the 1 MB voice detector) for phones under 4 GB, never the typed 575 MB.
    expect(compact).toBeLessThan(200_000_000);
  });
});

describe('Review ask card', () => {
  it('shows only when the person has not said yes and nothing is in flight or held', () => {
    expect(showReviewAsk({ choice: null, progress: null, hold: null })).toBe(true);
    expect(showReviewAsk({ choice: 'later', progress: null, hold: null })).toBe(true);
    expect(showReviewAsk({ choice: 'yes', progress: null, hold: null })).toBe(false);
    expect(showReviewAsk({ choice: null, progress: 0.4, hold: null })).toBe(false);
    expect(showReviewAsk({ choice: 'later', progress: null, hold: 'waiting_for_wifi' })).toBe(false);
  });
});

describe('wiring', () => {
  const queue = src('lib/transcription-queue/index.ts');

  it('picking a language only stores it; the queue starts a download for it only after a yes', () => {
    const lang = src('lib/models/author-language.ts');
    const setter = lang.slice(lang.indexOf('export function setAuthorSpeechLanguage'), lang.indexOf('/** The queue listens'));
    expect(setter).toMatch(/setSetting\(AUTHOR_LANGUAGE_KEY, lang\)/);
    expect(queue).toMatch(/onAuthorSpeechLanguage\(\(lang\) => \{ if \(speechAutoStartAllowed\(\)\) void requestSpeechFor\(lang\); \}\)/);
  });

  it('the first Review and waiting letters ask for a download only after a yes', () => {
    const words = queue.slice(queue.indexOf('export function requestWords'), queue.indexOf('/** "Try again"'));
    expect(words).toMatch(/if \(speechAutoStartAllowed\(\)\) void requestSpeechFor\(language\)/);
    expect(queue).toMatch(/speechAutoStartAllowed\(\) && !askedDownload\.has\(lang\)/);
  });

  it('every other call to requestSpeechFor is gated; a tap goes through startSpeechDownload, which records the yes', () => {
    const calls = [...queue.matchAll(/requestSpeechFor\(/g)].length;
    // definition + the three gated calls + startSpeechDownload
    expect(calls).toBe(5);
    expect(queue).toMatch(/export async function startSpeechDownload[\s\S]*?setSpeechDownloadChoice\('yes'\);\s*await requestSpeechFor\(language, opts\)/);
    expect(src('app/settings/recordings.tsx')).not.toMatch(/\brequestSpeechFor\b/);
  });

  it('the migration runs when the queue starts', () => {
    expect(queue).toMatch(/started = true;\s*migrateSpeechConsent\(\)/);
  });

  it('first run asks at the end, Review asks if the person said later, the wait card has a one-time mobile data button', () => {
    expect(src('app/onboarding.tsx')).toMatch(/<SpeechConsentCard/);
    const card = src('components/speech/speech-consent-card.tsx');
    expect(card).toMatch(/startSpeechDownload\(language\)/);
    expect(card).toMatch(/ask\.kind === 'low_space'/);
    const review = src('app/review.tsx');
    expect(review).toMatch(/showReviewAsk\(/);
    expect(review).toMatch(/startSpeechDownload\(language, \{ allowCellularOnce: true \}\)/);
    expect(review).toMatch(/formatBytes\(ask\.bytes\)/);
  });

  it('the card never types a size: it comes from the plan', () => {
    for (const text of [speechConsentCopy.body, speechConsentCopy.lowSpace, wordsCopy.pack.askBody, wordsCopy.pack.mobileDataButton]) {
      expect(text).toContain('{size}');
      expect(text).not.toMatch(/\d+\s?(MB|GB)/);
    }
  });

  it('nothing in the consent code logs or sends a value', () => {
    for (const f of ['lib/models/speech-consent.ts', 'lib/models/speech-consent.logic.ts', 'components/speech/speech-consent-card.tsx']) {
      expect(src(f), f).not.toMatch(/console\.|track\(|fetch\(/);
    }
  });
});

describe('copy', () => {
  it('names the choice and the size, promises nothing about speed and keeps the voice', () => {
    expect(speechConsentCopy.downloadButton).toBe('Download on Wi-Fi');
    expect(speechConsentCopy.laterButton).toBe('Not now');
    expect(speechConsentCopy.footnote).toMatch(/Your voice is always kept/);
    expect(wordsCopy.pack.askBody).toMatch(/Your voice is kept/);
  });
});
