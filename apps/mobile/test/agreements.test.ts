/// <reference types="node" />
/**
 * Before you begin (founder decision F2, 8 Nov 2026; LEGAL-REQ-002 unchanged; PR #597 data design 2.1): the neutral
 * age question plus an unticked agreement box on one screen, and the local agreement record. Fictional Asha family
 * only. Engineering reading, confirm with counsel (Q-A to Q-D).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@scribe/content';
import { AGE_GATE_PASSED_KEY, AGE_GATE_STOPPED_KEY, answerGate, decideGate } from '../src/lib/age-gate.logic';
import {
  PRIVACY_DOC_VERSION,
  TERMS_DOC_VERSION,
  agreementRows,
  continueBeforeBegin,
  decideEntry,
  type BeforeBeginAnswer,
} from '../src/lib/agreements.logic';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { agreements } from '../src/lib/db/repos';
import { sha256Hex } from '../src/lib/sha256';
import { nodeDb } from './helpers/node-db';
import { fixture } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

const ROOT = join(__dirname, '..', '..', '..');
const SRC = join(__dirname, '..', 'src');
const NOW = '2026-11-08T09:00:00.000Z';
const node = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const AGE_LIKE = /age|birth|dob/i;
let n = 0;
const ids = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const rows = (surface: 'first_run.before_you_begin' | 'update.agreement' = 'first_run.before_you_begin', now = NOW) =>
  agreementRows({ sentence: en.beforeBegin.agree, surface, now, appVersion: '1.0.0', newId: ids });

describe('sha256Hex is SHA-256 of the UTF-8 text', () => {
  it('matches node:crypto, including block boundaries and non-ASCII', () => {
    for (const s of ['', 'abc', en.beforeBegin.agree, 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(119), 'Asha, café अशा', 'x'.repeat(1000)]) {
      expect(sha256Hex(s), JSON.stringify(s.slice(0, 20))).toBe(node(s));
    }
  });
});

describe('[F2] Continue on Before you begin', () => {
  const at = (a: Partial<BeforeBeginAnswer>) => continueBeforeBegin({ adult: null, agreed: false, returning: false, ...a });

  it('with nothing answered it gives the reason and stores nothing, even with the box ticked', () => {
    expect(at({})).toEqual({ kind: 'reason', reason: 'chooseAnswer' });
    expect(at({ agreed: true })).toEqual({ kind: 'reason', reason: 'chooseAnswer' });
  });

  it('Yes without a tick asks for the tick (Yes alone records nothing)', () => {
    expect(at({ adult: true })).toEqual({ kind: 'reason', reason: 'tickBox' });
  });

  it('[LEGAL-REQ-002] No goes to the stop whatever the box says', () => {
    expect(at({ adult: false })).toEqual({ kind: 'stop' });
    expect(at({ adult: false, agreed: true })).toEqual({ kind: 'stop' });
  });

  it('Yes and a tick accept, and pass the age question', () => {
    expect(at({ adult: true, agreed: true })).toEqual({ kind: 'accept', passAge: true, surface: 'first_run.before_you_begin' });
  });

  it('an install that already passed the age question is asked only for the tick, and the age is not asked again', () => {
    expect(at({ returning: true })).toEqual({ kind: 'reason', reason: 'tickBox' });
    expect(at({ returning: true, agreed: true })).toEqual({ kind: 'accept', passAge: false, surface: 'update.agreement' });
  });
});

describe('[F2] the agreement record', () => {
  it('one Terms row and one Privacy row, with the document versions, the device time, the app version and the hash of the sentence shown', () => {
    const r = rows();
    expect(r.map((x) => [x.document, x.version, x.action])).toEqual([
      ['terms', TERMS_DOC_VERSION, 'accept'],
      ['privacy', PRIVACY_DOC_VERSION, 'accept'],
    ]);
    for (const x of r) {
      expect(x.recordedAt).toBe(NOW);
      expect(x.appVersion).toBe('1.0.0');
      expect(x.renderedSha256).toBe(node(en.beforeBegin.agree));
      expect(x.surface).toMatch(/^[a-z0-9_.]{1,64}$/);
      // D-026: the age is a timeless boolean in settings; the record never holds an age, a birth date or an age time.
      expect(Object.keys(x).filter((k) => AGE_LIKE.test(k))).toEqual([]);
    }
  });

  it('the document versions are the published front matter (fails when a document moves and the build does not)', () => {
    const version = (f: string) => readFileSync(join(ROOT, 'docs', 'legal', f), 'utf8').match(/^version:\s*(\S+)/m)?.[1];
    expect(version('terms-of-service.md')).toBe(TERMS_DOC_VERSION);
    expect(version('privacy-policy.md')).toBe(PRIVACY_DOC_VERSION);
  });

  it('the screen hashes the same sentence it shows', () => {
    const screen = readFileSync(join(SRC, 'components', 'gate', 'age-gate-screen.tsx'), 'utf8');
    expect(screen).toMatch(/<AgreementRow label=\{b\.agree\}/);
    expect(screen).toMatch(/acceptBeforeYouBegin\(b\.agree,/);
  });
});

describe('[F2] local schema v9: the agreements table', () => {
  it('v9 creates the table with no age column and no rows, even on an install that passed the old gate (no backfill)', () => {
    const { db } = nodeDb();
    const ctx = { now: NOW, newId: ids };
    migrate(db, ctx, MIGRATIONS.filter((m) => m.version <= 8));
    db.run("INSERT INTO settings (key, value) VALUES ('ageGate.passed', '1')");
    expect(migrate(db, ctx)).toMatchObject({ from: 8, to: LATEST_VERSION });
    const cols = db.all<{ name: string }>('PRAGMA table_info(agreements)').map((c) => c.name);
    expect(cols).toEqual(['id', 'document', 'version', 'action', 'surface', 'recorded_at', 'app_version', 'rendered_sha256', 'uploaded_at', 'server_act_id']);
    expect(cols.filter((c) => AGE_LIKE.test(c))).toEqual([]);
    expect(db.get<{ n: number }>('SELECT count(*) AS n FROM agreements')?.n).toBe(0);
    // Safe to run again on a database that already has the table.
    expect(() => MIGRATIONS.find((m) => m.version === 9)!.up(db, ctx)).not.toThrow();
  });

  it('a record is written once: a second accept of the same document and version keeps the first row as it was', () => {
    const f = fixture();
    expect(agreements.insertOnce(f.ctx, rows())).toBe(2);
    expect(agreements.insertOnce(f.ctx, rows('update.agreement', '2026-11-09T09:00:00.000Z'))).toBe(0);
    const kept = agreements.list(f.ctx);
    expect(kept).toHaveLength(2);
    expect(kept.every((r) => r.recordedAt === NOW && r.surface === 'first_run.before_you_begin')).toBe(true);
    expect(agreements.hasAccepted(f.ctx, 'terms')).toBe(true);
    f.close();
  });
});

describe('[F2] [LEGAL-REQ-002] what each path stores, through the store', () => {
  beforeEach(() => {
    store.closeStore();
    expect(store.openStore({ open: () => nodeDb(), now: () => NOW }).ok).toBe(true);
  });
  afterEach(() => store.closeStore());

  const db = () => store.localSqlDb();
  const settingKeys = () => db().all<{ key: string }>('SELECT key FROM settings ORDER BY key').map((r) => r.key);
  const agreementCount = () => db().get<{ n: number }>('SELECT count(*) AS n FROM agreements')!.n;

  it('a fresh install is asked, with nothing stored', () => {
    expect(decideEntry(decideGate({ passed: false, stoppedAt: null }, Date.parse(NOW)).decision, store.hasAgreement('terms'))).toBe('ask');
    expect(settingKeys()).toEqual([]);
    expect(agreementCount()).toBe(0);
  });

  it('Yes and a tick write the age boolean and the two rows together, and the gate passes', () => {
    store.recordAgreement(rows(), true);
    expect(settingKeys()).toEqual([AGE_GATE_PASSED_KEY]);
    expect(store.getSetting(AGE_GATE_PASSED_KEY)).toBe('1');
    expect(agreementCount()).toBe(2);
    expect(decideEntry('pass', store.hasAgreement('terms'))).toBe('pass');
  });

  it('No stores only the time of the No (the existing stop path), and nothing about the box', () => {
    const s = answerGate('no', Date.parse(NOW));
    store.setSetting(AGE_GATE_STOPPED_KEY, s.stoppedAt!);
    expect(settingKeys()).toEqual([AGE_GATE_STOPPED_KEY]);
    expect(agreementCount()).toBe(0);
    expect(decideGate({ passed: false, stoppedAt: s.stoppedAt }, Date.parse(NOW) + 60_000).decision).toBe('stop');
  });

  it('a build 1 install (age passed, no agreement) is shown the agreement once, and not again after it ticks', () => {
    store.setSetting(AGE_GATE_PASSED_KEY, '1');
    expect(decideEntry('pass', store.hasAgreement('terms'))).toBe('agree');
    store.recordAgreement(rows('update.agreement'), false);
    expect(decideEntry('pass', store.hasAgreement('terms'))).toBe('pass');
    expect(settingKeys()).toEqual([AGE_GATE_PASSED_KEY]);
    expect(db().all<{ surface: string }>('SELECT DISTINCT surface FROM agreements').map((r) => r.surface)).toEqual(['update.agreement']);
  });

  it('a failure part way leaves neither the rows nor the age boolean', () => {
    const bad = rows().map((r, i) => (i === 1 ? { ...r, version: null as unknown as string } : r));
    expect(() => store.recordAgreement(bad, true)).toThrow();
    expect(agreementCount()).toBe(0);
    expect(store.getSetting(AGE_GATE_PASSED_KEY)).toBeNull();
  });

  it('the stop and the age question are untouched: decideEntry passes ask and stop through', () => {
    expect(decideEntry('ask', true)).toBe('ask');
    expect(decideEntry('stop', true)).toBe('stop');
  });
});

describe('[CPrivO-3] the agreement is never logged or sent to analytics', () => {
  it('no file that writes or reads the record calls a logger, console, analytics or crash reporter', () => {
    for (const f of ['lib/agreements.logic.ts', 'lib/db/repos/agreements.ts', 'lib/age-gate.ts', 'components/ui/agreement-row.tsx']) {
      const code = readFileSync(join(SRC, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      expect(code, f).not.toMatch(/console\.|\blog\(|logger|analytics|track\(|captureException|Sentry|breadcrumb/i);
    }
  });
});
