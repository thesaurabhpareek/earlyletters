/// <reference types="node" />
/**
 * The navigation test (design spec 06 section 10, N1 to N10): fails if two tabs share a verb or a capture entry. The
 * proof for IA-R1 to IA-R4 and the prerequisite NS-01-R1 names (PRD 01 section 3). Read as source text like
 * tab-bar.test.ts; nothing here loads React Native. Each checker is pure over the files, the manifest and the tab
 * labels, so the fixtures of section 10.3 run the same code as the tree does, and the last block holds one fixture per
 * sub-check: a checker that cannot fail is not a test.
 *
 * Checked here: N1, N2(a to c), N3(a to g), N4, N5, N6(a, c, e), N10. Not checked, and why: N2(d to f) and N6(b, d)
 * need content's `tabsJob` strings and the glossary rows for Home and Me (spec 06 step 2); N7, N8 and N9 need the lens,
 * Find and Share modules (specs 01 to 04); IA-R5 to IA-R13 are device rows for qa. Limits (10.2): a static scan cannot
 * see a capture started by a string-built route; it catches the common shapes and the manifest.
 *
 * To run the scan over another checkout (an audit of a head before the consolidation, for example):
 * NAVIGATION_TEST_SRC=<path to that apps/mobile/src> npx vitest run test/navigation-one-entry.test.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { CAPTURE_DOORWAYS, CAPTURE_SOURCES, HOME_CAPTURE_SOURCES, isCaptureDoorway, isCaptureSource } from '../src/lib/capture/start-capture.logic';
import { TAB_JOBS, type TabJob } from '../src/lib/nav/tab-jobs';

const SRC = process.env.NAVIGATION_TEST_SRC ?? join(__dirname, '..', 'src');
/** Source without comments. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Every source file under src, src-relative path to code. */
type Files = Map<string, string>;
const files: Files = new Map(walk(SRC).map((p) => [relative(SRC, p).split('\\').join('/'), code(readFileSync(p, 'utf8'))]));

const LAYOUT = 'app/(tabs)/_layout.tsx';
const HOME = 'app/(tabs)/index.tsx';
const BOOK = 'app/(tabs)/book.tsx';
const ONE_ENTRY = 'lib/capture/start-capture.ts';
const ONE_ENTRY_LOGIC = 'lib/capture/start-capture.logic.ts';
/** Home's module (N3(c)): the one screen and its components. */
const inHomeModule = (f: string) => f === HOME || f.startsWith('components/tonight/');
/** The capture screens: a capture already begun moves between them with router.replace (Type instead, Record again, Write the words). Never a push. */
const CAPTURE_FLOW = ['app/listen.tsx', 'app/write.tsx', 'app/review.tsx'];
/** Name the routes to refuse them to a link (+not-found, the router handler): a guard, not a start. */
const ROUTE_GUARDS = ['lib/resilience/not-found.logic.ts', 'app/+native-intent.tsx'];
/** Doorway handlers (widget, Control Center control, Action button, Siri): none is built. A doorway PR adds its handler here with a design-systems approval line (10.3). */
const DOORWAY_HANDLERS: readonly string[] = [];
const ROUTE_LITERAL = /['"`]\/(listen|write)['"`]/;
const EXTRA_TABS = ['family', 'library', 'photos', 'share'];

/** The text inside the bracket that opens at `from`, up to its match. */
function balanced(text: string, from: number, open: string, close: string): string {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) return text.slice(from + 1, i);
  }
  return text.slice(from + 1);
}

