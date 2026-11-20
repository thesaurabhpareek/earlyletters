/// <reference types="node" />
/**
 * RT-PRV-07 (F17-REQ-007, P0) and [X6-R1] (rulings D3 and D2 of 20 Nov; NS-01-R49, NS-02-R26): nothing about a
 * letter, a picture, a child or a prompt reaches Spotlight, Siri, Handoff, App Intents or the share sheet's
 * suggestions. The app has none of the APIs that publish to them, and this scan keeps it that way: it fails if any
 * appears in the app's code (src), its own native modules (modules), its config, the Info.plist and entitlements its
 * config plugins write, or the native code of the packages that ship in it.
 * Comments are ignored, so a note that names an API is fine; a call or an import is not.
 *
 * What it looks for:
 * - Spotlight: CoreSpotlight, CSSearchableItem, CSSearchableIndex, isEligibleForSearch.
 * - Siri suggestions: INInteraction (donations), isEligibleForPrediction, suggestedInvocationPhrase.
 * - Handoff: NSUserActivity, userActivity, isEligibleForHandoff, becomeCurrent, NSUserActivityTypes.
 * - JS modules that wrap them: expo-router/head (sets an NSUserActivity per screen when `headOrigin`
 *   is configured), expo-quick-actions, and any spotlight, siri-shortcut or user-activity package.
 * - Linking.setInitialURL, as the lane asked (no such call should exist in the app).
 * - [X6-R1] (BL-962): NEVER and NOT_BUILT_YET below, the compiled Info.plist and entitlements of every EAS
 *   profile, and the iOS code of every package the app's dependencies pull in, against a reviewed list.
 * Ruling D2 (system writing tools off on letter fields) is not tested here: React Native 0.86.3 has no switch for
 * it, which BL-962 records as a finding, so NS-01-R50, NS-06-A22 and NS-21-R12 stay open.
 * The device half (Spotlight searches "Asha" and a fixture sentence, 0 results) is on the device test plan.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
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

type Rule = { name: string; re: RegExp };
const word = (name: string): Rule => ({ name, re: new RegExp(`\\b${name}\\b`) });

/** [X6-R1] additions that hold for good (ruling D3; NS-01-R49, NS-02-R26, NS-06-C7; NSC-04 in the security design). */
const NEVER: Rule[] = [
  // Spotlight and App Intents entities: an indexed item or an entity is a copy of a letter or a name outside the book.
  ...['CSSearchableItemAttributeSet', 'isEligibleForPublicIndexing', 'IndexedEntity', 'indexAppEntities', 'appEntityIdentifier'].map(word),
  { name: 'AppEntity', re: /\b\w*AppEntity\b/ },
  { name: 'EntityQuery', re: /\b\w*Entity\w*Query\b/ },
  // A doorway may one day open the app (NS-06 Part C), but it never takes words, a file or a picture as a parameter.
  { name: 'App Intents text parameter', re: /@Parameter\b[^{}]*?\bvar\s+\w+\s*:\s*\[?\s*(?:String|AttributedString|Substring|IntentFile)\b/ },
  // Siri suggestions, Siri vocabulary (it would hold a child's name) and the share sheet's suggestion row (INSendMessageIntent).
  ...['INVocabulary', 'INShortcut', 'INSendMessageIntent', 'setShortcutSuggestions', 'IntentDonationManager', 'RelevantIntentManager'].map(word),
  { name: 'INRelevantShortcut', re: /\bINRelevantShortcut\w*/ },
  { name: 'INVoiceShortcut', re: /\bIN(?:UIAdd)?VoiceShortcut\w*/ },
  { name: 'donate', re: /\.donate\b|\bdonateInteraction\w*/ },
  { name: 'Intents framework', re: /\b(?:import|@import)\s+Intents(?:UI)?\b|<Intents(?:UI)?\/|['"]Intents(?:UI)?['"]/ },
  // Dynamic Home Screen quick actions: their titles show outside the app.
  { name: 'shortcutItems', re: /\bshortcutItems\s*=(?!=)|\bsetShortcutItems\b|\bUIMutableApplicationShortcutItem\b/ },
  // NS-02-R26: no embedding or vector index of letters.
  ...['NLEmbedding', 'NLContextualEmbedding'].map(word),
  { name: 'vector index', re: /\bUSING\s+(?:vec0|vss0)\b|\bsqlite[-_]?(?:vec|vss)\b/i },
];

/**
 * Not built yet: App Intents and App Shortcuts. NS-06 Part C (quick capture) may add a doorway that only opens the app;
 * the PR that builds it moves these out under NS-06-C7 and NS-06-C8, and NEVER still holds for what a doorway carries.
 */
const NOT_BUILT_YET: Rule[] = ['AppIntents', 'AppIntent', 'AppShortcutsProvider', 'AppShortcut'].map(word);

const RULES: Rule[] = [...NATIVE_TOKENS.map(word), ...NEVER, ...NOT_BUILT_YET];

/**
 * A package name or any subpath of it: `expo-quick-actions` and `expo-quick-actions/router`; expo-router's head
 * module however it is reached (`expo-router/head`, `expo-router/head.js`, `expo-router/build/head`), but not
 * `expo-router` itself; and any spotlight, siri, user-activity or handoff package.
 */
const FORBIDDEN_PACKAGE = /^expo-quick-actions(\/|$)|^expo-router\/(.+\/)?head(\.[cm]?[jt]sx?)?(\/|$)|spotlight|siri|user-?activity|handoff/i;
/** [X6-R1]: any quick-actions or App Intents wrapper, and (NS-02-R26) any embedding or vector-index package. */
const X6_PACKAGE = /(^|[/-])quick-?actions(\/|$)|app-?intents?|sqlite-?v(ec|ss)|embedding|vector-?(store|db|index|search)|faiss|hnsw/i;
/** A third-party package that wraps these APIs. The app's own files (relative or `@/` paths) are not packages: `welcome-handoff.logic` is a screen handing over to the next, not Apple Handoff. */
const isForbiddenPackage = (m: string) => !m.startsWith('.') && !m.startsWith('@/') && (FORBIDDEN_PACKAGE.test(m) || X6_PACKAGE.test(m));

const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, exts: string[], skip: (name: string) => boolean = () => false): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.') || skip(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts, skip));
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
  for (const r of RULES) if (r.re.test(code)) bad.push(r.name);
  return bad;
}

/** A dependency may receive a link or an activity the person opens, and may carry on-device language tools it never calls on our words; what it may not do unreviewed is publish. */
const RECEIVING_OR_LOCAL = new Set(['NSUserActivity', 'userActivity', 'setInitialURL', 'NLEmbedding', 'NLContextualEmbedding', 'vector index']);
const donations = (text: string) => findings(text).filter((f) => !f.startsWith('import ') && !RECEIVING_OR_LOCAL.has(f));
/** A cheap first pass over thousands of dependency files: every rule's match contains one of these (the planted test checks it). */
const MAYBE = /Spotlight|CSSearchable|Eligible|Invocation|INInteraction|becomeCurrent|Entit|@Parameter|Vocabulary|Shortcut|Intent|donat|NSUserActivity|userActivity|setInitialURL|Embedding|vec|vss/i;

function scan(files: string[]): string[] {
  return files.flatMap((f) => findings(readFileSync(f, 'utf8')).map((b) => `${relative(APP, f)}: ${b}`));
}

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Record<string, Record<string, string> | undefined>;

/** Where Node would find package `name` from `from`, walking up through node_modules (npm hoists most of them to the root). */
function packageDir(name: string, from: string): string | undefined {
  for (let d = from; ; d = dirname(d)) {
    if (existsSync(join(d, 'node_modules', name, 'package.json'))) return join(d, 'node_modules', name);
    if (dirname(d) === d) return undefined;
  }
}

/** Every package the app's `dependencies` pull in (not dev), and the required ones that are not installed. */
function shippedPackages(): { packages: Map<string, string>; missing: string[] } {
  const packages = new Map<string, string>();
  const missing: string[] = [];
  const queue: [string, string, boolean][] = Object.keys(readJson(join(APP, 'package.json')).dependencies ?? {}).map((n) => [n, APP, false]);
  for (let next = queue.pop(); next; next = queue.pop()) {
    const [name, from, optional] = next;
    const dir = packageDir(name, from);
    if (!dir) {
      if (!optional) missing.push(name);
      continue;
    }
    if (packages.has(dir)) continue;
    packages.set(dir, name);
    const pkg = readJson(join(dir, 'package.json'));
    for (const d of Object.keys(pkg.dependencies ?? {})) queue.push([d, dir, false]);
    for (const d of Object.keys(pkg.optionalDependencies ?? {})) queue.push([d, dir, true]);
  }
  return { packages, missing };
}

/** Donation APIs named in the iOS code (Swift, Objective-C, podspecs) of the given packages, by `<package>/<path>`; tests, examples and Android are skipped. */
function dependencyHits(packages: Map<string, string>): { hits: Record<string, string[]>; files: number } {
  const hits: Record<string, string[]> = {};
  const notShipped = (n: string) => /^(tests?|__tests__|examples?|android)$/i.test(n);
  let files = 0;
  for (const [dir, name] of packages) {
    if (!existsSync(join(dir, 'ios')) && !readdirSync(dir).some((f) => f.endsWith('.podspec'))) continue;
    for (const f of walk(dir, ['.swift', '.m', '.mm', '.h', '.podspec'], notShipped)) {
      files++;
      const text = readFileSync(f, 'utf8');
      const found = MAYBE.test(text) ? donations(text) : [];
      if (found.length) hits[`${name}/${relative(dir, f)}`] = found;
    }
  }
  return { hits, files };
}

/**
 * Native iOS code in the shipped packages that names a donation API, read one by one for BL-962 (20 Nov, Expo SDK 57).
 * A new file, or a new API in a listed file, fails until someone reads it and records here why it publishes nothing of ours.
 */
const REVIEWED_DEPENDENCY_CODE: Record<string, string[]> = {
  // Publishes only when a screen renders <Head> from expo-router/head (createActivity, build/head/ExpoHead.ios.js:216),
  // and the src scan above forbids that import. expo-router's expo-module.config.json links the module either way.
  'expo-router/ios/ExpoHeadModule.swift': [
    'CoreSpotlight',
    'CSSearchableIndex',
    'isEligibleForSearch',
    'isEligibleForPrediction',
    'isEligibleForHandoff',
    'becomeCurrent',
    'CSSearchableItemAttributeSet',
    'isEligibleForPublicIndexing',
  ],
  // Opens the app from a Spotlight or Handoff continuation; publishes nothing.
  'expo-router/ios/ExpoHeadAppDelegateSubscriber.swift': ['CoreSpotlight'],
};

/** The activity type expo-router's config plugin always declares (plugin/build/withRouter.js:11-20). It lets the app open such an activity; publishing one needs expo-router/head, forbidden above. */
const EXPO_ROUTER_ACTIVITY = '$(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route';
const NEVER_PLIST = ['CoreSpotlightContinuation', 'INIntentsSupported', 'INIntentsRestrictedWhileLocked', 'NSExtension'];
/** Not built yet, as NOT_BUILT_YET: a Siri or Home Screen doorway of NS-06 Part C would add these with its own tests. */
const NOT_BUILT_YET_PLIST = ['NSSiriUsageDescription', 'UIApplicationShortcutItems'];

function plistProblems(plist: Record<string, unknown>, entitlements: Record<string, unknown>, plugins: unknown): string[] {
  const bad = [...NEVER_PLIST, ...NOT_BUILT_YET_PLIST].filter((k) => k in plist);
  const types = (plist.NSUserActivityTypes ?? []) as string[];
  bad.push(...types.filter((t) => t !== EXPO_ROUTER_ACTIVITY).map((t) => `NSUserActivityTypes ${t}`));
  if ('com.apple.developer.siri' in entitlements) bad.push('com.apple.developer.siri');
  const domains = (entitlements['com.apple.developer.associated-domains'] ?? []) as string[];
  bad.push(...domains.filter((d) => d.startsWith('activitycontinuation:')).map((d) => `associated domain ${d}`));
  // expo-sqlite links sqlite-vec when its plugin is asked to (NS-02-R26).
  if (/SQLiteVec/i.test(JSON.stringify(plugins ?? []))) bad.push('sqlite-vec');
  return bad;
}

/** The iOS config as `expo config --type introspect` compiles it for one EAS profile: every config plugin has run. */
async function compiledIos(env: Record<string, string>) {
  const req = createRequire(join(APP, 'package.json'));
  const { getPrebuildConfigAsync } = createRequire(req.resolve('@expo/cli/package.json'))('@expo/prebuild-config');
  const { compileModsAsync } = req('expo/config-plugins');
  const names = [...Object.keys(process.env).filter((k) => /^(EXPO_PUBLIC_|EAS_)/.test(k)), ...Object.keys(env)];
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    Object.assign(process.env, env);
    const { exp } = await getPrebuildConfigAsync(APP, { platforms: ['ios'] });
    const out = await compileModsAsync(exp, { projectRoot: APP, introspect: true, platforms: ['ios'], assertMissingModProviders: false, ignoreExistingNativeFiles: true });
    return { plist: out.ios?.infoPlist ?? {}, entitlements: out.ios?.entitlements ?? {}, plugins: exp.plugins };
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** One planted use of every [X6-R1] rule, with what the scan must report for it. */
const PLANTED: [string, string[]][] = [
  ['let s = CSSearchableItemAttributeSet(contentType: .text)', ['CSSearchableItemAttributeSet']],
  ['a.isEligibleForPublicIndexing = true', ['isEligibleForPublicIndexing']],
  ['struct LetterEntity: IndexedEntity {}', ['IndexedEntity']],
  ['try await CSSearchableIndex.default().indexAppEntities(items)', ['CSSearchableIndex', 'indexAppEntities']],
  ['activity.appEntityIdentifier = EntityIdentifier(for: e)', ['appEntityIdentifier']],
  ['struct ChildEntity: AppEntity { static var defaultQuery = ChildQuery() }', ['AppEntity']],
  ['struct LetterQuery: EntityStringQuery {}', ['EntityQuery']],
  ['@Parameter(title: "Words")\n  var words: String', ['App Intents text parameter']],
  ['@Parameter(title: "Picture") var picture: IntentFile?', ['App Intents text parameter']],
  ['INVocabulary.shared().setVocabularyStrings(names, of: .contactName)', ['INVocabulary']],
  ['let s = INShortcut(intent: i)', ['INShortcut']],
  ['let i = INSendMessageIntent(recipients: nil)', ['INSendMessageIntent']],
  ['INVoiceShortcutCenter.shared.setShortcutSuggestions(s)', ['setShortcutSuggestions', 'INVoiceShortcut']],
  ['try await IntentDonationManager.shared.donate(intent: i)', ['IntentDonationManager', 'donate']],
  ['try await RelevantIntentManager.shared.updateRelevantIntents(r)', ['RelevantIntentManager']],
  ['INRelevantShortcutStore.default.setRelevantShortcuts(r)', ['INRelevantShortcut']],
  ['interaction.donate { _ in }', ['donate']],
  ['[interaction donateInteractionWithCompletion:nil];', ['donate']],
  ['import Intents', ['Intents framework']],
  ['#import <IntentsUI/IntentsUI.h>', ['Intents framework']],
  ["s.frameworks = 'UIKit', 'Intents'", ['Intents framework']],
  ['UIApplication.shared.shortcutItems = [item]', ['shortcutItems']],
  ['let e = NLEmbedding.sentenceEmbedding(for: .english)', ['NLEmbedding']],
  ['let e = NLContextualEmbedding(language: .english)', ['NLContextualEmbedding']],
  ["db.execSync('CREATE VIRTUAL TABLE v USING vec0(e float[384])')", ['vector index']],
  ['import AppIntents', ['AppIntents']],
  ['struct StartLetter: AppIntent {}', ['AppIntent']],
  ['struct Doors: AppShortcutsProvider { static var appShortcuts: [AppShortcut] { [] } }', ['AppShortcutsProvider', 'AppShortcut']],
  ["import { QuickActions } from 'react-native-quick-actions';", ['import react-native-quick-actions']],
  ["import { Intents } from 'react-native-app-intents';", ['import react-native-app-intents']],
  ["const v = require('react-native-embeddings');", ['import react-native-embeddings']],
];

describe('[RT-PRV-07] [F17-REQ-007] [X6-R1] [NS-01-R49] [NS-02-R26] nothing about a letter, picture, child or prompt reaches Spotlight, Siri, Handoff or App Intents', () => {
  it('the scan catches each kind of use (so a clean result means something)', () => {
    expect(findings("import * as QuickActions from 'expo-quick-actions';")).toEqual(['import expo-quick-actions']);
    expect(findings("import Head from 'expo-router/head';")).toEqual(['import expo-router/head']);
    // Subpaths of a forbidden package are the same package (review A on #511).
    expect(findings("import Head from 'expo-router/head.js';")).toEqual(['import expo-router/head.js']);
    expect(findings("const Head = require('expo-router/build/head');")).toEqual(['import expo-router/build/head']);
    expect(findings("import { QuickActionsRouter } from 'expo-quick-actions/router';")).toEqual(['import expo-quick-actions/router']);
    expect(findings("import { Stack } from 'expo-router/stack';")).toEqual([]);
    expect(findings("import x from 'expo-quick-actionsfoo';")).toEqual([]);
    expect(findings("const s = require('react-native-spotlight-search');")).toEqual(['import react-native-spotlight-search']);
    expect(findings('<Head><meta property="expo:handoff" /></Head>; nav.userActivity = a;')).toEqual(['userActivity']);
    expect(findings('Linking.setInitialURL(url)')).toEqual(['setInitialURL']);
    expect(findings('let a = NSUserActivity(activityType: "x"); a.isEligibleForSearch = true')).toEqual(['isEligibleForSearch', 'NSUserActivity']);
    expect(findings('import CoreSpotlight\nlet i = INInteraction(intent: x, response: nil)')).toEqual(['CoreSpotlight', 'INInteraction']);
    expect(findings('// NSUserActivity is never used here\nconst x = 1;')).toEqual([]);
    expect(findings("import { router } from 'expo-router';")).toEqual([]);
    expect(findings("import { x } from '@/components/family/welcome-handoff.logic';")).toEqual([]);
  });

  it('[X6-R1] the scan catches every added pattern, and leaves receiving code and lookalikes alone', () => {
    for (const [source, expected] of PLANTED) expect(findings(source), source).toEqual(expected);
    for (const [source, names] of PLANTED) if (!names[0].startsWith('import ')) expect(MAYBE.test(source), source).toBe(true);
    for (const t of NATIVE_TOKENS) expect(MAYBE.test(t), t).toBe(true);
    const planted = new Set(PLANTED.flatMap(([, names]) => names));
    expect([...NEVER, ...NOT_BUILT_YET].map((r) => r.name).filter((n) => !planted.has(n))).toEqual([]);
    // Lookalikes stay quiet: a doorway option that is not words, reading quick actions, sharing out, icons, tokenizing.
    expect(findings('@Parameter(title: "Size") var size: SizeOption')).toEqual([]);
    expect(findings('let first = UIApplication.shared.shortcutItems?.first')).toEqual([]);
    expect(findings("import { shareAsync } from 'expo-sharing';")).toEqual([]);
    expect(findings("import { Ionicons } from '@expo/vector-icons';")).toEqual([]);
    expect(findings('let t = NLTokenizer(unit: .word)')).toEqual([]);
    // In a dependency, opening the app from a link, an activity or a quick action is receiving, not publishing.
    expect(donations('func application(_ a: UIApplication, continue userActivity: NSUserActivity) -> Bool { open(userActivity.webpageURL) }')).toEqual([]);
    expect(donations('func handle(_ shortcutItem: UIApplicationShortcutItem) {}')).toEqual([]);
    expect(donations('activity.isEligibleForSearch = true; activity.becomeCurrent()')).toEqual(['isEligibleForSearch', 'becomeCurrent']);
    expect(donations('INInteraction(intent: i, response: nil).donate { _ in }')).toEqual(['INInteraction', 'donate']);
  });

  it('[X6-R1] the Info.plist check catches each planted key', () => {
    const planted = plistProblems(
      { NSUserActivityTypes: [EXPO_ROUTER_ACTIVITY, 'INSendMessageIntent'], NSSiriUsageDescription: 'x', UIApplicationShortcutItems: [], CoreSpotlightContinuation: true, INIntentsSupported: [] },
      { 'com.apple.developer.siri': true, 'com.apple.developer.associated-domains': ['applinks:a.example', 'activitycontinuation:a.example'] },
      ['expo-router', ['expo-sqlite', { withSQLiteVecExtension: true }]],
    );
    expect(planted).toEqual([
      'CoreSpotlightContinuation',
      'INIntentsSupported',
      'NSSiriUsageDescription',
      'UIApplicationShortcutItems',
      'NSUserActivityTypes INSendMessageIntent',
      'com.apple.developer.siri',
      'associated domain activitycontinuation:a.example',
      'sqlite-vec',
    ]);
    expect(plistProblems({ NSUserActivityTypes: [EXPO_ROUTER_ACTIVITY] }, { 'com.apple.developer.associated-domains': ['applinks:a.example'] }, ['expo-sqlite'])).toEqual([]);
  });

  it('apps/mobile/src imports and calls none of them', () => {
    const files = walk(join(APP, 'src'), ['.ts', '.tsx', '.js', '.jsx', '.mjs']);
    expect(files.length).toBeGreaterThan(100); // the walk really reached the app
    expect(scan(files)).toEqual([]);
  });

  it("the app's own native modules (Swift, Kotlin, Objective-C, podspecs) use none of them", () => {
    const files = walk(join(APP, 'modules'), ['.ts', '.swift', '.kt', '.m', '.mm', '.h', '.java', '.podspec']);
    expect(files.some((f) => f.endsWith('.swift'))).toBe(true);
    expect(files.some((f) => f.endsWith('.podspec'))).toBe(true);
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

  const eas = readJson(join(APP, 'eas.json')) as unknown as { build: Record<string, { env?: Record<string, string> }> };
  for (const [profile, { env }] of Object.entries(eas.build)) {
    it(`[X6-R1] ${profile}: the Info.plist and entitlements the config plugins write turn on no system surface`, async () => {
      const { plist, entitlements, plugins } = await compiledIos(env ?? {});
      expect(Object.keys(plist).length).toBeGreaterThan(10); // the plugins really ran
      expect(plistProblems(plist, entitlements, plugins)).toEqual([]);
    }, 60_000);
  }

  it('[X6-R1] the dependency scan finds a planted donor package and skips its tests', () => {
    const dir = mkdtempSync(join(tmpdir(), 'x6-donor-'));
    try {
      mkdirSync(join(dir, 'ios', 'Tests'), { recursive: true });
      writeFileSync(join(dir, 'ios', 'Donor.swift'), 'import Intents\nINInteraction(intent: i, response: nil).donate { _ in }\n');
      writeFileSync(join(dir, 'ios', 'Tests', 'DonorTests.swift'), 'activity.becomeCurrent()\n');
      writeFileSync(join(dir, 'ios', 'Opener.swift'), 'func open(_ userActivity: NSUserActivity) {}\n');
      expect(dependencyHits(new Map([[dir, 'donor']]))).toEqual({ hits: { 'donor/ios/Donor.swift': ['INInteraction', 'donate', 'Intents framework'] }, files: 2 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[X6-R1] the iOS code of every package that ships in the app publishes nothing beyond the reviewed list', () => {
    const { packages, missing } = shippedPackages();
    expect(missing, 'node_modules does not match package-lock.json; run npm install').toEqual([]);
    const { hits, files } = dependencyHits(packages);
    expect(files).toBeGreaterThan(500); // the walk really reached react-native, expo and the rest
    expect(hits).toEqual(REVIEWED_DEPENDENCY_CODE);
  }, 60_000); // reads about 3,700 files: 2 to 5 s alone, more on a busy runner
});
