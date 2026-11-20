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

/** The text of rules.test.ts that builds the surfaces the rules read, without the import list. */
const WIRED = RULES.split('\n').filter((l) => !/^import |^\} from |^  [\w]+,$/.test(l)).join('\n');

/** Exports that are not in `ALL`, with the test that reads them instead. A new entry needs a reason. */
/** Exports built only from other exports; each source must be wired. */
const DERIVED: Record<string, string[]> = {
  emailsById: ['authEmails', 'lifecycleEmails', 'familyEmails', 'billingEmails', 'accountEmails', 'backupEmails'],
};

const EXEMPT: Record<string, string> = {
  testflightCopy: 'testflight.test.ts',
  appReviewCopy: 'app-review.test.ts',
  PLUS_PRICE: 'pricing.test.ts',
  PLUS_TRIAL: 'pricing.test.ts',
  plusPriceLine: 'pricing.test.ts',
  HELPLINE_DIRECTORY: 'helplines.test.ts',
  HELPLINE_MAX_AGE_DAYS: 'helplines.test.ts',
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
      expect(readFileSync(file, 'utf8'), `${where} does not mention ${name}`).toMatch(new RegExp(`\\b${name}\\b`));
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
    // Lock-screen lines are the title and body keys under the notification families. Settings, onboarding and
    // billing screens that mention reminders are screens, not notifications, and are left out.
    const looksLikeLockScreen = lines.filter((l) => /(^|\.)(notifications|neutral|together)\./.test(l.path));
    expect(looksLikeLockScreen.filter((l) => !NOTIFICATION_PATH.test(l.path)).map((l) => l.path)).toEqual([]);
  });

  it('[NS-48-R28] notification lines fit a lock screen: 40 for a title, 110 for a body, wherever the key lives', () => {
    const scoped = [...leaves(en, 'en'), ...leaves(features, 'features')].filter((l) => NOTIFICATION_PATH.test(l.path));
    const tooLong = scoped.filter((l) => l.text.length > (/title/i.test(l.path) ? 40 : 110)).map((l) => l.path);
    expect(tooLong).toEqual([]);
  });

  it('[NS-48-R28] VOICE.md line 70 is enforced: no notification carries an exclamation mark', () => {
    const voice = readFileSync(join(__dirname, '..', 'VOICE.md'), 'utf8');
    // The rule is at most one a month across all notifications. A template is sent again and again, so the
    // test holds the stricter line: none in any notification string, whichever family it sits in.
    expect(voice).toMatch(/exclamation mark per month across all notifications/);
    const scoped = [...leaves(en, 'en'), ...leaves(features, 'features')].filter((l) => NOTIFICATION_PATH.test(l.path));
    expect(scoped.filter((l) => l.text.includes('!')).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    expect(RULES).toMatch(/notifications: 0,/);
  });
});
