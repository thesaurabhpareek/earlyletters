/// <reference types="node" />
/**
 * Find's rules that need no database: the switch and the pause, the excerpt, what each state shows, and the scans that
 * keep the rules from being undone later (Home and Me have no Find, no query is kept or sent, no network, no recording).
 * Fictional Asha family only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { findCopy } from '@scribe/content';
import { announcementFor, clearOnBlur, findView, markOpeningLetter, rowLabel, segments } from '../src/components/find/find.logic';
import { fill } from '../src/lib/copy';
import { findPaused, findSurface, parseBookSearchFlag } from '../src/lib/find/flag';
import { ensureSearchIndex } from '../src/lib/find/lifecycle';
import { findPausedNow } from '../src/lib/find/pause';
import { foldText, ftsMatchString, matches, MIN_QUERY_CHARS, prepareQuery, snippetSource, tokenize } from '../src/lib/find/query';
import { excerpt, EXCERPT_MAX, matchRanges } from '../src/lib/find/snippet';
import { searchLetters } from '../src/lib/find/search';
import { findFixture } from './helpers/find-fixture';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const strip = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
function files(dir: string, test: (p: string) => boolean): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p, test) : test(p) ? [p] : [];
  });
}
const FIND_FILES = [...files(join(SRC, 'lib', 'find'), (p) => /\.tsx?$/.test(p)), ...files(join(SRC, 'components', 'find'), (p) => /\.tsx?$/.test(p))];
/**
 * The Book's blur handler in find-mode.tsx, whole: the guard that keeps the query for Back (R12), then the query cleared and
 * Find closed (R14). Tabs keep the Book mounted, so this handler is the only thing that clears the query when the parent
 * leaves for another tab; it is pinned as one sequence because `setQuery('')` also exists in Cancel, and a handler reduced
 * to the guard alone would otherwise stay green.
 */
const BLUR_HANDLER = /addListener\('blur', \(\) => \{\s*if \(!clearOnBlur\(\)\) return;\s*setQuery\(''\);\s*onClose\(\);\s*\}\)/;

