/// <reference types="node" />
/**
 * TestFlight build 1 (1 Nov 2026): the first-run speech card read "Getting ready, 0%" and never moved. A pack that
 * was queued or waiting for Wi-Fi counted as "in flight" with 0 bytes, so the old combineProgress returned 0 and the
 * card, which never read the wait or the failure, printed 0%. These tests pin the rule: a percent only while bytes
 * move; a wait, a check and a failure are said in words, a failure with Try again.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { speechConsentCopy, speechSettingsCopy } from '@scribe/content';
import { consentLine, doneLine } from '../src/components/speech/speech-consent-card.logic';
import { downloadMotion, shownPercent, type PackEvent } from '../src/lib/models/speech-download.logic';
import { packsCopy } from '../src/lib/packs/copy';

const VAD = 'speech-model.silero-vad-v6.2.0';
const ASR = 'speech-model.whisper-large-v3-turbo-q5_0';
const SIZES: Record<string, number> = { [VAD]: 885_098, [ASR]: 574_041_195 };
const PACKS = [VAD, ASR];
const bytesOf = (id: string) => SIZES[id];

function motion(events: Record<string, PackEvent>, installed: string[] = []) {
  return downloadMotion(PACKS, bytesOf, (id) => installed.includes(id), new Map(Object.entries(events)));
}

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

describe('a percent exists only while bytes move', () => {
  it('a queued pack has a stage and no percent (the old code returned 0)', () => {
    expect(motion({ [VAD]: { phase: 'queued', bytesDone: 0 } })).toEqual({ progress: null, stage: 'queued' });
  });

  it('a pack waiting for Wi-Fi after the small one installed has no percent (the field case: 0.15% printed as 0%)', () => {
    expect(motion({ [ASR]: { phase: 'waiting_for_wifi', bytesDone: 0 } }, [VAD])).toEqual({ progress: null, stage: null });
  });

  it('checking and finishing are stages, not percents', () => {
    expect(motion({ [ASR]: { phase: 'verifying', bytesDone: SIZES[ASR] } }, [VAD]).stage).toBe('verifying');
    expect(motion({ [ASR]: { phase: 'installing', bytesDone: SIZES[ASR] } }, [VAD]).stage).toBe('installing');
  });

  it('failed, cancelled and removed packs are not moving', () => {
    for (const phase of ['failed', 'cancelled', 'removed']) expect(motion({ [ASR]: { phase, bytesDone: 0 } })).toEqual({ progress: null, stage: null });
  });

  it('bytes moving give progress across every pack, installed ones in full', () => {
    const half = Math.floor(SIZES[ASR] / 2);
    const m = motion({ [ASR]: { phase: 'downloading', bytesDone: half } }, [VAD]);
    expect(m.stage).toBeNull();
    expect(m.progress).toBeCloseTo((SIZES[VAD] + half) / (SIZES[VAD] + SIZES[ASR]), 6);
  });

  it('never shows 0% and never 100% before it is done', () => {
    expect(shownPercent(null)).toBeNull();
    expect(shownPercent(0)).toBeNull();
    expect(shownPercent(0.0015)).toBeNull();
    expect(shownPercent(0.4)).toBe(40);
    expect(shownPercent(0.999)).toBe(99);
  });
});

describe('the first-run card line', () => {
  const idle = { progress: null, stage: null, hold: null, failure: null } as const;

  it('waiting for Wi-Fi says so, with no bar and no percent', () => {
    const l = consentLine({ ...idle, hold: 'waiting_for_wifi' }, 575);
    expect(l).toEqual({ text: 'Waits for Wi-Fi, 575 MB', bar: null, retry: false });
    expect(l.text).not.toMatch(/%/);
  });

  it('queued and checking are said in words', () => {
    expect(consentLine({ ...idle, stage: 'queued' }, 575).text).toBe(packsCopy.phases.queued);
    expect(consentLine({ ...idle, stage: 'verifying' }, 575).text).toBe(packsCopy.phases.verifying);
    expect(consentLine({ ...idle, stage: 'queued' }, 575).bar).toBeNull();
  });

  it('moving bytes under 1% show the bar and the word, not 0%', () => {
    const l = consentLine({ ...idle, progress: 0.002 }, 575);
    expect(l.text).toBe(packsCopy.phases.downloading);
    expect(l.bar).toBe(0.002);
  });

  it('moving bytes show the percent and the bar', () => {
    expect(consentLine({ ...idle, progress: 0.42 }, 575)).toEqual({ text: 'Getting ready, 42%', bar: 0.42, retry: false });
  });

  it('a failure is said calmly, with Try again where a tap can help', () => {
    expect(consentLine({ ...idle, failure: 'download_failed' }, 575)).toEqual({ text: speechSettingsCopy.downloadFailures.download_failed, bar: null, retry: true });
    expect(consentLine({ ...idle, failure: 'no_manifest' }, 575).retry).toBe(false);
    expect(consentLine({ ...idle, failure: 'something_new' }, 575).text).toBe(packsCopy.failures.generic);
  });

  it('before the first event it keeps the line said at the tap; once installed it says so', () => {
    expect(consentLine(idle, 575).text).toBe(speechConsentCopy.chosenYes);
    expect(doneLine(575).text).toBe('On this phone, 575 MB');
  });

  it('the card draws from consentLine, offers Try again, and its track is controlBorder (bg-input)', () => {
    const card = src('components/speech/speech-consent-card.tsx');
    expect(card).toMatch(/consentLine\(download, mb\)/);
    expect(card).toMatch(/line\.retry \?/);
    expect(card).toMatch(/rounded-full bg-input/);
    expect(card).not.toMatch(/speechSettingsCopy\.downloading/);
  });
});
