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
import * as siteModule from '../src/content/site';

type Leaf = { path: string; text: string; lang?: string; meta?: boolean };

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));
const COPY_ROOTS = ['src/scenes/parts', 'src/lib/legal'];
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
    expect(fromSite.some((l) => l.path === 'site.ts:site.scenes.s08.lines[6].text')).toBe(true);
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
  it('never implies the app writes for you', () => {
    // AI may be named only in a string that also promises it never writes and says letters stay private.
    const namesAi = PROSE.filter((l) => /\b(AI|A\.I\.|artificial intelligence)\b/.test(l.text));
    const unpromised = namesAi.filter(
      (l) =>
        !(/\b(never|not|don'?t|doesn'?t|won'?t|no)\b[^.]{0,60}\bwrit/i.test(l.text) && /\b(private|privacy|on your phone|on-device)\b/i.test(l.text)),
    );
    expect(unpromised.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    expect(
      offenders(
        PROSE,
        /\b(machine learning|LLM|GPT|chatbot|algorithms?|ghostwrit\w*|auto-?(write|writes|writing|complete)|writes? (it )?for you|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/i,
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
  // RULE: banned site words (learn, ABC, early learning, literacy, educational, AI-written, generated, legacy, hereafter, precious, unlock, seamless, magic, effortless).
  it('avoids the banned words', () => {
    const BANNED =
      /\b(learn(s|ed|ing|er|ers)?|ABC|early learning|literac(y|ies)|educat(ion|ional)|AI[- ]?(written|generated|powered)|generat(e|es|ed|ing)|legacy|hereafter|precious|unlock(s|ed|ing)?|seamless(ly)?|magic(al)?|effortless(ly)?)\b/i;
    expect(offenders(PROSE, BANNED)).toEqual([]);
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

  // RULE: exactly the seven v1.0 languages (BRIEF decision 6), in the order the support line names them.
  it('lists the seven v1.0 languages, in order, and the support line names them', () => {
    // Primary subtag only: lang may carry a script or region (zh-Hans, pt-BR).
    expect(lines.map((l) => l.lang.split('-')[0])).toEqual(['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt']);
    const names = lines.map((l) => l.name);
    expect(siteModule.site.scenes.s08.support).toContain(`${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
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
