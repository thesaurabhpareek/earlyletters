/// <reference types="node" />
/**
 * Source guard for the device adapter (it loads Expo native modules, so it
 * cannot run in Node). A 574 MB speech model must be hashed natively, off
 * the JavaScript thread (F05 7.5; DEVICE_TEST_PLAN S1-15): ScribeFiles has no
 * `sha256File`, so ScribeAudio's streamed CryptoKit hash is the one used.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const adapter = readFileSync(join(__dirname, '..', 'expo-adapter.ts'), 'utf8');
const audioSwift = readFileSync(join(__dirname, '..', '..', '..', '..', 'modules', 'scribe-audio', 'ios', 'ScribeAudioModule.swift'), 'utf8');

describe('[F05-REQ-018] large packs are hashed natively', () => {
  it('uses ScribeAudio sha256File when ScribeFiles has none, before any JavaScript slicing', () => {
    expect(adapter).toMatch(/import \{ ScribeAudio \} from '\.\.\/\.\.\/\.\.\/modules\/scribe-audio'/);
    expect(adapter).toMatch(/ScribeAudio!?\.sha256File\(uri\)/);
    const method = adapter.slice(adapter.indexOf('async sha256('));
    expect(method.indexOf('nativeSha256File')).toBeGreaterThan(-1);
    expect(method.indexOf('nativeSha256File')).toBeLessThan(method.indexOf('createSha256()'));
  });

  it('the native function exists and streams the file in blocks (never the whole file in memory)', () => {
    expect(audioSwift).toMatch(/AsyncFunction\("sha256File"\)/);
    expect(audioSwift).toMatch(/read\(upToCount: 1 << 20\)/);
  });

  it('a native refusal falls back to the JavaScript hash instead of failing the install', () => {
    const method = adapter.slice(adapter.indexOf('async sha256('), adapter.indexOf('freeBytes()'));
    expect(method).toMatch(/\(\) => null/);
    expect(method).toMatch(/\[0-9a-f\]\{64\}/);
  });
});
