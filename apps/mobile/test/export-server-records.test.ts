/**
 * The server's part of account.json (schema 1.2.0; BL-323, LEGAL-REQ-034):
 * every way the read can go, and that the export never fails, waits too long
 * or carries a shortened or account-identifying record because of it
 * (DATA-REQ-052).
 */
import { describe, expect, it } from 'vitest';
import {
  allRows,
  exportAct,
  MAX_PAGES,
  mergeDictionary,
  PAGE_ROWS,
  readServerRecords,
  type ReadOptions,
  type ReadResult,
  type ServerRecordsReader,
} from '../src/lib/export/server-records.logic';
import type { ExportDictionaryTerm } from '../src/lib/export/schema';

const HASH = 'ab'.repeat(32);
const row = (over: Record<string, unknown> = {}) => ({
  id: 'a2',
  profile_id: 'user-1',
  subject_hash: null,
  pseudonymised_at: null,
  document: 'terms',
  version: '1.0.0',
  action: 'accept',
  method: 'signin_sheet',
  surface: 'signin.terms',
  accepted_at: '2027-01-02T00:00:00+00:00',
  client_recorded_at: '2027-01-01T23:59:58+00:00',
  app_version: '1.0.0',
  platform: 'ios',
  locale: 'en-US',
  rendered_sha256: `\\x${HASH.toUpperCase()}`,
  context: { auth: 'apple', age_attested: true },
  ...over,
});
const ok = (data: unknown[]): ReadResult => ({ data, error: null });

function reader(over: Partial<Record<keyof ServerRecordsReader, () => Promise<ReadResult>>> = {}): ServerRecordsReader {
  return {
    acts: over.acts ?? (async () => ok([row(), row({ id: 'a1', document: 'sensitive-data', accepted_at: '2027-01-01T00:00:00+00:00', rendered_sha256: null })])),
    state: over.state ?? (async () => ok([{ document: 'terms', version: '1.0.0', action: 'accept', accepted_at: '2027-01-02T00:00:00+00:00' }, { document: 'sensitive-data', version: '1.0.0', action: 'accept', accepted_at: '2027-01-01T00:00:00+00:00' }])),
    dictionary: over.dictionary ?? (async () => ok([{ child_id: 'c1', term: 'Nani', kind: 'family', heard_as: ['nanny'] }])),
  };
}

const opts = (over: Partial<ReadOptions> = {}): ReadOptions => ({
  authUserId: 'user-1',
  ownerId: 'user-1',
  reader: reader(),
  timeoutMs: 200,
  now: () => new Date('2027-03-15T10:00:00.000Z'),
  ...over,
});

