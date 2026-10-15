/**
 * G-16 regression guards over the native sources (security review
 * docs/reviews/2026-10-04-security-privacy.md L9; ADR 0015's AUSoundIsolation
 * risk). Swift cannot be compiled in CI here, so these read the files and fail
 * if a guard is removed, or if the module APIs drift apart. Ported from
 * auto/2026-10-05-fixes (d1cbddb); device checks are in the PR body.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULES = join(__dirname, '..', 'modules');
const read = (p: string) => readFileSync(join(MODULES, p), 'utf8');
const audio = read('scribe-audio/ios/ScribeAudioModule.swift');
const store = read('scribe-store/ios/ScribeStoreModule.swift');
const sheet = read('scribe-store/ios/PlusStoreSheet.swift');
const kotlinStore = read('scribe-store/android/src/main/java/expo/modules/scribestore/ScribeStoreModule.kt');
const tsStore = read('scribe-store/index.ts');

/** AsyncFunction / Function names a module declares. */
const functions = (src: string) => [...src.matchAll(/(?:Async)?Function\("(\w+)"\)/g)].map((m) => m[1]).sort();

describe('ScribeAudio: no Int conversion traps (review L9)', () => {
  it('samples() and frame() check isFinite and clamp before Int(_:)', () => {
    const samples = audio.slice(audio.indexOf('static func samples'), audio.indexOf('static func frame'));
    expect(samples).toMatch(/isFinite/);
    expect(samples).toMatch(/maxDecodeSamples/);
    const frame = audio.slice(audio.indexOf('static func frame'), audio.indexOf('private static func decode('));
    expect(frame).toMatch(/isFinite/);
  });

  it('no unguarded Int(...rounded()) or AVAudioFramePosition(...rounded()) left', () => {
    expect(audio).not.toMatch(/Int\(\([^)]*\)\.rounded\(\)\)/);
    expect(audio).not.toMatch(/AVAudioFramePosition\(\([^)]*\)\.rounded\(\)\)/);
  });

  it('caps one decode request', () => {
    expect(audio).toMatch(/total <= maxDecodeSamples/);
  });
});

describe('ScribeAudio: AUSoundIsolation cannot crash the app (ADR 0015)', () => {
  it('validates the format before any engine call', () => {
    const enhance = audio.slice(audio.indexOf('private func enhance('));
    expect(enhance.indexOf('isolationFormatSupported(format)')).toBeGreaterThan(-1);
    expect(enhance.indexOf('isolationFormatSupported(format)')).toBeLessThan(enhance.indexOf('engine.attach'));
  });

  it('runs attach, connect, manual rendering, start and render inside the Objective-C exception catcher', () => {
    expect(audio).toMatch(/EXUtilities\.catchException/);
    const enhance = audio.slice(audio.indexOf('private func enhance('));
    for (const call of ['engine.attach(player)', 'engine.connect(player', 'enableManualRenderingMode', 'try engine.start()', 'renderOffline']) {
      const at = enhance.indexOf(call);
      expect(at, call).toBeGreaterThan(-1);
      const before = enhance.slice(Math.max(0, at - 400), at);
      expect(before, call).toMatch(/Self\.guarded\(/);
    }
  });

  it('remembers a broken isolation unit for the rest of the process', () => {
    expect(audio).toMatch(/markIsolationBroken\(\)/);
    expect(audio).toMatch(/isolationBroken/);
  });
});

describe('ScribeStore: the sheet can never stay stuck (review L9)', () => {
  it('resumes the continuation exactly once', () => {
    expect(store).toMatch(/final class OnceResume/);
    expect(store).toMatch(/OnceResume\(continuation\)/);
  });

  it('refuses a busy or detached presenter up front', () => {
    expect(store).toMatch(/isBeingDismissed/);
    expect(store).toMatch(/presentedViewController == nil/);
  });

  it('has a presentation watchdog, an idempotent teardown and an onDisappear path', () => {
    expect(sheet).toMatch(/presentTimeout/);
    expect(sheet).toMatch(/guard let done = completion else \{ return \}/);
    expect(sheet).toMatch(/\.onDisappear/);
  });

  it('uses main-actor tasks, not GCD blocks, for sheet state', () => {
    expect(sheet).not.toMatch(/DispatchQueue\.main\.asyncAfter/);
  });
});

describe('module API parity (ADR 0013: one JavaScript path)', () => {
  it('iOS, Android and the TypeScript declaration expose the same ScribeStore functions', () => {
    const ios = functions(store);
    expect(functions(kotlinStore)).toEqual(ios);
    for (const name of ios) expect(tsStore, name).toMatch(new RegExp(`\\b${name}\\(`));
    expect(ios).toEqual(['beginRefundRequest', 'currentEntitlements', 'presentOfferCodeRedeemSheet', 'presentSubscriptionStore', 'showManageSubscriptions', 'startTransactionListener', 'storeViewSupport', 'sync']);
  });

  it('only product ids, dates and flags cross into JavaScript', () => {
    expect(store).not.toMatch(/"(transactionId|originalId|appAccountToken|receipt)"/);
  });
});
