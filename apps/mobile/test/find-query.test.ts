/// <reference types="node" />
/**
 * Find's query and excerpt rules, which need no database (NS-02-R3, R6, R7, R8, R9, R27, R34, R45), and the import scans
 * that keep every Find file off the network, the logs and analytics from its first line (R15, R22). Moved from #798's
 * find-logic.test.ts by BL-952 slice 1. Fictional Asha family only.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { foldText, ftsMatchString, matches, MIN_QUERY_CHARS, prepareQuery, snippetSource, tokenize } from '../src/lib/find/query';
import { excerpt, EXCERPT_MAX, matchRanges } from '../src/lib/find/snippet';

const SRC = join(__dirname, '..', 'src');
const strip = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}
/** Every Find source, now and in the slices that follow (components/find arrives with the screen). */
const FIND_FILES = [...files(join(SRC, 'lib', 'find')), ...files(join(SRC, 'components', 'find'))];

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

  it('[NS-02-R7][NS-02-R8] Latin accents fold and a Devanagari vowel sign does not', () => {
    expect(foldText('Caf\u00e9 Ni\u00f1o Cora\u00e7\u00e3o \u00c5ngstr\u00f6m')).toBe('cafe nino coracao angstrom');
    expect(foldText('\u0928\u093e\u0935')).toBe('\u0928\u093e\u0935');
    expect(tokenize('\u0906\u091c \u0928\u093e\u0935').map((t) => t.text)).toEqual(['\u0906\u091c', '\u0928\u093e\u0935']);
  });
});

describe('[NS-02-R45] query text is never an operator', () => {
  it('[NS-02-R45] quotes, star, OR, AND, NOT, NEAR, minus, colon and brackets become plain terms or are dropped, and every term is quoted', () => {
    expect(ftsMatchString(['blue', 'boat'])).toBe('"blue" "boat"*');
    expect(ftsMatchString(['a"b'])).toBe('"a""b"*');
    expect(prepareQuery('blue* OR NOT boat')).toEqual({ kind: 'words', terms: ['blue', 'or', 'not', 'boat'] });
    for (const raw of ['"blue boat"', 'blue AND boat', 'NEAR(blue boat)', 'blue -boat', 'body:boat', '(blue) boat*']) {
      const q = prepareQuery(raw);
      expect(q.kind, raw).toBe('words');
      if (q.kind !== 'words') continue;
      expect(q.terms.join(' '), raw).toMatch(/^[a-z ]+$/); // no operator character survives
      expect(ftsMatchString(q.terms), raw).toMatch(/^("[a-z]+"\s)*"[a-z]+"\*$/); // each term a quoted phrase
    }
  });
});

describe('[NS-02-R34] no transliteration', () => {
  it('[NS-02-R34] Hindi typed in Latin letters is found by a Latin query only; the other script never matches', () => {
    const latin = { body: 'Aaj Asha ne naav dekhi.', extra: '' };
    const deva = { body: '\u0906\u091c \u0906\u0936\u093e \u0928\u0947 \u0928\u093e\u0935 \u0926\u0947\u0916\u0940\u0964', extra: '' };
    expect(matches(prepareQuery('naav'), latin)).toBe(true);
    expect(matches(prepareQuery('\u0928\u093e\u0935'), latin)).toBe(false);
    expect(matches(prepareQuery('naav'), deva)).toBe(false);
    expect(matches(prepareQuery('\u0928\u093e\u0935'), deva)).toBe(true);
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
});

describe('[NS-02-R15][NS-02-R22][NS-02-R27] what no Find file may do', () => {
  it('[NS-02-R15] no Find file logs, reports, tracks or builds a URL', () => {
    expect(FIND_FILES.length).toBeGreaterThan(0);
    for (const p of FIND_FILES) {
      expect(strip(readFileSync(p, 'utf8')), p).not.toMatch(/console\.|\btrack\(|analytics|Sentry|PostHog|captureException|breadcrumb|Linking|new URL|router\.(push|replace|setParams)\([^)]*(query|q=)/i);
    }
  });

  it('[NS-02-R22] no Find file imports a network, server or sync module', () => {
    for (const p of FIND_FILES) {
      expect(strip(readFileSync(p, 'utf8')), p).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|supabase|expo-network|NetInfo|axios|@\/lib\/(sync|auth|remote|backup)|\.\.\/sync|\.\.\/auth|\.\.\/backup/);
    }
  });

  it('[NS-02-R27] Find suggests nothing: no spelling, correction, synonym, transliteration, "did you mean" or related letter', () => {
    for (const p of FIND_FILES) {
      expect(strip(readFileSync(p, 'utf8')), p).not.toMatch(/suggest|didYouMean|did you mean|synonym|translit|spellcheck\(|autocorrect\(|related|recent|history/i);
    }
  });
});
