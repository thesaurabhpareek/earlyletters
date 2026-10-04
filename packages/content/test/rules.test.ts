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
import { brand } from '../../brand/index';
import { book, emails, en, features, onboardingStories, permissions, PROMPTS, site, STORY_VISUALS, storeListing } from '../src';

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
  ...leaves(emails, 'emails'),
  ...leaves(features, 'features'),
  ...onboardingStories.flatMap((c) => [
    { path: `story.${c.id}.headline`, text: c.headline },
    { path: `story.${c.id}.line`, text: c.line },
  ]),
  ...PROMPTS.map((p) => ({ path: `prompt.${p.key}`, text: p.text })),
];
/** Everything the rules below apply to: content plus feature-local app copy. */
const EVERY: Leaf[] = [...ALL, ...APP_COPY];
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
    expect(offenders(leaves(emails, 'emails'), new RegExp(brand.name, 'i'))).toEqual([]);
    expect(offenders(leaves(features, 'features'), new RegExp(brand.name, 'i'))).toEqual([]);
  });

  it('promises only what Plus gates in v1.0 (D-053): Read together after 3 per book, more books', () => {
    const plus = [...leaves(features.billing, 'billing'), ...leaves(en.plus, 'plus'), ...leaves(storeListing, 'store')];
    expect(offenders(plus, /\b(backup|backed up|themes?|covers?|vault)\b/i).filter((o) => !/^store\.description/.test(o) || /Plus[^.]*\b(backup|theme)/i.test(o))).toEqual([]);
    expect(en.plus.promise).toMatch(/Read together/);
    expect(en.plus.promise).toMatch(/more children/);
  });

  it('has no beta wording in the store listing (D-060, App Review 2.2)', () => {
    expect(offenders(leaves(storeListing, 'store'), /\bbeta\b/i)).toEqual([]);
  });

  it('makes no claim the v1.0 build cannot keep (D-055, D-056, D-059)', () => {
    // No recording upload or backup, no mixing languages in one sentence, no word highlight.
    const V1_OVERCLAIM = /\b(vault mode|recovery key|backed up|back (them|it) up|one sentence|mid-sentence|any mix|words appear|highlight|20 languages|any language|encrypted backup)/i;
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
    expect(emails.welcome.promise).toBe(promise);
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
  it('has a subject, preview and heading for every email, and short subjects', () => {
    for (const [key, mail] of Object.entries(emails)) {
      if (key === 'common') continue;
      const m = mail as { subject: string; preview: string; heading: string; body: readonly string[] };
      expect(m.subject.length, key).toBeLessThanOrEqual(60);
      expect(m.preview.length, key).toBeLessThanOrEqual(90);
      expect(m.heading.length, key).toBeGreaterThan(0);
      expect(m.body.length, key).toBeGreaterThan(0);
    }
  });

  it('never carries a child or letter placeholder', () => {
    expect(offenders(leaves(emails, 'emails'), /\{(child|signsAs|name|letters|notes)\}/)).toEqual([]);
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
