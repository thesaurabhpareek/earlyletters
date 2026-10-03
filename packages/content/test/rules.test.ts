/**
 * Brand and voice rules, enforced on every word the product says.
 * See VOICE.md. If a test here fails, fix the copy, not the test.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import {
  accountEmails,
  authEmails,
  billingEmails,
  book,
  emailChrome,
  emailLegal,
  en,
  familyEmails,
  lifecycleEmails,
  PROMPTS,
  site,
  storeListing,
  pages,
} from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

const ALL: Leaf[] = [
  ...leaves(en, 'en'),
  ...leaves(storeListing, 'store'),
  ...leaves(site, 'site'),
  ...leaves(book, 'book'),
  ...leaves(pages, 'pages'),
  ...PROMPTS.map((p) => ({ path: `prompt.${p.key}`, text: p.text })),
];
const EMAIL: Leaf[] = leaves(
  { authEmails, accountEmails, billingEmails, familyEmails, lifecycleEmails, emailChrome, emailLegal },
  'email',
);
const PUBLIC: Leaf[] = [...leaves(storeListing, 'store'), ...leaves(site, 'site'), ...leaves(pages, 'pages')];
const DOCS = ['VOICE.md', 'BRAND.md'].map((f) => ({ path: f, text: readFileSync(join(__dirname, '..', f), 'utf8') }));

const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

describe('characters', () => {
  it('has no em dashes, en dashes, curly quotes or ellipsis characters', () => {
    expect(offenders([...ALL, ...DOCS], /[—–‘’“”…]/)).toEqual([]);
  });

  it('has no emoji', () => {
    expect(offenders([...ALL, ...DOCS], /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('uses at most 3 exclamation marks across all product copy', () => {
    const count = ALL.reduce((n, l) => n + (l.text.match(/!/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(3);
  });
});

describe('no fear, guilt or loss', () => {
  const FEAR = /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead|passed away|when you'?re gone|if you'?re gone)\b/i;
  it('never uses fear, guilt or loss-aversion language', () => {
    expect(offenders(ALL, FEAR)).toEqual([]);
  });
});

describe('no AI-writing claims', () => {
  const AI = /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/;
  it('never implies the app writes for you', () => {
    expect(offenders(ALL, AI)).toEqual([]);
  });

  it('only mentions rewriting to promise it never happens', () => {
    // A question ("Do you rewrite my words?") is fine; its answer must be a no.
    const bad = ALL.filter(
      (l) =>
        /\brewrit/i.test(l.text) &&
        !l.text.trim().endsWith('?') &&
        !/\b(never|not|don'?t|won'?t|no)\b[^.]{0,40}\brewrit/i.test(l.text),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('prompts', () => {
  it('has at least 90 prompts with unique, stable keys', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(90);
    expect(new Set(PROMPTS.map((p) => p.key)).size).toBe(PROMPTS.length);
  });

  it('covers every kind and every age band', () => {
    for (const kind of ['opening', 'gap', 'hard', 'family', 'together']) {
      expect(PROMPTS.some((p) => p.kind === kind), kind).toBe(true);
    }
    for (const band of ['0-3', '4-6', '7-9', '10-12', '13-18', '19-24', '25-36', '37-60']) {
      expect(PROMPTS.some((p) => p.band === band), band).toBe(true);
    }
  });

  it('never genders the child and never audits the parent', () => {
    expect(offenders(PROMPTS.map((p) => ({ path: p.key, text: p.text })), /\b(she|he|her|him|his|hers)\b/i)).toEqual([]);
    expect(offenders(PROMPTS.map((p) => ({ path: p.key, text: p.text })), /\b(differently|should have|could have|better parent)\b/i)).toEqual([]);
  });

  it('gap prompts never mention time away', () => {
    const gap = PROMPTS.filter((p) => p.kind === 'gap').map((p) => ({ path: p.key, text: p.text }));
    expect(offenders(gap, /\b(miss(ed)?|away|gap|haven'?t|been a while|last time|absence|break)\b/i)).toEqual([]);
  });

  it('uses only known placeholders', () => {
    const allowed = new Set(['child', 'name', 'signsAs', 'count', 'month', 'weekday', 'year', 'inviter', 'price', 'n']);
    const unknown = ALL.flatMap((l) => [...l.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1])).filter((p) => !allowed.has(p));
    expect([...new Set(unknown)]).toEqual([]);
  });
});

describe('length limits', () => {
  it('App Store fields fit Apple limits', () => {
    expect(storeListing.appName.length).toBeLessThanOrEqual(30);
    expect(storeListing.subtitle.length).toBeLessThanOrEqual(30);
    expect(storeListing.promotionalText.length).toBeLessThanOrEqual(170);
    expect(storeListing.keywords.length).toBeLessThanOrEqual(100);
    expect(storeListing.keywords).not.toMatch(/\s/);
    expect(storeListing.description.length).toBeGreaterThanOrEqual(1500);
    expect(storeListing.description.length).toBeLessThanOrEqual(4000);
  });

  it('keywords do not repeat words from the name or subtitle', () => {
    const used = new Set(`${storeListing.appName} ${storeListing.subtitle}`.toLowerCase().match(/[a-z]+/g));
    expect(storeListing.keywords.split(',').filter((k) => used.has(k.toLowerCase()))).toEqual([]);
  });

  it('notifications fit on a lock screen', () => {
    const n = leaves(en.notifications, 'notifications');
    for (const l of n) {
      const limit = /title/i.test(l.path) ? 40 : 110;
      expect(l.text.length, l.path).toBeLessThanOrEqual(limit);
    }
  });

  it('buttons stay short', () => {
    const buttons = ALL.filter((l) => /(button|cta|Button|Cta)$/.test(l.path) || /\.(cta|button)\b/i.test(l.path));
    for (const b of buttons) expect(b.text.length, b.path).toBeLessThanOrEqual(22);
  });
});

describe('save failure reassurance', () => {
  it('tells people their words are safe on the phone', () => {
    expect(JSON.stringify(en.errors)).toMatch(/safe on this phone/i);
  });
});

describe('brand name comes from packages/brand', () => {
  // CLAUDE.md: the public name lives only in packages/brand. Copy uses `${brand.name}` (and friends), so a
  // rename is one edit. Comments may name the product; string literals and template text may not.
  const SRC = join(__dirname, '..', 'src');
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? files(join(dir, d.name)) : /\.tsx?$/.test(d.name) ? [join(dir, d.name)] : [],
    );

  /** Text of every string literal and template chunk in a file (comments are not tokens, so they are skipped). */
  function literalText(file: string): Leaf[] {
    const text = readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest);
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
    const out: Leaf[] = [];
    const STRINGY = new Set([
      ts.SyntaxKind.StringLiteral,
      ts.SyntaxKind.NoSubstitutionTemplateLiteral,
      ts.SyntaxKind.TemplateHead,
      ts.SyntaxKind.TemplateMiddle,
      ts.SyntaxKind.TemplateTail,
    ]);
    let depth = 0; // brace depth inside template substitutions
    const stack: number[] = [];
    for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
      if (kind === ts.SyntaxKind.OpenBraceToken) depth++;
      if (kind === ts.SyntaxKind.CloseBraceToken) {
        if (stack.length && stack[stack.length - 1] === depth) {
          kind = scanner.reScanTemplateToken(false);
          if (kind === ts.SyntaxKind.TemplateTail) stack.pop();
        } else depth--;
      }
      if (kind === ts.SyntaxKind.TemplateHead) stack.push(depth);
      if (STRINGY.has(kind)) {
        const line = ts.getLineAndCharacterOfPosition(source, scanner.getTokenStart()).line;
        out.push({ path: `${relative(SRC, file)}:${line + 1}`, text: scanner.getTokenValue() });
      }
    }
    return out;
  }

  it('never types the brand name in packages/content/src', () => {
    const name = new RegExp(brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const bad = files(SRC).flatMap(literalText).filter((l) => name.test(l.text));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('still renders the brand name where copy names the product', () => {
    expect(en.app.name).toBe(brand.name);
    expect(storeListing.appName).toBe(brand.storeName);
    expect(emailChrome.signature).toBe(`Warmly,\n${brand.name}`);
  });
});

describe('glossary (BRAND.md)', () => {
  const COPY = [...ALL, ...EMAIL];

  it('calls the edit feature Word for word, never tidying', () => {
    expect(offenders(COPY, /\btid(y|ied|ies|ying|ier)\b|\bcleaned up\b/i)).toEqual([]);
  });

  it('names the subscription Plus only', () => {
    expect(offenders(COPY, /Early Letters Plus|Book Plus|\b(Premium|Pro)\b|Plus Yearly/)).toEqual([]);
    expect(offenders(COPY, new RegExp(`${brand.name} Plus`))).toEqual([]);
  });

  it('says Apple Account, never Apple ID or store account', () => {
    expect(offenders(COPY, /\bApple ID\b|\bstore account\b|\biCloud account\b/i)).toEqual([]);
  });

  it('never calls a release a beta in store or website copy', () => {
    expect(offenders(PUBLIC, /\bbeta\b/i)).toEqual([]);
    expect(Object.keys(storeListing)).not.toContain('promotionalTextBeta');
  });

  it('keeps v1.0 public copy to the co-parent, with no gift or approval promises', () => {
    expect(offenders(PUBLIC, /\bgrandparents?\b|\bgifts?\b|\bapprov(e|es|ed|al)\b|\bcontributors?\b|\baunts?\b|\buncles?\b/i)).toEqual([]);
  });

  it('makes no Hindi-English mixing or word highlighting claims (v1.1)', () => {
    const COMMS = [...PUBLIC, ...EMAIL];
    expect(offenders(COMMS, /\bboth in (one|the same) sentence\b|\bmid-sentence\b|\bhighlight/i)).toEqual([]);
    expect(offenders(COMMS, /while the words appear/i)).toEqual([]);
  });

  it('uses "note" only for something people make, never for what we send', () => {
    expect(offenders(EMAIL, /\bnotes?\b/i)).toEqual([]);
  });

  it('names the sign-in buttons as the providers do', () => {
    expect(offenders(COPY, /\b(Google|Apple) sign-in\b|\b(Google|Apple) login\b|\bmagic link\b/i)).toEqual([]);
  });

  it('uses one descriptor', () => {
    expect(en.app.oneLine).toBe(`${brand.name}, the baby memory book you fill by talking.`);
    expect(offenders(COPY, /\bthe memory book you fill by talking\b/i)).toEqual([]);
  });
});
