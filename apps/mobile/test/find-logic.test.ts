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
import { announcementFor, findView, rowLabel, segments } from '../src/components/find/find.logic';
import { findPaused, findSurface, parseBookSearchFlag } from '../src/lib/find/flag';
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
    expect(prepareQuery('船')).toEqual({ kind: 'substring', terms: ['船'] });
    expect(prepareQuery('小船 笑')).toEqual({ kind: 'substring', terms: ['小船', '笑'] });
    expect(prepareQuery('ひ')).toEqual({ kind: 'substring', terms: ['ひ'] });
    expect(prepareQuery('한')).toEqual({ kind: 'substring', terms: ['한'] });
    expect(matches(prepareQuery('船'), { body: '我们看到了一只小船', extra: '' })).toBe(true);
    expect(matches(prepareQuery('舟'), { body: '我们看到了一只小船', extra: '' })).toBe(false);
  });
});

describe('[NS-02-R6] the words rule, as the scan reads it', () => {
  it('[NS-02-R6] every term, any order, last as a prefix, case and Latin accents folded', () => {
    const row = { body: 'Un café avec maman, puis les canards.', extra: '' };
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
    expect(foldText('Café Niño Coração Ångström')).toBe('cafe nino coracao angstrom');
    expect(foldText('नाव')).toBe('नाव');
    expect(tokenize('आज नाव').map((t) => t.text)).toEqual(['आज', 'नाव']);
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
  const WORDS = ['laughed', 'rain', 'blue', 'boat', 'café', 'niño', 'duck', 'park', 'hat', 'Asha', 'kite', 'song', 'bath', 'milk', 'slept', 'clapped', 'stairs', 'garden', 'moon', 'Papa'];
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
      expect(e.text, label).not.toMatch(/[…–—]/);
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
    const text = '𠀀'.repeat(150) + '船' + '𠀀'.repeat(150);
    const e = excerpt(prepareQuery('船'), text);
    expect(text.includes(e.text)).toBe(true);
    expect(e.text).toContain('船');
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

describe('[NS-02-R3] no message under the minimum', () => {
  it('[NS-02-R3] below the minimum the screen draws nothing: no hint string exists and the idle view renders no element', () => {
    expect(Object.keys(findCopy)).not.toContain('hint');
    const mode = strip(read('components/find/find-mode.tsx'));
    expect(mode).not.toMatch(/findCopy\.hint/);
    expect(mode).toMatch(/view === 'idle' \? null/);
  });
});

describe('[NS-02-R13] one calm line, no prompt to write', () => {
  it('[NS-02-R13] the views are idle, results, none and failed; none shows the existing title and one quiet line', () => {
    expect(findView({ result: null, failed: false })).toBe('idle');
    expect(findView({ result: { status: 'idle' }, failed: false })).toBe('idle');
    expect(findView({ result: { status: 'done', hits: [], path: 'index' }, failed: false })).toBe('none');
    expect(findView({ result: null, failed: true })).toBe('failed');
    const src = strip(read('components/find/find-mode.tsx'));
    expect(src).toMatch(/copy\.book\.empty\.searchTitle/);
    expect(src).toMatch(/findCopy\.noMatchHelp/);
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

describe('[NS-02-R14] queries are not remembered', () => {
  it('[NS-02-R14] the field turns autocorrect and spell check off and is cleared when the parent leaves the Book', () => {
    const mode = read('components/find/find-mode.tsx');
    expect(mode).toMatch(/autoCorrect=\{false\}/);
    expect(mode).toMatch(/spellCheck=\{false\}/);
    expect(mode).toMatch(/addListener\('blur'/);
    expect(mode).toMatch(/setQuery\(''\)/);
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
