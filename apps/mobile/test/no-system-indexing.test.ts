/// <reference types="node" />
/**
 * RT-PRV-07 (F17-REQ-007, P0): no letter content reaches Spotlight, Siri suggestions or Handoff.
 * The app has none of the APIs that publish to them, and this scan keeps it that way: it fails if any
 * appears in the app's code (src), its own native modules (modules), its config or its dependencies.
 * Comments are ignored, so a note that names an API is fine; a call or an import is not.
 *
 * What it looks for:
 * - Spotlight: CoreSpotlight, CSSearchableItem, CSSearchableIndex, isEligibleForSearch.
 * - Siri suggestions: INInteraction (donations), isEligibleForPrediction, suggestedInvocationPhrase.
 * - Handoff: NSUserActivity, userActivity, isEligibleForHandoff, becomeCurrent, NSUserActivityTypes.
 * - JS modules that wrap them: expo-router/head (sets an NSUserActivity per screen when `headOrigin`
 *   is configured), expo-quick-actions, and any spotlight, siri-shortcut or user-activity package.
 * - Linking.setInitialURL, as the lane asked (no such call should exist in the app).
 * The device half (Spotlight searches "Asha" and a fixture sentence, 0 results) is on the device test plan.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');

const NATIVE_TOKENS = [
  'CoreSpotlight',
  'CSSearchableItem',
  'CSSearchableIndex',
  'isEligibleForSearch',
  'isEligibleForPrediction',
  'isEligibleForHandoff',
  'suggestedInvocationPhrase',
  'INInteraction',
  'NSUserActivity',
  'userActivity',
  'becomeCurrent',
  'setInitialURL',
];
const FORBIDDEN_PACKAGE = /^(expo-router\/head|expo-quick-actions)$|spotlight|siri|user-?activity|handoff/i;
/** A third-party package that wraps these APIs. The app's own files (relative or `@/` paths) are not packages: `welcome-handoff.logic` is a screen handing over to the next, not Apple Handoff. */
const isForbiddenPackage = (m: string) => !m.startsWith('.') && !m.startsWith('@/') && FORBIDDEN_PACKAGE.test(m);

const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

/** Module specifiers a file imports, requires or loads with import(). */
function importsOf(text: string): string[] {
  const re = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm;
  return [...text.matchAll(re)].map((m) => m[1]);
}

/** Every finding in one source text: forbidden imports and forbidden identifiers. */
function findings(text: string): string[] {
  const code = strip(text);
  const bad = importsOf(code).filter(isForbiddenPackage).map((m) => `import ${m}`);
  for (const t of NATIVE_TOKENS) if (new RegExp(`\\b${t}\\b`).test(code)) bad.push(t);
  return bad;
}

function scan(files: string[]): string[] {
  return files.flatMap((f) => findings(readFileSync(f, 'utf8')).map((b) => `${relative(APP, f)}: ${b}`));
}

describe('[RT-PRV-07] [F17-REQ-007] no letter content in Spotlight, Siri suggestions or Handoff', () => {
  it('the scan catches each kind of use (so a clean result means something)', () => {
    expect(findings("import * as QuickActions from 'expo-quick-actions';")).toEqual(['import expo-quick-actions']);
    expect(findings("import Head from 'expo-router/head';")).toEqual(['import expo-router/head']);
    expect(findings("const s = require('react-native-spotlight-search');")).toEqual(['import react-native-spotlight-search']);
    expect(findings('<Head><meta property="expo:handoff" /></Head>; nav.userActivity = a;')).toEqual(['userActivity']);
    expect(findings('Linking.setInitialURL(url)')).toEqual(['setInitialURL']);
    expect(findings('let a = NSUserActivity(activityType: "x"); a.isEligibleForSearch = true')).toEqual(['isEligibleForSearch', 'NSUserActivity']);
    expect(findings('import CoreSpotlight\nlet i = INInteraction(intent: x, response: nil)')).toEqual(['CoreSpotlight', 'INInteraction']);
    expect(findings('// NSUserActivity is never used here\nconst x = 1;')).toEqual([]);
    expect(findings("import { router } from 'expo-router';")).toEqual([]);
    expect(findings("import { x } from '@/components/family/welcome-handoff.logic';")).toEqual([]);
  });

  it('apps/mobile/src imports and calls none of them', () => {
    const files = walk(join(APP, 'src'), ['.ts', '.tsx', '.js', '.jsx', '.mjs']);
    expect(files.length).toBeGreaterThan(100); // the walk really reached the app
    expect(scan(files)).toEqual([]);
  });

  it("the app's own native modules (Swift, Kotlin, Objective-C) use none of them", () => {
    const files = walk(join(APP, 'modules'), ['.ts', '.swift', '.kt', '.m', '.mm', '.h', '.java']);
    expect(files.some((f) => f.endsWith('.swift'))).toBe(true);
    expect(scan(files)).toEqual([]);
  });

  it('the config declares no activity types and no head origin, and no dependency wraps these APIs', () => {
    const config = strip(readFileSync(join(APP, 'app.config.ts'), 'utf8'));
    expect(config).not.toMatch(/NSUserActivityTypes|headOrigin|CoreSpotlight/);
    const pkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies });
    expect(deps.length).toBeGreaterThan(10);
    expect(deps.filter(isForbiddenPackage)).toEqual([]);
  });
});
