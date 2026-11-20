/// <reference types="node" />
/**
 * Founder, TestFlight 1.0.0 (8), 1 Nov 2026: "The download progress thing at first setup didn't show progress
 * percentage." After #541 the first-run card ("The book is open.", S08) still drew an empty bar below 1% (the fill
 * read the shown percent, null there, as 0), its fill grew by width, the whole card was a live region that re-read
 * every percent, and nothing said the person could start while it downloads. These tests pin the fix (wait-design,
 * wait-product, wait-content section 1).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { speechConsentCopy, speechSettingsCopy } from '@scribe/content';
import {
  barScale,
  consentLine,
  doneLine,
  showsStartNow,
  spokenLine,
  stateAnnouncement,
  type ConsentDownload,
} from '../src/components/speech/speech-consent-card.logic';
import { packsCopy } from '../src/lib/packs/copy';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const card = src('components/speech/speech-consent-card.tsx');
const idle: ConsentDownload = { progress: null, stage: null, hold: null, failure: null };

describe('the bar shows at low progress', () => {
  it('the fill is drawn from the true fraction, so 0.2% is not an empty bar', () => {
    expect(barScale(0.002)).toBeCloseTo(0.002, 6);
    expect(barScale(-1)).toBe(0);
    expect(barScale(2)).toBe(1);
    expect(barScale(Number.NaN)).toBe(0);
    // The old card passed `shownPercent(line.bar) ?? 0`: 0 below 1%.
    expect(card).not.toMatch(/shownPercent\(line\.bar\) \?\? 0/);
  });

  it('track controlBorder (bg-input, never bg-border), fill accent (bg-primary), grown by scaleX, never width', () => {
    const bar = card.slice(card.indexOf('function ProgressLine'));
    expect(bar).toMatch(/rounded-full bg-input/);
    expect(bar).not.toMatch(/bg-border/);
    expect(bar).toMatch(/bg-primary/);
    expect(bar).toMatch(/scaleX: scale\.value/);
    expect(bar).toMatch(/transformOrigin: 'left'/);
    expect(bar).not.toMatch(/width: `/);
    expect(bar).toMatch(/tokens\.motion\.snappy/);
    // Reduce Motion: steps to each value.
    expect(bar).toMatch(/reduced \? target :/);
  });

  it('VoiceOver: a stable label, the percent as the value, and no number below 1%', () => {
    const bar = card.slice(card.indexOf('function ProgressLine'));
    expect(bar).toMatch(/accessibilityLabel=\{packsCopy\.phases\.downloading\}/);
    expect(bar).toMatch(/accessibilityValue=\{n === null \? undefined : \{ min: 0, max: 100, now: n \}\}/);
  });
});

describe('"You can start now" is said only where it is true', () => {
  it('the line', () => {
    expect(speechConsentCopy.startNow).toBe('You can start now. Your voice is kept, and the words follow.');
  });

  it('shown while the download is on its way: at the tap, queued, moving, checking, finishing, waiting for Wi-Fi, offline', () => {
    expect(showsStartNow(idle, false)).toBe(true);
    for (const stage of ['queued', 'verifying', 'installing'] as const) expect(showsStartNow({ ...idle, stage }, false)).toBe(true);
    expect(showsStartNow({ ...idle, progress: 0.002 }, false)).toBe(true);
    expect(showsStartNow({ ...idle, progress: 0.42 }, false)).toBe(true);
    expect(showsStartNow({ ...idle, hold: 'waiting_for_wifi' }, false)).toBe(true);
    expect(showsStartNow({ ...idle, hold: 'offline' }, false)).toBe(true);
  });

  it('not once the words are here, not after a failure, not when the phone needs space', () => {
    expect(showsStartNow(idle, true)).toBe(false);
    expect(showsStartNow({ ...idle, failure: 'download_failed' }, false)).toBe(false);
    expect(showsStartNow({ ...idle, failure: 'cancelled' }, false)).toBe(false);
    expect(showsStartNow({ ...idle, hold: 'no_space' }, false)).toBe(false);
  });

  it('it is true in this build: a recording made while the pack is missing waits for it and is kept', () => {
    const machine = src('lib/transcription-queue/machine.ts');
    expect(machine).toMatch(/isReady\(s, lang\) \? 'queued' : 'waiting_for_pack'/);
    const review = src('app/review.tsx');
    expect(review).toMatch(/keep: \(\) => void keepRecordingOnly\(\)/);
    // Listen does not wait for the speech download.
    expect(src('app/listen.tsx')).not.toMatch(/installedPathsFor|speechDownload/);
  });

  it('the card draws it from showsStartNow, one still line, no rotation', () => {
    expect(card).toMatch(/showsStartNow\(download, done\) \?/);
    expect(card).toMatch(/\{t\.startNow\}/);
    expect(card).not.toMatch(/setInterval/);
  });
});

describe('per-state lines', () => {
  it('checking is "Almost ready. Checking the download." (the SHA-256 runs in verifying)', () => {
    expect(consentLine({ ...idle, stage: 'verifying' }, 575).text).toBe('Almost ready. Checking the download.');
    expect(src('lib/packs/engine.ts')).toMatch(/phase: 'verifying'[^\n]*\n\s*const digest = await fs\.sha256/);
    // Finishing is the rename after the check: it keeps its own word.
    expect(consentLine({ ...idle, stage: 'installing' }, 575).text).toBe(packsCopy.phases.installing);
  });

  it('a failure a tap can help with: "The download stopped.", the reason, and Try again', () => {
    expect(consentLine({ ...idle, failure: 'hash_mismatch' }, 575)).toEqual({
      text: speechSettingsCopy.downloadFailures.hash_mismatch,
      bar: null,
      retry: true,
      lead: 'The download stopped.',
    });
    expect(consentLine({ ...idle, failure: 'storage_error' }, 575).lead).toBe(speechConsentCopy.stopped);
    expect(consentLine({ ...idle, failure: 'something_new' }, 575).lead).toBe(speechConsentCopy.stopped);
  });

  it('never says it twice, and never where nothing started or a tap cannot help', () => {
    expect(consentLine({ ...idle, failure: 'download_failed' }, 575).lead).toBeUndefined();
    expect(consentLine({ ...idle, failure: 'download_stopped' }, 575).lead).toBeUndefined();
    expect(consentLine({ ...idle, failure: 'no_manifest' }, 575).lead).toBeUndefined();
    expect(consentLine({ ...idle, failure: 'needs_app_update' }, 575).lead).toBeUndefined();
  });

  it('the card shows the lead above the reason', () => {
    expect(card).toMatch(/line\.lead \? <Text variant="callout">\{line\.lead\}<\/Text> : null/);
  });
});

describe('VoiceOver hears changes of state, not each percent', () => {
  it('no live region on the downloading view', () => {
    const yes = card.slice(card.indexOf("choice === 'yes' ? ("), card.indexOf('{t.startNow}'));
    expect(yes).toMatch(/ProgressLine bar=/);
    expect(yes).not.toMatch(/accessibilityLiveRegion/);
  });

  it('a new percent is not a new state; a wait, a check, a failure and done are', () => {
    const at = (progress: number) => consentLine({ ...idle, progress }, 575);
    expect(stateAnnouncement(at(0.2), at(0.21))).toBeNull();
    expect(stateAnnouncement(at(0.002), at(0.42))).toBeNull();
    expect(stateAnnouncement(consentLine(idle, 575), at(0.01))).toBe(packsCopy.phases.downloading);
    expect(stateAnnouncement(at(0.99), consentLine({ ...idle, stage: 'verifying' }, 575))).toBe(speechConsentCopy.checking);
    expect(stateAnnouncement(at(0.5), consentLine({ ...idle, failure: 'hash_mismatch' }, 575))).toBe(
      `The download stopped. ${speechSettingsCopy.downloadFailures.hash_mismatch}`,
    );
    expect(stateAnnouncement(consentLine({ ...idle, stage: 'installing' }, 575), doneLine(575))).toBe('On this phone, 575 MB');
  });

  it('on mount only a failure that asks for a tap is said (the tap already said its line)', () => {
    expect(stateAnnouncement(null, consentLine(idle, 575))).toBeNull();
    expect(stateAnnouncement(null, consentLine({ ...idle, failure: 'download_stopped' }, 575))).toBe(speechSettingsCopy.downloadFailures.download_stopped);
    expect(spokenLine(consentLine({ ...idle, progress: 0.42 }, 575))).toBe(packsCopy.phases.downloading);
  });
});
