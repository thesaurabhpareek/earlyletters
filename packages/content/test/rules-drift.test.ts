/**
 * Drift guard for the content rules (handoff 24 section 1.11, NS-48-R28). rules.test.ts only reads the families
 * it is wired to; a new key family that nobody wires in passes every rule while being read by none. These
 * tests fail when that happens. They read no parent-facing words of their own.
 * If one fails, wire the family into `ALL` in rules.test.ts (or list it in EXEMPT with the test that reads it).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as content from '../src';
import { en, features } from '../src';
import { NOTIFICATION_PATH } from './support/notification-scope';

const SRC = join(__dirname, '..', 'src');
const RULES = readFileSync(join(__dirname, 'rules.test.ts'), 'utf8');

type Leaf = { path: string; text: string };
function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    return statSync(full).isDirectory() ? filesUnder(full) : n.endsWith('.ts') ? [full] : [];
  });
}

/** Files reachable from src/index.ts by relative import or re-export. */
function reachable(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (file: string): void => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const m of readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) {
      const base = resolve(dirname(file), m[1]);
      const next = [`${base}.ts`, join(base, 'index.ts')].find(existsSync);
      if (next) walk(next);
    }
  };
  walk(entry);
  return seen;
}

/**
 * The text of rules.test.ts that builds the surfaces the rules read, without the import list. The last filter
 * (`^  name,$`) assumes import members sit one per line inside `import { ... } from`, as they do now.
 */
const WIRED = RULES.split('\n').filter((l) => !/^import |^\} from |^  [\w]+,$/.test(l)).join('\n');

/** Exports built only from other exports; each source must be wired. */
const DERIVED: Record<string, string[]> = {
  emailsById: ['authEmails', 'lifecycleEmails', 'familyEmails', 'billingEmails', 'accountEmails', 'backupEmails'],
};

/**
 * Screen families that mention reminders or notifications but are shown in the app, not on the lock screen.
 * Exact keys only, never a wildcard under a family: a new key beside them is checked until listed here.
 */
