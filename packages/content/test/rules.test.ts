/**
 * Brand and voice rules, enforced on every word the product says.
 * See VOICE.md. If a test here fails, fix the copy, not the test.
 *
 * Also scans feature-local copy files in the app (`apps/mobile/src/**` files
 * named `copy.ts`, `*-copy.ts` or `*.copy.ts`): every string literal in them is
 * product copy and obeys the same rules.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
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
  features,
  lifecycleEmails,
  onboardingStories,
  pages,
  permissions,
  PROMPTS,
  site,
  STORY_VISUALS,
  storeListing,
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

// ---------------------------------------------------------------------------
// Feature-local copy files in the app
// ---------------------------------------------------------------------------

const REPO = join(__dirname, '..', '..', '..');
const APP_SRC = join(REPO, 'apps', 'mobile', 'src');
const COPY_FILE = /^(copy|.+[.-]copy)\.ts$/;

function copyFiles(dir: string): string[] {
  let names: string[] = [];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    const full = join(dir, name);
    if (name === 'node_modules' || name.startsWith('.')) return [];
    if (statSync(full).isDirectory()) return copyFiles(full);
    return COPY_FILE.test(name) ? [full] : [];
  });
}

/** String literals that are values (not imports, types, keys or `require` paths). */
function stringsIn(file: string): Leaf[] {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const out: Leaf[] = [];
  const where = (n: ts.Node) => `${relative(REPO, file)}:${source.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return;
    const parent = node.parent;
    const isKey =
      parent &&
      ((ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) ||
        (ts.isCallExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === 'require'));
    if (!isKey && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
      out.push({ path: where(node), text: node.text });
    } else if (ts.isTemplateExpression(node)) {
      out.push({ path: where(node), text: [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(' ') });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const APP_COPY_FILES = copyFiles(APP_SRC);
const APP_COPY: Leaf[] = APP_COPY_FILES.flatMap(stringsIn);

const ALL: Leaf[] = [
  ...leaves(en, 'en'),
  ...leaves(storeListing, 'store'),
  ...leaves(site, 'site'),
  ...leaves(book, 'book'),
  ...leaves(permissions, 'permissions'),
  ...leaves(features, 'features'),
  ...leaves(pages, 'pages'),
  ...onboardingStories.flatMap((c) => [
    { path: `story.${c.id}.headline`, text: c.headline },
    { path: `story.${c.id}.line`, text: c.line },
  ]),
  ...PROMPTS.map((p) => ({ path: `prompt.${p.key}`, text: p.text })),
];
/** Every email word (packages/content/src/emails): the catalog groups, the chrome and the legal lines. */
const EMAIL: Leaf[] = leaves(
  { authEmails, accountEmails, billingEmails, familyEmails, lifecycleEmails, emailChrome, emailLegal },
  'email',
);
/** Everything the rules below apply to: content, email copy and feature-local app copy. */
const EVERY: Leaf[] = [...ALL, ...EMAIL, ...APP_COPY];
/** What the public reads before installing: the store listing and the website. */
const PUBLIC: Leaf[] = [...leaves(storeListing, 'store'), ...leaves(site, 'site'), ...leaves(pages, 'pages')];
const DOCS = ['VOICE.md', 'BRAND.md'].map((f) => ({ path: f, text: readFileSync(join(__dirname, '..', f), 'utf8') }));

const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

describe('characters', () => {
  it('has no em dashes, en dashes, curly quotes or ellipsis characters', () => {
    expect(offenders([...EVERY, ...DOCS], /[—–‘’“”…]/)).toEqual([]);
  });

  it('has no emoji', () => {
    expect(offenders([...EVERY, ...DOCS], /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('uses at most 3 exclamation marks across all product copy', () => {
    const count = EVERY.reduce((n, l) => n + (l.text.match(/!/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(3);
  });
});

describe('no fear, guilt or loss', () => {
  const FEAR = /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead|passed away|when you'?re gone|if you'?re gone)\b/i;
  it('never uses fear, guilt or loss-aversion language', () => {
    expect(offenders(EVERY, FEAR)).toEqual([]);
  });
});

describe('no AI-writing claims', () => {
  const AI = /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/;
  it('never implies the app writes for you', () => {
    expect(offenders(EVERY, AI)).toEqual([]);
  });

  it('only mentions rewriting to promise it never happens', () => {
    // A question ("Do you rewrite my words?") is fine; its answer must be a no.
    const bad = EVERY.filter(
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
    // a, b: two names joined; minutes, seconds: elapsed time; letters, notes: counted phrases;
    // app: the public name, filled from packages/brand (never typed in in-app copy);
    // version, build: the app version row; date, reference, days, email: transactional emails;
    // label, duration, elapsed, total: player VoiceOver; size, percent: downloads; format: export
    // readme; cancelBy: trial end; coParent: deletion summary.
    const allowed = new Set([
      'child', 'name', 'signsAs', 'count', 'month', 'weekday', 'year', 'inviter', 'price', 'n',
      'a', 'b', 'minutes', 'seconds', 'letters', 'notes', 'app', 'version', 'build',
      'date', 'reference', 'days', 'email', 'label', 'duration', 'elapsed', 'total', 'size',
      'percent', 'format', 'cancelBy', 'coParent',
    ]);
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
    const n = [...leaves(en.notifications, 'notifications'), ...leaves(features.reminders.neutral, 'reminders.neutral'), ...leaves(features.reminders.together, 'reminders.together')];
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

describe('brand name and v1.0 claims', () => {
  it('never types the public name in in-app copy; uses {app} from packages/brand', () => {
    expect(offenders(leaves(en, 'en'), new RegExp(brand.name, 'i'))).toEqual([]);
    expect(offenders(leaves(permissions, 'permissions'), new RegExp(brand.name, 'i'))).toEqual([]);
    expect(offenders(APP_COPY, new RegExp(brand.name, 'i'))).toEqual([]);
    // Emails are rendered by packages/emails, not the app, so they build the name from `brand` in template
    // literals (D-076); 'never types the brand name in packages/content/src' below checks their source.
    expect(offenders(leaves(features, 'features'), new RegExp(brand.name, 'i'))).toEqual([]);
  });

  // D-073 (founder, 3 Oct 2026, evening) puts the owner's encrypted backup in v1.0 and in Plus, so backup is
  // no longer an overclaim here. Themes, covers and vault mode still are.
  it('promises only what Plus gates in v1.0 (D-053, D-073): backup, Read together after 3 per book, more books', () => {
    const plus = [...leaves(features.billing, 'billing'), ...leaves(en.plus, 'plus'), ...leaves(storeListing, 'store')];
    expect(offenders(plus, /\b(themes?|covers?|vault)\b/i).filter((o) => !/^store\.description/.test(o) || /Plus[^.]*\btheme/i.test(o))).toEqual([]);
    expect(en.plus.promise).toMatch(/backup/);
    expect(en.plus.promise).toMatch(/Read together/);
    expect(en.plus.promise).toMatch(/more children/);
  });

  it('has no beta wording in the store listing (D-060, App Review 2.2)', () => {
    expect(offenders(leaves(storeListing, 'store'), /\bbeta\b/i)).toEqual([]);
  });

  it('makes no claim the v1.0 build cannot keep (D-055, D-056, D-059, D-073)', () => {
    // No mixing languages in one sentence, no word highlight, no family listening. Owner-only encrypted backup
    // ships in v1.0 (D-073 supersedes D-059's "no audio upload"), so backup wording is no longer blocked here.
    const V1_OVERCLAIM = /\b(vault mode|one sentence|mid-sentence|any mix|words appear|highlight|20 languages|any language|hear each other|family can (hear|listen))/i;
    expect(offenders([...leaves(storeListing, 'store'), ...leaves(site, 'site')], V1_OVERCLAIM)).toEqual([]);
    // Family at launch is the co-parent only: the listing never promises grandparents or a web page.
    const FAMILY = /\b(grandparents?|nani|dadi|aunts?|uncles?|no app needed|from the web|web page)\b/i;
    expect(offenders([...leaves(storeListing, 'store'), ...onboardingStories.map((c) => ({ path: c.id, text: `${c.headline} ${c.line}` }))], FAMILY)).toEqual([]);
  });

  it('names the seven v1.0 languages in the store listing (D-056)', () => {
    for (const lang of ['English', 'Hindi', 'Spanish', 'Mandarin Chinese', 'French', 'Arabic', 'Portuguese']) {
      expect(storeListing.description, lang).toContain(lang);
    }
  });

  it('points the store listing at the live legal pages (D-063)', () => {
    expect(storeListing.description).toContain(brand.web.terms);
    expect(storeListing.description).toContain(brand.web.privacy);
  });
});

describe('privacy reassurance (D-061)', () => {
  it('says the promise word for word wherever it appears', () => {
    const promise = en.trust.promise;
    expect(en.trust.settings.body).toBe(promise);
    expect(authEmails.welcome.body).toContain(promise);
    // Any email line that states the promise states it word for word.
    const stated = EMAIL.filter((l) => /never sell|never use them for ads|train machine learning/i.test(l.text));
    expect(stated.length).toBeGreaterThan(0);
    for (const l of stated) expect(l.text, l.path).toBe(promise);
    expect(site.privacy.lead).toBe(promise);
    expect(storeListing.description).toContain(promise);
    expect(en.trust.settings.voice).toBe(en.trust.voice);
    expect(storeListing.description).toContain(en.trust.voice);
  });

  it('never sounds fearful or absolute about security', () => {
    const FEARFUL = /\b(hack(ed|ers?|s)?|breach(es)?|leak(s|ed)?|spy(ing)?|steal|creepy|scary|don'?t worry|military[- ]grade|bank[- ]level|unhackable|completely secure|end-to-end|HIPAA)\b|100%/i;
    expect(offenders(EVERY, FEARFUL)).toEqual([]);
  });

  it('keeps each reassurance to one or two short sentences', () => {
    const lines = [...leaves(en.trust, 'trust'), ...onboardingStories.map((c) => ({ path: c.id, text: c.line }))];
    for (const l of lines) {
      expect((l.text.match(/[.!?](\s|$)/g) ?? []).length, l.path).toBeLessThanOrEqual(2);
      expect(l.text.length, l.path).toBeLessThanOrEqual(160);
    }
  });
});

describe('licences', () => {
  it('carries every language pack attribution word for word', () => {
    const dir = join(REPO, 'packs', 'text-rules');
    const needed = readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => (JSON.parse(readFileSync(join(dir, f), 'utf8')).attribution ?? []) as string[]);
    expect(needed.length).toBeGreaterThan(0);
    for (const line of needed) expect(features.licences.packs).toContain(line);
  });
});

describe('onboarding story cards (server fallback, D-066)', () => {
  it('fits the story block schema in packages/api', () => {
    const ids = new Set<string>();
    onboardingStories.forEach((c, i) => {
      expect(c.type).toBe('story');
      expect(c.id).toMatch(/^story\.[a-z-]+\.v\d+$/);
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(c.order).toBe(i + 1);
      expect(c.headline.length, c.id).toBeLessThanOrEqual(80);
      expect(c.line.length, c.id).toBeLessThanOrEqual(200);
      expect(STORY_VISUALS).toContain(c.visual);
      for (const m of `${c.headline} ${c.line}`.matchAll(/\{(\w+)\}/g)) expect(['child', 'app', 'signsAs']).toContain(m[1]);
    });
  });
});

describe('emails', () => {
  const MAILS = [authEmails, accountEmails, billingEmails, familyEmails, lifecycleEmails].flatMap((g) => Object.values(g));

  it('has a subject, preview and heading for every email, and short subjects', () => {
    expect(MAILS.length).toBeGreaterThan(0);
    for (const m of MAILS) {
      expect(m.subject.length, m.id).toBeLessThanOrEqual(60);
      expect(m.preheader.length, m.id).toBeLessThanOrEqual(90);
      expect(m.heading.length, m.id).toBeGreaterThan(0);
      expect(m.body.length, m.id).toBeGreaterThan(0);
    }
  });

  it('never carries a child or letter placeholder', () => {
    expect(offenders(EMAIL, /\{(child|signsAs|name|letters|notes)\}/)).toEqual([]);
  });
});

describe('store listing document (docs/store/app-store.md)', () => {
  const doc = readFileSync(join(REPO, 'docs', 'store', 'app-store.md'), 'utf8');
  it('matches packages/content word for word (run scripts/brand/store-listing.ts)', () => {
    for (const field of [storeListing.appName, storeListing.subtitle, storeListing.promotionalText, storeListing.keywords, storeListing.whatsNewV1, storeListing.description]) {
      expect(doc).toContain(field);
    }
    for (const c of storeListing.screenshotCaptions) expect(doc).toContain(c);
  });

  it('keeps captions short enough for a frame', () => {
    for (const s of storeListing.screenshots) {
      expect(s.caption.length, s.id).toBeLessThanOrEqual(40);
      expect(s.subline.length, s.id).toBeLessThanOrEqual(60);
    }
  });
});

describe('feature-local app copy files', () => {
  it('finds the app copy files it checks', () => {
    const names = APP_COPY_FILES.map((f) => basename(f));
    expect(names).toContain('copy.ts');
    expect(names).toContain('permission-copy.ts');
  });

  it('keeps the build-time permission string identical to packages/content', () => {
    const file = APP_COPY_FILES.find((f) => basename(f) === 'permission-copy.ts');
    expect(file).toBeDefined();
    const texts = stringsIn(file!).map((l) => l.text);
    expect(texts).toContain(permissions.microphone);
  });
});

describe('support resources (D-034)', () => {
  it('dials digits only and names each line', () => {
    for (const r of en.struggling.resources) {
      expect(r.tel).toMatch(/^\d{3,11}$/);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.how).toContain(r.tel.length === 3 ? r.tel : r.tel.slice(-4));
    }
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
    // In-app copy carries {app}, filled from packages/brand when the app loads it (apps/mobile/src/lib/copy.ts).
    expect(en.app.name.replaceAll('{app}', brand.name)).toBe(brand.name);
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
    expect(offenders(PUBLIC, /\bgifts?\b|\bapprov(e|es|ed|al)\b|\bcontributors?\b/i)).toEqual([]);
    // D-055: other family may be named on the website only as "coming in a later update" (or asked about in an
    // FAQ question whose answer says so), never as a v1.0 feature.
    const later = /\b(later update|not yet|coming)\b/i;
    const family = PUBLIC.filter((l) => /\bgrandparents?\b|\baunts?\b|\buncles?\b/i.test(l.text) && !(l.path.startsWith('site.') && (later.test(l.text) || l.text.trim().endsWith('?'))));
    expect(family.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
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
    expect(en.app.oneLine.replaceAll('{app}', brand.name)).toBe(`${brand.name}, the baby memory book you fill by talking.`);
    expect(offenders(COPY, /\bthe memory book you fill by talking\b/i)).toEqual([]);
  });
});