describe('[NS-02-R1] Find lives on the Book header only, behind a switch that default to off', () => {
  it('[NS-02-R1] the build switch reads EXPO_PUBLIC_BOOK_SEARCH and only the word on turns it on', () => {
    expect(parseBookSearchFlag(undefined)).toBe(false);
    expect(parseBookSearchFlag('')).toBe(false);
    expect(parseBookSearchFlag('off')).toBe(false);
    expect(parseBookSearchFlag('true')).toBe(false);
    expect(parseBookSearchFlag('1')).toBe(false);
    expect(parseBookSearchFlag(' ON ')).toBe(true);
    expect(read('lib/find/flag.ts')).toMatch(/process\.env\.EXPO_PUBLIC_BOOK_SEARCH/);
  });

  it('[NS-02-R1] the action draws only with the switch on, no pause, and a letter to find: absent otherwise, never greyed', () => {
    const on = { build: true, paused: false, hasLetters: true };
    expect(findSurface(on)).toBe(true);
    expect(findSurface({ ...on, build: false })).toBe(false);
    expect(findSurface({ ...on, paused: true })).toBe(false);
    expect(findSurface({ ...on, hasLetters: false })).toBe(false);
  });

  it('[NS-02-R1] the remote pause can hide Find and can never turn it on', () => {
    expect(findPaused(undefined)).toBe(false);
    expect(findPaused(null)).toBe(false);
    expect(findPaused({ killSwitches: {} })).toBe(false);
    expect(findPaused({ killSwitches: { bookSearch: false } })).toBe(false);
    expect(findPaused({ killSwitches: { bookSearch: true } })).toBe(true);
    // Whatever the config says, a build with the switch off has no Find.
    for (const paused of [true, false]) expect(findSurface({ build: false, paused, hasLetters: true })).toBe(false);
    // A pause is read from the signed config on each call; one that cannot be read does not pause and does not enable.
    expect(findPausedNow(() => ({ getRemoteConfig: () => ({ killSwitches: { bookSearch: true } }) }))).toBe(true);
    expect(findPausedNow(() => ({ getRemoteConfig: () => ({ killSwitches: { bookSearch: false } }) }))).toBe(false);
    expect(findPausedNow(() => ({ getRemoteConfig: () => null }))).toBe(false);
    expect(findPausedNow(() => { throw new Error('not loaded'); })).toBe(false);
  });

  it('[NS-02-R1] only the Book hosts Find: Home, Me, Settings and the other tabs import none of it', () => {
    const offenders = files(join(SRC, 'app'), (p) => /\.tsx?$/.test(p))
      .filter((p) => /from '@\/(components|lib)\/find\//.test(readFileSync(p, 'utf8')))
      .map((p) => relative(SRC, p));
    expect(offenders).toEqual([join('app', '(tabs)', 'book.tsx')]);
    const components = files(join(SRC, 'components'), (p) => /\.tsx?$/.test(p) && !p.includes(`${join('components', 'find')}`))
      .filter((p) => /from '@\/(components|lib)\/find\//.test(readFileSync(p, 'utf8')))
      .map((p) => relative(SRC, p));
    expect(components).toEqual([]);
  });

  it('[NS-02-R1] the Book offers one action named for VoiceOver, in the cover band and in the inline bar', () => {
    const book = strip(read('app/(tabs)/book.tsx'));
    expect(book).toMatch(/findCopy\.button/);
    expect(book.match(/testID="book\.(bar\.)?find"/g)).toHaveLength(1); // the bar's; the band's is in cover-band.tsx
    expect(read('components/book/cover-band.tsx')).toMatch(/testID="book\.find"/);
    expect(book).toMatch(/findSurface\(\{ build: findBuildEnabled\(\), paused: findPausedNow\(\)/);
  });
});

describe('[NS-02-R3] what a query means', () => {
  it('[NS-02-R3] fewer than three characters, spaces and marks alone do nothing', () => {
    expect(MIN_QUERY_CHARS).toBe(3);
    for (const raw of ['', ' ', '  ', 'a', 'ab', ' a b ', '!!', '...']) expect(prepareQuery(raw).kind, raw).toBe('none');
    expect(prepareQuery('abc').kind).toBe('words');
    expect(prepareQuery('a b c').kind).toBe('words');
  });

  it('[NS-02-R3] one CJK character is enough and takes the substring rule; each space-separated piece is looked for as written', () => {
    expect(prepareQuery('\u8239')).toEqual({ kind: 'substring', terms: ['\u8239'] });
    expect(prepareQuery('\u5c0f\u8239 \u7b11')).toEqual({ kind: 'substring', terms: ['\u5c0f\u8239', '\u7b11'] });
    expect(prepareQuery('\u3072')).toEqual({ kind: 'substring', terms: ['\u3072'] });
    expect(prepareQuery('\ud55c')).toEqual({ kind: 'substring', terms: ['\ud55c'] });
    expect(matches(prepareQuery('\u8239'), { body: '\u6211\u4eec\u770b\u5230\u4e86\u4e00\u53ea\u5c0f\u8239', extra: '' })).toBe(true);
    expect(matches(prepareQuery('\u821f'), { body: '\u6211\u4eec\u770b\u5230\u4e86\u4e00\u53ea\u5c0f\u8239', extra: '' })).toBe(false);
  });
});

describe('[NS-02-R6] the words rule, as the scan reads it', () => {
  it('[NS-02-R6] every term, any order, last as a prefix, case and Latin accents folded', () => {
    const row = { body: 'Un caf\u00e9 avec maman, puis les canards.', extra: '' };
    expect(matches(prepareQuery('CAFE maman'), row)).toBe(true);
    expect(matches(prepareQuery('canard'), row)).toBe(true); // prefix of the last term
    expect(matches(prepareQuery('canard maman'), row)).toBe(false); // "canard" is not whole, and it is not the last term
    expect(matches(prepareQuery('maman puis'), row)).toBe(true);
  });

  it('[NS-02-R6] the FTS expression quotes every term, so no operator can leak in, and only the last is a prefix', () => {
    expect(ftsMatchString(['blue', 'boat'])).toBe('"blue" "boat"*');
    expect(ftsMatchString(['a"b'])).toBe('"a""b"*');
    expect(prepareQuery('blue* OR NOT boat')).toEqual({ kind: 'words', terms: ['blue', 'or', 'not', 'boat'] });
  });

  it('[NS-02-R7] Latin accents fold and a Devanagari vowel sign does not', () => {
    expect(foldText('Caf\u00e9 Ni\u00f1o Cora\u00e7\u00e3o \u00c5ngstr\u00f6m')).toBe('cafe nino coracao angstrom');
    expect(foldText('\u0928\u093e\u0935')).toBe('\u0928\u093e\u0935');
    expect(tokenize('\u0906\u091c \u0928\u093e\u0935').map((t) => t.text)).toEqual(['\u0906\u091c', '\u0928\u093e\u0935']);
  });
});

describe('[NS-02-R9] the excerpt is a slice of the parent\'s words', () => {
  // A small seeded generator so the 200 fixtures are the same on every run.
  function rng(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  }
  const WORDS = ['laughed', 'rain', 'blue', 'boat', 'caf\u00e9', 'ni\u00f1o', 'duck', 'park', 'hat', 'Asha', 'kite', 'song', 'bath', 'milk', 'slept', 'clapped', 'stairs', 'garden', 'moon', 'Papa'];
  const PUNCT = ['', '', '', ',', '.', '!', '?'];

  it('[NS-02-R9] for 200 random letters the excerpt is a contiguous substring, starts and ends on a whole word, holds the match, and has no ellipsis character', () => {
    const r = rng(42);
    for (let i = 0; i < 200; i++) {
      const n = 4 + Math.floor(r() * 90);
      let text = '';
      for (let k = 0; k < n; k++) text += WORDS[Math.floor(r() * WORDS.length)] + PUNCT[Math.floor(r() * PUNCT.length)] + (r() < 0.04 ? '\n' : ' ');
      text = text.trim();
      const target = WORDS[Math.floor(r() * WORDS.length)];
      const q = prepareQuery(target.length < 3 ? target + 'xx' : target);
      const e = excerpt(q, text);
      const label = `${i}: ${target}`;
      expect(text.includes(e.text), label).toBe(true);
      expect(text.slice(e.offset, e.offset + e.text.length), label).toBe(e.text);
      expect(e.text.length, label).toBeLessThanOrEqual(EXCERPT_MAX + 4);
      expect(e.text, label).not.toMatch(/[\u2026\u2013\u2014]/);
      // whole words at both ends: the neighbours in the source are a space, a line break or the edge of the text
      expect(e.offset === 0 || /[\s]/.test(text[e.offset - 1]) || /[.!?]/.test(text[e.offset - 1]), label).toBe(true);
      expect(e.offset + e.text.length === text.length || /[\s]/.test(text[e.offset + e.text.length]), label).toBe(true);
      for (const m of e.marks) expect(foldText(e.text.slice(m.start, m.end)).startsWith(foldText(target)) || matches(q, { body: e.text.slice(m.start, m.end), extra: '' }), label).toBe(true);
      if (matchRanges(q, text).length > 0) expect(e.marks.length, label).toBeGreaterThan(0);
    }
  });

  it('[NS-02-R9] a long run-on letter is cut on whole words around the match; a letter that fits is shown whole', () => {
    const long = ('word '.repeat(100) + 'the blue boat floated ' + 'word '.repeat(100)).trim();
    const q = prepareQuery('boat');
    const e = excerpt(q, long);
    expect(e.text.length).toBeLessThanOrEqual(EXCERPT_MAX + 4);
    expect(e.text).toContain('boat');
    expect(e.cutStart && e.cutEnd).toBe(true);
    const short = excerpt(q, 'We saw the boat.');
    expect(short.text).toBe('We saw the boat.');
    expect(short.cutStart || short.cutEnd).toBe(false);
  });

  it('[NS-02-R9] the excerpt is the sentence that holds the match, and the match is marked as a whole word', () => {
    const text = 'We went to the park. She laughed at the ducks by the water. Then we slept.';
    const e = excerpt(prepareQuery('duck'), text);
    expect(e.text).toBe('She laughed at the ducks by the water.');
    expect(e.marks.map((m) => e.text.slice(m.start, m.end))).toEqual(['ducks']);
  });

  it('[NS-02-R9] CJK text with no spaces is sliced at a character, never inside a surrogate pair, and still a substring', () => {
    const text = '\u{20000}'.repeat(150) + '\u8239' + '\u{20000}'.repeat(150);
    const e = excerpt(prepareQuery('\u8239'), text);
    expect(text.includes(e.text)).toBe(true);
    expect(e.text).toContain('\u8239');
    expect(e.text).not.toMatch(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);
  });

  it('[NS-02-R9] a result quotes the typed photo words when those hold the match, and the letter otherwise', () => {
    const q = prepareQuery('slide');
    expect(snippetSource(q, { body: 'We stayed home.', extra: 'Asha on the red slide' })).toBe('extra');
    expect(snippetSource(prepareQuery('stayed'), { body: 'We stayed home.', extra: 'Asha on the red slide' })).toBe('body');
    expect(snippetSource(q, { body: 'We stayed home.', extra: '' })).toBe('body');
  });

  it('[NS-02-R9] the marked runs and the plain runs together are exactly the excerpt, once', () => {
    const e = excerpt(prepareQuery('blue boat'), 'The blue boat, the blue boats.');
    const parts = segments(e.text, e.marks);
    expect(parts.map((p) => p.text).join('')).toBe(e.text);
    expect(parts.filter((p) => p.marked).map((p) => p.text)).toEqual(['blue', 'boat', 'blue', 'boats']);
    expect(segments('abc', [{ start: 1, end: 2 }, { start: 1, end: 3 }]).map((p) => p.text).join('')).toBe('abc');
  });
});

describe('[NS-02-R11] no count on screen or in the VoiceOver string', () => {
  it('[NS-02-R11] the announcements and the row label carry no number of results', () => {
    expect(announcementFor('results', 'No letters with that word yet.')).toBe('Letters found');
    expect(announcementFor('none', 'No letters with that word yet.')).toBe('No letters with that word yet.');
    expect(announcementFor('idle', 'x')).toBeNull();
    expect(announcementFor('failed', 'x')).toBeNull();
    expect(rowLabel('Saturday, 14 October', 'She laughed at the ducks.')).toBe('Saturday, 14 October. She laughed at the ducks. Opens the letter.');
  });

  it('[NS-02-R11] the screen builds no count: no length of the results, no number word, no plural helper', () => {
    // The screens (tsx) never read the length of the results; find.logic.ts only asks whether there is any (a yes or no).
    const code = strip(read('components/find/find-mode.tsx')) + strip(read('components/find/find-result-row.tsx'));
    expect(code).not.toMatch(/\b(rows|hits|result|results)\b[\w.?]*\.length|plural\(|Intl\.NumberFormat|toLocaleString/);
    expect(code).not.toMatch(/\{[^}]*\b(count|total)\b[^}]*\}/);
    expect(strip(read('components/find/find.logic.ts'))).not.toMatch(/Letters found|\bcount\b|\btotal\b|plural\(/);
  });
});

describe('[NS-02-R21] a result row is read once', () => {
  it('[NS-02-R21] the row label ends "Opens the letter." one time and the row carries no accessibilityHint, so VoiceOver reads the sentence once (design 02 section 8)', () => {
    const label = rowLabel('Saturday, 14 October', 'She laughed at the ducks.');
    expect(label.endsWith(' Opens the letter.')).toBe(true);
    expect(label.match(/Opens the letter\./g)).toHaveLength(1);
    expect(findCopy.rowA11y.match(/Opens the letter\./g)).toHaveLength(1);
    // The Card is one VoiceOver element with one label; a hint would be read after it, so the row sets none and imports
    // nothing that holds one.
    const row = strip(read('components/find/find-result-row.tsx'));
    expect(row).toMatch(/accessibilityLabel=\{rowLabel\(datelineA11y, hit\.excerpt\.text\)\}/);
    expect(row).not.toMatch(/accessibilityHint|openHint|@\/lib\/copy/);
  });
});

describe('[NS-02-R3] no message under the minimum', () => {
  it('[NS-02-R3] below the minimum the screen draws nothing: no hint string exists and the idle view renders no element', () => {
    expect(Object.keys(findCopy)).not.toContain('hint');
    const mode = strip(read('components/find/find-mode.tsx'));
    expect(mode).not.toMatch(/findCopy\.hint/);
    expect(mode).toMatch(/view === 'idle' \? null/);
  });
});

describe('[NS-02-R13] one calm line, no prompt to write', () => {
  it('[NS-02-R13] the views are idle, results, none and failed; none shows book.empty.searchTitle and nothing else (FD-R10)', () => {
    expect(findView({ result: null, failed: false })).toBe('idle');
    expect(findView({ result: { status: 'idle' }, failed: false })).toBe('idle');
    expect(findView({ result: { status: 'done', hits: [], path: 'index' }, failed: false })).toBe('none');
    expect(findView({ result: null, failed: true })).toBe('failed');
    // The second line under the title ("Try another word.") left with spec 02 section 9: no slot, no use anywhere in Find.
    expect(Object.keys(findCopy)).not.toContain('noMatchHelp');
    for (const p of FIND_FILES) expect(strip(readFileSync(p, 'utf8')), p).not.toMatch(/noMatchHelp|Try another word/);
    const src = strip(read('components/find/find-mode.tsx'));
    const start = src.indexOf("view === 'none' ? (");
    expect(start).toBeGreaterThan(0);
    const none = src.slice(start, src.indexOf(') : (', start));
    // The no-match branch draws one Text, the existing title, and no second line, button, link or Find string.
    expect(none).toMatch(/copy\.book\.empty\.searchTitle/);
    expect(none.match(/<Text\b/g)).toHaveLength(1);
    expect(none).not.toMatch(/<Button|<Pressable|onPress|findCopy\./);
  });

  it('[NS-02-R13] Find starts nothing: it imports no capture, recorder, router push to write or Home route, and has only Cancel and Try again as buttons', () => {
    for (const p of FIND_FILES) {
      const code = strip(readFileSync(p, 'utf8'));
      expect(code, p).not.toMatch(/@\/lib\/capture|recorder|expo-audio|startRecording|router\.(navigate|push)\(\s*'\/'/i);
      expect(code, p).not.toMatch(/saveLetterFromDraft|createDraft|setTypedWordsOnce|upsert\(/);
    }
    const mode = strip(read('components/find/find-mode.tsx'));
    expect(mode.match(/<Button\b/g)).toHaveLength(2);
    expect(mode).toMatch(/findCopy\.cancel/);
    expect(mode).toMatch(/findCopy\.retry/);
  });
});

describe('[NS-02-R12] Back keeps the query', () => {
  it('[NS-02-R12] the blur that follows a result opening its letter keeps the query, once; any other blur clears it', () => {
    expect(clearOnBlur()).toBe(true); // leaving for another tab: cleared
    markOpeningLetter();
    expect(clearOnBlur()).toBe(false); // the letter page opens: the query stays for Back
    expect(clearOnBlur()).toBe(true); // Back, then leaving: cleared again; the mark is spent
  });

  it('[NS-02-R12] Find is drawn over the Book, which stays mounted, and is no route of its own, so Back returns to the same query and place', () => {
    const book = strip(read('app/(tabs)/book.tsx'));
    expect(book).toMatch(/\{finding && findOn \? <FindMode /);
    // `finding` is the state and that one render; the list under the overlay is never unmounted by it.
    expect(book.match(/\bfinding\b/g)).toHaveLength(2);
    expect(files(join(SRC, 'app'), (p) => /find/i.test(relative(SRC, p)))).toEqual([]);
    const mode = strip(read('components/find/find-mode.tsx'));
    expect(mode).toMatch(/markOpeningLetter\(\);\s*onOpen\(id\);/);
    expect(mode).toMatch(BLUR_HANDLER);
  });
});

describe('[NS-02-R14] queries are not remembered', () => {
  it('[NS-02-R14] the field turns autocorrect and spell check off and is cleared when the parent leaves the Book', () => {
    const mode = read('components/find/find-mode.tsx');
    expect(mode).toMatch(/autoCorrect=\{false\}/);
    expect(mode).toMatch(/spellCheck=\{false\}/);
    expect(strip(mode)).toMatch(BLUR_HANDLER);
  });

  it('[NS-02-R14] nothing in Find writes a setting, a file, secure storage or a list: no recent searches, no suggestions', () => {
    for (const p of FIND_FILES) {
      const code = strip(readFileSync(p, 'utf8'));
      expect(code, p).not.toMatch(/AsyncStorage|MMKV|secureStorage|SecureStore|setSetting|expo-file-system|writeFile|localStorage|recent|history|suggest/i);
    }
    // The only settings the lifecycle writes are fixed keys with fixed values, never a query.
    const life = strip(read('lib/find/lifecycle.ts'));
    for (const m of life.matchAll(/INTO settings \(key, value\) VALUES \(\?, \?\)'?,?\s*([^)]*)\)/g)) expect(m[1]).not.toMatch(/query|raw|text/i);
  });

  it('[NS-02-R14] a query typed through search leaves no trace in any table of the database', () => {
    const f = findFixture();
    try {
      f.add({ text: 'The blue boat floated.' });
      const canary = 'zqxjkcanaryword';
      searchLetters(f.db, canary, 'child-asha');
      searchLetters(f.db, 'blue boat', 'child-asha');
      const tables = f.db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'letter_search%'");
      for (const t of tables) expect(JSON.stringify(f.db.all(`SELECT * FROM "${t.name}"`)), t.name).not.toContain(canary);
      expect(f.db.all('SELECT * FROM settings').map((r) => JSON.stringify(r)).join('')).not.toMatch(/blue boat/);
    } finally {
      f.close();
    }
  });
});

describe('[NS-02-R15] the query never leaves the screen', () => {
  it('[NS-02-R15] a canary query, a hit and a forced error write nothing to any console channel', () => {
    const f = findFixture();
    const channels = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;
    const spies = channels.map((c) => vi.spyOn(console, c).mockImplementation(() => {}));
    try {
      f.add({ text: 'The zqxjkcanaryword floated.' });
      searchLetters(f.db, 'zqxjkcanaryword', 'child-asha');
      f.db.exec('DROP TABLE letter_search_rows'); // forces the index query to fail
      searchLetters(f.db, 'zqxjkcanaryword', 'child-asha');
      for (const s of spies) expect(s).not.toHaveBeenCalled();
    } finally {
      for (const s of spies) s.mockRestore();
      f.close();
    }
  });

  it('[NS-02-R15] no Find file logs, reports, tracks or builds a URL', () => {
    for (const p of FIND_FILES) {
      const code = strip(readFileSync(p, 'utf8'));
      expect(code, p).not.toMatch(/console\.|\btrack\(|analytics|Sentry|PostHog|captureException|breadcrumb|Linking|new URL|router\.(push|replace|setParams)\([^)]*(query|q=)/i);
    }
    // Opening a letter passes its id and nothing else.
    expect(strip(read('app/(tabs)/book.tsx'))).toMatch(/const open = \(id: string\) => router\.push\(\{ pathname: '\/letter\/\[id\]', params: \{ id \} \}\)/);
  });

  it('[NS-02-R15] no analytics event for Find is in the allowlist (design NAV-R12: no new event)', () => {
    const catalog = readFileSync(join(__dirname, '..', '..', '..', 'packages', 'analytics', 'src', 'catalog.ts'), 'utf8');
    expect(catalog).not.toMatch(/book_search|find_/i);
  });
});

describe('[NS-02-R22] Find makes no network call', () => {
  it('[NS-02-R22] no Find file imports a network, server or sync module', () => {
    for (const p of FIND_FILES) {
      const code = strip(readFileSync(p, 'utf8'));
      expect(code, p).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|supabase|expo-network|NetInfo|axios|@\/lib\/(sync|auth|remote|backup)|\.\.\/sync|\.\.\/auth|\.\.\/backup/);
    }
  });
  it('[NS-02-R22] the only import of the remote module is the pause, which reads the config already on the phone', () => {
    const offenders = FIND_FILES.filter((p) => /remote/.test(strip(readFileSync(p, 'utf8')))).map((p) => relative(SRC, p));
    expect(offenders).toEqual([join('lib', 'find', 'pause.ts')]);
  });

  it('[NS-02-R22] Find makes 0 network calls: the index path, the scan path and the index build touch fetch and XMLHttpRequest 0 times', () => {
    let calls = 0;
    vi.stubGlobal('fetch', () => {
      calls += 1;
      return Promise.reject(new Error('Find must not reach the network'));
    });
    vi.stubGlobal(
      'XMLHttpRequest',
      class {
        constructor() {
          calls += 1;
        }
      },
    );
    const indexed = findFixture();
    const scanned = findFixture({ index: false });
    try {
      indexed.add({ text: 'The blue boat floated past the lighthouse.' });
      scanned.add({ text: 'The blue boat floated past the lighthouse.' });
      const a = searchLetters(indexed.db, 'blue boat', 'child-asha');
      const b = searchLetters(scanned.db, 'blue boat', 'child-asha');
      expect(a.status === 'done' && a.path).toBe('index');
      expect(b.status === 'done' && b.path).toBe('scan');
      expect(a.status === 'done' && a.hits).toHaveLength(1);
      ensureSearchIndex(scanned.db);
      expect(searchLetters(scanned.db, '\u8239', 'child-asha').status).toBe('done'); // the CJK substring path
      expect(calls).toBe(0);
    } finally {
      vi.unstubAllGlobals();
      indexed.close();
      scanned.close();
    }
  });
});

describe('[NS-02-R23][FD-R13] the short-query hint is VoiceOver-only and never drawn', () => {
  it('[NS-02-R23][FD-R13] the field carries findCopy.fieldHint as its accessibilityHint and no text node renders it', () => {
    expect(typeof findCopy.fieldHint).toBe('string');
    const mode = strip(read('components/find/find-mode.tsx'));
    // Once, as the field's accessibilityHint; never as the child of a Text or any other element.
    expect(mode.match(/findCopy\.fieldHint/g)).toHaveLength(1);
    expect(mode).toMatch(/<TextField[\s\S]*?accessibilityHint=\{findCopy\.fieldHint\}[\s\S]*?\/>/);
    expect(mode).not.toMatch(/>\s*\{findCopy\.fieldHint\}/);
    expect(mode).not.toMatch(/<Text[^>]*>[\s\S]{0,40}fieldHint/);
    // TextField hands accessibilityHint to the TextInput and draws only `helper` and `error`, never the hint prop.
    const field = strip(read('components/ui/text-field.tsx'));
    expect(field).toMatch(/accessibilityHint=\{props\.accessibilityHint \?\? hint\}/);
    expect(field).not.toMatch(/\{props\.accessibilityHint\}/);
    // No other Find file mentions it, so nothing else can draw it. The idle view is still nothing (R3).
    for (const p of FIND_FILES) if (!p.endsWith('find-mode.tsx')) expect(strip(readFileSync(p, 'utf8')), p).not.toMatch(/fieldHint/);
    expect(mode).toMatch(/view === 'idle' \? null/);
  });

  it('[NS-02-R23] the hint is one sentence that names no number of results and does not claim three characters', () => {
    expect(findCopy.fieldHint).not.toMatch(/\d|\b(three|results?|matches)\b/i);
    expect(findCopy.fieldHint.match(/[.!?]/g)).toHaveLength(1);
    expect(findCopy.fieldHint.endsWith('.')).toBe(true);
  });
});

describe('[NX-31-R3] a book with no name', () => {
  it("[NS-02][NX-31-R3] the placeholder names the book through the app's fill(), so a blank name reads \"Find in your child's book\"", () => {
    expect(fill(findCopy.placeholder, { child: 'Asha' })).toBe("Find in Asha's book");
    for (const blank of ['', '   ']) expect(fill(findCopy.placeholder, { child: blank }), JSON.stringify(blank)).toBe("Find in your child's book");
    expect(strip(read('components/find/find-mode.tsx'))).toMatch(/placeholder=\{fill\(findCopy\.placeholder, \{ child: child\.name \}\)\}/);
  });
});

describe('[NS-02] Find never records audio and writes nothing to a letter', () => {
  it('[NS-02-R14] no Find source writes to entries, drafts or the Keychain, or touches the microphone', () => {
    for (const p of FIND_FILES) {
      if (p.endsWith(join('lib', 'find', 'lifecycle.ts'))) continue; // the index tables only; see find-lifecycle.test.ts
      const code = strip(readFileSync(p, 'utf8'));
      expect(code, p).not.toMatch(/(INSERT INTO|UPDATE|DELETE FROM)\s+(entries|drafts|children)\b|expo-audio|microphone|Audio\.|useAudioRecorder/i);
    }
    const life = strip(read('lib/find/lifecycle.ts'));
    expect(life).not.toMatch(/(INSERT INTO|UPDATE|DELETE FROM)\s+(entries|drafts|children)\b/);
  });
  it('[NS-02-R5] the findable view never names raw_transcript, audio, a hash or a child name', () => {
    const src = strip(read('lib/find/sources.ts'));
    const viewSql = src.slice(src.indexOf('export function searchableViewSql'));
    expect(viewSql).not.toMatch(/raw_transcript|audio|sha256|machine_edits|c\.name|author_signs_as/);
  });
});

describe('[NS-02-R19] FTS5 on the phone', () => {
  it('[NS-02-R19] expo-sqlite 57 compiles FTS5 in unless the Podfile properties turn it off, and this app never turns it off', () => {
    const podspec = readFileSync(join(__dirname, '..', '..', '..', 'node_modules', 'expo-sqlite', 'ios', 'ExpoSQLite.podspec'), 'utf8');
    expect(podspec).toMatch(/SQLITE_ENABLE_FTS5=1/);
    expect(podspec).toMatch(/expo\.sqlite\.enableFTS'\] == 'false'/);
    const config = readFileSync(join(__dirname, '..', 'app.config.ts'), 'utf8');
    expect(config).not.toMatch(/enableFTS/);
    expect(config).not.toMatch(/expo-build-properties[\s\S]{0,200}expo\.sqlite/);
  });
});
