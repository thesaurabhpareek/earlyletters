/// <reference types="node" />
/**
 * BL-1999, spec 15 (docs/design/specs/15-FIRST-LETTER-NO-MODEL-20261124.md): a first letter with no speech model.
 * The rule is pure (words-state.logic `typedOfferShown`); Node cannot load React Native, so the screen's use of it is
 * checked in its source, as listen.test.ts does. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listenRoom } from '@/components/capture/listen.logic';
import { typedOfferShown } from '@/components/capture/words-state.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const listen = code(src('app/listen.tsx'));

const base = { startControl: true, onThisPhone: false, choice: null as 'yes' | 'later' | null, hold: null as 'waiting_for_wifi' | 'no_space' | 'offline' | null, failure: null as string | null };

describe('the typed offer on Listen (spec 15 section 3)', () => {
  it('[FL-01] offer shows at Not now, and with no choice yet', () => {
    expect(typedOfferShown({ ...base, choice: 'later' })).toBe(true);
    expect(typedOfferShown({ ...base, choice: null })).toBe(true);
  });
  it('[FL-02] offer shows on a Wi-Fi wait, offline, no space, and a failure', () => {
    expect(typedOfferShown({ ...base, choice: 'yes', hold: 'waiting_for_wifi' })).toBe(true);
    expect(typedOfferShown({ ...base, choice: 'yes', hold: 'offline' })).toBe(true);
    expect(typedOfferShown({ ...base, choice: 'yes', hold: 'no_space' })).toBe(true);
    expect(typedOfferShown({ ...base, choice: 'yes', failure: 'checksum' })).toBe(true);
  });
  it('[FL-03] no offer while words are coming', () => {
    expect(typedOfferShown({ ...base, choice: 'yes' })).toBe(false);
  });
  it('[FL-04] no offer when the model is here', () => {
    for (const choice of [null, 'later', 'yes'] as const) expect(typedOfferShown({ ...base, choice, onThisPhone: true })).toBe(false);
  });
  it('[FL-05] never during a take, and Listen draws it only where the start control is', () => {
    for (const phase of ['asking', 'recording', 'paused', 'finishing'] as const) {
      expect(typedOfferShown({ ...base, startControl: listenRoom(phase).startControl })).toBe(false);
    }
    expect(typedOfferShown({ ...base, startControl: listenRoom('ready').startControl })).toBe(true);
    expect(listen).toMatch(/startControl: room\.startControl,/);
  });
  it('[FL-06] typing starts nothing: the offer opens Write as typeInstead does and never writes the choice or starts a download', () => {
    expect(listen).toMatch(/label=\{copy\.errors\.micDenied\.typeButton\} onPress=\{typeInstead\} disabled=\{!typeOffer\} testID="listen\.type"/);
    expect(listen).toMatch(/const typeInstead = \(\) => router\.replace\(\{ pathname: '\/write', params: promptKey \? \{ promptKey \} : \{\} \}\)/);
    expect(listen).not.toMatch(/setSpeechDownloadChoice|startSpeechDownload|requestWords/);
  });
  it('shows once: the picture Type already is the offer, so the two never show together', () => {
    expect(listen).toMatch(/const typeOffer =\s*!withPhoto &&/);
    expect(listen).toMatch(/\{!withPhoto \? \(\s*<View[^>]*testID="listen\.typeSlot"/);
  });
  it('the install check is lazy: it is evaluated only after room.startControl, never during a take (#480)', () => {
    const at = listen.indexOf('const typeOffer =');
    const expr = listen.slice(at, listen.indexOf(';', at));
    expect(expr.indexOf('room.startControl &&')).toBeGreaterThan(-1);
    expect(expr.indexOf('room.startControl &&')).toBeLessThan(expr.indexOf('speechOnThisPhone('));
    expect(listen.match(/speechOnThisPhone\(speechLanguage\)/g)).toHaveLength(1);
  });
  it('the slot is always held, hidden like listen.discardSlot, so the red circle never moves (5.8 rule 3)', () => {
    const slot = listen.slice(listen.indexOf('testID="listen.typeSlot"') - 400, listen.indexOf('testID="listen.typeSlot"'));
    expect(slot).toMatch(/opacity: typeOffer \? 1 : 0/);
    expect(slot).toMatch(/pointerEvents=\{typeOffer \? 'auto' : 'none'\}/);
    expect(slot).toMatch(/accessibilityElementsHidden=\{!typeOffer\}/);
    expect(slot).toMatch(/importantForAccessibility=\{typeOffer \? 'auto' : 'no-hide-descendants'\}/);
  });
  it('reads the model state without starting anything, and adds no new string', () => {
    expect(listen).toMatch(/useSpeechDownload\(phase === 'ready'/);
    expect(listen).not.toMatch(/"Type instead"/);
  });
  it('the download state is read only at Ready with no picture, so a live take reads no settings (#480)', () => {
    expect(listen).toMatch(/useSpeechDownload\(phase === 'ready' && !pendingPhoto\?\.source \? speechLanguage : null\)/);
    expect(listen).not.toMatch(/useSpeechDownload\(speechLanguage\)/);
    // The hook's null path returns idle before any speech-state read.
    const hook = readFileSync(join(__dirname, '..', 'src/lib/transcription-queue/use-words.ts'), 'utf8');
    expect(hook.indexOf('if (!language) return')).toBeGreaterThan(-1);
    expect(hook.indexOf('if (!language) return')).toBeLessThan(hook.indexOf('speechDownloadProgress(language)'));
  });
});
