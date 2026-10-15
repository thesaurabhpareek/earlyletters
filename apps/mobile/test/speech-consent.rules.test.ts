/**
 * Speech download consent and the download-start rules as truth tables
 * (D-087, debate Q-015 3.3): every combination of the stored choice, the
 * migration inputs, free space at the boundary, and the Review ask card.
 * Pure functions; test/speech-consent.test.ts covers the wiring.
 */
import { describe, expect, it } from 'vitest';
import { LARGE_PACK_RESERVE_BYTES, SMALL_PACK_RESERVE_BYTES } from '../src/lib/packs/engine';
import {
  askKind,
  autoStartAllowed,
  hasRoomFor,
  neededBytes,
  parseChoice,
  planConsentMigration,
  reserveFor,
  showReviewAsk,
  SPEECH_DOWNLOAD_KEY,
  SPEECH_DOWNLOAD_MIGRATED_KEY,
  type SpeechDownloadChoice,
} from '../src/lib/models/speech-consent.logic';

describe('the stored choice', () => {
  it.each([
    ['yes', 'yes'],
    ['later', 'later'],
    ['YES', null],
    ['Yes', null],
    [' yes', null],
    ['no', null],
    ['true', null],
    ['1', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('parseChoice(%j) is %j', (stored, choice) => {
    expect(parseChoice(stored)).toBe(choice);
  });

  it('[D-087] only yes lets the app start a download by itself', () => {
    expect(autoStartAllowed('yes')).toBe(true);
    expect(autoStartAllowed('later')).toBe(false);
    expect(autoStartAllowed(null)).toBe(false);
  });

  it('the keys are stable device settings (renaming them would re-ask every phone)', () => {
    expect(SPEECH_DOWNLOAD_KEY).toBe('speech.download');
    expect(SPEECH_DOWNLOAD_MIGRATED_KEY).toBe('speech.download.migrated');
  });
});

describe('the one-time migration, every combination', () => {
  const stored: Array<string | null> = [null, 'yes', 'later', 'junk'];
  const bools = [false, true];
  const rows: Array<[string | null, boolean, boolean, boolean]> = [];
  for (const s of stored) for (const migrated of bools) for (const languageChosen of bools) for (const modelInstalled of bools) rows.push([s, migrated, languageChosen, modelInstalled]);

  it.each(rows)('stored=%j migrated=%s language=%s model=%s', (s, migrated, languageChosen, modelInstalled) => {
    const plan = planConsentMigration({ stored: s, migrated, languageChosen, modelInstalled });
    if (migrated) {
      expect(plan).toBeNull();
      return;
    }
    expect(plan?.markMigrated).toBe(true);
    if (parseChoice(s)) {
      // an answer the person gave is never overridden
      expect(plan?.choice).toBeNull();
    } else {
      expect(plan?.choice).toBe(languageChosen || modelInstalled ? 'yes' : null);
    }
  });

  it('[D-087] a fresh install stays unset after the migration, so nothing downloads until the person answers', () => {
    expect(planConsentMigration({ stored: null, migrated: false, languageChosen: false, modelInstalled: false })).toEqual({ choice: null, markMigrated: true });
  });
});

describe('free space at the boundary', () => {
  it('the reserve follows the pack engine: 50 MB and under is a small pack, a byte more is large', () => {
    expect(reserveFor(50_000_000)).toBe(SMALL_PACK_RESERVE_BYTES);
    expect(reserveFor(50_000_001)).toBe(LARGE_PACK_RESERVE_BYTES);
    expect(reserveFor(0)).toBe(SMALL_PACK_RESERVE_BYTES);
    expect(neededBytes(50_000_000)).toBe(50_000_000 + SMALL_PACK_RESERVE_BYTES);
    expect(neededBytes(800_000_000)).toBe(800_000_000 + LARGE_PACK_RESERVE_BYTES);
  });

  it.each([
    [800_000_000, null, true, 'ask'],
    [800_000_000, 800_000_000 + LARGE_PACK_RESERVE_BYTES, true, 'ask'],
    [800_000_000, 800_000_000 + LARGE_PACK_RESERVE_BYTES - 1, false, 'low_space'],
    [800_000_000, 0, false, 'low_space'],
    [10_000_000, 10_000_000 + SMALL_PACK_RESERVE_BYTES, true, 'ask'],
    [10_000_000, 10_000_000 + SMALL_PACK_RESERVE_BYTES - 1, false, 'low_space'],
  ])('model %i bytes, free %j: room %s, card %s', (bytes, free, room, kind) => {
    expect(hasRoomFor(bytes, free)).toBe(room);
    expect(askKind(bytes, free)).toBe(kind);
  });
});

describe('the Review ask card, every combination', () => {
  const choices: Array<SpeechDownloadChoice | null> = [null, 'later', 'yes'];
  const progresses: Array<number | null> = [null, 0, 0.5, 1];
  const holds: Array<'waiting_for_wifi' | 'no_space' | 'offline' | null> = [null, 'waiting_for_wifi', 'no_space', 'offline'];
  const rows: Array<[SpeechDownloadChoice | null, number | null, 'waiting_for_wifi' | 'no_space' | 'offline' | null]> = [];
  for (const c of choices) for (const p of progresses) for (const h of holds) rows.push([c, p, h]);

  it.each(rows)('choice=%j progress=%j hold=%j', (choice, progress, hold) => {
    const shown = showReviewAsk({ choice, progress, hold });
    expect(shown).toBe(choice !== 'yes' && progress === null && hold === null);
  });

  it('[D-087] exactly two of the combinations show the card: no answer, or "later", with nothing in flight or held', () => {
    expect(rows.filter(([c, p, h]) => showReviewAsk({ choice: c, progress: p, hold: h })).map(([c]) => c)).toEqual([null, 'later']);
  });
});
