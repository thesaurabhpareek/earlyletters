#!/usr/bin/env node
/**
 * Checks, before any build is queued, everything that can be checked without Apple or Expo accounts.
 *   npm run preflight:testflight -w @scribe/mobile
 * Exits 1 with a plain list of what is wrong. It does not build and needs no secrets.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const bad = [];
const ok = [];
const check = (cond, good, problem) => (cond ? ok.push(good) : bad.push(problem));

const r = spawnSync('npx', ['expo', 'config', '--type', 'public', '--json'], { cwd: ROOT, env: { ...process.env, EXPO_PUBLIC_APP_ENV: 'preview' }, encoding: 'utf8' });
let cfg = null;
try {
  cfg = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
} catch {
  bad.push('The app config does not evaluate (run `npx expo config` in apps/mobile and read the error).');
}
if (cfg) {
  const id = cfg.ios?.bundleIdentifier ?? '';
  check(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+){2,}$/.test(id), `Bundle id ${id}`, `Bundle id "${id}" is not a valid reverse-domain id.`);
  check(!/example/.test(id), 'Bundle id is not a placeholder', `Bundle id "${id}" still contains "example": set publisher.domain in packages/brand.`);
  check(id.endsWith('.preview'), 'TestFlight build uses the .preview id, so the permanent production id is not spent', `The preview build id "${id}" has no .preview suffix: the production id would be spent by a test build.`);
  check(cfg.name === 'Early Letters', `Name "${cfg.name}"`, `Unexpected app name "${cfg.name}".`);
  check(cfg.scheme === 'scribe', `URL scheme ${cfg.scheme}`, `Unexpected URL scheme "${cfg.scheme}".`);
  const audio = (cfg.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-audio');
  check(Boolean(audio?.[1]?.microphonePermission) && !/example\.com/.test(audio[1].microphonePermission), 'Microphone purpose string present', 'Microphone purpose string is missing or a placeholder.');
  check(audio?.[1]?.enableBackgroundRecording === false && audio?.[1]?.enableBackgroundPlayback === false, 'No background audio modes (LEGAL-REQ-011)', 'Background audio is on: it must stay off (LEGAL-REQ-011).');
  check(existsSync(join(ROOT, cfg.icon ?? 'missing')), `Icon file ${cfg.icon}`, `Icon file ${cfg.icon} does not exist.`);
  check(/^\d+\.\d+\.\d+$/.test(cfg.version ?? ''), `Version ${cfg.version}`, 'Version is not x.y.z.');
}
const eas = JSON.parse(readFileSync(join(ROOT, 'eas.json'), 'utf8'));
check(eas.build?.testflight?.distribution === 'store', 'eas.json has a testflight profile with store distribution', 'eas.json has no "testflight" build profile with distribution "store".');
check(eas.cli?.appVersionSource === 'remote' && eas.build?.testflight?.autoIncrement === true, 'Build numbers are managed by EAS and auto-increment', 'Build numbers are not auto-incremented: uploads would be rejected as duplicates.');
check(Boolean(eas.submit?.testflight), 'eas.json has a testflight submit profile', 'eas.json has no "testflight" submit profile.');
const brand = readFileSync(join(ROOT, '../../packages/brand/index.ts'), 'utf8');
check(!/example\.com/.test(brand), 'packages/brand holds no example.com placeholder', 'packages/brand still holds an example.com placeholder.');
const notes = [];
if (!process.env.EXPO_TOKEN) notes.push('EXPO_TOKEN is not set here (needed only for the CI workflow, not for a local `eas build`).');
for (const l of ok) console.log('ok   ', l);
for (const l of bad) console.log('FAIL ', l);
for (const l of notes) console.log('note ', l);
console.log(bad.length ? `\n${bad.length} problem(s). Fix them before building.` : '\nPreflight passed. This checks configuration only: it does not prove the build will succeed, and it does not touch Apple or Expo.');
process.exit(bad.length ? 1 : 0);