describe('[BL-323] readServerRecords', () => {
  it('signed out, or server features off: no record, and nothing is read', async () => {
    let reads = 0;
    const counting = reader({ acts: async () => (reads++, ok([])) });
    for (const o of [opts({ authUserId: null, reader: counting }), opts({ reader: null })]) {
      const r = await readServerRecords(o);
      expect(r.consent).toEqual({ status: 'not_signed_in', read_at: null, current: [], acts: [] });
      expect(r.dictionary).toEqual([]);
    }
    expect(reads).toBe(0);
  });

  it('a different account than the one that owns these letters: no record, nothing read', async () => {
    let reads = 0;
    const r = await readServerRecords(opts({ ownerId: 'user-2', reader: reader({ acts: async () => (reads++, ok([])) }) }));
    expect(r.consent.status).toBe('different_account');
    expect(r.consent.acts).toEqual([]);
    expect(reads).toBe(0);
  });

  it('signed in before the first sync claimed the letters: the record is read', async () => {
    expect((await readServerRecords(opts({ ownerId: null }))).consent.status).toBe('included');
  });

  it('included: every act oldest first, the latest per document, no account columns, hash as hex', async () => {
    const r = await readServerRecords(opts());
    expect(r.consent.status).toBe('included');
    expect(r.consent.read_at).toBe('2027-03-15T10:00:00.000Z');
    expect(r.consent.acts.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(r.consent.current.map((c) => c.document)).toEqual(['sensitive-data', 'terms']);
    const terms = r.consent.acts[1];
    expect(terms.rendered_sha256).toBe(HASH);
    expect(terms.context).toEqual({ auth: 'apple', age_attested: true });
    for (const a of r.consent.acts) {
      expect(Object.keys(a).sort()).toEqual(
        ['action', 'app_version', 'at', 'client_recorded_at', 'context', 'document', 'id', 'locale', 'method', 'platform', 'rendered_sha256', 'surface', 'version'],
      );
    }
    expect(JSON.stringify(r)).not.toContain('user-1');
    expect(r.dictionary).toEqual([{ child_id: 'c1', term: 'Nani', kind: 'family', heard_as: ['nanny'], forms: null, source: 'server' }]);
  });

  it('acts at the same instant keep a stable order (by id)', async () => {
    const t = '2027-01-01T00:00:00+00:00';
    const r = await readServerRecords(opts({ reader: reader({ acts: async () => ok([row({ id: 'b', accepted_at: t }), row({ id: 'a', accepted_at: t })]) }) }));
    expect(r.consent.acts.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('any read error, a thrown error or missing data: unavailable, and no partial record', async () => {
    const failing: Partial<Record<keyof ServerRecordsReader, () => Promise<ReadResult>>>[] = [
      { acts: async () => ({ data: null, error: { code: 'PGRST301' } }) },
      { state: async () => ({ data: null, error: { message: 'offline' } }) },
      { dictionary: async () => ({ data: null, error: { message: 'offline' } }) },
      { acts: async () => Promise.reject(new TypeError('Network request failed')) },
      { state: async () => ({ data: null, error: null }) },
    ];
    for (const f of failing) {
      const r = await readServerRecords(opts({ reader: reader(f) }));
      expect(r.consent, JSON.stringify(Object.keys(f))).toEqual({ status: 'unavailable', read_at: null, current: [], acts: [] });
      expect(r.dictionary).toEqual([]);
    }
  });

  it('a row this app cannot describe makes the record unavailable instead of shortening it', async () => {
    for (const bad of [row({ action: 'agree' }), row({ platform: 'desktop' }), row({ id: null }), row({ accepted_at: 42 }), 'x', null]) {
      const r = await readServerRecords(opts({ reader: reader({ acts: async () => ok([row(), bad]) }) }));
      expect(r.consent.status, JSON.stringify(bad)).toBe('unavailable');
    }
    const r = await readServerRecords(opts({ reader: reader({ state: async () => ok([{ document: 'terms', version: '1', action: 'unknown', accepted_at: 't' }]) }) }));
    expect(r.consent.status).toBe('unavailable');
  });

  it('times out, aborts the reads, and still returns: the export never waits on the network for long', async () => {
    let signal: AbortSignal | null = null;
    const hang: ServerRecordsReader = {
      acts: (s) => ((signal = s), new Promise<ReadResult>(() => {})),
      state: () => new Promise<ReadResult>(() => {}),
      dictionary: () => new Promise<ReadResult>(() => {}),
    };
    const started = Date.now();
    const r = await readServerRecords(opts({ reader: hang, timeoutMs: 50 }));
    expect(Date.now() - started).toBeLessThan(1000);
    expect(r.consent.status).toBe('unavailable');
    expect(signal!.aborted).toBe(true);
  });

  it('a read that fails after the timeout is not an unhandled rejection', async () => {
    const late: ServerRecordsReader = {
      acts: () => new Promise<ReadResult>((_, reject) => setTimeout(() => reject(new Error('late')), 80)),
      state: async () => ok([]),
      dictionary: async () => ok([]),
    };
    const unhandled: unknown[] = [];
    const onUnhandled = (e: unknown) => unhandled.push(e);
    process.on('unhandledRejection', onUnhandled);
    try {
      expect((await readServerRecords(opts({ reader: late, timeoutMs: 20 }))).consent.status).toBe('unavailable');
      await new Promise((res) => setTimeout(res, 150));
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('skips spelling-list rows it cannot describe (a hint, not a legal record)', async () => {
    const words = [
      { child_id: null, term: 'Bengaluru', kind: 'place', heard_as: null },
      { child_id: 'c1', term: '  ', kind: 'word', heard_as: [] },
      { child_id: 'c1', term: 'Zed', kind: 'robot', heard_as: [] },
      { child_id: 'c1', term: 'Ammu', kind: 'nickname', heard_as: ['amu', 7] },
    ];
    const r = await readServerRecords(opts({ reader: reader({ dictionary: async () => ok(words) }) }));
    expect(r.consent.status).toBe('included');
    expect(r.dictionary).toEqual([
      { child_id: null, term: 'Bengaluru', kind: 'place', heard_as: [], forms: null, source: 'server' },
      { child_id: 'c1', term: 'Ammu', kind: 'nickname', heard_as: ['amu'], forms: null, source: 'server' },
    ]);
  });

  it('carries each script\'s spelling (dictionary_terms.forms), leaving out a form it cannot describe', async () => {
    const words = [
      {
        child_id: 'c1', term: 'Asha', kind: 'child', heard_as: [],
        forms: [
          { script: 'devanagari', text: '\u0906\u0936\u093e', heardAs: ['aasha'], offerOnly: ['\u0905\u0936\u093e'] },
          { script: 'latin', text: 'Asha' },
          { script: 'klingon', text: 'x' },
          { script: 'arabic', text: '  ' },
          'not a form',
        ],
      },
      { child_id: 'c1', term: 'Dev', kind: 'child', heard_as: [], forms: [{ script: 'klingon', text: 'x' }] },
      { child_id: 'c1', term: 'Papa', kind: 'family', heard_as: [], forms: 'nope' },
    ];
    const r = await readServerRecords(opts({ reader: reader({ dictionary: async () => ok(words) }) }));
    expect(r.dictionary[0].forms).toEqual([
      { script: 'devanagari', text: '\u0906\u0936\u093e', heard_as: ['aasha'], offer_only: ['\u0905\u0936\u093e'] },
      { script: 'latin', text: 'Asha', heard_as: [], offer_only: [] },
    ]);
    expect(r.dictionary[1].forms).toBeNull();
    expect(r.dictionary[2].forms).toBeNull();
  });
});

describe('[BL-323] allRows', () => {
  it('reads page after page until a short page', async () => {
    const ranges: [number, number][] = [];
    const r = await allRows(async (from, to) => {
      ranges.push([from, to]);
      return ok(Array.from({ length: ranges.length < 3 ? PAGE_ROWS : 7 }, (_, i) => from + i));
    });
    expect(ranges).toEqual([[0, PAGE_ROWS - 1], [PAGE_ROWS, 2 * PAGE_ROWS - 1], [2 * PAGE_ROWS, 3 * PAGE_ROWS - 1]]);
    expect(r.data).toHaveLength(2 * PAGE_ROWS + 7);
  });

  it('an error on any page, or more rows than it will read, is an error, never a short list', async () => {
    let n = 0;
    expect((await allRows(async () => (++n === 2 ? { data: null, error: 'x' } : ok(Array(PAGE_ROWS).fill(0))))).data).toBeNull();
    const endless = await allRows(async () => ok(Array(PAGE_ROWS).fill(0)));
    expect(endless).toEqual({ data: null, error: 'too_many_rows' });
    expect(MAX_PAGES * PAGE_ROWS).toBeGreaterThanOrEqual(10_000);
  });
});

describe('[BL-323] exportAct', () => {
  it('keeps a malformed hash and context out of the record', () => {
    const a = exportAct(row({ rendered_sha256: '\\xdeadbeef', context: ['not', 'an', 'object'], locale: null, client_recorded_at: null }));
    expect(a).toMatchObject({ rendered_sha256: null, context: {}, locale: null, client_recorded_at: null });
  });
});

describe('[BL-323] mergeDictionary', () => {
  const t = (child_id: string | null, term: string, source: 'phone' | 'server', heard_as: string[] = []): ExportDictionaryTerm => ({
    child_id,
    term,
    kind: 'word',
    heard_as,
    forms: null,
    source,
  });

  it('phone words first; a server word already on the phone for the same book (any case) is not repeated', () => {
    const merged = mergeDictionary([t('c1', 'Asha', 'phone')], [t('c1', 'asha', 'server'), t('c2', 'Asha', 'server'), t(null, 'Nani', 'server', ['nanny'])]);
    expect(merged.map((m) => [m.child_id, m.term, m.source])).toEqual([
      ['c1', 'Asha', 'phone'],
      ['c2', 'Asha', 'server'],
      [null, 'Nani', 'server'],
    ]);
  });

  it('treats composed and decomposed spellings as the same word, and never shares arrays with its input', () => {
    const phone = [t('c1', 'Zoé', 'phone', ['zoey'])];
    const merged = mergeDictionary(phone, [t('c1', 'Zoé', 'server')]);
    expect(merged).toHaveLength(1);
    merged[0].heard_as.push('x');
    expect(phone[0].heard_as).toEqual(['zoey']);
  });
});
