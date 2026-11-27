/// <reference types="node" />
/**
 * BL-1174: capture and doorway stragglers. A kept letter takes no new audio (NS-19-R1), two takes never share a raw
 * transcript or a machine edit (NS-19-R4), only Home starts a letter (NS-35-R1), and every doorway from outside the app
 * lands on Home or a reading screen and never records or keeps on its own (NS-35-R3, NS-35-R4). Cards: NS-19 in
 * docs/product/prd/09-capture.md, NS-35 in docs/product/prd/11-foundations.md.
 *
 * Read as source text where the rule is about who may call what (like navigation-one-entry.test.ts, which this does
 * not replace: IA-N3 checks the same entry from the manifest's side). Each scanner is a pure function over the files,
 * and the last block plants one breach per scanner so none of them can only pass. Where a surface is not built yet
 * (a share extension, a Siri intent, a widget, a notification action, a second take), the test pins its absence:
 * the PR that builds one must change this file. Fictional family "Asha" only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { brand } from '@scribe/brand';
import { verifyEdits } from '@scribe/core';

// +native-intent.tsx is run for real below; these stand in for the modules it reaches that need a phone (the
// Keychain, SQLite) or a build environment. They only record: nothing here decides where a link lands.
const env = vi.hoisted(() => ({ serverFeatures: false, alpha: false, invites: [] as string[], authLinks: 0 }));
vi.mock('@/lib/store', () => ({ getSetting: () => null }));
vi.mock('@/lib/capabilities', () => ({ serverFeaturesEnabled: () => env.serverFeatures }));
vi.mock('@/lib/billing/alpha', () => ({
  get PLUS_ALPHA() {
    return env.alpha;
  },
}));
vi.mock('@/lib/auth/pending', () => ({ setPendingAuthLink: () => void env.authLinks++ }));
vi.mock('@/lib/family/pending-invite', () => ({ savePendingInvite: async (t: string) => void env.invites.push(t) }));

import { redirectSystemPath } from '../src/app/+native-intent';
import { laterWordsDraft } from '../src/components/capture/later-words.logic';
import { CAPTURE_DOORWAYS, planCapture } from '../src/lib/capture/start-capture.logic';
import * as drafts from '../src/lib/db/repos/drafts';
import type { Entry } from '../src/lib/db/repos/types';
import { registerReminderCategory, REMINDER_CATEGORY } from '../src/lib/reminders/categories';
import { REMINDER_SOURCE, routeForReminder } from '../src/lib/reminders/payload';
import { consumeListenStart, resetListenStart } from '../src/lib/resilience/start-intent';
import { cleanSpoken } from '../src/lib/transcription-queue/clean';
import { importSpecifiers, stripComments } from './helpers/import-reader';
import { fixture, insertBook } from './helpers/store-fixture';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
/**
 * Source without comments, so a comment that names a rule never counts as code. The reader keeps strings whole, so a
 * `//` inside a specifier ('@/lib//capture/x') is part of the path, not a comment that hides the rest of the line.
 */
const code = stripComments;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
type Files = Map<string, string>;
/** The tree as written, for the parser below (which reads comments and line numbers itself). */
const rawFiles: Files = new Map(walk(SRC).map((p) => [relative(SRC, p).split('\\').join('/'), readFileSync(p, 'utf8')]));
const files: Files = new Map([...rawFiles].map(([f, t]) => [f, code(t)]));
const src = (f: string) => files.get(f) ?? '';

/** Home's module: the one screen that starts a letter, and its components (NAV-TAB-ROLES P1). A folder is not a screen, so
 * renderBreaches also holds which screens draw a component that starts. */
const inHome = (f: string) => f === 'app/(tabs)/index.tsx' || f.startsWith('components/tonight/');
const ONE_ENTRY = 'lib/capture/start-capture.ts';
/** The capture screens move among themselves with router.replace: a mode change, not a start (NS-35-R2). */
const CAPTURE_FLOW = ['app/listen.tsx', 'app/write.tsx', 'app/review.tsx'];
/**
 * A start route as a literal: a string or template that opens with /listen or /write (also ./ or ../, or right after a
 * template's `${...}`), followed by its end, a path, a query or a hash. So '/listen?promptKey=x', `/write?draftId=${id}`
 * and '/Listen/' count, and '/listening' or '/writer' do not.
 */
