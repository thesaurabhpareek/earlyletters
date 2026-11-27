// node --test scripts/guards/sdk-denylist.test.mjs (wired into the root `npm test` list). Fixtures are temp folders.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { importFindings, loadList, lockfileFindings, main, packageOf, scan } from './sdk-denylist.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const list = loadList();
const lock = (...names) => ({ lockfileVersion: 3, packages: { '': {}, ...Object.fromEntries(names.map((n) => [n, { version: '1.0.0' }])) } });
const tree = (files) => {
  const d = mkdtempSync(join(tmpdir(), 'sdk-denylist-'));
  for (const [f, c] of Object.entries({ 'package-lock.json': JSON.stringify(lock()), ...files })) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), c);
  }
  return d;
};
const quiet = () => {};

test('[LEGAL-REQ-016] the list names Meta, AppsFlyer, Adjust, Branch, Google Mobile Ads, AdSupport and AppTrackingTransparency', () => {
  const vendors = new Set(list.entries.map((e) => e.vendor));
  for (const v of ['Meta', 'AppsFlyer', 'Adjust', 'Branch', 'Google Mobile Ads', 'AdSupport', 'AppTrackingTransparency']) assert.ok(vendors.has(v), v);
  for (const fw of ['AdSupport', 'AppTrackingTransparency', 'HealthKit']) assert.ok(list.entries.some((e) => e.kind === 'ios-framework' && e.name === fw), fw);
});

test('[BL-2125] every class (ads, attribution, tracking, health, face, diarization, speech synthesis) has an entry', () => {
  for (const c of list.classes) assert.ok(list.entries.some((e) => e.class === c), c);
});

test('[LEGAL-REQ-016] the repository as it stands passes', () => {
  assert.deepEqual(scan(REPO), []);
  assert.equal(main(['--repo', REPO], quiet, quiet), 0);
});

test('[LEGAL-REQ-016] a denylisted package in the lockfile fails, nested or under an npm alias', () => {
  assert.equal(lockfileFindings(lock('node_modules/react-native-appsflyer'), list).length, 1);
  assert.equal(lockfileFindings(lock('node_modules/expo/node_modules/expo-tracking-transparency'), list).length, 1);
  assert.equal(lockfileFindings({ packages: { 'node_modules/harmless': { name: '@react-native-firebase/admob' } } }, list).length, 1);
  assert.equal(main(['--repo', tree({ 'package-lock.json': JSON.stringify(lock('node_modules/react-native-adjust')) })], quiet, quiet), 1);
});

test('[BL-2125] lockfile names match exactly, never by substring', () => {
  assert.deepEqual(lockfileFindings(lock('node_modules/expo-speech-recognition', 'node_modules/my-react-native-health', 'node_modules/sayings', 'node_modules/@scribe/mobile'), list), []);
});

test('[BL-2125] an import is matched on its exact package, including a subpath, require and dynamic import', () => {
  assert.equal(packageOf('react-native-health/lib/x'), 'react-native-health');
  assert.equal(packageOf('@elevenlabs/client/dist'), '@elevenlabs/client');
  for (const s of ['./x', '@/lib/x', 'node:fs', '/abs']) assert.equal(packageOf(s), null, s);
  const text = "import x from 'react-native-health/lib';\nconst y = require('expo-speech');\nawait import('@vladmandic/face-api');\nexport { z } from 'react-native-branch';";
  assert.equal(importFindings('apps/mobile/src/a.ts', text, list).length, 4);
  assert.deepEqual(importFindings('apps/mobile/src/b.ts', "import a from 'expo-speech-recognition';\nimport b from './expo-speech';", list), []);
});

test('[BL-2125] a commented-out import does not count', () => {
  assert.deepEqual(importFindings('packages/core/src/a.ts', "// import x from 'expo-speech';\n/* require('react-native-tts') */\nconst u = 'https://x';", list), []);
});

test('[LEGAL-REQ-016] a Swift or Objective-C import of AdSupport, AppTrackingTransparency or HealthKit fails; StoreKit passes', () => {
  assert.equal(importFindings('apps/mobile/modules/m/ios/A.swift', 'import Foundation\nimport AppTrackingTransparency\n@_implementationOnly import HealthKit', list).length, 2);
  assert.equal(importFindings('apps/mobile/modules/m/ios/B.m', '#import <AdSupport/AdSupport.h>\n@import HealthKit;', list).length, 2);
  assert.deepEqual(importFindings('apps/mobile/modules/m/ios/C.swift', 'import StoreKit\n// import AdSupport', list), []);
  const d = tree({ 'apps/mobile/modules/m/ios/A.swift': 'import AdSupport\n' });
  assert.equal(scan(d, list).length, 1);
});

test('[BL-2125] it fails closed: no lockfile is exit 2, and a malformed list does not load', () => {
  const d = mkdtempSync(join(tmpdir(), 'sdk-denylist-'));
  assert.equal(main(['--repo', d], quiet, quiet), 2);
  const bad = join(d, 'list.json');
  writeFileSync(bad, JSON.stringify({ classes: ['face'], entries: [{ kind: 'npm', name: 'x', class: 'nope' }] }));
  assert.throws(() => loadList(bad), /bad denylist entry/);
});
