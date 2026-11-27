/**
 * Brand, voice and v1.0-claims rules for every word on earlyletters.com. Owner: BR1.
 * Walks site.ts (sampleLetter and site, by import) and every `copy.ts`, `*-copy.ts` or `*.copy.ts`
 * under src/scenes/parts/** and src/lib/legal/** (by reading string literals, so a copy file's own
 * imports and aliases never matter; comments and import paths are ignored).
 * If a rule fails, fix the copy, not the test. Sources: packages/content/VOICE.md, CLAUDE.md,
 * docs/agents/BRIEF-2026-10-03.md, packages/content/test/rules.test.ts.
 */
import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brand } from '@scribe/brand';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { alt as ogAlt } from '../src/app/opengraph-image';
import * as siteModule from '../src/content/site';

type Leaf = { path: string; text: string; lang?: string; meta?: boolean };

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));
const COPY_ROOTS = ['src/scenes/parts', 'src/lib/legal', 'src/lib/support'];
const COPY_FILE = /(^|[-.])copy\.tsx?$/;
const META_KEYS = new Set(['lang', 'dir', 'href']);
const NON_PROSE = /^(\/|#|https?:|mailto:|ltr$|rtl$|[a-z]{2}(-[A-Za-z]{2,4})?$)/;

/** Every string in an imported value, with its path. A `text` next to a `lang` carries that language. */
function leaves(value: unknown, path: string, lang?: string, meta = false): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value, lang, meta }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`, lang, meta));
  if (value && typeof value === 'object') {
    const own = (value as { lang?: unknown }).lang;
    return Object.entries(value).flatMap(([k, v]) =>
      leaves(v, `${path}.${k}`, k === 'text' && typeof own === 'string' ? own : lang, meta || META_KEYS.has(k)),
    );
  }
  return [];
}

function listFiles(dir: string): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // the folder does not exist yet
  }
  return entries.flatMap((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

/** String literals in a TypeScript file: not comments, import paths or type-level literals. */
function fileLeaves(file: string): Leaf[] {
  const name = relative(WEB_ROOT, file);
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  const out: Leaf[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isLiteralTypeNode(node)) return;
    if (ts.isObjectLiteralExpression(node)) {
      const prop = (n: string) =>
        node.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === n);
      const lang = prop('lang')?.initializer;
      const text = prop('text')?.initializer;
      if (lang && text && ts.isStringLiteralLike(lang) && ts.isStringLiteralLike(text)) {
        out.push({ path: `${name}:${source.getLineAndCharacterOfPosition(text.getStart()).line + 1}`, text: text.text, lang: lang.text });
        node.properties.forEach((p) => {
          if (p !== prop('text')) ts.forEachChild(p, visit);
        });
        return;
      }
    }
    const isPiece =
      ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node);
    if (isPiece && node.text.trim() !== '' && node.text !== 'use client') {
      const path = `${name}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      out.push({ path, text: node.text, meta: NON_PROSE.test(node.text) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const COPY_FILES = COPY_ROOTS.flatMap((r) => listFiles(join(WEB_ROOT, r))).filter((f) => COPY_FILE.test(basename(f))).sort();

const ALL: Leaf[] = [
  ...Object.entries(siteModule).flatMap(([name, value]) => leaves(value, `site.ts:${name}`)),
  ...COPY_FILES.flatMap(fileLeaves),
];
/** Words in English, as a person reads them: no links, codes or other languages. */
const PROSE = ALL.filter((l) => !l.meta && (l.lang === undefined || l.lang === 'en'));

const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

describe('what is being checked', () => {
  // RULE: the walker sees site.ts (a shrinking leaf count means the shape changed and rules went blind).
  it('walks every string in site.ts', () => {
    const fromSite = ALL.filter((l) => l.path.startsWith('site.ts:'));
    expect(fromSite.some((l) => l.path === 'site.ts:sampleLetter.text')).toBe(true);
    expect(fromSite.some((l) => l.path === 'site.ts:site.scenes.s08.lines[0].text')).toBe(true);
    expect(fromSite.length).toBeGreaterThan(60);
  });
});

describe('characters', () => {
  // RULE: no em or en dashes (or lookalike dashes), curly or low quotes, or ellipsis characters.
  it('has no dashes, curly quotes or ellipsis characters', () => {
    expect(offenders(ALL, /[—–―‒‘’‚‛“”„‟…]/)).toEqual([]);
  });

  // RULE: no emoji, including flags, keycaps and emoji variation selectors.
  it('has no emoji', () => {
    expect(offenders(ALL, /\p{Extended_Pictographic}|[️⃣\u{1F1E6}-\u{1F1FF}]/u)).toEqual([]);
  });

  // RULE: at most one exclamation mark across the whole site.
  it('uses at most one exclamation mark site-wide', () => {
    const marked = ALL.filter((l) => /[!！]/.test(l.text)).map((l) => `${l.path}: ${l.text}`);
    const count = ALL.reduce((n, l) => n + (l.text.match(/[!！]/g)?.length ?? 0), 0);
    expect(count, marked.join('\n')).toBeLessThanOrEqual(1);
  });

  // RULE: text is NFC and has no zero-width, soft-hyphen or bidi-override characters (they break Hindi and Arabic quietly).
  it('is clean Unicode', () => {
    expect(ALL.filter((l) => l.text !== l.text.normalize('NFC')).map((l) => l.path)).toEqual([]);
    expect(offenders(ALL, /[­​﻿‪-‮⁦-⁩]/)).toEqual([]);
  });
});

describe('no fear, guilt or loss', () => {
  // RULE: no fear, guilt or loss language (packages/content/test/rules.test.ts FEAR, plus pressure and fading words).
  it('never uses fear, guilt, loss or pressure language', () => {
    const FEAR =
      /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead|passed away|when you'?re gone|if you'?re gone)\b/i;
    const PRESSURE = /\b(slips? away|fad(e|es|ed|ing)|vanish(es|ed|ing)?|disappear(s|ed|ing)?|hurry|deadline|running out|last chance|miss(ing)? out)\b/i;
    expect(offenders(PROSE, FEAR)).toEqual([]);
    expect(offenders(PROSE, PRESSURE)).toEqual([]);
  });
});

describe('no machine-writing claims', () => {
  // RULE: never imply software writes or improves anything (rules.test.ts AI list, case-insensitive except AI itself, plus a few synonyms).
  // Founder decision (2026-10): "AI" may be named, but only as something that listens, understands,
  // keeps, or is never used on your words. Any sentence naming AI must contain one of those verbs and
  // may never pair it with writing, improving or creating.
  it('names AI only as something that listens and never writes', () => {
    const named = PROSE.filter((l) => /\b(AI|A\.I\.)\b/.test(l.text));
    const bad = named.filter(
      (l) => !/\b(listen(s|ing)?|understands?|hears?|keeps?|never (used|rewrites?|adds?))\b/i.test(l.text) || /\b(writes?|writing|creates?|improves?|turns?|crafts?|tells?)\b/i.test(l.text),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    expect(
      offenders(
        PROSE,
        /\b(artificial intelligence|machine learning|LLM|GPT|chatbot|algorithms?|ghostwrit\w*|auto-?(write|writes|writing|complete)|writes? (it )?for you|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/i,
      ),
    ).toEqual([]);
  });

  // RULE: "rewrite" appears only inside a never-rewrite promise (no question exemption: a question is not a promise).
  it('mentions rewriting only to promise it never happens', () => {
    const bad = PROSE.filter(
      (l) => /\bre-?writ|\brewrote/i.test(l.text) && !/\b(never|not|don'?t|won'?t|no)\b[^.]{0,40}\bre-?writ/i.test(l.text),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('site vocabulary', () => {
  // RULE: banned site words (learn, ABC, early learning, literacy, educational, AI-written, generated, legacy, hereafter, cherish, precious, journey, unlock, seamless, magic, effortless).
  it('avoids the banned words', () => {
    const BANNED =
      /\b(learn(s|ed|ing|er|ers)?|ABC|early learning|literac(y|ies)|educat(ion|ional)|AI[- ]?(written|generated|powered)|generat(e|es|ed|ing)|legacy|hereafter|cherish(es|ed|ing)?|precious|journey(s|ed|ing)?|unlock(s|ed|ing)?|seamless(ly)?|magic(al)?|effortless(ly)?)\b/i;
    expect(offenders(PROSE, BANNED)).toEqual([]);
  });

  // RULE (claims and trust rulings, 1 Nov 2026, docs/exec-rulings-claims-trust-2026-11-01.md, Q1, Q5 and Q6): no "exactly as you
  // said it" and no "word for word" in public site copy or in the share image's alt text. The default Review view removes ums and
  // repeats and adds capitals and full stops, so a promise of exactness is not true of the words. What is true: it stays in your
  // words, every change is marked, the original recording is kept unchanged. "Never adds a word" is deliberately NOT banned: the
  // ruling kept it as true (verifyEdits rejects inserted_content_word), so do not widen this rule to it.
  // Scope: site copy and the share image alt only. The edit feature's name ("Word for word") and the Review view ("Exactly as said") are product
  // terms that live in packages/content (BRAND.md glossary, VOICE.md), which this test never reads, so they are not caught here.
  it('makes no "exactly as you said it" or "word for word" promise, in the site copy or the share image alt text', () => {
    const HELD = /\b(exactly as (you|they|i|we|it was|they were) (said|spoke|say)\b(?: it)?|exactly as said|word[\s-]+for[\s-]+word|every word exactly)/i;
    expect(offenders(PROSE, HELD)).toEqual([]);
    const alts: Leaf[] = [{ path: 'src/app/opengraph-image.ts:alt', text: ogAlt }];
    expect(offenders(alts, HELD)).toEqual([]);
    // The rule sees what it should: it catches the held phrases and leaves "never adds a word" alone.
    expect(HELD.test('Kept exactly as you said it.')).toBe(true);
    expect(HELD.test('Every word kept exactly as it was said.')).toBe(true);
    expect(HELD.test('Your letters, word for word.')).toBe(true);
    expect(HELD.test('It never adds a word, and every fix can be put back.')).toBe(false);
  });

  // RULE: the product name is spelled exactly as in packages/brand (never EarlyLetters, Early letters or early-letters) and the codename never shows.
  it('spells the brand name as packages/brand does', () => {
    const near = /\bearly[\s -]*letters?\b(?!\.(com|app))/gi;
    const wrong = PROSE.flatMap((l) => (l.text.match(near) ?? []).filter((m) => m !== brand.name).map((m) => `${l.path}: "${m}" in ${l.text}`));
    expect(wrong).toEqual([]);
    expect(offenders(ALL.filter((l) => !l.meta), /\bscribe\b/i)).toEqual([]);
  });
});

describe('the child is never gendered', () => {
  // RULE: no he, him, his or himself anywhere in English copy (other languages are skipped: "he" is a Spanish verb form).
  it('never uses he, him or his', () => {
    expect(offenders(PROSE, /\b(he|him|his|himself)\b/i)).toEqual([]);
  });

  // RULE: she and her only in an explicit allowlist of sentences where they refer to an adult.
  it('uses she and her only for adults, from an allowlist', () => {
    const ADULT_SENTENCES: { path: string; sentence: string }[] = [
      // Mama is the co-parent in the letter, an adult. The pronoun is not the child.
      { path: 'site.ts:sampleLetter.text', sentence: 'Mama pretended not to notice and then laughed so hard she had to sit down.' },
      // The same sentence inside the as-heard transcript the review scene shows.
      { path: 'site.ts:sampleLetter.heard[3].text', sentence: 'Mama pretended not to notice and then laughed so hard she had to sit down.' },
    ];
    const bad = PROSE.flatMap((l) =>
      l.text
        .split(/(?<=[.!?])\s+/)
        .filter((s) => /\b(she|her|hers|herself)\b/i.test(s))
        .filter((s) => !ADULT_SENTENCES.some((a) => a.path === l.path && a.sentence === s))
        .map((s) => `${l.path}: ${s}`),
    );
    expect(bad).toEqual([]);
  });

  // RULE: no gendered nouns for the child (girl, boy, daughter, son, princess, prince).
  it('never says girl, boy, daughter or son', () => {
    expect(offenders(PROSE, /\b(girls?|boys?|daughters?|sons?|princess(es)?|prince)\b/i)).toEqual([]);
  });
});

describe('v1.0 truth (docs/agents/BRIEF-2026-10-03.md decisions 5, 6 and 9)', () => {
  // RULE: nothing for grandparents or wider family (v1.0 is co-parent only), and no Nani, Dadi or Dada.
  it('makes no grandparent or wider-family promises', () => {
    expect(
      offenders(
        ALL.filter((l) => !l.meta),
        /\b(grandma|grandpa|grandparents?|grandmothers?|grandfathers?|nani|dadi|dada|nana|nonna|aunts?|uncles?|contributors?)\b/i,
      ),
    ).toEqual([]);
  });

  // RULE: nothing printed, no Android or Google Play (digital and iPhone only at v1.0).
  it('makes no print, Android or Google Play promises', () => {
    expect(
      offenders(
        ALL.filter((l) => !l.meta),
        /\b(printed|print(ing)? books?|print(ed)? (edition|copy|copies)|hardcover|hardback|photo books?|android|google play)\b/i,
      ),
    ).toEqual([]);
  });

  // RULE: no word highlighting and no Hindi-English code-switching (both are v1.1).
  it('makes no highlighting or code-switching promises', () => {
    expect(
      offenders(
        PROSE,
        /\b(highlight(s|ed|ing)?|hinglish|code-?switch(ing)?|bilingual|mix(ed|ing)? (two |your |both )?languages?|both in the same sentence)\b/i,
      ),
    ).toEqual([]);
  });
});

describe('s08 language lines (translations need native-speaker confirmation, see docs/web/copy/BR1-audit.md)', () => {
  const lines = siteModule.site.scenes.s08.lines;
  const SCRIPT: Record<string, RegExp> = {
    en: /^[\p{Script=Latin}\p{Script=Common}]+$/u,
    es: /^[\p{Script=Latin}\p{Script=Common}]+$/u,
    fr: /^[\p{Script=Latin}\p{Script=Common}]+$/u,
    pt: /^[\p{Script=Latin}\p{Script=Common}]+$/u,
    hi: /^[\p{Script=Devanagari}\p{Script=Common}\p{Script=Inherited}]+$/u,
    zh: /^[\p{Script=Han}\p{Script=Common}]+$/u,
    ar: /^[\p{Script=Arabic}\p{Script=Common}\p{Script=Inherited}]+$/u,
  };
  const STOP: Record<string, string> = { en: '.', es: '.', fr: '.', pt: '.', hi: '।', zh: '。', ar: '.' };

  // RULE (exec council 1 Nov 2026, D-115, D-125 item 2): until a native reviewer is on record, the page shows the English
  // line only, and neither the headline nor the support says any language is already checked.
  it('shows the English line only, and promises review before any other language', () => {
    expect(lines.map((l) => l.lang)).toEqual(['en']);
    const { headline, support } = siteModule.site.scenes.s08;
    expect(support).toMatch(/native speaker has checked/);
    expect(`${headline} ${support}`).not.toMatch(/\b(Hindi|Spanish|Mandarin|French|Arabic|Portuguese)\b/);
    expect(headline).not.toMatch(/checked|reviewed|verified/i);
  });

  // RULE: each line is in its own script, ends with its language's full stop, and is right to left only for Arabic.
  it('uses the right script, full stop and direction for each language', () => {
    for (const line of lines) {
      const l = { ...line, lang: line.lang.split('-')[0] };
      expect(l.text, `${l.lang} script`).toMatch(SCRIPT[l.lang]);
      expect(l.text.endsWith(STOP[l.lang]), `${l.lang} full stop`).toBe(true);
      expect(l.dir, `${l.lang} direction`).toBe(l.lang === 'ar' ? 'rtl' : 'ltr');
      if (l.lang === 'hi' || l.lang === 'zh') expect(l.text, `${l.lang} has no ASCII full stop`).not.toContain('.');
      if (l.lang === 'zh') expect(l.text, 'zh has no spaces').not.toMatch(/\s/);
    }
  });
});

describe('copy files', () => {
  // RULE: a file named like copy but outside the glob (Copy.ts, copy.json, strings.ts) would silently skip these rules, so it fails here.
  it('has no copy-like file the rules cannot read', () => {
    const copyLike = COPY_ROOTS.flatMap((r) => listFiles(join(WEB_ROOT, r))).filter((f) => /(copy|strings|text|words)/i.test(basename(f)));
    expect(copyLike.filter((f) => !COPY_FILE.test(basename(f))).map((f) => relative(WEB_ROOT, f))).toEqual([]);
  });
});

/**
 * The bans packages/content/test/rules.test.ts applied to the retired website copy (packages/content/src/site.en.ts and
 * pages.en.ts, which nothing rendered; BL-556 removed them). The live website words are site.ts and the copy files
 * walked above, so each of those rules now reads them here. Patterns are copied from rules.test.ts; where this file
 * already held a rule (dashes, emoji, exclamation marks, fear, AI, rewrite, he and him, son and daughter, "exactly as
 * you said it", grandparents, highlighting) it is not repeated.
 */
describe('rules carried over from the content package (BL-556)', () => {
  const WORDS = ALL.filter((l) => !l.meta);

  // RULE (C-REQ-005, PRD.md K-03): nothing promises a daily rhythm. "One day" (someday) passes.
  it('[C-REQ-005] promises no daily rhythm', () => {
    const DAILY =
      /\b(daily|nightly|every (?:single )?(?:day|night)|each (?:day|night)|(?:once|twice|one|words?|minutes?|letters?|notes?|nudges?|reminders?) (?:a|per) (?:day|night))\b/i;
    expect(offenders(PROSE, DAILY)).toEqual([]);
  });

  // RULE (LEGAL-REQ-045, App Review 2.3.8): the app is for adults; the site never presents it as for children or as
  // something a child uses alone.
  it('[LEGAL-REQ-045] has no "kids" and no child-directed phrases', () => {
    const CHILD = String.raw`(?:\b(?:kids?|child|children|toddlers?|little ones?|bab(?:y|ies))\b|\{child\})`;
    const CHILD_DIRECTED = new RegExp(
      [
        String.raw`\bkids?\b|\bkiddos?\b`,
        String.raw`\bchildren'?s app\b`,
        String.raw`\bfor (?:children|kids|babies|toddlers|little ones)\b`,
        String.raw`\b(?:child|kid|baby|toddler)-?(?:friendly|safe)\b`,
        String.raw`\bfor ages \d+`,
        String.raw`${CHILD} (?:can|could|will|gets? to|is able to|are able to) (?:tap|listen|play|use|record|explore|press|swipe)\b`,
        String.raw`${CHILD}[^.!?]{0,60}\b(?:on (?:their|his|her) own|by (?:themselves|themself|himself|herself)|(?:all )?alone)\b`,
        String.raw`\b(?:listen|play|tap|explore) alone\b`,
        String.raw`\blet (?:them|your (?:child|children|little ones?|kids?)|\{child\}) (?:listen|use|play|tap|record|explore)\b`,
      ].join('|'),
      'i',
    );
    expect(offenders(PROSE, CHILD_DIRECTED)).toEqual([]);
  });

  // RULE (K-32): digital only, no print or ordering a book. "Printable" (the PDF book) passes.
  it('[K-32] mentions no print or ordering a book', () => {
    const PRINT =
      /\b(print(?:s|ed|ing|er|ers)?|hardcover|hardback|paperback|softcover|hard ?copy|hard ?copies|photo ?books?|physical (?:book|books|copy|copies)|order (?:(?:a|your|the|more|extra) )?(?:book|books|copy|copies)|shipping|ships to|delivered to your door)\b/i;
    expect(offenders(WORDS, PRINT)).toEqual([]);
  });

  // RULE (D-060, K-13): no release is called a beta.
  it('[K-13] never says beta', () => {
    expect(offenders(WORDS, /\bbeta\b/i)).toEqual([]);
  });

  // RULE (PRD-REQ-009, K-05): any shutdown notice says 90 days.
  it('[PRD-REQ-009] every shutdown notice says 90 days', () => {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const COMPANY = String.raw`(?:\b(?:we|us|the company|the service|the app|our (?:company|service|app))\b|\{app\}|\b${escape(brand.name)}\b)`;
    const SHUT = new RegExp(
      String.raw`${COMPANY}[^.!?]{0,40}?\b(?:close|closes|closing|shut(?:s|ting)? down|wind(?:s|ing)? down|cease operations|stop(?:s|ping)? operating|discontinu\w*)\b|\b(?:shutdown|wind-down)\b`,
      'i',
    );
    const WORDS_TO_DIGITS: Record<string, string> = { seven: '7', ten: '10', fourteen: '14', thirty: '30', sixty: '60', ninety: '90' };
    const DAY_NUMBERS = /\b(\d+|seven|ten|fourteen|thirty|sixty|ninety)(?:\s*\(\d+\))?(?:-day|\s+(?:calendar\s+|business\s+)?days?)\b/gi;
    const MONTHS = /\b(\d+|one|two|three|four|six|twelve)(?:\s*\(\d+\))?(?:-month|\s+months?)\b/gi;
    const numbersIn = (text: string) => [
      ...[...text.matchAll(DAY_NUMBERS)].map((m) => WORDS_TO_DIGITS[m[1].toLowerCase()] ?? m[1]),
      ...[...text.matchAll(MONTHS)].map((m) => `${m[1]} months`),
    ];
    const bad = PROSE.filter((l) => SHUT.test(l.text) && numbersIn(l.text).some((n) => n !== '90'));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  // RULE (CR-25, BRAND.md internal terms): take, entry, draft (as nouns) and language pack stay inside.
  it('[CR-25] says no internal word: take, entry, draft or language pack', () => {
    const NUMBER_WORDS = 'two|three|four|five|six|seven|eight|nine|ten';
    const TAKE_NOUN = new RegExp(
      [
        '\\b(?:a|an|this|that|each|every|one|per)\\s+take\\b',
        '\\b(?:the|your|any)\\s+takes?\\b',
        `(?:\\b(?:these|those|many|some|all|both|several|${NUMBER_WORDS}|\\d+)|\\{count\\})\\s+takes\\b`,
        '^takes\\s+(?:that|which|may|are|were)\\b',
      ].join('|'),
      'i',
    );
    const ENTRY = /(?<!data\/)\bentr(?:y|ies)\b(?!\.json)/i;
    const DRAFT_NOUN = /\bdrafts\b|\b(?:a|an|the|your|each|this|that|any|saved|unsaved|as|in)\s+draft\b/i;
    const PACK = /\b(?:language|languages|speech|text[\s-]+rules?|rule|model)[\s-]+packs?\b/i;
    for (const re of [TAKE_NOUN, ENTRY, DRAFT_NOUN, PACK]) expect(offenders(PROSE, re), String(re)).toEqual([]);
  });

  // RULE (D-055, D-056, D-059, D-073): no claim the v1.0 build cannot keep.
  it('makes no v1.0 overclaim: mixing languages, words appearing, any language, family listening', () => {
    const V1_OVERCLAIM = /\b(vault mode|one sentence|mid-sentence|any mix|words appear|highlight|20 languages|any language|hear each other|family can (hear|listen))/i;
    expect(offenders(PROSE, V1_OVERCLAIM)).toEqual([]);
    expect(offenders(PROSE, /while the words appear/i)).toEqual([]);
  });

  // RULE (D-061): never fearful or absolute about security.
  it('never sounds fearful or absolute about security', () => {
    const FEARFUL = /\b(hack(ed|ers?|s)?|breach(es)?|leak(s|ed)?|spy(ing)?|steal|creepy|scary|don'?t worry|military[- ]grade|bank[- ]level|unhackable|completely secure|end-to-end|HIPAA)\b|100%/i;
    expect(offenders(PROSE, FEARFUL)).toEqual([]);
  });

  // RULE (BRAND.md glossary): the fixes are never tidying; a month is never a chapter; Plus is Plus; Apple Account;
  // sign-in buttons named as the providers name them; one descriptor.
  it('keeps to the BRAND.md glossary', () => {
    expect(offenders(PROSE, /\btid(y|ied|ies|ying|ier)\b|\bcleaned up\b/i)).toEqual([]);
    expect(offenders(PROSE, /\bchapters?\b/i)).toEqual([]);
    expect(offenders(PROSE, /Early Letters Plus|Book Plus|\b(Premium|Pro)\b|Plus Yearly/)).toEqual([]);
    expect(offenders(PROSE, new RegExp(`${brand.name} Plus`))).toEqual([]);
    expect(offenders(PROSE, /\bApple ID\b|\bstore account\b|\biCloud account\b/i)).toEqual([]);
    expect(offenders(PROSE, /\b(Google|Apple) sign-in\b|\b(Google|Apple) login\b|\bmagic link\b/i)).toEqual([]);
    expect(offenders(PROSE, /\bletters to your child,? in your (?:own )?voice\b/i)).toEqual([]);
  });

  // RULE (D-139, 1 Nov 2026): the old descriptor ("the baby memory book you fill by talking") is retired. The live site
  // still carries it in the three lines below; the retired copy in packages/content did not, so this rule is new to them.
  // Changing them needs new words, which BL-556 does not write. The list only shrinks: a line that is fixed must leave it.
  it('uses the retired descriptor only in the lines still listed (D-139)', () => {
    const OLD_DESCRIPTOR = /\bmemory book (?:that )?(?:you|parents) fill by talking\b/i;
    const STILL_OLD = ['site.ts:site.meta.title', 'site.ts:site.brand.line', 'site.ts:site.welcomeEmail.intro'];
    const found = PROSE.filter((l) => OLD_DESCRIPTOR.test(l.text)).map((l) => l.path);
    expect(found.filter((p) => !STILL_OLD.includes(p)), 'new lines with the retired descriptor').toEqual([]);
    expect(STILL_OLD.filter((p) => !found.includes(p)), 'fixed: remove from STILL_OLD').toEqual([]);
  });

  // RULE [BL-374] (D-082; ported from packages/content rules.test.ts by BL-556): no word a person reads keeps a promise
  // D-082 retired. The content rule read the removed site.en.ts and pages.en.ts; the live site copy is read here.
  it('[BL-374] never keeps a promise D-082 retired: "free, always", "writing stays open", "Plus is optional"', () => {
    const RETIRED_PROMISES = /free, always|writing stays open|plus is optional|first book you start is free|\bplus is off\b/i;
    for (const bad of ['The first book you start is free, always.', 'Writing stays open.', 'Plus is optional.', 'Plus is off.'])
      expect(RETIRED_PROMISES.test(bad), bad).toBe(true);
    expect(offenders(PROSE, RETIRED_PROMISES)).toEqual([]);
  });

  // RULE (BL-393, D-074; ported from packages/content rules.test.ts by BL-556): never transcription, transcribe or
  // transcript in site copy. The word names the technology and reads as if the app writes.
  it('never says transcription, transcribe or transcript (BL-393, D-074)', () => {
    expect(offenders(PROSE, /\btranscri\w*/i)).toEqual([]);
  });

  // RULE [BRAND-MOMENTS-1] (ported from packages/content rules.test.ts by BL-556): moment is a place, never a thing
  // a person makes. Same pattern as MOMENT_MADE there; "Try again in a moment." passes.
  const MOMENT_MADE =
    /\b(?:your|my|our|their|new|these|those|favou?rite|precious|special|captured|saved|shared|recent|best)\s+moments?\b|\bmoments?\s+(?:from|you|we|with|captured|saved)\b|\b\d+\s+moments\b|\b(?:capture|save|record|share|write|add|make|keep)\s+(?:a|the|this|that|every|each|your)?\s*(?:precious\s+)?moments?\b|\bphoto moments?\b/i;
  it('[BRAND-MOMENTS-1] never calls a moment a thing a person makes', () => {
    expect(offenders(PROSE, MOMENT_MADE)).toEqual([]);
    for (const bad of ['Save a moment', 'Capture every precious moment', 'Your moments']) expect(MOMENT_MADE.test(bad), bad).toBe(true);
    for (const ok of ['Try again in a moment.', 'One moment.']) expect(MOMENT_MADE.test(ok), ok).toBe(false);
  });

  // RULE (BL-556; was "never types the brand name" over packages/content/src): the brand name is never typed in
  // site copy. site.ts and the copy files take it from packages/brand (NAME), so a rename reaches every line.
  it('never types the brand name in site.ts or the copy files', () => {
    const name = new RegExp(brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const files = [fileURLToPath(new URL('../src/content/site.ts', import.meta.url)), ...COPY_FILES];
    const bad = files.flatMap(fileLeaves).filter((l) => name.test(l.text));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  // RULE (BRAND-MOMENTS-2, X1, Q-X1-12): the website does not say Moments until counsel clears the name.
  it('[BRAND-MOMENTS-2] does not say Moments', () => {
    expect(offenders(PROSE, /\bmoments\b/i)).toEqual([]);
  });

  // RULE (D-055): v1.0 public copy makes no gift, approval or contributor promise.
  it('makes no gift, approval or contributor promise', () => {
    expect(offenders(PROSE, /\bgifts?\b|\bapprov(e|es|ed|al)\b|\bcontributors?\b/i)).toEqual([]);
  });

  // RULE (claims and trust rulings, 1 Nov 2026, Q5 row 1): only the fixes the first build makes.
  it('promises no grammar fixes and no fix to any misheard word (Q5 row 1)', () => {
    expect(offenders(PROSE, /grammar|we was|misheard word/i)).toEqual([]);
  });

  // RULE: the site fills no placeholders, so a {word} would show as typed.
  it('shows no unfilled {placeholder}', () => {
    expect(offenders(PROSE, /\{\w+\}/)).toEqual([]);
  });

  // RULE: buttons stay short. A key named button or cta is a button; the keys inside `cta.live` (a badge label, a QR
  // hint and alt text) are not, so only the last key counts here.
  it('keeps buttons to 22 characters', () => {
    const buttons = ALL.filter((l) => l.path.startsWith('site.ts:') && /(button|cta)$/i.test(l.path.split('.').pop() ?? ''));
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.filter((b) => b.text.length > 22).map((b) => `${b.path}: ${b.text}`)).toEqual([]);
  });

  // RULE (claims and trust rulings Q3, D-121, D-126): the site describes the first build only. The /j invite page
  // (`site.invite`) is the one exception: its claims are listed in packages/content/test/claims-capabilities.test.ts
  // KNOWN_VIOLATIONS and BL-558 decides them. No other line may say these words.
  it('describes the first build only: no invite, sync, backup, gift or mixed languages (Q3)', () => {
    const held = /private by design|invite|grandparent|co-parent|backs up|backed up|sync|vault|cloud|gift|same sentence/i;
    const INVITE_PAGE = 'site.ts:site.invite.';
    expect(offenders(PROSE.filter((l) => !l.path.startsWith(INVITE_PAGE)), held)).toEqual([]);
    expect(PROSE.some((l) => l.path.startsWith(INVITE_PAGE) && held.test(l.text)), 'the invite page no longer says these: drop the exception').toBe(true);
  });
});
