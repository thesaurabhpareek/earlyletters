/// <reference types="node" />
/**
 * NS-16 remote pause (BL-980, GAP-LOG G-18; review B finding 5 on #2093): `killSwitches.signAsOther` in the signed
 * config already on the phone hides the From card even with the build flag on, so a new letter signs as the parent,
 * as before. It never turns the card on, a config that cannot be read is not paused (fail-open, as every pause), and
 * the config is read only with the flag on. Fictional Asha family only.
 *
 * Mutant this file was written to catch: `signAsOtherOffered` ignores the pause (returns the build flag alone). On
 * develop before this change the file does not load (no pause exists), so every test here is red.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({ useState: (init: unknown) => [typeof init === 'function' ? (init as () => unknown)() : init, () => {}] }));
const h = vi.hoisted(() => ({ settings: new Map<string, string>() }));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
  getEntry: () => null,
}));

import { setSignAsOtherForTest, setSignAsOtherRemoteForTest, signAsOtherOffered, useFromName } from '../src/lib/capture/sign-as-other';
import { serializeDraftName, signAsOtherPaused, SIGN_AS_DRAFT_SETTING } from '../src/lib/capture/sign-as-other.logic';

let reads = 0;
const config = (killSwitches: Record<string, unknown> | null) => () => ({
  getRemoteConfig: () => {
    reads += 1;
    return { killSwitches };
  },
});

beforeEach(() => {
  h.settings.clear();
  reads = 0;
  setSignAsOtherForTest(true);
  setSignAsOtherRemoteForTest(config({ signAsOther: false }));
});

describe('[NS-16][G-18] killSwitches.signAsOther hides the From card', () => {
  it('[NS-16][G-18] with the flag on and no pause the card is offered', () => {
    expect(signAsOtherOffered()).toBe(true);
    expect(useFromName({ draftId: 'd1', keptEntryId: null }).offered).toBe(true);
  });

  it('[NS-16][G-18] the pause hides the card even with the build flag on, and Keep signs as the parent', () => {
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani'));
    setSignAsOtherRemoteForTest(config({ signAsOther: true }));
    const from = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(from.offered).toBe(false);
    expect(from.typed).toBe(''); // the typed name is not shown or used while paused
    expect(from.shown('Mama')).toBe('Mama');
    expect(from.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
  });

  it('[NS-16][G-18] the pause never turns the card on: flag off stays off, and the config is not read', () => {
    setSignAsOtherForTest(false);
    setSignAsOtherRemoteForTest(config({ signAsOther: false }));
    expect(useFromName({ draftId: 'd1', keptEntryId: null }).offered).toBe(false);
    expect(reads).toBe(0);
  });

  it('[NS-16][G-18] fail-open: a config that cannot be read, lacks the key or holds anything but true is not paused', () => {
    setSignAsOtherRemoteForTest(() => {
      throw new Error('no config yet');
    });
    expect(signAsOtherOffered()).toBe(true);
    for (const ks of [null, {}, { signAsOther: 'true' }, { signAsOther: 1 }, { bookSearch: true }]) {
      setSignAsOtherRemoteForTest(config(ks));
      expect(signAsOtherOffered(), JSON.stringify(ks)).toBe(true);
    }
    expect(signAsOtherPaused(null)).toBe(false);
    expect(signAsOtherPaused({ killSwitches: { signAsOther: true } })).toBe(true);
  });

  it('[NS-16][G-18] the letter sheet draws the From card only when offered', () => {
    const sheet = readFileSync(join(__dirname, '..', 'src', 'components', 'capture', 'letter-sheet.tsx'), 'utf8');
    expect(sheet).toContain('{from?.offered ? (');
  });

  it('[NS-16][G-18] the key is in the shared kill-switch vocabulary, so a signed config can carry it', async () => {
    const { KILL_SWITCH_KEYS, DEFAULT_REMOTE_CONFIG } = await import('../../../packages/api/src/remote-config');
    expect(KILL_SWITCH_KEYS as readonly string[]).toContain('signAsOther');
    expect(DEFAULT_REMOTE_CONFIG.killSwitches.signAsOther).toBe(false);
  });
});