const SCREEN_FAMILIES =
  /^(?:en\.(?:onboarding\.reminder|settings\.reminders|children\.settings|settingsMore|settingsHome)|features\.(?:reminders\.(?:priming|settings|weekdays|weekdaysShort)|billing\.(?:plan|confirmation)|family\.soon\.notify))(?:\.|\[|$)/;
/** A key named for a push or a notification is lock-screen text unless it is a listed screen line. */
const PUSH_NAMED = /(?:push|notification)[^.]*$/i;
const PUSH_SCREEN_LINES = new Set<string>([
  'en.settings.privacy.notificationsLine',
  'features.billing.plan.notificationsOff',
  'features.billing.plan.turnOnNotifications',
]);

/** Exports that are not in `ALL`, with the test that reads them instead. A new entry needs a reason. */
const EXEMPT: Record<string, string> = {
  testflightCopy: 'testflight.test.ts',
  appReviewCopy: 'app-review.test.ts',
  PLUS_PRICE: 'pricing.test.ts',
  PLUS_TRIAL: 'pricing.test.ts',
  plusPriceLine: 'pricing.test.ts',
  HELPLINE_DIRECTORY: 'helplines.test.ts',
  HELPLINE_MAX_AGE_DAYS: 'helplines.test.ts',
  CONSENT_LOCALE: 'consent-manifest.test.ts',
  CONSENT_SHOWN_IDS: 'consent-manifest.test.ts',
  DAY_AUTHORITIES: 'days.calendar.test.ts',
  DAY_AUTHORITY_IDS: 'days.calendar.test.ts',
  US_DAY_ROWS: 'days.calendar.test.ts',
};

describe('content rules drift', () => {
  it('[NS-48-R28] every source file under src is reachable from the package index', () => {
    const live = reachable(join(SRC, 'index.ts'));
    expect(filesUnder(SRC).filter((f) => !live.has(f)).map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });

  it('[NS-48-R28] every data export of the package is read by rules.test.ts or listed as read elsewhere', () => {
    const data = Object.entries(content).filter(([, v]) => typeof v === 'string' || (typeof v === 'object' && v !== null));
    expect(data.length).toBeGreaterThan(15);
    // The single feature exports are the same objects `features` holds, which rules.test.ts reads whole.
    const inFeatures = new Set<unknown>(Object.values(features));
    const unread = data
      .filter(([, v]) => !inFeatures.has(v))
      .map(([name]) => name)
      .filter((name) => !new RegExp(`\\b${name}\\b`).test(WIRED) && !(name in EXEMPT) && !(name in DERIVED));
    for (const [name, sources] of Object.entries(DERIVED)) {
      expect(name in content, `${name} is no longer exported`).toBe(true);
      expect(sources.filter((src) => !new RegExp(`\\b${src}\\b`).test(WIRED)), name).toEqual([]);
    }
    expect(unread).toEqual([]);
  });

  it('[NS-48-R28] every exemption names a test that really reads the export', () => {
    for (const [name, where] of Object.entries(EXEMPT)) {
      expect(name in content, `${name} is no longer exported`).toBe(true);
      const file = join(__dirname, where.split(' ')[0]);
      const body = readFileSync(file, 'utf8').split('\n').filter((l) => !/^import |^\} from |^  [\w]+,$/.test(l)).join('\n');
      expect(body, `${where} does not use ${name} outside its imports`).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('[NS-48-R28] the EXEMPT list has no export that rules.test.ts already reads', () => {
    expect(Object.keys(EXEMPT).filter((n) => new RegExp(`\\b${n}\\b`).test(WIRED))).toEqual([]);
  });

  it('[NS-48-R28] en and features are read whole, so no family under them can be missed', () => {
    expect(WIRED).toMatch(/\.\.\.leaves\(en, 'en'\)/);
    expect(WIRED).toMatch(/\.\.\.leaves\(features, 'features'\)/);
    expect(WIRED).toMatch(/const EVERY: Leaf\[\] = \[\.\.\.ALL, \.\.\.EMAIL, \.\.\.APP_COPY\]/);
  });

  it('[NS-48-R28] every notification or reminder line is inside the notification scope', () => {
    const lines = [...leaves(en, 'en'), ...leaves(features, 'features')];
    const scoped = lines.filter((l) => NOTIFICATION_PATH.test(l.path));
    expect(scoped.length).toBeGreaterThan(30);
    // A path that looks like a notification family must be in scope, unless it is a screen family listed in
    // SCREEN_FAMILIES. A future features.days.*, culture.* or ntc.* family cannot stay green unchecked.
    const lookalike = /(^|\.)(notifications?|neutral|together|reminders?|days|culture|ntc|dayNames|suggestions)(\.|\[)/;
    const unchecked = lines.filter((l) => lookalike.test(l.path) && !NOTIFICATION_PATH.test(l.path) && !SCREEN_FAMILIES.test(l.path));
    expect(unchecked.map((l) => l.path)).toEqual([]);
    // A screen family can still hide a lock-screen line, such as settings.pushBody: a key named for a push or a
    // notification must be in scope or listed in PUSH_SCREEN_LINES by exact path.
    const pushNamed = lines.filter((l) => PUSH_NAMED.test(l.path) && !NOTIFICATION_PATH.test(l.path) && !PUSH_SCREEN_LINES.has(l.path));
    expect(pushNamed.map((l) => l.path)).toEqual([]);
  });

  it('[NS-48-R28] notification lines fit a lock screen: 40 for a title, 110 for a body, wherever the key lives', () => {
    const scoped = [...leaves(en, 'en'), ...leaves(features, 'features')].filter((l) => NOTIFICATION_PATH.test(l.path));
    const tooLong = scoped.filter((l) => l.text.length > (/title/i.test(l.path) ? 40 : 110)).map((l) => l.path);
    expect(tooLong).toEqual([]);
  });

  it('[NS-48-R28] the VOICE.md notification line is enforced: no notification carries an exclamation mark', () => {
    const voice = readFileSync(join(__dirname, '..', 'VOICE.md'), 'utf8');
    // VOICE.md says none (Q-NTC-7, CL-040), as the test does: a template is sent again and again, so no
    // notification string carries one, whichever family it sits in.
    expect(voice).toMatch(/No exclamation marks in notifications \(Q-NTC-7, CL-040\)\./);
    expect(voice).not.toMatch(/exclamation mark per month/);
    const scoped = [...leaves(en, 'en'), ...leaves(features, 'features')].filter((l) => NOTIFICATION_PATH.test(l.path));
    expect(scoped.filter((l) => l.text.includes('!')).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    // Approving a monthly exclamation mark means editing the VOICE.md notification line and both places that hold zero:
    // this test and the `notifications` budget in rules.test.ts, together.
    expect(RULES).toMatch(/notifications: 0,/);
  });

  it('[NS-48-R28] the rhythm and gap rules read the whole notification scope, not their own path guess', () => {
    // RHYTHM_SCOPE feeds the gap and day-count rules. If it stops using NOTIFICATION_PATH, a notification
    // family outside en.notifications or a "remind" key (features.photos.suggestions, a future ntc family)
    // is read by the length rule but never by the gap rules.
    const line = WIRED.split('\n').find((l) => /const RHYTHM_SCOPE\b/.test(l)) ?? '';
    expect(line, 'RHYTHM_SCOPE is no longer defined in rules.test.ts').not.toBe('');
    expect(line).toMatch(/NOTIFICATION_PATH\.test\(l\.path\)/);
  });
});

/**
 * The BRAND.md glossary rows handoff 24 section 1.11 names under RV-3 (GAP-LOG RV-3, Q-FD-26): "note" is the word
 * for something a person makes, never for what the app sends, which is a reminder or a message. rules.test.ts
 * enforces the email half of that row by its own regex; nothing else ties the row to the rules or the copy, so
 * the row could be reworded, or the rule dropped, and every rule test would stay green. These tests read the row.
 * If one fails, the row, the rule and the copy disagree: settle which one is right, never loosen the test.
 */
const BRAND_MD = readFileSync(join(__dirname, '..', 'BRAND.md'), 'utf8');

type GlossaryRow = { concept: string; use: string; banned: string; notes: string };
/** The rows of the `## Glossary` table, header and separator left out. */
function glossaryRows(): GlossaryRow[] {
  const start = BRAND_MD.indexOf('\n## Glossary\n');
  if (start < 0) return [];
  const rest = BRAND_MD.slice(start + 1);
  const end = rest.indexOf('\n## ');
  const section = end < 0 ? rest : rest.slice(0, end);
  return section
    .split('\n')
    .filter((l) => l.startsWith('| '))
    .slice(1)
    .map((l) => {
      const [concept, use, banned, notes, ...extra] = l.slice(1, -1).split('|').map((c) => c.trim());
      // A fifth cell means a pipe inside a cell or a new column: either way this parse no longer reads the row.
      expect(extra, l).toEqual([]);
      return { concept, use, banned, notes };
    });
}
const NOTE = /\bnotes?\b/i;
const ROW_MADE = 'Short piece someone makes';
const ROW_SENT = /^What we send\b/;

describe('content rules drift: the BRAND.md glossary rows the handoff names (RV-3)', () => {
  it('[NS-48-R28, RV-3] the glossary keeps one row for a note a person makes and one for what the app sends', () => {
    const rows = glossaryRows();
    expect(rows.length).toBeGreaterThan(20);
    const made = rows.filter((r) => r.concept === ROW_MADE);
    const sent = rows.filter((r) => ROW_SENT.test(r.concept));
    expect(made.length, ROW_MADE).toBe(1);
    expect(sent.length, 'What we send').toBe(1);
    // A note is something a person makes.
    expect(made[0].use).toBe('note');
    expect(made[0].notes).toMatch(/Only ever something a person makes/);
    // What the app sends is a reminder or a message, and "note" is banned for it.
    expect(sent[0].use.split(';').map((w) => w.trim())).toEqual(['reminder', 'message']);
    expect(sent[0].banned).toMatch(/^note$/);
    // One term per concept: no other row offers "note" as the word to use.
    expect(rows.filter((r) => r.concept !== ROW_MADE && NOTE.test(r.use)).map((r) => r.concept)).toEqual([]);
  });

  it('[NS-48-R28, RV-3] the lines the "What we send" row quotes are still lines the package says', () => {
    const sent = glossaryRows().find((r) => ROW_SENT.test(r.concept));
    const quoted = [...(sent?.notes ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(quoted.length).toBeGreaterThan(0);
    const said = new Set(leaves(content).map((l) => l.text));
    expect(quoted.filter((q) => !said.has(q))).toEqual([]);
  });

  it('[NS-48-R28, RV-3] rules.test.ts still holds the row\'s email rule: no "note" in anything sent by email', () => {
    const rule = /it\('uses "note" only for something people make, never for what we send', \(\) => \{\n\s*expect\(offenders\(EMAIL, \/\\bnotes\?\\b\/i\)\)\.toEqual\(\[\]\);/;
    expect(RULES).toMatch(rule);
  });

  it('[NS-48-R28, RV-3] no notification or reminder line calls what the app sends a note, wherever the key lives', () => {
    // Lock-screen text is what the app sends, as email is; the row bans the word for both. A key may keep an
    // internal name such as monthNotesLabel: only the words are read.
    const scoped = [...leaves(en, 'en'), ...leaves(features, 'features')].filter((l) => NOTIFICATION_PATH.test(l.path));
    expect(scoped.length).toBeGreaterThan(30);
    expect(scoped.filter((l) => NOTE.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});