type NavCall = { verb: 'push' | 'replace' | 'navigate' | 'href'; arg: string };
function navCalls(text: string): NavCall[] {
  const out: NavCall[] = [];
  for (const m of text.matchAll(/\brouter\.(push|replace|navigate)\(/g)) out.push({ verb: m[1] as NavCall['verb'], arg: balanced(text, m.index + m[0].length - 1, '(', ')') });
  for (const m of text.matchAll(/\bhref=\{/g)) out.push({ verb: 'href', arg: balanced(text, m.index + m[0].length - 1, '{', '}') });
  for (const m of text.matchAll(/\bhref="([^"]*)"/g)) out.push({ verb: 'href', arg: `"${m[1]}"` });
  return out;
}

/** Call sites of startCapture (not its definition) and the `source` literal each passes, or null when it is not a literal. */
function startCalls(text: string): (string | null)[] {
  return [...text.matchAll(/(?<!function )\bstartCapture\(/g)].map((m) => /\bsource:\s*'([^']*)'/.exec(balanced(text, m.index + m[0].length - 1, '(', ')'))?.[1] ?? null);
}

const screensOf = (layout: string) => [...layout.matchAll(/<Tabs\.Screen\s+name="(\w+)"/g)].map((m) => m[1]);
const head = (verb: string) => verb.trim().split(/\s+/)[0];

/** N1: the bar. */
function checkBar(fs: Files, manifest: readonly TabJob[], tabs: Record<string, unknown>): string[] {
  const out: string[] = [];
  const layout = fs.get(LAYOUT) ?? '';
  const screens = screensOf(layout);
  const ids = manifest.map((t) => t.id);
  if (screens.join() !== ids.join()) out.push(`N1 the layout screens are ${screens.join(', ')}, not ${ids.join(', ')}`);
  for (const t of manifest) {
    const title = new RegExp(`<Tabs\\.Screen\\s+name="${t.id}"[\\s\\S]*?\\btitle: (t\\.(\\w+)|[^,\\n]+)`).exec(layout);
    if (!title) out.push(`N1 ${t.id} has no title`);
    else if (title[2] !== t.tabsKey) out.push(`N1 ${t.id} is titled ${title[1]}, not copy.tabs.${t.tabsKey}`);
    if (typeof tabs[t.tabsKey] !== 'string') out.push(`N1 copy.tabs.${t.tabsKey} is not a string`);
  }
  return out;
}

/** N2: verbs, (a) to (c). (d) to (f) wait for content's tabsJob strings. */
function checkVerbs(manifest: readonly TabJob[]): string[] {
  const out: string[] = [];
  for (const t of manifest) {
    const words = t.verb.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 2 || t.verb !== t.verb.toLowerCase()) out.push(`N2(c) ${t.id}: the verb "${t.verb}" is not one or two lowercase words`);
  }
  for (let i = 0; i < manifest.length; i++) {
    for (let j = i + 1; j < manifest.length; j++) {
      const a = manifest[i];
      const b = manifest[j];
      if (a.verb === b.verb) out.push(`N2(a) ${a.id} and ${b.id} share the verb "${a.verb}"`);
      else if (head(a.verb) === head(b.verb)) out.push(`N2(b) ${a.id} and ${b.id} share the head "${head(a.verb)}"`);
    }
  }
  return out;
}

/** N3: one capture entry, (a) to (g). */
function checkOneEntry(fs: Files, manifest: readonly TabJob[]): string[] {
  const out: string[] = [];
  const seen = new Map<string, string>();
  for (const t of manifest) {
    for (const s of t.captureEntries) {
      if (seen.has(s)) out.push(`N3(a) ${s} is listed under ${seen.get(s)} and ${t.id}`);
      seen.set(s, t.id);
    }
    if (t.id !== 'index' && t.captureEntries.length > 0) out.push(`N3(b) ${t.id} lists capture entries`);
  }
  const entry = fs.get(ONE_ENTRY);
  if (!entry || !/export function startCapture\(/.test(entry)) out.push(`N3(c) the one capture start function is missing: ${ONE_ENTRY}`);
  if (!(fs.get(HOME) ?? '').includes('startCapture(')) out.push(`N3(c) Home's cluster does not start through startCapture`);
  for (const [f, text] of fs) {
    if (f !== ONE_ENTRY) {
      for (const source of startCalls(text)) {
        if (!inHomeModule(f) && !DOORWAY_HANDLERS.includes(f)) out.push(`N3(c) ${f} calls startCapture`);
        if (source === null || !isCaptureSource(source)) out.push(`N3(f) ${f} calls startCapture with a source outside the list: ${source ?? 'not a literal'}`);
        else if (isCaptureDoorway(source) && !DOORWAY_HANDLERS.includes(f)) out.push(`N3(g) ${f} passes the doorway source ${source}`);
      }
    }
    for (const nav of navCalls(text)) {
      if (!ROUTE_LITERAL.test(nav.arg) || f === ONE_ENTRY) continue;
      if (nav.verb === 'replace' && CAPTURE_FLOW.includes(f)) continue;
      out.push(`N3(d) ${f} ${nav.verb === 'href' ? 'links to' : `router.${nav.verb} opens`} a capture route`);
    }
    if (ROUTE_LITERAL.test(text) && !inHomeModule(f) && ![ONE_ENTRY, ONE_ENTRY_LOGIC, ...CAPTURE_FLOW, ...ROUTE_GUARDS].includes(f)) out.push(`N3(d) ${f} names a capture route`);
    if (/size="capture"/.test(text) && !inHomeModule(f)) out.push(`N3(e) ${f} renders the capture cluster`);
  }
  return out;
}

/** N4: no extra tabs. */
function checkNoExtraTabs(fs: Files): string[] {
  const out: string[] = [];
  const layout = fs.get(LAYOUT) ?? '';
  const screens = screensOf(layout);
  for (const s of screens) if (EXTRA_TABS.includes(s)) out.push(`N4 the layout defines a ${s} tab`);
  if (screens.length > 3) out.push(`N4 the layout defines ${screens.length} tabs`);
  if (/Tabs\.Protected/.test(layout)) out.push('N4 the layout hides a tab behind Tabs.Protected');
  return out;
}

/** N5: the Book starts nothing. */
function checkBookStartsNothing(fs: Files): string[] {
  const out: string[] = [];
  const book = fs.get(BOOK) ?? '';
  if (/\bstartCapture\b|size="capture"/.test(book) || ROUTE_LITERAL.test(book)) out.push('N5 the Book references a capture start');
  const cta = /label=\{copy\.book\.empty\.bookCta\}\s+onPress=\{/.exec(book);
  if (!cta) return [...out, 'N5 the Book has no empty-state button'];
  const handler = balanced(book, cta.index + cta[0].length - 1, '{', '}');
  if (!/router\.navigate\('\/'\)/.test(handler)) out.push(`N5 the Book's empty-state button does not switch to the Home tab: ${handler.trim()}`);
  return out;
}

/** N6: words, (a), (c) and (e). (b) and (d) wait for content's glossary rows and tabsJob strings. */
function checkWords(tabs: Record<string, unknown>, manifest: readonly TabJob[]): string[] {
  const out: string[] = [];
  const keys: string[] = manifest.map((t) => t.tabsKey);
  for (const [k, v] of Object.entries(tabs)) {
    if (!keys.includes(k)) out.push(`N6(c) copy.tabs.${k} is not a tab label key`);
    if (typeof v !== 'string') out.push(`N6(e) copy.tabs.${k} is not a string`);
    else if (!/^[A-Z][a-z]+$/.test(v)) out.push(`N6(a) the label "${v}" is not one word`);
  }
  return out;
}

/** N10: Home offers no firsts or seal. */
function checkHomeOffersNoFirstsOrSeal(fs: Files): string[] {
  const out: string[] = [];
  for (const [f, text] of fs) {
    if (!inHomeModule(f)) continue;
    for (const name of ['FirstMark', 'SealedRow']) if (new RegExp(`\\b${name}\\b`).test(text)) out.push(`N10 ${f} imports ${name}`);
    const key = /\b(?:copy|en)\.(?:firsts|seal)\.\w+/.exec(text);
    if (key) out.push(`N10 ${f} uses the key ${key[0]}`);
  }
  return out;
}

describe('the navigation test (design spec 06 section 10)', () => {
  it('[IA-N1] the bar is the manifest: index, book, you in that order, each titled from copy.tabs', () => {
    expect(checkBar(files, TAB_JOBS, en.tabs)).toEqual([]);
    expect(TAB_JOBS.map((t) => t.id)).toEqual(['index', 'book', 'you']);
  });

  it('[IA-N2] each tab declares one verb; no two tabs share a verb or its head', () => {
    expect(checkVerbs(TAB_JOBS)).toEqual([]);
    expect(TAB_JOBS.map((t) => t.verb)).toEqual(['say', 'read', 'look after']);
  });

  it('[IA-N3] one capture entry: Home starts through startCapture with a source from the closed list, and nothing else opens /listen or /write', () => {
    expect(checkOneEntry(files, TAB_JOBS)).toEqual([]);
    // One list (10.1): Home's entries plus the doorways are every source, and the names are the PRD's.
    expect([...HOME_CAPTURE_SOURCES, ...CAPTURE_DOORWAYS]).toEqual([...CAPTURE_SOURCES]);
    expect([...CAPTURE_SOURCES]).toEqual(['speak', 'type', 'notMuchToday', 'photo', 'widget', 'controlCenterControl', 'actionButton', 'siri']);
    expect(TAB_JOBS[0].captureEntries).toBe(HOME_CAPTURE_SOURCES);
  });

  it('[IA-N4] no fourth tab, and no tab hidden behind Tabs.Protected', () => {
    expect(checkNoExtraTabs(files)).toEqual([]);
  });

  it('[IA-N5] the Book starts nothing: its empty-state button switches to the Home tab', () => {
    expect(checkBookStartsNothing(files)).toEqual([]);
  });

  it('[IA-N6] tab labels are single words, strings only, under the manifest label keys', () => {
    expect(checkWords(en.tabs, TAB_JOBS)).toEqual([]);
  });

  it('[IA-N10] Home offers no firsts or seal', () => {
    expect(checkHomeOffersNoFirstsOrSeal(files)).toEqual([]);
  });
});

describe('the navigation test proves it can fail (design spec 06 section 10.3)', () => {
  const layout = files.get(LAYOUT) ?? '';
  const book = files.get(BOOK) ?? '';
  const codes = (failures: string[]) => [...new Set(failures.map((x) => x.split(' ')[0]))];
  const withFile = (path: string, text: string | null): Files => {
    const next = new Map(files);
    if (text === null) next.delete(path);
    else next.set(path, text);
    return next;
  };
  const manifest = (rows: Partial<TabJob>[]): TabJob[] => TAB_JOBS.map((t, i) => ({ ...t, ...rows[i] }) as TabJob);
  const tabs = { ...en.tabs } as Record<string, unknown>;

  it('[IA-N1] N1a screens out of order and N1b a typed title fail N1', () => {
    const swapped = layout.replace(/(<Tabs\.Screen name="index"[^\n]*\n)(\s*<Tabs\.Screen name="book"[^\n]*\n)/, '$2$1');
    expect(swapped).not.toBe(layout);
    expect(codes(checkBar(withFile(LAYOUT, swapped), TAB_JOBS, tabs))).toContain('N1');
    const typed = layout.replace('title: t.tonight,', "title: 'Tonight',");
    expect(typed).not.toBe(layout);
    expect(codes(checkBar(withFile(LAYOUT, typed), TAB_JOBS, tabs))).toContain('N1');
  });

  it('[IA-N2] N2a a shared verb, N2b a shared head and N2c an empty verb fail N2', () => {
    expect(codes(checkVerbs(manifest([{ verb: 'read' }, { verb: 'read' }])))).toEqual(['N2(a)']);
    expect(codes(checkVerbs(manifest([{}, { verb: 'look up' }])))).toEqual(['N2(b)']);
    expect(codes(checkVerbs(manifest([{ verb: '' }])))).toEqual(['N2(c)']);
    expect(codes(checkVerbs(manifest([{ verb: 'say it all now' }])))).toEqual(['N2(c)']);
  });

  it('[IA-N3] N3a to N3g each fail their own sub-check', () => {
    expect(codes(checkOneEntry(files, manifest([{}, { captureEntries: ['speak'] }])))).toEqual(['N3(a)', 'N3(b)']);
    expect(codes(checkOneEntry(files, manifest([{}, {}, { captureEntries: ['siri'] }])))).toEqual(['N3(b)']);
    expect(codes(checkOneEntry(withFile('app/(tabs)/book-row.tsx', "const go = () => startCapture({ source: 'speak' });"), TAB_JOBS))).toEqual(['N3(c)']);
    // The function missing, or Home not using it, is also N3(c): the check is red on a tree before the consolidation.
    expect(codes(checkOneEntry(withFile(ONE_ENTRY, null), TAB_JOBS))).toEqual(['N3(c)']);
    expect(codes(checkOneEntry(withFile(HOME, "router.push({ pathname: mode === 'typed' ? '/write' : '/listen', params });"), TAB_JOBS))).toEqual(['N3(c)', 'N3(d)']);
    expect(codes(checkOneEntry(withFile('app/(tabs)/you-row.tsx', "const go = () => router.push('/listen');"), TAB_JOBS))).toEqual(['N3(d)']);
    expect(codes(checkOneEntry(withFile('app/settings/row.tsx', "const go = () => router.navigate({ pathname: '/write', params: {} });"), TAB_JOBS))).toEqual(['N3(d)']);
    expect(codes(checkOneEntry(withFile('components/book/row.tsx', '<Link href="/write">Type</Link>'), TAB_JOBS))).toEqual(['N3(d)']);
    // A capture screen may replace between the capture screens; a push there is a start.
    expect(codes(checkOneEntry(withFile('app/review.tsx', "router.push({ pathname: '/listen' });"), TAB_JOBS))).toEqual(['N3(d)']);
    expect(codes(checkOneEntry(withFile('components/book/cluster.tsx', '<Button size="capture" label={t.speakButton} />'), TAB_JOBS))).toEqual(['N3(e)']);
    expect(codes(checkOneEntry(withFile('components/tonight/extra.tsx', "startCapture({ source: 'sparkle' });"), TAB_JOBS))).toEqual(['N3(f)']);
    expect(codes(checkOneEntry(withFile('components/tonight/extra.tsx', 'startCapture({ source });'), TAB_JOBS))).toEqual(['N3(f)']);
    expect(codes(checkOneEntry(withFile('app/(tabs)/book-row.tsx', "startCapture({ source: 'siri' });"), TAB_JOBS))).toEqual(['N3(c)', 'N3(g)']);
    expect(codes(checkOneEntry(withFile('components/tonight/extra.tsx', "startCapture({ source: 'siri' });"), TAB_JOBS))).toEqual(['N3(g)']);
  });

  it('[NS-01-R1] the photo start goes through startCapture; pushing Listen directly from Home or a photo file fails N3', () => {
    const home = files.get(HOME) ?? '';
    expect(startCalls(home)).toContain('photo');
    const pushed = home.replace(/startCapture\(\{ source: 'photo',[^\n]*\}\)\)/, "router.push({ pathname: '/listen', params: { promptKey: prompt.key } }))");
    expect(pushed).not.toBe(home);
    expect(codes(checkOneEntry(withFile(HOME, pushed), TAB_JOBS))).toEqual(['N3(d)']);
    expect(codes(checkOneEntry(withFile('lib/photos/use-photo-start.ts', "router.push({ pathname: '/listen', params });"), TAB_JOBS))).toEqual(['N3(d)']);
  });

  it('[IA-N4] N4a a share screen and N4b a tab behind Tabs.Protected fail N4', () => {
    const share = layout.replace('<Tabs.Screen name="book"', '<Tabs.Screen name="share" options={{ title: t.book }} />\n          <Tabs.Screen name="book"');
    expect(share).not.toBe(layout);
    expect(codes(checkNoExtraTabs(withFile(LAYOUT, share)))).toEqual(['N4']);
    const guarded = layout.replace('</Tabs>', '<Tabs.Protected guard={false}><Tabs.Screen name="family" /></Tabs.Protected></Tabs>');
    expect(guarded).not.toBe(layout);
    expect(codes(checkNoExtraTabs(withFile(LAYOUT, guarded)))).toEqual(['N4']);
  });

  it('[IA-N5] N5a a Book button that calls startCapture and N5b one that pushes /write fail N5', () => {
    const cta = /label=\{copy\.book\.empty\.bookCta\} onPress=\{\(\) => router\.navigate\('\/'\)\}/;
    expect(book).toMatch(cta);
    expect(codes(checkBookStartsNothing(withFile(BOOK, book.replace(cta, "label={copy.book.empty.bookCta} onPress={() => startCapture({ source: 'speak' })}"))))).toEqual(['N5']);
    expect(codes(checkBookStartsNothing(withFile(BOOK, book.replace(cta, "label={copy.book.empty.bookCta} onPress={() => router.push('/write')}"))))).toEqual(['N5']);
    expect(codes(checkBookStartsNothing(withFile(BOOK, book.replace(cta, 'label={copy.book.empty.bookCta} onPress={() => router.push(\'/settings\')}'))))).toEqual(['N5']);
  });

  it('[IA-N6] N6a a two-word label, N6c a key outside the manifest and N6e a non-string fail N6', () => {
    expect(codes(checkWords({ ...tabs, tonight: 'Our Book' }, TAB_JOBS))).toEqual(['N6(a)']);
    expect(codes(checkWords({ ...tabs, share: 'Share' }, TAB_JOBS))).toEqual(['N6(c)']);
    expect(codes(checkWords({ ...tabs, tonight: { label: 'Home' } }, TAB_JOBS))).toEqual(['N6(e)']);
  });

  it('[IA-N10] N10a FirstMark and N10b SealedRow in Home fail N10, as does a firsts or seal key', () => {
    expect(codes(checkHomeOffersNoFirstsOrSeal(withFile('components/tonight/first.tsx', "import { FirstMark } from '@/components/book/first-mark';")))).toEqual(['N10']);
    expect(codes(checkHomeOffersNoFirstsOrSeal(withFile('components/tonight/sealed.tsx', "import { SealedRow } from '@/components/book/sealed-row';")))).toEqual(['N10']);
    expect(codes(checkHomeOffersNoFirstsOrSeal(withFile(HOME, `${files.get(HOME)}\nconst x = copy.seal.homeOpened;`)))).toEqual(['N10']);
  });
});