const START_ROUTE = /(?:['"`]|\})\.{0,2}\/(listen|write)(?=['"`/?#]|\$\{)/i;
/** The same for every capture screen Review included (read-together is playback only, and starts nothing). */
const CAPTURE_LITERAL = /(?:['"`]|\})\.{0,2}\/(listen|write|review)(?=['"`/?#]|\$\{)/gi;
type CaptureScreen = 'listen' | 'write' | 'review';
/**
 * NS-35-R1: the closed list of files that may hold each capture route as a literal, anywhere in the file (a router call,
 * a constant, a route map). Any other file that names one is a breach, whatever it does with it. Each entry says why.
 */
const CAPTURE_LITERAL_FILES: Record<CaptureScreen, string[]> = {
  listen: [
    ONE_ENTRY, // the one entry's own plan type
    'lib/capture/start-capture.logic.ts', // the one entry's plan: Speak and photo open Listen
    'app/review.tsx', // Record again: a replace inside the capture flow (startBreaches holds the verb)
    'lib/resilience/not-found.logic.ts', // the list a link from outside is turned away from
  ],
  write: [
    'lib/capture/start-capture.logic.ts', // the one entry's plan: Type opens Write
    'components/tonight/draft-card.logic.ts', // Home's draft card resumes a typed draft (renderBreaches holds who takes its route: ROUTE_FREE_EXPORTS)
    'app/listen.tsx', // Type instead: a replace inside the capture flow
    'app/review.tsx', // Type or edit the words: a replace inside the capture flow
  ],
  review: [
    'components/tonight/draft-card.logic.ts', // Home's draft card resumes a spoken draft
    'app/listen.tsx', // a finished take goes on to Review (replace)
    'app/write.tsx', // a typed draft goes on to Review (replace)
    'app/letter/[id].tsx', // the words that arrived later, opened on the words (NS-19-R1 pins that case)
    'lib/resilience/not-found.logic.ts', // the list a link from outside is turned away from
  ],
};

/** The text inside the bracket that opens at `from`, up to its match. */
function balanced(text: string, from: number, open: string, close: string): string {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) return text.slice(from + 1, i);
  }
  return text.slice(from + 1);
}

// ── Scanners (pure over a file map, so the fixtures below run the same code as the tree) ─────────────────────────────

/** Files that prepare or start a recorder. The one recording path is beginTake, plus Listen resuming its own take. */
const RECORD_SITES = ['lib/capture/recorder.ts', 'app/listen.tsx', 'dev/kill-drill.ts'];
function recordBreaches(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, t] of fs) {
    if (/\buseAudioRecorder\(|\.prepareToRecordAsync\(|\brecorder\.record\(\)/.test(t) && !RECORD_SITES.includes(f)) out.push(`${f} starts a recorder`);
    if (/(?<!function )\bbeginTake\(/.test(t) && !['app/listen.tsx', 'dev/kill-drill.ts'].includes(f)) out.push(`${f} calls beginTake`);
  }
  return out;
}

/** The letter page and what it draws: none of it may start, arm or open a capture (NS-19-R1, card section 15). */
const onLetterPage = (f: string) => f.startsWith('app/letter/') || f.startsWith('components/book/') || f.startsWith('components/player/');
function letterPageBreaches(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, t] of fs) {
    if (!onLetterPage(f)) continue;
    for (const name of ['startCapture', 'beginTake', 'armListenStart', 'useAudioRecorder']) if (new RegExp(`\\b${name}\\b`).test(t)) out.push(`${f} uses ${name}`);
    if (START_ROUTE.test(t)) out.push(`${f} names a capture route`);
  }
  return out;
}

/** NS-35-R1: outside Home's module, nothing calls startCapture or opens /listen or /write except a capture-flow replace. */
function startBreaches(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, t] of fs) {
    if (f !== ONE_ENTRY && !inHome(f) && /(?<!function )\bstartCapture\(/.test(t)) out.push(`${f} calls startCapture`);
    if (f === ONE_ENTRY || inHome(f)) continue;
    for (const m of t.matchAll(/\brouter\.(push|replace|navigate)\(|\bhref=\{|\bhref="/g)) {
      const verb = m[1] ?? 'href';
      const arg = m[0].startsWith('href="') ? t.slice(m.index + 6, t.indexOf('"', m.index + 6)) : balanced(t, m.index + m[0].length - 1, m[0].endsWith('{') ? '{' : '(', m[0].endsWith('{') ? '}' : ')');
      if (!START_ROUTE.test(`'${arg}'`) && !START_ROUTE.test(arg)) continue;
      if (verb === 'replace' && CAPTURE_FLOW.includes(f)) continue;
      out.push(`${f} ${verb === 'href' ? 'links to' : `router.${verb} opens`} a capture route`);
    }
  }
  return out;
}

/** NS-35-R1: every capture route literal in every file, against the closed list above. */
function literalBreaches(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, t] of fs) {
    const named = new Set([...t.matchAll(CAPTURE_LITERAL)].map((m) => m[1].toLowerCase() as CaptureScreen));
    for (const r of named) if (!CAPTURE_LITERAL_FILES[r].includes(f)) out.push(`${f} names /${r}`);
  }
  return out;
}

/** One read per file text: the fixtures plant a file or two onto the tree, so the rest is read once for the whole run. */
const specsOf = new Map<string, string[]>();
const specs = (t: string) => specsOf.get(t) ?? specsOf.set(t, importSpecifiers(t)).get(t)!;
const EXTS = ['', ...['.ts', '.tsx'].flatMap((e) => ['', '.ios', '.android', '.native', '.web'].flatMap((p) => [p + e, `/index${p}${e}`]))];
/**
 * The files in the map that `spec`, imported from `f`, names (`@/` is src; a package is none of them). Both forms are
 * normalised the same way, so `..`, `.` and `//` in an alias path name the file Metro bundles, not a key no file has.
 */
function resolve(fs: Files, f: string, spec: string): string[] {
  const base = spec.startsWith('@/') ? posix.normalize(spec.slice(2)) : spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(f), spec)) : null;
  return base === null ? [] : EXTS.map((e) => base + e).filter((x) => fs.has(x));
}
/**
 * A literal dynamic `import('x')` (a lazy load is an import as surely as a static one: src already lazy-loads with
 * `void import('@/lib/...').then(...)`). `typeof import('x')` is a type and carries nothing.
 */
