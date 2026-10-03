/**
 * Brand and voice rules, enforced on every word the product says.
 * See VOICE.md. If a test here fails, fix the copy, not the test.
 * A title that starts with an id in brackets proves that requirement (BACKLOG Definition of Done 1).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { book, en, PROMPTS, site, storeListing } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

// Surfaces. IN_APP is the iOS app; IN_APP plus STORE is everything Apple reviews as "app or metadata".
const IN_APP = leaves(en, 'en');
const STORE = leaves(storeListing, 'store');
const SITE = leaves(site, 'site');
const BOOK = leaves(book, 'book');
const PROMPT_LEAVES = PROMPTS.map((p) => ({ path: `prompt.${p.key}`, text: p.text }));
const ALL: Leaf[] = [...IN_APP, ...STORE, ...SITE, ...BOOK, ...PROMPT_LEAVES];
const DOCS = ['VOICE.md', 'BRAND.md'].map((f) => ({ path: f, text: readFileSync(join(__dirname, '..', f), 'utf8') }));

const offenders = (items: Leaf[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

describe('characters', () => {
  it('has no em dashes, en dashes, curly quotes or ellipsis characters', () => {
    expect(offenders([...ALL, ...DOCS], /[—–‘’“”…]/)).toEqual([]);
  });

  it('has no emoji', () => {
    expect(offenders([...ALL, ...DOCS], /\p{Extended_Pictographic}/u)).toEqual([]);
  });

  // Per surface, so one surface's addition never fails another's (TDD 07 Q-17). The budgets add up to
  // the old global ceiling of 3. Notifications get none: a template is sent again and again, and
  // VOICE.md allows at most one exclamation mark a month across all notifications.
  it('keeps exclamation marks rare, within a budget per surface', () => {
    const count = (items: Leaf[]) => items.reduce((n, l) => n + (l.text.match(/!/g)?.length ?? 0), 0);
    const isNotification = (l: Leaf) => l.path.startsWith('en.notifications.');
    const used = {
      notifications: count(IN_APP.filter(isNotification)),
      inApp: count(IN_APP.filter((l) => !isNotification(l))),
      store: count(STORE),
      site: count(SITE),
      book: count(BOOK),
      prompts: count(PROMPT_LEAVES),
    };
    const budget = { notifications: 0, inApp: 2, store: 0, site: 1, book: 0, prompts: 0 };
    for (const surface of Object.keys(budget) as (keyof typeof budget)[]) {
      expect(used[surface], surface).toBeLessThanOrEqual(budget[surface]);
    }
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

// BL-118 rules (TDD 07 section 6). Each one guards a decision that copy alone cannot keep.

describe('no daily rhythm, streaks or gap counts', () => {
  // Reminders default to a few evenings a week; no string may promise or imply a daily rhythm (PRD.md K-03).
  const DAILY = /\b(daily|every day|each day|(?:once|twice|words?|minutes?|letters?|notes?|nudges?|reminders?) a day)\b/i;
  // Anything that reminds, notifies or celebrates.
  const RHYTHM_SCOPE = IN_APP.filter((l) => /^en\.(notifications|moments)\./.test(l.path) || /remind/i.test(l.path));
  const GAP = /\b(in a row|missed|miss(?:es|ing)? (?:a|one|any)|since (?:your|the) last|streaks?|(?:days?|nights?|weeks?) since|(?:days?|nights?) (?:off|away))\b/i;
  // "one day" is left out on purpose: it means "someday", which VOICE.md's legacy rule asks for.
  const DAY_COUNT = /(?:\b\d+|\{\w+\}|\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|thirty))\s+(?:days?|nights?)\b/i;

  it('[C-REQ-005] no string promises a daily rhythm', () => {
    expect(offenders(ALL, DAILY)).toEqual([]);
  });

  it('[C-REQ-005] reminder, notification and moment strings never count days, runs or gaps', () => {
    expect(RHYTHM_SCOPE.length).toBeGreaterThan(30);
    expect(offenders(RHYTHM_SCOPE, GAP)).toEqual([]);
    expect(offenders(RHYTHM_SCOPE, DAY_COUNT)).toEqual([]);
  });
});

describe('moments celebrate without comparing', () => {
  const MOMENTS = IN_APP.filter((l) => l.path.startsWith('en.moments.'));
  // Never celebrated: comparisons, speed, per-author totals and plan status (C-REQ-015).
  const COMPARE = /\b(more than|most|fewer|less than|ahead|behind|faster|fastest|quicker|slower|better|best|than (?:you|others|anyone|before|last))\b/i;
  const PLAN = /\b(Plus|trial|subscri\w*|premium|upgrade)\b/i;

  it('[C-REQ-015] moment strings never compare, never count per author and never mention the plan', () => {
    expect(MOMENTS.length).toBeGreaterThan(10);
    expect(offenders(MOMENTS, COMPARE)).toEqual([]);
    expect(offenders(MOMENTS, PLAN)).toEqual([]);
    const perAuthor = MOMENTS.filter((l) => /\{count\}/.test(l.text) && /\{(signsAs|name|inviter)\}/.test(l.text));
    expect(perAuthor.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('adult audience', () => {
  // The app is for adults; the store and the website never present it as for children or as something a
  // child uses alone (LEGAL-REQ-045). App Review 2.3.8 reserves "For Kids" and "For Children" for the Kids Category.
  const CHILD_DIRECTED =
    /\b(kids?|kiddos?|for (?:children|toddlers|little ones)|(?:child|kid)-?friendly|for ages \d+|on (?:their|his|her) own|by themselves|(?:listen|play|tap|explore) alone|let (?:them|your (?:child|children|little ones?)|\{child\}) (?:listen|use|play|tap|record|explore))\b/i;

  it('[LEGAL-REQ-045] store and website copy has no "kids" and no child-directed phrases', () => {
    expect(offenders([...STORE, ...SITE], CHILD_DIRECTED)).toEqual([]);
  });
});

describe('digital only', () => {
  // v1 is digital only: no printed books, print or ordering anywhere (PRD.md K-32).
  const PRINT =
    /\b(print(?:s|ed|ing|er|ers|able)?|hardcover|hardback|paperback|softcover|physical (?:book|books|copy|copies)|order (?:(?:a|your|the|more|extra) )?(?:book|books|copy|copies)|shipping|ships to|delivered to your door)\b/i;
  // The reading-size option, not a printed book. Allowed only at this path with this exact value.
  const ALLOWED = new Map([['en.reader.sizes.largePrint', 'Large print']]);

  it('[K-32] no product, store, website or book string mentions print or ordering a book', () => {
    const hits = ALL.filter((l) => PRINT.test(l.text) && ALLOWED.get(l.path) !== l.text);
    expect(hits.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('beta placement', () => {
  // The quiet beta label lives only in Settings, About. The store listing never says "beta": the beta runs
  // on TestFlight (PRD.md K-13; brief 3 Oct decision 10, which settles D-030; App Review 2.2).
  // Which screen shows the About strings is checked in apps/mobile, not here.
  const ABOUT = /^en\.settings\.about\./;

  it('[K-13] "beta" appears only in the About strings, never in the store listing or anywhere else', () => {
    expect(offenders(ALL.filter((l) => !ABOUT.test(l.path)), /\bbeta\b/i)).toEqual([]);
  });

  it('[K-13] the About strings still carry the beta label until the founder ends the beta', () => {
    expect(en.settings.about.beta.label).toMatch(/\bbeta\b/i);
    expect(en.settings.about.beta.body).toMatch(/\bbeta\b/i);
  });
});

describe('Apple platforms only', () => {
  // App Review 2.3.10 (read on developer.apple.com, 3 Oct 2026): "don't include names, icons, or imagery of
  // other mobile platforms or alternative app marketplaces in your app or metadata, unless there is specific,
  // approved interactive functionality." Scope: the iOS app and its store metadata; the website may differ.
  // The list names the common ones; it is not exhaustive. "Google" alone stays allowed for Sign in with Google.
  const OTHER_PLATFORMS =
    /\b(android|google play|play store|galaxy store|amazon appstore|appgallery|harmonyos|windows phone|blackberry|f-droid|aptoide|altstore|setapp|epic games store)\b/i;

  it('[CR-131] the iOS app and its store metadata name no other mobile platform or app marketplace', () => {
    expect(offenders([...IN_APP, ...STORE], OTHER_PLATFORMS)).toEqual([]);
  });
});

describe('never gender anyone', () => {
  // The child is always {child}; authors are {signsAs}. Prompts are checked above; this covers every string.
  it('uses no gendered pronouns in any product, store, website or book string', () => {
    expect(offenders(ALL, /\b(she|he|her|him|his|hers|herself|himself)\b/i)).toEqual([]);
  });
});

describe('the 90-day pledge', () => {
  // 90 days' notice with export working throughout, stated identically in Terms 17, Privacy Policy 18,
  // the deletion spec and Settings, Help and Legal (PRD-REQ-009, PRD.md K-05).
  const SHUT = /\b(close|closes|closing|shut ?down|shuts down|shutting down|wind(?:s|ing)? down|cease operations|discontinu\w*)\b/i;
  const DAY_NUMBERS = /\b(\d+)(?:-day|\s+days?)\b/gi;
  const numbersIn = (text: string) => [...text.matchAll(DAY_NUMBERS)].map((m) => m[1]);
  const LEGAL_DIR = join(__dirname, '..', '..', '..', 'docs', 'legal');

  it('[PRD-REQ-009] Settings, Help and Legal states the pledge: 90 days and export throughout', () => {
    expect(en.settings.help.pledge).toMatch(/\b90 days\b/);
    expect(en.settings.help.pledge).toMatch(/\bexport\b/i);
  });

  it('[PRD-REQ-009] every shutdown notice in copy says 90 days', () => {
    const bad = ALL.filter((l) => SHUT.test(l.text) && numbersIn(l.text).some((n) => n !== '90'));
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('[PRD-REQ-009] every shutdown notice in docs/legal says 90 days', () => {
    // A line counts when it, or the heading of its section, talks about closing. Counsel notes are
    // drafting comments, not statements, so they are skipped.
    const files = readdirSync(LEGAL_DIR).filter((f) => f.endsWith('.md'));
    expect(files).toEqual(expect.arrayContaining(['terms-of-service.md', 'privacy-policy.md', 'DELETION_AND_EXPORT_SPEC.md']));
    const bad: string[] = [];
    let statements = 0;
    for (const f of files) {
      let heading = '';
      readFileSync(join(LEGAL_DIR, f), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/^#{1,6}\s/.test(line)) heading = line;
          if (line.includes('[COUNSEL')) return;
          if (!SHUT.test(line) && !SHUT.test(heading)) return;
          const days = numbersIn(line);
          if (days.length) statements++;
          if (days.some((n) => n !== '90')) bad.push(`${f}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(statements).toBeGreaterThanOrEqual(3);
    expect(bad).toEqual([]);
  });
});
