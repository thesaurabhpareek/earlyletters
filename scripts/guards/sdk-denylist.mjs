#!/usr/bin/env node
// SDK and import denylist (BL-117, first slice). Fails when a workspace package.json depends on, or a source file
// imports, a package from the denylist: ads, attribution, tracking, HealthKit, face and diarization libraries,
// speech synthesis and voice cloning (CVL-04). Also fails on iOS permission keys and framework names in app config.
// Pure Node, no install needed:  node scripts/guards/sdk-denylist.mjs [--repo <root>]
// Opt-in analytics (posthog) and crash reporting are governed by packages/analytics and are deliberately not listed.
// Wired non-blocking in .github/workflows/security-scan.yml. To allow a package on purpose, change DENY in a PR with a reason.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DENY = [
  // ads, attribution, tracking
  [/^(react-native-google-mobile-ads|expo-ads-[\w-]+|react-native-admob[\w-]*|react-native-appsflyer|appsflyer-[\w-]+|react-native-adjust|@adjustcom\/[\w-]+|react-native-branch|react-native-singular[\w-]*|kochava[\w-]*|react-native-fbsdk-next|react-native-fbads|expo-facebook|react-native-idfa-aaid|@react-native-firebase\/(analytics|admob)|expo-tracking-transparency|react-native-tracking-transparency|@segment\/[\w-]+|mixpanel[\w-]*|react-native-mixpanel|@amplitude\/[\w-]+|amplitude-js|@datadog\/[\w-]+|@bugsnag\/[\w-]+|@microsoft\/react-native-clarity)$/, 'ads, attribution or tracking SDK'],
  // health
  [/^(react-native-health|react-native-health-connect|@kingstinct\/react-native-healthkit|expo-health[\w-]*|rn-apple-healthkit)$/, 'HealthKit or health data library'],
  // face and diarization
  [/^(expo-face-detector|@react-native-ml-kit\/face-detection|react-native-vision-camera-face-detector|face-api\.js|@vladmandic\/face-api|@mediapipe\/tasks-vision|pyannote[\w-]*|sherpa-onnx-diariz[\w-]*|[\w-]*diariz[\w-]*)$/, 'face or diarization library'],
  // speech synthesis and voice cloning (CVL-04)
  [/^(expo-speech|react-native-tts|@elevenlabs\/[\w-]+|elevenlabs|@google-cloud\/text-to-speech|@aws-sdk\/client-polly|microsoft-cognitiveservices-speech-sdk|react-native-voice-cloning[\w-]*|openai-tts[\w-]*)$/, 'speech synthesis or voice cloning library'],
];
// Native names that must not appear as plugin entries, entitlements or Info.plist keys in app config files.
export const NATIVE = [/\bAdSupport\b/, /\bAppTrackingTransparency\b/, /\bNSUserTrackingUsageDescription\b/, /\bHealthKit\b/, /\bNSHealth(Share|Update)UsageDescription\b/, /\bNSFaceIDUsageDescription\b/];

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'ios', 'android', 'coverage', '.expo']);
const SRC = /\.(m?[jt]sx?|cjs)$/;
const IMPORT = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"\n]+)['"]/g;

const pkgOf = (spec) => (spec.startsWith('.') || spec.startsWith('/') ? null : spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
export const denied = (name) => DENY.find(([re]) => re.test(name))?.[1] ?? null;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

export function scan(repo) {
  const found = [];
  const rel = (p) => path.relative(repo, p).split(path.sep).join('/');
  for (const f of walk(repo)) {
    const r = rel(f), base = path.basename(f);
    if (base === 'package.json') {
      let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
      for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'])
        for (const n of Object.keys(j[k] ?? {})) { const why = denied(n); if (why) found.push(`${r}: ${k} lists ${n} (${why})`); }
    } else if (SRC.test(base) && !/\.test\.[mc]?[jt]sx?$/.test(base) && !r.includes('/test/') && !r.startsWith('scripts/guards/')) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(IMPORT)) { const n = pkgOf(m[1]); const why = n && denied(n); if (why) found.push(`${r}: imports ${m[1]} (${why})`); }
      if (/^app\.config\.[mc]?[jt]s$|^app\.json$/.test(base))
        text.split('\n').forEach((line, i) => { if (!/^\s*(\/\/|\*|\/\*)/.test(line)) for (const re of NATIVE) if (re.test(line)) found.push(`${r}:${i + 1}: native name ${re.source}`); });
    }
  }
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--repo');
  const repo = path.resolve(i > 0 ? process.argv[i + 1] : '.');
  const found = scan(repo);
  if (found.length) { console.error(`denylist: ${found.length} finding(s)\n` + found.map((s) => '  ' + s).join('\n')); process.exit(1); }
  console.log('denylist: clean');
}