const lazyImports = (t: string) => [...t.matchAll(/(?<![.\w$])(?<!\btypeof\s+)import\s*\(\s*(['"`])([^'"`$\n]+)\1\s*\)/g)].map((m) => m[2]);
/** Value imports between the files in the map, lazy ones included (type-only imports are erased at build and are no edge). */
function importers(fs: Files): Map<string, Set<string>> {
  const by = new Map<string, Set<string>>();
  for (const [f, t] of fs) for (const spec of [...specs(t), ...lazyImports(t)]) for (const to of resolve(fs, f, spec)) (by.get(to) ?? by.set(to, new Set()).get(to)!).add(f);
  return by;
}

/**
 * NS-35-R1: every walk above reads a specifier as written. Metro bundles any `require(x)` or `import(x)` whose argument
 * Babel can fold to a string (a template, a sum, a const), so such a call reaches a file no walk sees. The rule is
 * closed instead: every runtime `require(` and `import(` call in src takes exactly one plain quoted string. Parsed, so a
 * comment, a string, `typeof import('x')` (a type) and a method such as `jest.requireActual` are not calls here.
 */
function specifierBreaches(fs: Files): { calls: number; breaches: string[] } {
  let calls = 0;
  const breaches: string[] = [];
  for (const [f, t] of fs) {
    const sf = ts.createSourceFile(f, t, ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))) {
        calls++;
        if (n.arguments.length !== 1 || !ts.isStringLiteral(n.arguments[0])) {
          const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
          breaches.push(`${f}:${line} ${n.expression.getText(sf)}(${n.arguments.map((a) => a.getText(sf)).join(', ')}) takes no plain string`);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return { calls, breaches };
}

/**
 * NS-35-R1: the two files on the literal list whose exports reach other screens. A file may hold a start route there
 * (CAPTURE_LITERAL_FILES), and a screen that takes the route from one and pushes it opens capture as surely as one that
 * types it. So the rule is closed, like the literal list: any value import of these files is a start, unless the name
 * is on its file's list of route-free exports below, each with its reason. A new export is a start until someone adds
 * it here and says why it carries no route; a renamed or dropped one leaves a stale entry, which fails below.
 * Home and the one entry may take anything (they start), so the list is only what other files take today.
 */
const ROUTE_FREE_EXPORTS: Record<string, Record<string, string>> = {
  'lib/capture/start-capture.logic.ts': {
    HOME_CAPTURE_SOURCES: "tab-jobs.ts: the names of Home's sources, a list of words with no pathname",
  },
  'components/tonight/draft-card.logic.ts': {
    tonightDateline: "Family: the dateline's text and its label",
    writeDateline: "Write: the dateline's text and its label",
    clockOf: 'Review: a duration as a clock string',
    draftWords: "the Plus gate: a draft's words, a string",
    spoken: 'the Plus gate: joins the parts of a spoken label',
    resurfaced: 'the slip registry: a kept letter to read again (it opens the letter, never capture)',
    EXCERPT: 'the draft and resurfaced cards: how many lines of excerpt, and the type variant',
  },
};
/** Screens a lazy or static import of which draws capture: the capture screens and the one entry. */
const CAPTURE_MODULES = [...CAPTURE_FLOW, ONE_ENTRY];
/**
 * Every value name `t` takes from a file in ROUTE_FREE_EXPORTS: a named import or re-export (by its exported name, so a
 * rename at the importer does not hide it), a default import, or `*` for the whole module (`* as`, `export *`, a
 * literal `require`, a literal `import(...)`), which hands over every export. `type` names and clauses carry no value.
 */
function takenFrom(fs: Files, f: string, t: string): { name: string; from: string }[] {
  const out: { name: string; from: string }[] = [];
  const take = (spec: string, clause: string | null) => {
    for (const to of resolve(fs, f, spec)) {
      if (!ROUTE_FREE_EXPORTS[to]) continue;
      const c = clause?.trim() ?? '*';
      if (/^type\b/.test(c)) continue;
      const named = /\{([^}]*)\}/.exec(c);
      const names = named ? named[1].split(',').map((x) => x.trim()).filter((x) => x && !/^type\s/.test(x)).map((x) => x.split(/\s+as\s+/)[0].trim()) : [];
      const head = c.replace(/\{[^}]*\}/, '').replace(/,/g, ' ').trim();
      if (/\*/.test(head)) names.push('*');
      else if (head && head !== '{}') names.push('default');
      for (const name of names) out.push({ name, from: to });
    }
  };
  for (const m of t.matchAll(/\b(?:import|export)\s+([^;'"`]*?)\s*\bfrom\s*['"]([^'"\n]+)['"]/g)) take(m[2], m[1]);
  for (const m of t.matchAll(/\brequire\(\s*(['"`])([^'"`$\n]+)\1\s*\)/g)) take(m[2], null);
  for (const spec of lazyImports(t)) take(spec, null);
  return out;
}
/** The start routes `t` takes by value: every name from takenFrom that is not on its file's route-free list. */
function routeImports(fs: Files, f: string, t: string): string[] {
  return takenFrom(fs, f, t)
    .filter(({ name, from }) => !Object.hasOwn(ROUTE_FREE_EXPORTS[from], name))
    .map(({ name, from }) => `${name === '*' ? 'the whole module' : name} from ${from}`);
}
/** The value names a file exports (declarations and `export { }` lists; types carry no route and are left out). */
function exportedValues(t: string): Set<string> {
  const out = new Set<string>();
  for (const m of t.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|enum)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of t.matchAll(/\bexport\s*\{([^}]*)\}/g)) for (const x of m[1].split(',')) if (x.trim() && !/^type\s/.test(x.trim())) out.add(x.trim().split(/\s+as\s+/).pop()!.trim());
  return out;
}
/** Entries on the route-free list that no longer earn their place: no longer exported, or no file but Home and the one entry takes them. */
function staleRouteFree(fs: Files): string[] {
  const takers = new Map<string, Set<string>>();
  for (const [f, t] of fs) {
    if (f === ONE_ENTRY || f === 'app/(tabs)/index.tsx') continue;
    for (const { name, from } of takenFrom(fs, f, t)) (takers.get(`${from}#${name}`) ?? takers.set(`${from}#${name}`, new Set()).get(`${from}#${name}`)!).add(f);
  }
  const out: string[] = [];
  for (const [file, names] of Object.entries(ROUTE_FREE_EXPORTS)) {
    const exported = exportedValues(fs.get(file) ?? '');
    for (const name of Object.keys(names)) {
      if (!exported.has(name)) out.push(`${file} no longer exports ${name}`);
      else if (!takers.has(`${file}#${name}`)) out.push(`no file outside Home takes ${name} from ${file}`);
    }
  }
  return out;
}

/**
 * NS-35-R1 by screen, not by folder: a file that starts a letter (it imports or calls startCapture, imports a capture
 * screen, takes a name off ROUTE_FREE_EXPORTS's files that is not on its list, or a router call or link in it opens
 * /listen or /write; a lazy `import()` counts as an import) may be drawn by Home alone. The
 * screens that draw a file are the files under app/ that reach it through imports, itself included. The capture flow's
 * own replaces are held by startBreaches.
 */
function renderBreaches(fs: Files): string[] {
  const by = importers(fs);
  const opensStart = (t: string) =>
    [...t.matchAll(/\brouter\.(push|replace|navigate)\(|\bhref=\{|\bhref="/g)].some((m) =>
      START_ROUTE.test(m[0].startsWith('href="') ? `'${t.slice(m.index + 6, t.indexOf('"', m.index + 6))}'` : balanced(t, m.index + m[0].length - 1, m[0].endsWith('{') ? '{' : '(', m[0].endsWith('{') ? '}' : ')')),
    );
  const out: string[] = [];
  for (const [f, t] of fs) {
    if (f === ONE_ENTRY || CAPTURE_FLOW.includes(f)) continue;
    const starts = CAPTURE_MODULES.some((m) => by.get(m)?.has(f)) || /(?<!function )\bstartCapture\(/.test(t) || routeImports(fs, f, t).length > 0 || opensStart(t);
    if (!starts) continue;
    const seen = new Set([f]);
    for (const x of seen) for (const i of by.get(x) ?? []) seen.add(i);
    for (const screen of [...seen].filter((x) => x.startsWith('app/') && x !== 'app/(tabs)/index.tsx').sort()) out.push(`${screen} draws ${f}, which starts a letter`);
  }
  return out;
}

/** NS-35-R4: what would make a doorway the app does not have yet. Each one, once built, must come with its own test. */
const DOORWAY_SURFACES: [RegExp, string][] = [
  [/\bNSExtension\b|share-extension|ShareExtension|expo-share-intent|react-native-share-menu|react-native-receive-sharing-intent/, 'a share extension'],
  [/\bAppIntent\b|\bINIntent\b|\bINExtension\b|com\.apple\.developer\.siri|NSUserActivityTypes|react-native-siri-shortcut|SiriKit/, 'a Siri intent or shortcut'],
  [/\bWidgetKit\b|ControlWidget|apple-targets|expo-widgets|react-native-widget-extension/, 'a widget or control'],
  [/UIApplicationShortcutItems|expo-quick-actions|react-native-quick-actions/, 'a Home Screen quick action'],
];
function doorwaySurfaces(texts: Map<string, string>): string[] {
  const out: string[] = [];
  for (const [f, t] of texts) for (const [re, what] of DOORWAY_SURFACES) if (re.test(t)) out.push(`${f} declares ${what}`);
  return out;
}
/** Native and build files a doorway would have to touch. app.config.ts and package.json are read, never changed here. */
function nativeTexts(): Map<string, string> {
  const out = new Map<string, string>([
    ['app.config.ts', readFileSync(join(ROOT, 'app.config.ts'), 'utf8')],
    ['package.json', readFileSync(join(ROOT, 'package.json'), 'utf8')],
  ]);
  const native = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) native(p);
      else if (/\.(swift|m|mm|h|plist|entitlements|kt|java|json)$/.test(name)) out.set(relative(ROOT, p), readFileSync(p, 'utf8'));
    }
  };
  native(join(ROOT, 'modules'));
  return out;
}

/** Files that answer a notification tap, and what each may do with it: land on a screen, or count it (opt-in analytics). */
const TAP_HANDLERS = ['lib/reminders/scheduler.ts', 'lib/billing/plan-reminders.ts', 'lib/analytics/observers.ts'];
function tapHandlerBreaches(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, t] of fs) {
    const handles = /addNotificationResponseReceivedListener|getLastNotificationResponse|useLastNotificationResponse/.test(t);
    if (handles && !TAP_HANDLERS.includes(f)) out.push(`${f} answers a notification tap`);
    if (!handles) continue;
    for (const name of ['startCapture', 'beginTake', 'armListenStart', 'keepEntry', 'saveEntry', 'keepDraft', 'createRecordingDraft', 'createDraft']) {
      if (new RegExp(`\\b${name}\\b`).test(t)) out.push(`${f} answers a tap and can reach ${name}`);
    }
    if (/from '[^']*capture\//.test(t)) out.push(`${f} answers a tap and imports capture`);
  }
  return out;
}

// ── NS-19-R1 ───────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('[NS-19-R1] a kept letter is never reopened for speech', () => {
  it('[NS-19-R1] a recorder starts in one place: beginTake (and Listen resuming its own take); nothing else prepares or records', () => {
    expect(recordBreaches(files)).toEqual([]);
  });

  it('[NS-19-R1] beginTake takes no letter: it always writes a new draft row, and Listen takes only a prompt from its route', () => {
    // The input is a book and a prompt; there is no entry or draft id to aim it at a kept letter.
    expect(src('lib/capture/recorder.ts')).toMatch(/export async function beginTake\(recorder: AudioRecorder, input: \{ childId: string; promptKey: string \| null \}\)/);
    const body = balanced(src('lib/capture/recorder.ts'), src('lib/capture/recorder.ts').indexOf('{', src('lib/capture/recorder.ts').indexOf('export async function beginTake') + 80), '{', '}');
    expect(body).toMatch(/createRecordingDraft\(\{ childId: input\.childId, promptKey: input\.promptKey,/);
    // createRecordingDraft mints a fresh id (createDraft: c.newId()).
    expect(src('lib/store.ts')).toMatch(/export function createDraft\(input: NewDraft\): Draft \{\s*const c = ctx\(\);\s*const id = c\.newId\(\);/);
    const listen = src('app/listen.tsx');
    expect([...listen.matchAll(/useLocalSearchParams</g)]).toHaveLength(1);
    expect(listen).toMatch(/useLocalSearchParams<\{ promptKey\?: string \}>\(\)/);
  });

  it('[NS-19-R1] the letter page and what it draws never start, arm or open a capture (no "add audio" control)', () => {
    expect(letterPageBreaches(files)).toEqual([]);
  });

  it('[NS-19-R1] the one Review a kept letter opens is the words that arrived later: it opens on the words, where Record again is not offered', () => {
    const letter = src('app/letter/[id].tsx');
    const reviewPushes = [...letter.matchAll(/router\.push\(\{ pathname: '\/review', params: \{ entryId[^}]*\} \}\)/g)];
    expect(reviewPushes.length).toBeGreaterThan(0);
    // laterWordsDraft hands Review words to read, and nothing for a letter without them...
    const kept = { id: 'e1', kind: 'letter', childId: 'child-asha', captureMode: 'spoken', promptKey: null, capturedAt: '2026-10-03T09:00:00.000Z', audioUri: 'file:///asha.m4a', rawTranscript: 'You laughed at the ducks.', finalText: 'You laughed at the ducks.', wordsUnreviewed: true } as unknown as Entry;
    expect(laterWordsDraft(kept, () => true)?.typedText).toBe('You laughed at the ducks.');
    expect(laterWordsDraft({ ...kept, finalText: '' } as Entry, () => true)).toBeNull();
    expect(laterWordsDraft({ ...kept, wordsUnreviewed: false } as Entry, () => true)).toBeNull();
    // ...so Review starts at Ready, past the words card that holds Record again (wordsCard runs only while transcribing).
    const review = src('app/review.tsx');
    expect(review).toMatch(/useState<Phase>\(\s*typed \|\| draft\?\.rawTranscript \? 'ready'/);
    expect(review).toMatch(/const card =\s*phase === 'transcribing' \|\| phase === 'waiting'\s*\? wordsCard\(/);
    // And Record again, where it is offered for a draft, opens a new take with the prompt only: never an entry id.
    expect(review).toMatch(/router\.replace\(\{ pathname: '\/listen', params: draft\?\.promptKey \? \{ promptKey: draft\.promptKey \} : \{\} \}\)/);
    expect(review).not.toMatch(/pathname: '\/listen', params: \{[^}]*entryId/);
  });
});

// ── NS-19-R4 (the store half; the verifier half is packages/core/test/ns-19-r4-takes.test.ts) ───────────────────────────

describe('[NS-19-R4] no edit spans two takes', () => {
  const TAKE_1 = 'Asha, today at the park you';
  const TAKE_2 = 'you laughed um at the ducks.';
  function twoTakes() {
    const f = fixture();
    insertBook(f.db, { id: 'child-asha', name: 'Asha' });
    for (const id of ['take-1', 'take-2']) drafts.insert(f.ctx, id, { childId: 'child-asha', captureMode: 'spoken', promptKey: null, audioUri: `file:///${id}.m4a`, audioDurationMs: 4000 });
    expect(drafts.setTranscriptOnce(f.ctx, 'take-1', TAKE_1)).toBe(true);
    expect(drafts.setTranscriptOnce(f.ctx, 'take-2', TAKE_2)).toBe(true);
    return f;
  }

  it('[NS-19-R4] two takes are two draft rows, each with its own audio and its own raw transcript', () => {
    const f = twoTakes();
    const one = drafts.get(f.ctx, 'take-1')!;
    const two = drafts.get(f.ctx, 'take-2')!;
    expect([one.rawTranscript, two.rawTranscript]).toEqual([TAKE_1, TAKE_2]);
    expect(one.audioUri).not.toBe(two.audioUri);
    f.close();
  });

  it('[NS-19-R4] each raw transcript is set once: neither the repo nor a direct write can change or join it', () => {
    const f = twoTakes();
    expect(drafts.setTranscriptOnce(f.ctx, 'take-1', `${TAKE_1} ${TAKE_2}`)).toBe(false);
    expect(() => f.db.run('UPDATE drafts SET raw_transcript = ? WHERE id = ?', `${TAKE_1} ${TAKE_2}`, 'take-1')).toThrow('raw_transcript is immutable');
    expect(() => f.db.run("UPDATE drafts SET raw_transcript = '' WHERE id = ?", 'take-2')).toThrow('raw_transcript is immutable');
    expect(drafts.get(f.ctx, 'take-1')!.rawTranscript).toBe(TAKE_1);
    expect(drafts.get(f.ctx, 'take-2')!.rawTranscript).toBe(TAKE_2);
    f.close();
  });

  it("[NS-19-R4] each take is cleaned on its own raw: its own verifyEdits pass, and every edit stays inside that take", () => {
    const f = twoTakes();
    for (const id of ['take-1', 'take-2']) {
      const raw = drafts.get(f.ctx, id)!.rawTranscript!;
      const r = cleanSpoken(raw, [{ term: 'Asha', kind: 'child', heardAs: [] }], 'en');
      for (const e of r.applied) expect(e.end).toBeLessThanOrEqual(raw.length);
      expect(verifyEdits(r.applied, { raw, level: 'clean', dictionary: [{ term: 'Asha', kind: 'child', heardAs: [] }], protectedSpans: [] }).accepted).toEqual(r.applied);
    }
    // The app's one cleaning call takes one raw string, never a list of takes.
    expect(src('lib/transcription-queue/clean.ts')).toMatch(/export function cleanSpoken\(\s*raw: string,/);
    f.close();
  });

  it('[NS-19-R4] a second take is not built yet (NS-19-R2 is P2): no store, screen or route continues a draft with a second take', () => {
    // Pinned absence: the PR that builds Continue must replace this with the take tests above run through its own path.
    const joins = [...files].filter(([, t]) => /\b(appendTake|addTake|continueDraft|secondTake|takeIndex)\b/.test(t)).map(([f]) => f);
    expect(joins).toEqual([]);
    expect(readFileSync(join(SRC, 'lib/db/migrations.ts'), 'utf8')).not.toMatch(/CREATE TABLE IF NOT EXISTS takes\b/);
  });
});

// ── NS-35-R1 ───────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('[NS-35-R1] only Home starts', () => {
  it('[NS-35-R1] outside Home, no screen calls startCapture or pushes, navigates or links to /listen or /write', () => {
    expect(startBreaches(files)).toEqual([]);
    // Home does start through the one entry, so the scan is looking at the right file.
    expect(src('app/(tabs)/index.tsx')).toMatch(/startCapture\(\{ source: 'speak'/);
  });

  it('[NS-35-R1] a capture route is named only in its closed list of files: a query, a template or a constant elsewhere is a breach', () => {
    expect(literalBreaches(files)).toEqual([]);
    // Every file on the list still names its route, so the list cannot carry a stale entry that would let a new file in.
    for (const [r, fs] of Object.entries(CAPTURE_LITERAL_FILES)) {
      for (const f of fs) expect([...src(f).matchAll(CAPTURE_LITERAL)].some((m) => m[1].toLowerCase() === r), `${f} names /${r}`).toBe(true);
    }
  });

  it('[NS-35-R1] only Home draws a starter: a file that calls or imports startCapture, takes a start route from a listed file, or opens /listen or /write, is reached from no other screen', () => {
    expect(renderBreaches(files)).toEqual([]);
    // The scan sees Home's real start, so a Home-only starter is what passes.
    expect(importers(files).get(ONE_ENTRY)).toEqual(new Set(['app/(tabs)/index.tsx']));
    // And it sees who takes a start route by value today: the one entry and Home, and no one else.
    const takers = [...files].filter(([f, t]) => routeImports(files, f, t).length > 0).map(([f]) => f).sort();
    expect(takers).toEqual(['app/(tabs)/index.tsx', ONE_ENTRY]);
  });

  it('[NS-35-R1] the route-free list is closed and current: every name on it is still exported by its file and taken outside Home', () => {
    expect(staleRouteFree(files)).toEqual([]);
    // The reader sees the files' real exports, so a stale entry is what it would report.
    expect(exportedValues(src('lib/capture/start-capture.logic.ts'))).toEqual(new Set(['HOME_CAPTURE_SOURCES', 'CAPTURE_DOORWAYS', 'CAPTURE_SOURCES', 'CAPTURE_ROUTES', 'isCaptureSource', 'isCaptureDoorway', 'planCapture']));
    expect(exportedValues(src('components/tonight/draft-card.logic.ts'))).toContain('draftCard');
  });

  it('[NS-35-R1] every require( and import( in src takes one plain string, so every walk reads where it points', () => {
    const { calls, breaches } = specifierBreaches(rawFiles);
    expect(breaches).toEqual([]);
    // The parser sees src's real lazy loads (auth-store, billing, sync, the native modules), so a scan of nothing fails.
    expect(calls).toBeGreaterThan(10);
  });

  it('[NS-35-R1] the doorway sources in the closed list start nothing until their handlers are built', () => {
    for (const source of CAPTURE_DOORWAYS) expect(planCapture({ source })).toEqual({ kind: 'reserved', source });
  });
});

// ── NS-35-R3 ───────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('[NS-35-R3] doorways land, never start', () => {
  const CAPTURE_SCREENS = ['/listen', '/write', '/review', '/read-together'];
  // The origin and scheme come from packages/brand: the public name is never typed here.
  const ORIGIN = brand.web.origin.replace(/\/+$/, '');
  const S = `${brand.scheme}://`;

  it('[NS-35-R3] a reminder tap lands on Home (the evening nudge) or the Book (month and birthday notes), never a capture screen', () => {
    for (const kind of ['evening', 'month', 'birthday', 'anything-else']) {
      const route = routeForReminder({ source: REMINDER_SOURCE, kind });
      expect(['/', '/book']).toContain(route);
    }
    expect(routeForReminder({ source: REMINDER_SOURCE, kind: 'evening' })).toBe('/');
    expect(routeForReminder({ source: 'someone.else', kind: 'evening' })).toBeNull();
    expect(routeForReminder(null)).toBeNull();
    // The live listener and the cold-start read both go only where routeForReminder says.
    expect(src('lib/reminders/scheduler.ts')).toMatch(/const target = routeForReminder\(r\.notification\.request\.content\.data\);[\s\S]*?router\.navigate\(target\)/);
  });

  it('[NS-35-R3] a plan notice lands on Settings, Plus: not a capture screen (card section 2, as built)', () => {
    // plan-reminders.ts loads expo-notifications, so its route is read from the source.
    const planRoute = /export const PLAN_ROUTE = '([^']+)';/.exec(src('lib/billing/plan-reminders.ts'))?.[1];
    expect(planRoute).toBe('/settings/plus');
    expect(CAPTURE_SCREENS).not.toContain(planRoute);
    expect([...src('lib/billing/plan-reminders.ts').matchAll(/router\.(push|replace|navigate)\(([^)]*)\)/g)].map((m) => m[2])).toEqual(['PLAN_ROUTE']);
  });

  it('[NS-35-R3] no notification tap handler can start, arm, record or keep anything', () => {
    expect(tapHandlerBreaches(files)).toEqual([]);
  });

  it.each([
    `${S}listen`,
    `${S}write`,
    `${S}review?draftId=d1`,
    `${S}read-together`,
    `${S}/listen?promptKey=first-smile`,
    `${ORIGIN}/listen`,
    `${ORIGIN}/write`,
    `${ORIGIN}/review?entryId=e1`,
    `${ORIGIN}/Listen/`,
    '/write?draftId=d1',
    `${S}letter/e1`,
    `${S}book`,
    `${S}anything`,
    `${ORIGIN}/open`,
  ])('[NS-35-R3] the link %s lands on Home, server features on or off, and keeps nothing', async (url) => {
    for (const serverFeatures of [false, true]) {
      for (const alpha of [false, true]) {
        Object.assign(env, { serverFeatures, alpha, invites: [], authLinks: 0 });
        expect(await redirectSystemPath({ path: url, initial: true })).toBe('/');
        expect(env.invites).toEqual([]);
        expect(env.authLinks).toBe(0);
      }
    }
  });

  it('[NS-35-R3] no incoming link of any kind lands on a capture screen (sign-in and invite links land on their own flows)', async () => {
    const links = [
      `${ORIGIN}/auth/callback#token_hash=pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f&type=email`,
      `${S}auth/callback`,
      `${ORIGIN}/j#t=3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6`,
      `${ORIGIN}/invite`,
      'not a url',
      '',
    ];
    for (const url of links) {
      for (const serverFeatures of [false, true]) {
        for (const alpha of [false, true]) {
          Object.assign(env, { serverFeatures, alpha, invites: [], authLinks: 0 });
          const route = await redirectSystemPath({ path: url, initial: false });
          expect(CAPTURE_SCREENS.some((s) => route === s || route?.startsWith(`${s}?`) || route?.startsWith(`${s}/`)), `${url} -> ${route}`).toBe(false);
        }
      }
    }
  });

  it('[NS-35-R3] only the parent\'s tap on Home starts: Listen turns the microphone on only after startCapture armed it, and only once', () => {
    resetListenStart();
    // A link, a restored screen or a doorway reaches Listen unarmed: it shows Ready and waits for a tap.
    expect(consumeListenStart(1_000)).toBe(false);
    const armers = [...files].filter(([, t]) => /\barmListenStart\(/.test(t)).map(([f]) => f).filter((f) => f !== 'lib/resilience/start-intent.ts');
    expect(armers).toEqual([ONE_ENTRY]);
    // startCapture arms only for Speak, which only Home's cluster passes (NS-35-R1 above).
    expect(planCapture({ source: 'speak' })).toMatchObject({ armListen: true });
    for (const source of ['type', 'notMuchToday', 'photo', ...CAPTURE_DOORWAYS] as const) expect(planCapture({ source })).not.toMatchObject({ armListen: true });
  });
});

// ── NS-35-R4 ───────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('[NS-35-R4] extensions are doorways', () => {
  it('[NS-35-R4] no share extension, Siri intent, widget, control or quick action is built yet (pinned absence)', () => {
    // When one is built it is a doorway under R3: it lands on Home or a reading screen and never records or keeps.
    // Its PR adds its handler to the closed source list (start-capture.logic.ts) and replaces this pin with that test.
    expect(doorwaySurfaces(nativeTexts())).toEqual([]);
  });

  it('[NS-35-R4] a notification carries no action: the reminder category registers none, and nothing else registers a category', async () => {
    const calls: { id: string; actions: unknown[] }[] = [];
    await registerReminderCategory(async (id, actions) => void calls.push({ id, actions }));
    expect(calls).toEqual([{ id: REMINDER_CATEGORY, actions: [] }]);
    const registrars = [...files].filter(([, t]) => /setNotificationCategoryAsync/.test(t)).map(([f]) => f);
    expect(registrars).toEqual(['lib/reminders/scheduler.ts']);
    expect(src('lib/reminders/scheduler.ts')).toMatch(/registerReminderCategory\(Notifications\.setNotificationCategoryAsync\)/);
  });

  it('[NS-35-R4] a doorway source, once wired, still cannot record or keep on its own: it plans no route, no arming, no keep', () => {
    for (const source of CAPTURE_DOORWAYS) {
      const plan = planCapture({ source });
      expect(plan.kind).toBe('reserved');
      expect(plan).not.toHaveProperty('armListen');
    }
  });
});

// ── The scanners fail on a planted breach ──────────────────────────────────────────────────────────────────────────────

describe('each scanner fails on a planted breach', () => {
  const plant = (f: string, text: string): Files => new Map([...files, [f, code(text)]]);

  it('[NS-19-R1] fixture: a recorder started on the letter page is caught twice', () => {
    const fs = plant('app/letter/[id].tsx', `${src('app/letter/[id].tsx')}\nconst r = useAudioRecorder(OPTS); r.record();`);
    expect(recordBreaches(fs)).toContain('app/letter/[id].tsx starts a recorder');
    expect(letterPageBreaches(fs)).toContain('app/letter/[id].tsx uses useAudioRecorder');
  });

  it('[NS-19-R1] fixture: an "add audio" button on a book component that opens Listen is caught', () => {
    const fs = plant('components/book/add-audio.tsx', "export const AddAudio = () => <Button onPress={() => router.push({ pathname: '/listen', params: { entryId } })} />;");
    expect(letterPageBreaches(fs)).toEqual(['components/book/add-audio.tsx names a capture route']);
    expect(startBreaches(fs)).toEqual(['components/book/add-audio.tsx router.push opens a capture route']);
  });

  it('[NS-35-R1] fixture: the Book calling startCapture, or a settings link to /write, is caught', () => {
    expect(startBreaches(plant('app/(tabs)/book.tsx', `${src('app/(tabs)/book.tsx')}\nstartCapture({ source: 'speak' });`))).toEqual(['app/(tabs)/book.tsx calls startCapture']);
    expect(startBreaches(plant('app/settings/x.tsx', '<Link href="/write" />'))).toEqual(['app/settings/x.tsx links to a capture route']);
  });

  it('[NS-35-R1] fixture: a capture route with a query string, in a template literal, or held in a constant is caught', () => {
    const book = src('app/(tabs)/book.tsx');
    const query = plant('app/(tabs)/book.tsx', `${book}\nexport const x = () => router.push('/listen?promptKey=first-smile');`);
    expect(startBreaches(query)).toEqual(['app/(tabs)/book.tsx router.push opens a capture route']);
    expect(literalBreaches(query)).toEqual(['app/(tabs)/book.tsx names /listen']);
    expect(renderBreaches(query)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    const family = plant('app/family.tsx', `${src('app/family.tsx')}\nconst go = (k: string) => router.push(\`/listen?promptKey=\${k}\`);`);
    expect(startBreaches(family)).toEqual(['app/family.tsx router.push opens a capture route']);
    expect(literalBreaches(family)).toEqual(['app/family.tsx names /listen']);
    const letter = plant('app/letter/[id].tsx', `${src('app/letter/[id].tsx')}\nconst more = () => router.push('/write?draftId=1');`);
    expect(letterPageBreaches(letter)).toEqual(['app/letter/[id].tsx names a capture route']);
    expect(literalBreaches(letter)).toEqual(['app/letter/[id].tsx names /write']);
    const constant = plant('lib/quick/quick-start.ts', "const QUICK_ROUTE = '/write';\nexport const quick = () => router.navigate(QUICK_ROUTE);");
    expect(literalBreaches(constant)).toEqual(['lib/quick/quick-start.ts names /write']);
    // A route map held as data, or a template built on a prefix, is the same breach.
    expect(literalBreaches(plant('lib/quick/routes.ts', "export const ROUTES = { speak: { pathname: '/Listen/' } };"))).toEqual(['lib/quick/routes.ts names /listen']);
    expect(literalBreaches(plant('lib/quick/link.ts', 'export const to = (p: string) => `${p}/review?draftId=d1`;'))).toEqual(['lib/quick/link.ts names /review']);
    // Not a route: other words that start the same way stay clear.
    expect(literalBreaches(plant('lib/quick/words.ts', "export const a = ['/listening', '/writer', 'listen', '/reviews'];"))).toEqual([]);
  });

  it('[NS-35-R1] fixture: a Home component that starts a letter, drawn from the Book, is caught by who draws it, not by its folder', () => {
    const chip = "import { startCapture } from '@/lib/capture/start-capture';\nexport const SpeakChip = () => <Chip onPress={() => startCapture({ source: 'speak' })} />;";
    const drawnBy = (screen: string) => plant(screen, `import { SpeakChip } from '@/components/tonight/speak-chip';\n${src(screen)}`);
    const fromBook = new Map([...drawnBy('app/(tabs)/book.tsx'), ['components/tonight/speak-chip.tsx', code(chip)]]);
    expect(renderBreaches(fromBook)).toEqual(['app/(tabs)/book.tsx draws components/tonight/speak-chip.tsx, which starts a letter']);
    // The same chip drawn by Home alone passes: the rule is the screen, and Home may start.
    expect(renderBreaches(new Map([...drawnBy('app/(tabs)/index.tsx'), ['components/tonight/speak-chip.tsx', code(chip)]]))).toEqual([]);
    // Through a second module, with the import renamed, or by pushing Listen itself: still the Book drawing a start.
    const wrapped = new Map([
      ...plant('app/(tabs)/book.tsx', `import { Footer } from '../../components/book/footer';\n${src('app/(tabs)/book.tsx')}`),
      ['components/book/footer.tsx', code("import { SpeakChip } from '../tonight/speak-chip';\nexport const Footer = () => <SpeakChip />;")],
      ['components/tonight/speak-chip.tsx', code("import { startCapture as begin } from '@/lib/capture/start-capture';\nexport const SpeakChip = () => <Chip onPress={() => begin({ source: 'speak' })} />;")],
    ]);
    expect(renderBreaches(wrapped)).toEqual(['app/(tabs)/book.tsx draws components/tonight/speak-chip.tsx, which starts a letter']);
    const pushes = new Map([...drawnBy('app/(tabs)/book.tsx'), ['components/tonight/speak-chip.tsx', code("export const SpeakChip = () => <Chip onPress={() => router.push('/listen')} />;")]]);
    expect(renderBreaches(pushes)).toEqual(['app/(tabs)/book.tsx draws components/tonight/speak-chip.tsx, which starts a letter']);
    // An aliased import in a screen is a start too, though no call is named startCapture.
    expect(renderBreaches(plant('app/family.tsx', `import { startCapture as begin } from '@/lib/capture/start-capture';\n${src('app/family.tsx')}`))).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
    // A type-only import is erased at build and starts nothing.
    expect(renderBreaches(plant('app/family.tsx', `import type { CaptureStarted } from '@/lib/capture/start-capture';\n${src('app/family.tsx')}`))).toEqual([]);
  });

  // A screen that pushes a start route taken from a file on the literal list starts as surely as one that types it.
  it('[NS-35-R1] fixture (a): Family resuming a draft through Home\'s card route, renamed, is caught', () => {
    const a = plant('app/family.tsx', `import { draftCard as dc } from '@/components/tonight/draft-card.logic';\n${src('app/family.tsx')}\nconst open = (d: DraftFields) => router.push(dc(d).route);`);
    expect(renderBreaches(a)).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
  });

  it('[NS-35-R1] fixture (b): the Book pushing the one entry\'s route list is caught', () => {
    const b = plant('app/(tabs)/book.tsx', `import { CAPTURE_ROUTES } from '@/lib/capture/start-capture.logic';\n${src('app/(tabs)/book.tsx')}\nconst go = () => router.push(CAPTURE_ROUTES[0]);`);
    expect(renderBreaches(b)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
  });

  it('[NS-35-R1] fixture (c): the Book running the plan itself and pushing the pathname it returns is caught', () => {
    const c = plant('app/(tabs)/book.tsx', `import { planCapture } from '../../lib/capture/start-capture.logic';\n${src('app/(tabs)/book.tsx')}\nconst go = () => { const p = planCapture({ source: 'speak' }); if (p.kind === 'route') router.push({ pathname: p.pathname, params: p.params }); };`);
    expect(renderBreaches(c)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
  });

  it('[NS-35-R1] fixture: the whole module or a barrel re-export hands the route over too; a type or another export does not', () => {
    const family = src('app/family.tsx');
    expect(renderBreaches(plant('app/family.tsx', `import * as plan from '@/lib/capture/start-capture.logic';\n${family}`))).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
    const barrel = new Map([
      ...plant('app/(tabs)/book.tsx', `import { routes } from '@/lib/quick';\n${src('app/(tabs)/book.tsx')}`),
      ['lib/quick/index.ts', code("export { CAPTURE_ROUTES as routes } from '../capture/start-capture.logic';")],
    ]);
    expect(renderBreaches(barrel)).toEqual(['app/(tabs)/book.tsx draws lib/quick/index.ts, which starts a letter']);
    // As Family and tab-jobs.ts take from these files today: a type, a listed source list, a dateline.
    expect(renderBreaches(plant('app/family.tsx', `import { type CapturePlan, HOME_CAPTURE_SOURCES } from '@/lib/capture/start-capture.logic';\nimport type { DraftCard } from '@/components/tonight/draft-card.logic';\n${family}`))).toEqual([]);
    // An export that is not on the list counts, even one that holds no route today (CAPTURE_DOORWAYS): the list is closed.
    expect(renderBreaches(plant('app/family.tsx', `import { CAPTURE_DOORWAYS } from '@/lib/capture/start-capture.logic';\n${family}`))).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
  });

  // The route-free list is closed: what is not on it is a start, and what is on it must still be real.
  it('[NS-35-R1] fixture: a new export that carries a route is a start until it is listed, from either file', () => {
    const card = src('components/tonight/draft-card.logic.ts');
    const resume = new Map([
      ...plant('components/tonight/draft-card.logic.ts', `${card}\nexport const resumeRoute = (d: DraftFields): DraftRoute => draftCard(d).route;`),
      ['app/family.tsx', code(`import { resumeRoute } from '@/components/tonight/draft-card.logic';\n${src('app/family.tsx')}\nconst open = (d: DraftFields) => router.push(resumeRoute(d));`)],
    ]);
    expect(renderBreaches(resume)).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
    const listen = new Map([
      ...plant('lib/capture/start-capture.logic.ts', `${src('lib/capture/start-capture.logic.ts')}\nexport const LISTEN_ROUTE = CAPTURE_ROUTES[0];`),
      ['app/(tabs)/book.tsx', code(`import { LISTEN_ROUTE } from '@/lib/capture/start-capture.logic';\n${src('app/(tabs)/book.tsx')}\nconst go = () => router.push(LISTEN_ROUTE);`)],
    ]);
    expect(renderBreaches(listen)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
  });

  it('[NS-35-R1] fixture: a renamed export is a start under its new name, and a renamed listed name goes stale', () => {
    const logic = src('lib/capture/start-capture.logic.ts');
    const renamed = new Map([
      ...plant('lib/capture/start-capture.logic.ts', logic.replace(/\bCAPTURE_ROUTES\b/g, 'START_ROUTES')),
      ['app/(tabs)/book.tsx', code(`import { START_ROUTES } from '@/lib/capture/start-capture.logic';\n${src('app/(tabs)/book.tsx')}\nconst go = () => router.push(START_ROUTES[0]);`)],
    ]);
    expect(renderBreaches(renamed)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    // tonightDateline renamed at its source and at Family: the old entry is stale, and the new name is a start.
    const card = src('components/tonight/draft-card.logic.ts');
    const dateline = new Map([
      ...plant('components/tonight/draft-card.logic.ts', card.replace(/\btonightDateline\b/g, 'tonightLine')),
      ['app/family.tsx', code(src('app/family.tsx').replace(/\btonightDateline\b/g, 'tonightLine'))],
      ['app/(tabs)/index.tsx', code(src('app/(tabs)/index.tsx').replace(/\btonightDateline\b/g, 'tonightLine'))],
    ]);
    expect(staleRouteFree(dateline)).toEqual(['components/tonight/draft-card.logic.ts no longer exports tonightDateline']);
    expect(renderBreaches(dateline)).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
    // A listed name that only Home still takes is stale too: the entry clears no one.
    const unused = plant('app/review.tsx', src('app/review.tsx').replace(/import \{ clockOf \} from '@\/components\/tonight\/draft-card\.logic';/, ''));
    expect(staleRouteFree(unused)).toEqual(['no file outside Home takes clockOf from components/tonight/draft-card.logic.ts']);
  });

  it('[NS-35-R1] fixture: a lazy import() of a route file, the one entry or a capture screen is a start', () => {
    const book = src('app/(tabs)/book.tsx');
    const whole = plant('app/(tabs)/book.tsx', `${book}\nexport const go = async () => { const m = await import('@/lib/capture/start-capture.logic'); router.push(m.CAPTURE_ROUTES[0]); };`);
    expect(renderBreaches(whole)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    const plan = plant('app/family.tsx', `${src('app/family.tsx')}\nconst go = async () => { const { planCapture } = await import('../lib/capture/start-capture.logic'); const p = planCapture({ source: 'speak' }); if (p.kind === 'route') router.push(p.pathname); };`);
    expect(renderBreaches(plan)).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
    const entry = plant('app/(tabs)/book.tsx', `${book}\nconst go = () => void import('@/lib/capture/start-capture').then((m) => m.startCapture);`);
    expect(renderBreaches(entry)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    const screen = plant('app/(tabs)/book.tsx', `${book}\nconst Listen = lazy(() => import('../listen'));`);
    expect(renderBreaches(screen)).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    // A lazy import of a route-free module, or a type written with typeof import(), starts nothing.
    expect(renderBreaches(plant('app/family.tsx', `${src('app/family.tsx')}\ntype P = typeof import('@/lib/capture/start-capture.logic');\nconst j = () => void import('@/lib/nav/tab-jobs');`))).toEqual([]);
  });

  it('[NS-35-R1] fixture: an alias path with .. or a doubled slash names the same file, and is a start', () => {
    const book = src('app/(tabs)/book.tsx');
    for (const spec of ['@/lib/capture/../capture/start-capture.logic', '@/lib//capture/start-capture.logic', '@/lib/./capture/start-capture.logic']) {
      const b = plant('app/(tabs)/book.tsx', `import { CAPTURE_ROUTES } from '${spec}';\n${book}\nconst go = () => router.push(CAPTURE_ROUTES[0]);`);
      expect(renderBreaches(b), spec).toEqual(['app/(tabs)/book.tsx draws app/(tabs)/book.tsx, which starts a letter']);
    }
    // The lazy form goes through the same resolve.
    const lazy = plant('app/family.tsx', `${src('app/family.tsx')}\nconst go = async () => (await import('@/lib//capture/start-capture')).startCapture;`);
    expect(renderBreaches(lazy)).toEqual(['app/family.tsx draws app/family.tsx, which starts a letter']);
  });

  it('[NS-35-R1] fixture: a default import from a route file counts as a taken name', () => {
    const b = plant('app/(tabs)/book.tsx', `import plan from '@/lib/capture/start-capture.logic';\n${src('app/(tabs)/book.tsx')}`);
    expect(routeImports(b, 'app/(tabs)/book.tsx', src('app/(tabs)/book.tsx'))).toEqual([]);
    expect(routeImports(b, 'app/(tabs)/book.tsx', b.get('app/(tabs)/book.tsx')!)).toEqual(['default from lib/capture/start-capture.logic.ts']);
  });

  it('[NS-35-R1] fixture: a template, a string sum or a const-bound specifier is caught with its file and line', () => {
    const at = (body: string) => specifierBreaches(new Map([['app/(tabs)/book.tsx', `import { router } from 'expo-router';\n// require(P) in a comment is no call\n${body}`]])).breaches;
    expect(at("export const go = async () => { const m = await import(`@/lib/capture/${'start-capture.logic'}`); router.push(m.CAPTURE_ROUTES[0]); };")).toEqual([
      "app/(tabs)/book.tsx:3 import(`@/lib/capture/${'start-capture.logic'}`) takes no plain string",
    ]);
    expect(at('const m = require(`@/lib/capture/start-capture.logic`);')).toEqual(['app/(tabs)/book.tsx:3 require(`@/lib/capture/start-capture.logic`) takes no plain string']);
    expect(at("const m = require('@/lib/capture/' + 'start-capture.logic');")).toEqual(["app/(tabs)/book.tsx:3 require('@/lib/capture/' + 'start-capture.logic') takes no plain string"]);
    expect(at("const P = '@/lib/capture/start-capture.logic';\nconst m = require(P);")).toEqual(['app/(tabs)/book.tsx:4 require(P) takes no plain string']);
    expect(at("const P = '@/lib/capture/start-capture.logic';\nconst m = await import(P);")).toEqual(['app/(tabs)/book.tsx:4 import(P) takes no plain string']);
    // A plain string, a type written with typeof import(), a method named require and a string are not breaches.
    expect(at("const a = require('@/lib/nav/tab-jobs');\nvoid import('@/lib/nav/tab-jobs');\ntype T = typeof import('@/lib/capture/start-capture.logic');\nconst b = jest.requireActual(P);\nconst c = 'require(P)';")).toEqual([]);
  });

  it('[NS-35-R3] fixture: a notification tap handler that starts a capture is caught', () => {
    const fs = plant('lib/reminders/quick-start.ts', "Notifications.addNotificationResponseReceivedListener(() => startCapture({ source: 'speak' }));");
    expect(tapHandlerBreaches(fs)).toEqual(['lib/reminders/quick-start.ts answers a notification tap', 'lib/reminders/quick-start.ts answers a tap and can reach startCapture']);
  });

  it('[NS-35-R4] fixture: a share extension or a Siri intent is caught', () => {
    expect(doorwaySurfaces(new Map([['app.config.ts', "plugins: [['expo-share-intent', {}]]"]]))).toEqual(['app.config.ts declares a share extension']);
    expect(doorwaySurfaces(new Map([['modules/x/ios/Speak.swift', 'struct SpeakIntent: AppIntent {}']]))).toEqual(['modules/x/ios/Speak.swift declares a Siri intent or shortcut']);
  });
});
