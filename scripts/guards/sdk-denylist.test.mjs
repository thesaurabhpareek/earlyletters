import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan, denied } from './sdk-denylist.mjs';

const tmp = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'denylist-'));
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); }
  return d;
};

test('names on the list are denied, ordinary ones are not', () => {
  for (const n of ['react-native-appsflyer', 'expo-tracking-transparency', 'react-native-health', 'expo-face-detector', 'expo-speech', '@elevenlabs/client', 'my-diarization-kit']) assert.ok(denied(n), n);
  for (const n of ['react', 'expo-audio', 'posthog-react-native', 'zod']) assert.equal(denied(n), null, n);
});

test('a clean tree passes', () => {
  assert.deepEqual(scan(tmp({ 'a/package.json': '{"dependencies":{"react":"1"}}', 'a/src/x.ts': "import React from 'react';\nimport y from './y';" })), []);
});

test('a dependency, an import and a native name are each found', () => {
  const d = tmp({
    'a/package.json': '{"devDependencies":{"expo-speech":"1"}}',
    'a/src/x.ts': "import { x } from 'react-native-health/lib';\nconst t = require('expo-tracking-transparency');",
    'a/app.config.ts': "// AdSupport is fine in a comment\nexport default { ios: { infoPlist: { NSUserTrackingUsageDescription: 'x' } } };",
  });
  const out = scan(d);
  assert.equal(out.length, 4, out.join('\n'));
});

test('test files and node_modules are skipped', () => {
  assert.deepEqual(scan(tmp({ 'a/test/x.ts': "import 'expo-speech';", 'a/x.test.ts': "import 'expo-speech';", 'node_modules/p/package.json': '{"dependencies":{"expo-speech":"1"}}' })), []);
});
