/// <reference types="node" />
/**
 * NSC-01 (BL-1045): the native-source pin. [NSC-01] modules/REVIEWED.sha256 matches every file under modules/, so a
 * Swift or Kotlin edit cannot reach a build until security-architect has read it and the manifest changed with it.
 * Each rule has a positive control run on a fixture tree (the bad input is found; the clean one stays clean).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { hashSources, manifestProblems, MANIFEST_NAME, parseManifest, renderManifest } from '../scripts/native-sources.mjs';

const MODULES = join(__dirname, '..', 'modules');
const HEAD = 'a'.repeat(40);
const made: string[] = [];
afterAll(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** A fixture modules tree with one Swift and one Kotlin file (fictional module, nothing real). */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'native-pin-'));
  made.push(dir);
  mkdirSync(join(dir, 'asha-demo', 'ios'), { recursive: true });
  mkdirSync(join(dir, 'asha-demo', 'android', 'build'), { recursive: true });
  writeFileSync(join(dir, 'asha-demo', 'ios', 'Demo.swift'), 'let a = 1\n');
  writeFileSync(join(dir, 'asha-demo', 'android', 'build', 'Demo.kt'), 'val a = 1\n');
  return dir;
}
const pinned = (dir: string) => renderManifest(HEAD, hashSources(dir));

describe('[NSC-01] the reviewed manifest matches modules/', () => {
  it('[NSC-01] every file under apps/mobile/modules is pinned at the hash it has now, and a head is named', () => {
    const text = readFileSync(join(MODULES, MANIFEST_NAME), 'utf8');
    expect(manifestProblems(text, hashSources(MODULES))).toEqual([]);
    expect(parseManifest(text).head).toMatch(/^[0-9a-f]{40}$/);
  });
  it('[NSC-01] the pin covers all five shipped modules and their Swift and Kotlin files', () => {
    const files = Object.keys(parseManifest(readFileSync(join(MODULES, MANIFEST_NAME), 'utf8')).files);
    for (const m of ['scribe-audio', 'scribe-files', 'scribe-keys', 'scribe-photo', 'scribe-store']) expect(files.some((f) => f.startsWith(`${m}/`))).toBe(true);
    expect(files.filter((f) => /\.(swift|kt)$/.test(f)).length).toBeGreaterThanOrEqual(7);
  });
});

describe('[NSC-01] the pin fails on any edit', () => {
  it('[NSC-01] a clean fixture has no problem', () => {
    const dir = fixture();
    expect(manifestProblems(pinned(dir), hashSources(dir))).toEqual([]);
  });
  it('[NSC-01] one changed byte in a Swift file fails, naming the file', () => {
    const dir = fixture();
    const text = pinned(dir);
    writeFileSync(join(dir, 'asha-demo', 'ios', 'Demo.swift'), 'let a = 2\n');
    expect(manifestProblems(text, hashSources(dir))).toEqual(['changed since review: asha-demo/ios/Demo.swift']);
  });
  it('[NSC-01] a new file fails, even inside a folder named build', () => {
    const dir = fixture();
    const text = pinned(dir);
    writeFileSync(join(dir, 'asha-demo', 'android', 'build', 'Extra.kt'), 'val b = 2\n');
    expect(manifestProblems(text, hashSources(dir))).toEqual(['added, not reviewed: asha-demo/android/build/Extra.kt']);
  });
  it('[NSC-01] a deleted file fails (a removal is a change the reviewer reads too)', () => {
    const dir = fixture();
    const text = pinned(dir);
    rmSync(join(dir, 'asha-demo', 'ios', 'Demo.swift'));
    expect(manifestProblems(text, hashSources(dir))).toEqual(['removed, still pinned: asha-demo/ios/Demo.swift']);
  });
  it('[NSC-01] a manifest with no head, or no files, or garbage fails closed', () => {
    const dir = fixture();
    const noHead = pinned(dir).replace(/^# pinned-head:.*\n/m, '');
    expect(manifestProblems(noHead, hashSources(dir))).toEqual(['the manifest does not name a pinned head (a line "# pinned-head: <40 hex>")']);
    expect(manifestProblems('', hashSources(dir))).toContain('the manifest pins no file');
    expect(manifestProblems('not a manifest', hashSources(dir)).length).toBeGreaterThan(0);
  });
  it('[NSC-01] a symlinked file fails closed (the podspec glob would follow it)', () => {
    const dir = fixture();
    symlinkSync(join(dir, 'asha-demo', 'ios', 'Demo.swift'), join(dir, 'asha-demo', 'ios', 'Link.swift'));
    expect(() => hashSources(dir)).toThrow(/symlink under modules\/: asha-demo\/ios\/Link\.swift/);
  });
  it('[NSC-01] a symlinked directory fails closed', () => {
    const dir = fixture();
    symlinkSync(join(dir, 'asha-demo', 'ios'), join(dir, 'asha-demo', 'ios-link'), 'dir');
    expect(() => hashSources(dir)).toThrow(/symlink under modules\/: asha-demo\/ios-link/);
  });
  it('[NSC-01] a dangling symlink fails closed too', () => {
    const dir = fixture();
    symlinkSync(join(dir, 'nowhere'), join(dir, 'asha-demo', 'Gone.swift'));
    expect(() => hashSources(dir)).toThrow(/symlink under modules\//);
  });
  it('[NSC-01] the manifest header says it pins current state and records no security read', () => {
    const text = readFileSync(join(MODULES, MANIFEST_NAME), 'utf8');
    expect(text).toMatch(/CURRENT state/);
    expect(text).toMatch(/No security-architect read is recorded/);
    expect(text).not.toMatch(/has read/);
    expect(text).not.toMatch(/reviewed-head/);
  });
  it('[NSC-01] the manifest file itself is not part of the pin (it cannot hash itself)', () => {
    expect(Object.keys(hashSources(MODULES))).not.toContain(MANIFEST_NAME);
  });
});
