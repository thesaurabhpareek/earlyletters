/// <reference types="node" />
/**
 * Two parents' phones, end to end, the way the alpha runs (D-106): every phone
 * is a real store facade (src/lib/store.ts, its own module instance over its own
 * node:sqlite database, with the app's migrations), every write goes through the
 * store exactly as screens make it, and the sync engine talks to one server: the
 * real SQL of supabase/migrations in PGlite, run as the signed-in user. Protocol v1
 * (the words compare and set) comes from S02's migration when it exists, else from
 * the stand-in that is S03's request to S02 (helpers/sync-v1-standin.sql).
 *
 * Phones: Mama's phone, Papa's phone (the co-parent) and Mama's second phone. A
 * words conflict needs two phones of one author (F16 C1: only the author edits a
 * letter's words), so the conflict is between Mama's two phones while Papa reads.
 * The second describe is the held draft state table of ADR 0025 section 9, one case
 * per cell, on its own server with two phones of Mama's (P sends, Q is the other).
 * The third, on its own server too, is the #182 re-check: a refused op that runs again
 * after a lost answer and meets SCCON, with ops behind it that had applied (a withdrawn
 * consent or a terms version asking again; refused SCDEL or SCIMM), and a held draft let
 * go during that pause.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import type { SyncEngine } from '../src/lib/sync/engine';
import type { SupabaseLike } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { flaky, startSyncServer, type SyncServer } from './helpers/sync-server';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';

// The server checks device ids and capture times against its own clock (within a day), so the phones start at now.
const clock = { t: Date.now() };
const iso = () => new Date(clock.t).toISOString();
const tick = (ms = 60_000) => {
  clock.t += ms;
};

function uuid7(ms = clock.t): string {
  const b = randomBytes(16);
  let t = BigInt(ms);
  for (let i = 5; i >= 0; i--) {
    b[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type Store = typeof import('../src/lib/store');

interface Phone {
  name: string;
  store: Store;
  db: SqlDb;
  /** One sync cycle against the server (a new engine each time: the app may have been killed in between). */
  sync: (server?: SupabaseLike) => ReturnType<SyncEngine['sync']>;
  /** Signs in: claims the phone's local data for the account (A-REQ-015), then one cycle. */
  signIn: () => Promise<void>;
  /** The app is killed and opened again on the same database file. */
  relaunch: () => void;
}

let server: SyncServer;

/** A phone: its own store module instance (vi.resetModules), opened on its own database. */
async function phone(name: string, uid: string): Promise<Phone> {
  vi.resetModules();
  const store = (await import('../src/lib/store')) as Store;
  const caps = await import('../src/lib/capabilities');
  caps.setServerFeaturesForTests(true); // this module instance's switch: a build with server features on
  const { createSyncEngine } = await import('../src/lib/sync/engine');
  const handle = nodeDb();
  const open = () => store.openStore({ open: () => ({ db: handle.db, close: () => {} }), now: iso, newId: (at?: number) => uuid7(at ?? clock.t) });
  expect(open().ok).toBe(true);
  const engine = (s: SupabaseLike) =>
    createSyncEngine({
      db: store.localSqlDb(), supabase: s, userId: uid, newId: () => uuid7(), now: () => clock.t, random: () => 1,
      setTimer: () => 0, clearTimer: () => {}, isActive: () => false,
      afterPull: () => store.finishServerErased(() => {}), // as lib/sync/index.ts wires it, with no files on disk
    });
  return {
    name,
    store,
    db: handle.db,
    sync: (s = server.serverFor(uid)) => engine(s).sync(),
    signIn: async () => {
      const e = engine(server.serverFor(uid));
      expect(e.start()).not.toBeNull();
      await e.sync();
    },
    relaunch: () => {
      store.closeStore();
      expect(open().ok).toBe(true);
    },
  };
}

const serverEntry = async (id: string) =>
  (await server.sys('select final_text, in_book, deleted_at, raw_transcript, language from entries where id = $1', [id])).rows[0] as
    | { final_text: string; in_book: boolean; deleted_at: string | null; raw_transcript: string; language: string | null }
    | undefined;
const row = (p: Phone, id: string) =>
  p.db.get<{ final_text: string; raw_transcript: string; deleted_at: string | null; sync_state: string; author_id: string | null; language: string | null; in_book: number }>(
    'SELECT * FROM entries WHERE id = ?', id);
const outbox = (p: Phone) => p.db.all<{ type: string }>('SELECT type FROM sync_outbox ORDER BY lane, seq').map((r) => r.type);

/** A typed letter through the capture path: draft, Review's choices, then saveLetterFromDraft (as review.tsx does). */
function writeLetter(p: Phone, childId: string, text: string, opts: { inBook?: boolean; language?: string; month?: string } = {}): string {
  tick(5_000);
  const d = p.store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  if (opts.language) expect(p.store.setDraftLanguage(d.id, opts.language)).toBe(true);
  if (opts.month) expect(p.store.setDraftOccurred(d.id, opts.month, 'month')).toBe(true);
  const child = p.store.getChild(childId)!;
  p.store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: opts.inBook ?? true,
    soundsLikeMe: null, childId, authorSignsAs: child.signsAs, audioUri: null,
  });
  return d.id;
}

/** An edit of a saved letter's words, through the store's upsert (the letter edit screen is not built yet, WP-F06-07). */
function editWords(p: Phone, id: string, text: string): void {
  tick(5_000);
  const e = p.store.getEntry(id)!;
  p.store.saveEntry({ ...e, finalText: text });
}

const ledgerCount = (p: Phone) => p.store.ledgerDb().counts();

describe('two parents, three phones, one server (protocol v1)', () => {
  let mama: Phone;
  let papa: Phone;
  let mama2: Phone;
  let ASHA = '';
  const ids: Record<string, string> = {};

  // Each case starts a fresh rate window: the server allows 60 pushes a minute per person, and Mama's
  // two phones share one account across the whole file (the limit itself is S02's, tested in test:db).
  beforeEach(async () => {
    if (server) await server.sys('delete from sync_rate_windows');
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA, PAPA], protocol: 'v1' });
    await server.consent(MAMA, PAPA);
    mama = await phone('mama', MAMA);
    papa = await phone('papa', PAPA);
    mama2 = await phone('mama2', MAMA);
  }, 120_000);

  it('[A-REQ-015] [G-26] letters made before any account go up at the first sign-in, with their language and date choices', async () => {
    ASHA = mama.store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Mama' }).id;
    ids.first = writeLetter(mama, ASHA, 'You found your feet today.', { language: 'en-GB' });
    ids.month = writeLetter(mama, ASHA, 'The month you learned to wave.', { month: '2026-09-17' });
    expect(outbox(mama)).toEqual([]); // nothing queues before the first sign-in
    expect(mama.store.getEntry(ids.month)).toMatchObject({ occurredOn: '2026-09-01', occurredPrecision: 'month' });

    await mama.signIn();
    expect(outbox(mama)).toEqual([]);
    expect(await serverEntry(ids.first)).toMatchObject({ final_text: 'You found your feet today.', language: 'en' }); // en-GB travels as the server code
    expect(row(mama, ids.first)).toMatchObject({ language: 'en-GB', sync_state: 'synced', author_id: MAMA }); // the phone keeps its finer tag
    expect(ledgerCount(mama)).toEqual({ recorded: 2, present: 2 });
  }, 60_000);

  it('[F16-REQ-007] [F16-REQ-085] Papa joins: the book, its settings and the in-book letters arrive; never a raw transcript or a language', async () => {
    const token = (await server.userSql(MAMA, `select public.create_child_invite($1, 'parent') t`, [ASHA])).rows[0].t;
    await server.userSql(PAPA, 'select public.accept_child_invite($1)', [token]);
    await papa.signIn();
    expect(papa.store.getChild(ASHA)).toMatchObject({ name: 'Asha', role: 'parent', createdByMe: false });
    expect(row(papa, ids.first)).toMatchObject({ final_text: 'You found your feet today.', raw_transcript: '', author_id: MAMA, language: null });
    // With S02's wire-contract columns (20261015030000) the month precision reaches the server and the co-parent.
    const hasPrecision = (await server.sys(
      "select 1 from information_schema.columns where table_name = 'entries' and column_name = 'occurred_precision'")).rows.length === 1;
    if (hasPrecision) {
      expect((await server.sys('select occurred_precision from entries where id = $1', [ids.month])).rows[0].occurred_precision).toBe('month');
      expect(papa.db.get('SELECT occurred_precision FROM entries WHERE id = ?', ids.month)).toEqual({ occurred_precision: 'month' });
    }
    expect(papa.store.listMembers(ASHA).map((m) => m.id)).toEqual([MAMA]);
  }, 60_000);

  it('[F14-REQ-036] the other parent\'s letters never count on Papa\'s phone; his own first letter is free letter 1', async () => {
    expect(ledgerCount(papa)).toEqual({ recorded: 0, present: 0 });
    ids.papa = writeLetter(papa, ASHA, 'Bath time, and you splashed us both.');
    expect(ledgerCount(papa)).toEqual({ recorded: 1, present: 1 });
    await papa.sync();
    await mama.sync();
    expect(row(mama, ids.papa)).toMatchObject({ author_id: PAPA, raw_transcript: '' });
    expect(ledgerCount(mama)).toEqual({ recorded: 2, present: 2 }); // Papa's letter on Mama's phone never counts
  }, 60_000);

  it('[F16-REQ-009] edit, delete and restore of a letter reach the co-parent\'s phone', async () => {
    editWords(mama, ids.first, 'You found your feet today, and then the floor.');
    await mama.sync();
    await papa.sync();
    expect(row(papa, ids.first)?.final_text).toBe('You found your feet today, and then the floor.');

    tick();
    mama.store.deleteEntry(ids.first);
    await mama.sync();
    expect((await serverEntry(ids.first))?.deleted_at).not.toBeNull();
    await papa.sync();
    expect(row(papa, ids.first)).toBeNull(); // someone else's deleted letter leaves the phone
    expect(mama.store.listDeleted().map((e) => e.id)).toContain(ids.first); // Recently deleted on the author's phone

    tick();
    mama.store.undeleteEntry(ids.first);
    expect(outbox(mama)).toEqual(['entry.restore', 'entry.upsert']);
    const r = await mama.sync();
    expect(r).toMatchObject({ rejected: 0, conflicts: 0 }); // the restore's re-sent words are no conflict
    expect((await serverEntry(ids.first))?.deleted_at).toBeNull();
    await papa.sync();
    expect(row(papa, ids.first)?.final_text).toBe('You found your feet today, and then the floor.');
  }, 60_000);

  it('[F12] [C5] children edits: book settings reach the other parent; each parent\'s signature is their own; two renames end the same on both', async () => {
    tick();
    mama.store.updateChild(ASHA, { name: 'Asha Rose', birthday: '2025-04-13' });
    papa.store.updateChild(ASHA, { signsAs: 'Papa' });
    await mama.sync();
    await papa.sync();
    await mama.sync();
    expect(papa.store.getChild(ASHA)).toMatchObject({ name: 'Asha Rose', birthday: '2025-04-13', signsAs: 'Papa' });
    expect(mama.store.getChild(ASHA)).toMatchObject({ signsAs: 'Mama' });
    expect(mama.store.listMembers(ASHA)).toEqual([expect.objectContaining({ id: PAPA, signsAs: 'Papa' })]);

    // Both parents rename the book offline: the later arrival wins on the server and on both phones (F16 C5).
    tick();
    mama.store.updateChild(ASHA, { name: 'Asha R.' });
    papa.store.updateChild(ASHA, { name: 'Little Asha' });
    await mama.sync();
    await papa.sync();
    await mama.sync();
    expect((await server.sys('select name from children where id = $1', [ASHA])).rows[0].name).toBe('Little Asha');
    expect(mama.store.getChild(ASHA)?.name).toBe('Little Asha');
    expect(papa.store.getChild(ASHA)?.name).toBe('Little Asha');
  }, 60_000);

  it('[F16-REQ-010] [F16-REQ-082] a words conflict between Mama\'s two phones: compare and set, both versions kept, a kill loses neither, the author chooses', async () => {
    await mama2.signIn();
    expect(row(mama2, ids.first)).toMatchObject({ final_text: 'You found your feet today, and then the floor.', sync_state: 'synced' });

    // Both of Mama's phones are offline and change the same letter's words.
    editWords(mama, ids.first, 'You found your feet, then the floor, then the cat.');
    editWords(mama2, ids.first, 'You stood up by yourself today.');
    await mama.sync(); // first to arrive: the server takes these words
    const r = await mama2.sync(); // second: refused for the words, kept on this phone
    expect(r.conflicts).toBe(1);
    expect((await serverEntry(ids.first))?.final_text).toBe('You found your feet, then the floor, then the cat.');
    expect(row(mama2, ids.first)?.final_text).toBe('You found your feet, then the floor, then the cat.'); // the letter follows the server
    expect(mama2.store.listConflicts(ids.first).map((c) => c.words.final_text)).toEqual(['You stood up by yourself today.']);
    expect(mama2.store.listConflicts(ids.first)[0].words).toBeDefined();
    expect(outbox(mama2)).toEqual([]); // never re-sent unless the author picks it

    // The app is killed on the second phone: both versions are still there.
    mama2.relaunch();
    expect(mama2.store.getEntry(ids.first)?.finalText).toBe('You found your feet, then the floor, then the cat.');
    const [copy] = mama2.store.listConflicts(ids.first);
    expect(copy.words.final_text).toBe('You stood up by yourself today.');

    // Papa reads the letter: he sees the words the server holds, never the conflict copy.
    await papa.sync();
    expect(row(papa, ids.first)?.final_text).toBe('You found your feet, then the floor, then the cat.');

    // "Use this phone's version": those words become the letter's again, everywhere; the others stay in history.
    expect(mama2.store.resolveConflict(copy.opId, 'mine')).toBe(true);
    const r2 = await mama2.sync();
    expect(r2.conflicts).toBe(0);
    expect((await serverEntry(ids.first))?.final_text).toBe('You stood up by yourself today.');
    expect((await server.sys('select 1 from entry_versions where entry_id = $1 and final_text = $2', [ids.first, 'You found your feet, then the floor, then the cat.'])).rows).toHaveLength(1);
    await mama.sync();
    await papa.sync();
    expect(row(mama, ids.first)?.final_text).toBe('You stood up by yourself today.');
    expect(row(papa, ids.first)?.final_text).toBe('You stood up by yourself today.');
    expect(mama2.store.listConflicts()).toEqual([]);
    expect(row(mama2, ids.first)?.raw_transcript).toBe('You found your feet today.'); // raw never changes
  }, 60_000);

  it('[F16-REQ-010] "Keep the other one" lets this phone\'s copy go and sends nothing', async () => {
    editWords(mama, ids.month, 'The month you learned to wave, and to clap.');
    editWords(mama2, ids.month, 'The month you waved at everyone.');
    await mama.sync();
    await mama2.sync();
    const [copy] = mama2.store.listConflicts(ids.month);
    expect(copy.words.final_text).toBe('The month you waved at everyone.');
    expect(mama2.store.resolveConflict(copy.opId, 'theirs')).toBe(true);
    expect(outbox(mama2)).toEqual([]);
    await mama2.sync();
    expect((await serverEntry(ids.month))?.final_text).toBe('The month you learned to wave, and to clap.');
    expect(mama2.store.listConflicts()).toEqual([]);
  }, 60_000);

  it('[F16 C2] another phone\'s book change is never a words conflict, and its newer words are taken before this phone writes', async () => {
    editWords(mama, ids.month, 'The month you learned to wave, clap and laugh.');
    await mama.sync(); // the words changed on the server
    tick();
    mama2.store.setEntryInBook(ids.month, false); // the second phone only takes the letter out of the book
    const r = await mama2.sync();
    expect(r.conflicts).toBe(0);
    expect(row(mama2, ids.month)).toMatchObject({ final_text: 'The month you learned to wave, clap and laugh.', in_book: 0 });
    expect(await serverEntry(ids.month)).toMatchObject({ final_text: 'The month you learned to wave, clap and laugh.', in_book: false });
    // Its next words edit is based on those words: no conflict, nothing lost.
    editWords(mama2, ids.month, 'The month you learned to wave, clap, laugh and sing.');
    expect((await mama2.sync()).conflicts).toBe(0);
    expect((await serverEntry(ids.month))?.final_text).toBe('The month you learned to wave, clap, laugh and sing.');
    await papa.sync();
    expect(row(papa, ids.month)).toBeNull(); // out of the book: it leaves the co-parent's phone
  }, 60_000);

  it('[F16-REQ-025] two edits queued on one phone never raise a conflict, even when the first answer was lost', async () => {
    editWords(mama, ids.first, 'You stood up by yourself today, twice.');
    const lost = await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' }));
    expect(lost.phase).toBe('offline');
    editWords(mama, ids.first, 'You stood up by yourself today, twice, and laughed.');
    expect(outbox(mama)).toEqual(['entry.upsert', 'entry.upsert']); // the sent op is never rewritten
    tick(2_000);
    const r = await mama.sync();
    expect(r).toMatchObject({ conflicts: 0, rejected: 0, phase: 'idle' });
    expect((await serverEntry(ids.first))?.final_text).toBe('You stood up by yourself today, twice, and laughed.');
    expect(mama.store.listConflicts()).toEqual([]);
  }, 60_000);

  it('[F16-REQ-010] a refused push whose answer was lost: the retry still keeps this phone\'s words as a conflict copy', async () => {
    await mama2.sync();
    editWords(mama, ids.first, 'You pulled yourself up on the sofa.');
    editWords(mama2, ids.first, 'You stood at the sofa and grinned.');
    await mama.sync();
    const lost = await mama2.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' })); // refused, answer lost
    expect(lost.phase).toBe('offline');
    tick(2_000);
    const r = await mama2.sync(); // a duplicate: the server answers the refusal again, never a rebase
    expect(r.conflicts).toBe(1);
    expect((await serverEntry(ids.first))?.final_text).toBe('You pulled yourself up on the sofa.');
    expect(row(mama2, ids.first)?.final_text).toBe('You pulled yourself up on the sofa.');
    expect(mama2.store.listConflicts(ids.first).map((c) => c.words.final_text)).toEqual(['You stood at the sofa and grinned.']);
    mama2.relaunch();
    tick(2_000);
    await mama2.sync(); // later pulls never drop the copy
    expect(mama2.store.listConflicts(ids.first).map((c) => c.words.final_text)).toEqual(['You stood at the sofa and grinned.']);
    expect(mama2.store.resolveConflict(mama2.store.listConflicts(ids.first)[0].opId, 'theirs')).toBe(true);
  }, 60_000);

  it('[F16-REQ-010] a refused push whose answer was lost, then a second edit: the server never takes words based on a version this phone never saw', async () => {
    editWords(mama, ids.first, 'You pulled yourself up, then sat down with a bump.');
    editWords(mama2, ids.first, 'You stood, then sat.');
    await mama.sync();
    await mama2.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' }));
    editWords(mama2, ids.first, 'You stood, then sat, then laughed.');
    tick(2_000);
    const r = await mama2.sync();
    expect(r.conflicts).toBe(1);
    expect((await serverEntry(ids.first))?.final_text).toBe('You pulled yourself up, then sat down with a bump.');
    expect(mama2.store.listConflicts(ids.first).map((c) => c.words.final_text)).toEqual(['You stood, then sat, then laughed.']);
    expect(outbox(mama2)).toEqual([]); // the queued words stopped travelling
    expect(mama2.store.resolveConflict(mama2.store.listConflicts(ids.first)[0].opId, 'theirs')).toBe(true);
    await mama.sync();
  }, 60_000);

  it('[F16-REQ-010] the words version never falls behind a version already handed out (xid order is not commit order)', async () => {
    if (!server.standIn) return; // S02's migration owns this rule once it lands
    const ahead = '99999999';
    await server.sys('alter table entries disable trigger entries_sync_xid');
    await server.sys('update entries set sync_xid = $2::xid8 where id = $1', [ids.first, ahead]);
    await server.sys('alter table entries enable trigger entries_sync_xid');
    await server.sys("update entries set final_text = final_text || ' ' where id = $1", [ids.first]); // an older xid commits words later
    const { rows } = await server.sys('select text_xid::text as t from entries where id = $1', [ids.first]);
    expect(BigInt(rows[0].t as string) > BigInt(ahead)).toBe(true);
    await server.sys("update entries set final_text = rtrim(final_text) where id = $1", [ids.first]);
  }, 60_000);

  it('the receipt helpers are not client RPCs: none in public, none callable by anon (review B2-3)', async () => {
    if (!server.standIn) return; // S02's migration owns these once it lands
    const { rows } = await server.sys(
      "select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and (p.proname like '%note_applied%' or p.proname like '%dup_outcome%')");
    expect(rows).toEqual([]);
    const priv = await server.sys(`select has_schema_privilege('anon', 'sync_private', 'usage') as schema_use,
      has_function_privilege('anon', 'sync_private.note_applied(uuid, uuid, boolean, boolean)', 'execute') as note,
      has_function_privilege('anon', 'sync_private.dup_outcome(uuid, uuid)', 'execute') as dup`);
    expect(priv.rows[0]).toEqual({ schema_use: false, note: false, dup: false });
  });

  it('[F14-REQ-036] after every sync, each phone counts only its own author\'s letters', () => {
    expect(ledgerCount(mama).present).toBe(2);
    expect(ledgerCount(mama2).present).toBe(2); // the same author's letters, pulled to a second phone
    expect(ledgerCount(papa).present).toBe(1);
  });

  // ── Held drafts (v8; F16 6.2 I, WP-F14-22 and WP-F16-17) ─────────────────
  const heldRow = async (id: string) =>
    (await server.sys('select kind, typed_text, author_id, in_book_choice from held_drafts where id = $1', [id])).rows[0] as
      | { kind: string; typed_text: string | null; author_id: string; in_book_choice: boolean | null }
      | undefined;
  const gone = async (id: string) => (await server.sys('select gone from held_drafts_gone where id = $1', [id])).rows[0]?.gone;
  const typedDraft = (p: Phone, text: string) => {
    tick(5_000);
    return p.store.createDraft({ childId: ASHA, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text }).id;
  };
  /** Papa's pull as his phone asks for it: the in-book digest and the held section. */
  const papaPull = async () => {
    const r = await server.serverFor(PAPA).rpc('sync_pull', { p_since: { books: { [ASHA]: {} }, held: { cursor: null } }, p_limit: 200 });
    const d = r.data as { books: { visible: unknown }[]; held: { rows: unknown[] } };
    return { visible: d.books[0].visible, held: d.held.rows };
  };

  it('[F16-REQ-029] [F14-REQ-039] a held letter goes up as an author-only row; the co-parent never sees it; the author\'s other phone gets it in the waiting row', async () => {
    const before = await papaPull();
    ids.held = typedDraft(mama, 'You asked for more at breakfast.');
    expect(outbox(mama)).toEqual([]); // a draft that was never held never leaves the phone
    mama.store.setDraftTyped(ids.held, 'You asked for more at breakfast, and more again.');
    expect(outbox(mama)).toEqual([]);
    expect(mama.store.holdDraft(ids.held, { inBookChoice: true })).toBe(true);
    expect(outbox(mama)).toEqual(['held.upsert']);
    await mama.sync();
    expect(outbox(mama)).toEqual([]);
    expect(await heldRow(ids.held)).toEqual({ kind: 'held_letter', typed_text: 'You asked for more at breakfast, and more again.', author_id: MAMA, in_book_choice: true });

    // The co-parent: no row through RLS, nothing in his pull, the same book digest.
    expect((await server.userSql(PAPA, 'select count(*)::int as n from held_drafts')).rows[0].n).toBe(0);
    expect(await papaPull()).toEqual(before);
    await papa.sync();
    expect(papa.db.get('SELECT id FROM drafts WHERE id = ?', ids.held)).toBeNull();
    expect(row(papa, ids.held)).toBeNull();

    // Mama's second phone: the held letter arrives in the waiting row, words and choice intact (F14-REQ-041).
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).map((d) => [d.id, d.typedText, d.inBookChoice])).toEqual([
      [ids.held, 'You asked for more at breakfast, and more again.', true],
    ]);
    expect(outbox(mama2)).toEqual([]); // what arrived is not sent back
  }, 60_000);

  it('[F16-REQ-029] held words by compare and set between Mama\'s two phones: both kept, the author chooses', async () => {
    mama.store.setDraftTyped(ids.held, 'You asked for more at breakfast, then for the spoon.');
    mama2.store.setDraftTyped(ids.held, 'More, you said, at breakfast.');
    await mama.sync();
    const r = await mama2.sync();
    expect(r.conflicts).toBe(1);
    expect((await heldRow(ids.held))?.typed_text).toBe('You asked for more at breakfast, then for the spoon.');
    expect(mama2.store.listHeldDrafts(ASHA)[0].typedText).toBe('You asked for more at breakfast, then for the spoon.');
    const [copy] = mama2.store.listConflicts(ids.held);
    expect(copy).toMatchObject({ draft: true, words: { final_text: 'More, you said, at breakfast.' } });
    expect(outbox(mama2)).toEqual([]);
    mama2.relaunch();
    expect(mama2.store.listConflicts(ids.held).map((c) => c.words.final_text)).toEqual(['More, you said, at breakfast.']);

    expect(mama2.store.resolveConflict(copy.opId, 'mine')).toBe(true);
    expect(outbox(mama2)).toEqual(['held.upsert']);
    expect((await mama2.sync()).conflicts).toBe(0);
    expect((await heldRow(ids.held))?.typed_text).toBe('More, you said, at breakfast.');
    await mama.sync();
    expect(mama.store.listHeldDrafts(ASHA)[0].typedText).toBe('More, you said, at breakfast.');
    expect(mama2.store.listConflicts()).toEqual([]);
  }, 60_000);

  it('[F16-REQ-029] Keep after Plus: the held draft becomes a letter, its held row goes in the same transaction, the other phone keeps one copy', async () => {
    const recorded = ledgerCount(mama).recorded;
    tick(5_000);
    const d = mama.store.listHeldDrafts(ASHA)[0];
    mama.store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: d.typedText!, machineEdits: [], finalText: d.typedText!, inBook: true,
      soundsLikeMe: null, childId: ASHA, authorSignsAs: 'Mama', audioUri: null,
    });
    expect(outbox(mama)).toEqual(['entry.upsert']);
    expect(ledgerCount(mama).recorded).toBe(recorded + 1); // kept with its words: it counts now (M17)
    await mama.sync();
    expect(await heldRow(ids.held)).toBeUndefined();
    expect(await gone(ids.held)).toBe('kept');
    expect((await serverEntry(ids.held))?.final_text).toBe('More, you said, at breakfast.');

    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA)).toEqual([]);
    expect(row(mama2, ids.held)).toMatchObject({ final_text: 'More, you said, at breakfast.', author_id: MAMA });
    await papa.sync();
    expect(row(papa, ids.held)?.final_text).toBe('More, you said, at breakfast.'); // now a letter in the book
  }, 60_000);

  it('[F16-REQ-029] Keep on one phone while the other changed the held words: those words stay as a conflict copy of the letter (review A-1)', async () => {
    ids.keptRace = typedDraft(mama, 'You found the cat asleep in the basket.');
    mama.store.holdDraft(ids.keptRace, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    mama2.store.setDraftTyped(ids.keptRace, 'You found the cat asleep in your basket, and laughed.'); // offline
    tick(5_000);
    const d = mama.store.listHeldDrafts(ASHA).find((x) => x.id === ids.keptRace)!;
    mama.store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: d.typedText!, machineEdits: [], finalText: d.typedText!, inBook: true,
      soundsLikeMe: null, childId: ASHA, authorSignsAs: 'Mama', audioUri: null,
    });
    await mama.sync();
    await mama2.sync(); // its held upload meets the kept letter, then the letter arrives
    expect(row(mama2, ids.keptRace)?.final_text).toBe('You found the cat asleep in the basket.');
    const [copy] = mama2.store.listConflicts(ids.keptRace);
    expect(copy?.words.final_text).toBe('You found the cat asleep in your basket, and laughed.');
    expect(mama2.store.resolveConflict(copy.opId, 'mine')).toBe(true);
    await mama2.sync();
    expect((await serverEntry(ids.keptRace))?.final_text).toBe('You found the cat asleep in your basket, and laughed.');
    expect((await serverEntry(ids.keptRace))?.raw_transcript).toBe('You found the cat asleep in the basket.'); // raw never changes
    await mama.sync();
  }, 60_000);

  it('[F16-REQ-029] letting a held draft go lets this phone\'s conflict copy of its words go too (review B-1)', async () => {
    ids.copyGo = typedDraft(mama, 'Your hands in the flour.');
    mama.store.holdDraft(ids.copyGo, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    mama.store.setDraftTyped(ids.copyGo, 'Your hands in the flour, and on my nose.');
    mama2.store.setDraftTyped(ids.copyGo, 'Flour everywhere.');
    await mama.sync();
    expect((await mama2.sync()).conflicts).toBe(1);
    expect(mama2.store.listConflicts(ids.copyGo)).toHaveLength(1);
    expect(mama2.store.beginDiscard(ids.copyGo)).toBe(true);
    expect(mama2.store.listConflicts()).toEqual([]);
    await mama2.sync();
    expect(await heldRow(ids.copyGo)).toBeUndefined();
    await mama.sync();
    expect(mama.store.listHeldDrafts(ASHA).map((x) => x.id)).not.toContain(ids.copyGo);
  }, 60_000);

  it('[F16-REQ-029] [F16-U31] let go on one phone: the row leaves the server and the other phone lets its copy go', async () => {
    ids.letGo = typedDraft(mama, 'The day you met the rain.');
    mama.store.holdDraft(ids.letGo, { inBookChoice: null });
    await mama.sync();
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).map((d) => d.id)).toEqual([ids.letGo]);

    expect(mama.store.beginDiscard(ids.letGo)).toBe(true);
    expect(mama.store.finishDiscard(ids.letGo)).toBe(true);
    expect(outbox(mama)).toEqual(['held.discard']);
    await mama.sync();
    expect(await heldRow(ids.letGo)).toBeUndefined();
    expect(await gone(ids.letGo)).toBe('discarded');
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA)).toEqual([]);
    expect(mama2.db.get<{ state: string }>('SELECT state FROM drafts WHERE id = ?', ids.letGo)?.state).toBe('discarding'); // the launch sweep finishes it
    expect(outbox(mama2)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-029] [F14-REQ-037] a voice-only letter waiting for its words is a waiting_letter row; once its words exist the letter replaces it', async () => {
    tick(5_000);
    const draft = mama.store.createDraft({ childId: ASHA, captureMode: 'spoken', promptKey: null, audioUri: 'file:///asha/take-1.m4a', audioDurationMs: 4_000 });
    const recorded = ledgerCount(mama).recorded;
    const e = mama.store.saveVoiceOnlyFromDraft(draft, { childId: ASHA, authorSignsAs: 'Mama', inBook: true, engineVersion: 5, audioExists: true });
    ids.waiting = e.id;
    expect(ledgerCount(mama).recorded).toBe(recorded); // no words yet: it does not count
    expect(outbox(mama)).toEqual(['held.upsert']);
    await mama.sync();
    expect((await heldRow(ids.waiting))?.kind).toBe('waiting_letter');
    expect(await serverEntry(ids.waiting)).toBeUndefined();
    await papa.sync();
    expect(row(papa, ids.waiting)).toBeNull();
    await mama2.sync();
    expect(mama2.store.listWaitingForWords(ASHA).map((x) => x.id)).toEqual([ids.waiting]); // its recording returns through backup (F08)

    tick();
    expect(mama.store.setWordsForWaitingEntry(ids.waiting, {
      rawTranscript: 'you clapped for the bath', machineEdits: [], finalText: 'you clapped for the bath', editLevel: 'verbatim', engineVersion: 5,
    })).toBe(true);
    expect(outbox(mama)).toEqual(['entry.upsert']);
    await mama.sync();
    expect(await heldRow(ids.waiting)).toBeUndefined();
    expect(await gone(ids.waiting)).toBe('kept');
    expect((await serverEntry(ids.waiting))?.raw_transcript).toBe('you clapped for the bath');
    await mama2.sync();
    expect(row(mama2, ids.waiting)).toMatchObject({ final_text: 'you clapped for the bath', raw_transcript: 'you clapped for the bath' });
    expect(mama2.store.listWaitingForWords(ASHA)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] without consent a held upload waits on the phone; letting one go still reaches the server', async () => {
    ids.kept = typedDraft(mama, 'Your first word was a song.');
    mama.store.holdDraft(ids.kept, { inBookChoice: true });
    await mama.sync();
    await server.sensitiveConsent(MAMA, 'withdraw');
    ids.paused = typedDraft(mama, 'You hummed all the way home.');
    mama.store.holdDraft(ids.paused, { inBookChoice: true });
    mama.store.deleteDraft(ids.kept);
    expect(outbox(mama)).toEqual(['held.upsert', 'held.discard']);
    const r = await mama.sync();
    expect(r.phase).toBe('paused_consent');
    expect(await heldRow(ids.paused)).toBeUndefined();
    expect(await heldRow(ids.kept)).toBeUndefined(); // the let-go reached the server while paused
    expect(outbox(mama)).toEqual(['held.upsert']);

    await server.sensitiveConsent(MAMA, 'accept');
    await mama.sync();
    expect((await heldRow(ids.paused))?.typed_text).toBe('You hummed all the way home.');
    expect(outbox(mama)).toEqual([]);
  }, 60_000);

  // ── Erase now with sync on (WP-F16-13; F16-REQ-024, D-085) ─────────────
  it('[F16-REQ-024] Erase now: the server copy and its history go at once, and the author\'s other phone drops it at its next pull', async () => {
    ids.erase = writeLetter(mama, ASHA, 'The day you threw the spoon.');
    await mama.sync();
    editWords(mama, ids.erase, 'The day you threw the spoon, twice.');
    await mama.sync();
    await mama2.sync();
    await papa.sync();
    expect(row(papa, ids.erase)).not.toBeNull();

    tick();
    mama.store.deleteEntry(ids.erase);
    await mama.sync();
    await mama2.sync();
    await papa.sync();
    expect(mama2.store.listDeleted().map((e) => e.id)).toContain(ids.erase);
    expect(row(papa, ids.erase)).toBeNull(); // someone else's deleted letter already left Papa's phone

    expect(mama.store.eraseEntry(ids.erase, () => {})).toBe(true);
    expect(row(mama, ids.erase)).toBeNull();
    expect(outbox(mama)).toEqual(['entry.erase']);
    await mama.sync();
    expect(outbox(mama)).toEqual([]);
    expect(await serverEntry(ids.erase)).toBeUndefined();
    expect((await server.sys('select count(*)::int as n from entry_versions where entry_id = $1', [ids.erase])).rows[0].n).toBe(0);
    expect((await server.sys("select 1 from purge_ledger where entity_type = 'entry' and entity_id = $1", [ids.erase])).rows).toHaveLength(1);

    await mama2.sync(); // an ordinary pull, not the daily verify
    expect(row(mama2, ids.erase)).toBeNull();
    expect(mama2.store.listDeleted().map((e) => e.id)).not.toContain(ids.erase);
    expect(outbox(mama2)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-024] Erase now before the delete ever left: the server erases the live copy and the co-parent\'s phone drops it', async () => {
    ids.eraseLive = writeLetter(mama, ASHA, 'Your first time on the swing.');
    await mama.sync();
    await papa.sync();
    expect(row(papa, ids.eraseLive)).not.toBeNull();
    tick();
    mama.store.deleteEntry(ids.eraseLive);
    expect(mama.store.eraseEntry(ids.eraseLive, () => {})).toBe(true);
    expect(outbox(mama)).toEqual(['entry.erase']); // the queued delete went with the row
    const lost = await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' }));
    expect(lost.phase).toBe('offline');
    expect(await serverEntry(ids.eraseLive)).toBeUndefined(); // applied, answer lost
    tick(2_000);
    expect(await mama.sync()).toMatchObject({ rejected: 0, phase: 'idle' }); // the retry is a no-op
    expect(outbox(mama)).toEqual([]);
    await papa.sync();
    expect(row(papa, ids.eraseLive)).toBeNull();
  }, 60_000);

  it('[F16-REQ-024] only the author erases: the co-parent\'s erase of Mama\'s letter changes nothing and says nothing about it', async () => {
    const r = await server.serverFor(PAPA).rpc('sync_push', { p_ops: [{ op: uuid7(), type: 'entry.erase', id: ids.first, data: {} }] });
    const none = await server.serverFor(PAPA).rpc('sync_push', { p_ops: [{ op: uuid7(), type: 'entry.erase', id: uuid7(), data: {} }] });
    const strip = (x: unknown) => { const o = (x as { results: Record<string, unknown>[] }).results[0]; return { ok: o.ok, missing: o.missing }; };
    expect(strip(r.data)).toEqual({ ok: true, missing: true });
    expect(strip(none.data)).toEqual(strip(r.data)); // the same answer as no letter at all
    expect((await serverEntry(ids.first))?.deleted_at).toBeNull();
  }, 60_000);

  it('[F16-REQ-024] Erase now on a voice-only letter waiting for its words: its held row goes, and the other phone erases its copy, never restorable (review A2-1, final review B4)', async () => {
    tick(5_000);
    const draft = mama.store.createDraft({ childId: ASHA, captureMode: 'spoken', promptKey: null, audioUri: 'file:///asha/take-2.m4a', audioDurationMs: 3_000 });
    const e = mama.store.saveVoiceOnlyFromDraft(draft, { childId: ASHA, authorSignsAs: 'Mama', inBook: true, engineVersion: 5, audioExists: true });
    await mama.sync();
    await mama2.sync();
    expect(mama2.store.listWaitingForWords(ASHA).map((x) => x.id)).toContain(e.id);
    tick();
    mama.store.deleteEntry(e.id);
    expect(mama.store.eraseEntry(e.id, () => {})).toBe(true);
    expect(outbox(mama)).toEqual(['entry.erase']);
    await mama.sync();
    expect(await heldRow(e.id)).toBeUndefined();
    expect(await gone(e.id)).toBe('erased');
    await mama2.sync();
    expect(mama2.store.listWaitingForWords(ASHA).map((x) => x.id)).not.toContain(e.id);
    expect(mama2.store.listDeleted().map((x) => x.id)).not.toContain(e.id); // nothing left to restore
    expect(row(mama2, e.id)).toBeNull();
  }, 60_000);

  it('[F16-REQ-024] Erase now on a waiting letter deleted earlier: the other phone\'s Recently deleted copy is erased too (final review B4)', async () => {
    tick(5_000);
    const draft = mama.store.createDraft({ childId: ASHA, captureMode: 'spoken', promptKey: null, audioUri: 'file:///asha/take-3.m4a', audioDurationMs: 3_000 });
    const e = mama.store.saveVoiceOnlyFromDraft(draft, { childId: ASHA, authorSignsAs: 'Mama', inBook: true, engineVersion: 5, audioExists: true });
    await mama.sync();
    await mama2.sync();
    tick();
    mama.store.deleteEntry(e.id);
    await mama.sync(); // its held row is let go; the second phone moves it to Recently deleted
    await mama2.sync();
    expect(mama2.store.listDeleted().map((x) => x.id)).toContain(e.id);
    expect(mama.store.eraseEntry(e.id, () => {})).toBe(true);
    expect(outbox(mama)).toEqual(['entry.erase']);
    await mama.sync();
    expect(await gone(e.id)).toBe('erased');
    await mama2.sync();
    expect(mama2.store.listDeleted().map((x) => x.id)).not.toContain(e.id);
    expect(row(mama2, e.id)).toBeNull();
  }, 60_000);

  // ── Held drafts, final review cases ───────────────────────────────────
  it('[F16-REQ-010] a lost held answer that returns as a duplicate never lets this phone overwrite words it never saw (final review A-B1)', async () => {
    const id = typedDraft(mama, 'One.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    mama.store.setDraftTyped(id, 'One, by Mama.');
    await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' })); // applied, answer lost
    mama.store.setDraftTyped(id, 'One, by Mama, twice.'); // offline: a second upload queues behind the first
    await mama2.sync();
    mama2.store.setDraftTyped(id, 'One, by the second phone.');
    expect((await mama2.sync()).conflicts).toBe(0);
    tick(2_000);
    const r = await mama.sync();
    expect(r.conflicts).toBe(1);
    expect((await heldRow(id))?.typed_text).toBe('One, by the second phone.');
    expect(mama.store.listConflicts(id).map((c) => c.words.final_text)).toEqual(['One, by Mama, twice.']);
  }, 60_000);

  it('[LEGAL-REQ-009] a held draft let go during a consent pause stays let go when consent returns (final review A-B2, B-1, P9)', async () => {
    const id = typedDraft(mama, 'You whispered to the dog.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    await server.sensitiveConsent(MAMA, 'withdraw');
    mama.store.setDraftTyped(id, 'You whispered to the dog, and it listened.');
    expect((await mama.sync()).phase).toBe('paused_consent');
    expect(mama.store.beginDiscard(id)).toBe(true);
    expect(mama.store.finishDiscard(id)).toBe(true);
    await mama.sync(); // the let-go goes during the pause
    expect(await heldRow(id)).toBeUndefined();
    await server.sensitiveConsent(MAMA, 'accept');
    await mama.sync();
    expect(await heldRow(id)).toBeUndefined();
    expect(outbox(mama)).toEqual([]);
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).map((x) => x.id)).not.toContain(id);
  }, 60_000);

  it('[F16-REQ-029] a late let-go from an offline phone never erases newer words from the other phone (final review B-2, P1)', async () => {
    const id = typedDraft(mama, 'You sang to the moon.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    expect(mama.store.beginDiscard(id)).toBe(true); // offline: the let-go waits
    mama2.store.setDraftTyped(id, 'You sang to the moon, then waved at it, then fell asleep.');
    await mama2.sync();
    await mama.sync(); // the let-go meets newer words: the row stays, and comes back to this phone
    expect((await heldRow(id))?.typed_text).toBe('You sang to the moon, then waved at it, then fell asleep.');
    await mama.sync();
    expect(mama.store.listHeldDrafts(ASHA).find((x) => x.id === id)?.typedText).toBe('You sang to the moon, then waved at it, then fell asleep.');
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).find((x) => x.id === id)?.typedText).toBe('You sang to the moon, then waved at it, then fell asleep.');
  }, 60_000);

  it('[F16-REQ-029] a date-only change after words changed elsewhere is no conflict, and the newer words stay (final review B-3, P2)', async () => {
    const id = typedDraft(mama, 'Your first snow.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    mama.store.setDraftTyped(id, 'Your first snow, and you tried to eat it.');
    await mama.sync();
    expect(mama2.store.setDraftOccurred(id, '2026-10-01', 'day')).toBe(true); // before pulling the new words
    expect((await mama2.sync()).conflicts).toBe(0);
    expect(mama2.store.listConflicts(id)).toEqual([]);
    expect(await heldRow(id)).toMatchObject({ typed_text: 'Your first snow, and you tried to eat it.' });
    expect((await server.sys('select occurred_on::text as d from held_drafts where id = $1', [id])).rows[0].d).toBe('2026-10-01');
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).find((x) => x.id === id)?.typedText).toBe('Your first snow, and you tried to eat it.');
  }, 60_000);

  it('[F16-REQ-029] the server refuses a second raw transcript once one is set (SCIMM), and a held row of another author is invisible', async () => {
    await server.sys("update held_drafts set raw_transcript = 'you hummed' where id = $1", [ids.paused]);
    await expect(server.userSql(MAMA, "update held_drafts set raw_transcript = 'you sang' where id = $1", [ids.paused])).rejects.toMatchObject({ code: 'SCIMM' });
    expect((await server.userSql(PAPA, 'select id from held_drafts where id = $1', [ids.paused])).rows).toEqual([]);
    await expect(server.userSql(PAPA, "update held_drafts set typed_text = 'x' where id = $1 returning id", [ids.paused])).resolves.toMatchObject({ rows: [] });
    expect((await server.sys('select count(*)::int as n from held_drafts_gone g where g.author_id <> $1', [MAMA])).rows[0].n).toBe(0);
  }, 60_000);

  it('[LEGAL-REQ-009] a letter deleted during a consent pause stays deleted when consent returns (final review B-1, P10)', async () => {
    await server.sensitiveConsent(MAMA, 'withdraw');
    ids.pausedLetter = writeLetter(mama, ASHA, 'You held the spoon by yourself.');
    expect((await mama.sync()).phase).toBe('paused_consent'); // the upload met SCCON and waits
    tick();
    mama.store.deleteEntry(ids.pausedLetter);
    expect(outbox(mama)).toEqual([]); // it never reached the server: deleted before it left, nothing to send
    await mama.sync();
    await server.sensitiveConsent(MAMA, 'accept');
    await mama.sync();
    expect(await serverEntry(ids.pausedLetter)).toBeUndefined();
    expect(mama.store.listDeleted().map((e) => e.id)).toContain(ids.pausedLetter);
    await papa.sync();
    expect(row(papa, ids.pausedLetter)).toBeNull();
  }, 60_000);

  it('[LEGAL-REQ-009] a delete the server took drops every earlier upload of the letter still queued', async () => {
    ids.pausedSynced = writeLetter(mama, ASHA, 'Your laugh at bath time.');
    await mama.sync();
    await papa.sync();
    await server.sensitiveConsent(MAMA, 'withdraw');
    editWords(mama, ids.pausedSynced, 'Your laugh at bath time, and the splash.');
    expect((await mama.sync()).phase).toBe('paused_consent');
    tick();
    mama.store.deleteEntry(ids.pausedSynced);
    await mama.sync(); // the delete goes during the pause
    expect((await serverEntry(ids.pausedSynced))?.deleted_at).not.toBeNull();
    await server.sensitiveConsent(MAMA, 'accept');
    await mama.sync();
    expect((await serverEntry(ids.pausedSynced))?.deleted_at).not.toBeNull(); // the waiting edit never brought it back
    expect(outbox(mama)).toEqual([]);
    await papa.sync();
    expect(row(papa, ids.pausedSynced)).toBeNull();
    expect(mama.store.listDeleted().map((e) => e.id)).toContain(ids.pausedSynced);
  }, 60_000);

  it('[F16-REQ-029] a let-go right after a held upload whose answer was lost sticks on both phones (re-check A-R1)', async () => {
    const id = typedDraft(mama, 'Six.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' })); // applied, answer lost
    expect((await heldRow(id))?.typed_text).toBe('Six.');
    expect(mama.store.beginDiscard(id)).toBe(true);
    expect(mama.store.finishDiscard(id)).toBe(true);
    tick(2_000);
    await mama.sync();
    await mama.sync();
    expect(await heldRow(id)).toBeUndefined();
    expect(mama.store.listHeldDrafts(ASHA).map((x) => x.id)).not.toContain(id);
    await mama2.sync();
    expect(mama2.store.listHeldDrafts(ASHA).map((x) => x.id)).not.toContain(id);
  }, 60_000);

  it('[F16-REQ-024] Erase now holds past the 60 day forget: an offline edit of an erased letter never brings it back (final review B6, P5)', async () => {
    ids.forgot = writeLetter(mama, ASHA, 'You ate a whole pear.');
    await mama.sync();
    await mama2.sync();
    editWords(mama2, ids.forgot, 'You ate a whole pear, and the core.'); // offline
    tick();
    mama.store.deleteEntry(ids.forgot);
    expect(mama.store.eraseEntry(ids.forgot, () => {})).toBe(true);
    await mama.sync();
    await server.sys("delete from purge_ledger where entity_type = 'entry' and entity_id = $1", [ids.forgot]); // the 60 day trim
    const r = await mama2.sync();
    expect(r.pushed).toBe(0);
    expect(await serverEntry(ids.forgot)).toBeUndefined();
    expect(mama2.store.listDeleted().map((e) => e.id)).toContain(ids.forgot); // its words stay on that phone, in Recently deleted
    await mama.sync();
    await papa.sync();
    expect(row(mama, ids.forgot)).toBeNull();
    expect(row(papa, ids.forgot)).toBeNull();
  }, 60_000);

  it('[F16-REQ-024] a Restore made offline on the other phone never undoes Erase now on a waiting letter (re-check B-R2, P3b)', async () => {
    tick(5_000);
    const draft = mama.store.createDraft({ childId: ASHA, captureMode: 'spoken', promptKey: null, audioUri: 'file:///asha/take-4.m4a', audioDurationMs: 3_000 });
    const e = mama.store.saveVoiceOnlyFromDraft(draft, { childId: ASHA, authorSignsAs: 'Mama', inBook: true, engineVersion: 5, audioExists: true });
    await mama.sync();
    await mama2.sync();
    tick();
    mama.store.deleteEntry(e.id);
    await mama.sync();
    await mama2.sync();
    expect(mama2.store.listDeleted().map((x) => x.id)).toContain(e.id);
    mama2.store.undeleteEntry(e.id); // offline
    expect(outbox(mama2)).toEqual(['held.upsert']);
    expect(mama.store.eraseEntry(e.id, () => {})).toBe(true);
    await mama.sync();
    expect(await gone(e.id)).toBe('erased');
    await mama2.sync();
    expect(await heldRow(e.id)).toBeUndefined();
    expect(await gone(e.id)).toBe('erased');
    expect(row(mama2, e.id)).toBeNull();
    expect(outbox(mama2)).toEqual([]);
    await mama.sync();
    expect(row(mama, e.id)).toBeNull();
  }, 60_000);

  it('[F16-REQ-029] Keep on a phone that has not seen the other phone\'s newer held words: both versions are kept, the author chooses (review K blocking 1)', async () => {
    const id = typedDraft(mama, 'You built a tower of cups.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    mama2.store.setDraftTyped(id, 'You built a tower of cups, then knocked it down.');
    await mama2.sync(); // the server's held row has the second phone's words
    tick(5_000);
    const d = mama.store.listHeldDrafts(ASHA).find((x) => x.id === id)!; // not pulled: still the old words
    mama.store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: d.typedText!, machineEdits: [], finalText: d.typedText!, inBook: true,
      soundsLikeMe: null, childId: ASHA, authorSignsAs: 'Mama', audioUri: null,
    });
    const keep = mama.db.get<{ payload: string }>("SELECT payload FROM sync_outbox WHERE entity_id = ? AND type = 'entry.upsert'", id)!;
    expect(JSON.parse(keep.payload)).toHaveProperty('held_base');
    const r = await mama.sync();
    expect(r.conflicts).toBe(1);
    // The letter follows the newer held words everywhere; this phone keeps its own as a conflict copy.
    expect((await serverEntry(id))?.final_text).toBe('You built a tower of cups, then knocked it down.');
    expect(await heldRow(id)).toBeUndefined();
    expect(row(mama, id)?.final_text).toBe('You built a tower of cups, then knocked it down.');
    expect(mama.store.listConflicts(id).map((c) => c.words.final_text)).toEqual(['You built a tower of cups.']);
    await mama2.sync();
    expect(row(mama2, id)?.final_text).toBe('You built a tower of cups, then knocked it down.');
    expect(mama2.store.listHeldDrafts(ASHA).map((x) => x.id)).not.toContain(id);
    // "Use this phone's version": the first phone's words become the letter's, everywhere.
    expect(mama.store.resolveConflict(mama.store.listConflicts(id)[0].opId, 'mine')).toBe(true);
    await mama.sync();
    expect((await serverEntry(id))?.final_text).toBe('You built a tower of cups.');
    await mama2.sync();
    expect(row(mama2, id)?.final_text).toBe('You built a tower of cups.');
  }, 60_000);

  it('[F16-REQ-029] a let-go that met newer words, answered twice after a lost answer, still brings the draft back (review K blocking 2)', async () => {
    const id = typedDraft(mama, 'You sang in the bath.');
    mama.store.holdDraft(id, { inBookChoice: true });
    await mama.sync();
    await mama2.sync();
    expect(mama.store.beginDiscard(id)).toBe(true); // offline: the let-go waits
    mama2.store.setDraftTyped(id, 'You sang in the bath, and the duck joined in.');
    await mama2.sync();
    await mama.sync(flaky(server.serverFor(MAMA), { loseAnswer: 1, only: 'sync_push' })); // kept, answer lost
    await mama.sync(); // the let-go waits out its backoff; this pull already passes the newer held row
    tick(2_000);
    await mama.sync(); // the repeat must answer kept again, or the draft is never pulled back
    await mama.sync();
    expect((await heldRow(id))?.typed_text).toBe('You sang in the bath, and the duck joined in.');
    expect(mama.store.listHeldDrafts(ASHA).find((x) => x.id === id)?.typedText).toBe('You sang in the bath, and the duck joined in.');
  }, 60_000);

  it('[TDD 06 P-1] after a server restore, a letter with an edit queued goes back up with the edit, never as erased (final re-check B-R1, P11)', async () => {
    ids.restored = writeLetter(mama, ASHA, 'Your first word, and it was ball.');
    await mama.sync();
    // The server is restored to a point before that letter existed (the drill in sync-e2e.test.ts).
    const restorePoint = new Date(Date.now() - 3600_000).toISOString();
    await server.sys('set session_replication_role = replica');
    await server.sys('delete from entries where id = $1', [ids.restored]);
    await server.sys('set session_replication_role = origin');
    await server.sys(`select public.sync_begin_epoch('drill', $1)`, [restorePoint]);
    editWords(mama, ids.restored, 'Your first word, and it was ball, twice.');
    await mama.sync(); // it pushes before its pull learns of the restore
    await mama.sync();
    expect(await serverEntry(ids.restored)).toMatchObject({ final_text: 'Your first word, and it was ball, twice.', deleted_at: null });
    expect(row(mama, ids.restored)).toMatchObject({ final_text: 'Your first word, and it was ball, twice.', deleted_at: null });
    expect(mama.store.listDeleted().map((e) => e.id)).not.toContain(ids.restored);
  }, 60_000);
});

// ── The held draft state table (ADR 0025 section 9; S02's half is #208, section 7d) ──
/**
 * One case per cell of the table: one held draft id, one author, two of the author's
 * phones. P sends the cell's op; Q is the author's other phone. Every case starts from
 * the cell's state on the server, reached through the store as screens reach it, and
 * checks what the server answers, what both phones end with, and where the words live.
 * The two client rules every cell assumes: (c1) held_v and held_base move only to a
 * words version this phone's own words produced; (c2) applied false with no letter is
 * a refusal, whatever current says.
 */
describe('the held draft state table, ADR 0025 section 9: two phones of one author, one case per cell', () => {
  let P: Phone; // sends the cell's op
  let Q: Phone; // the author's other phone
  let BOOK = '';

  interface Answer {
    [k: string]: unknown;
    ok?: boolean;
    held?: { id: string; v: string } | null;
    current?: { v: string; final_text?: string | null; typed_text?: string | null } | null;
    entry?: { id: string; v: string } | null;
    applied_v?: string | null;
  }
  interface Seen { type: string; id: string; op: string; sent: Record<string, unknown>; r: Answer }

  beforeEach(async () => {
    if (!server) return;
    await server.sys('delete from sync_rate_windows');
    // A case that failed midway never leaves consent withdrawn for the next one (one failure, not 38).
    const g = (await server.sys('select sensitive_data from public.content_gate_state($1)', [MAMA])).rows[0];
    if (g && !g.sensitive_data) await server.sensitiveConsent(MAMA, 'accept');
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA], protocol: 'v1' });
    await server.consent(MAMA);
    P = await phone('P', MAMA);
    Q = await phone('Q', MAMA);
    BOOK = P.store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Mama' }).id;
    await P.signIn();
    await Q.signIn();
    expect(Q.store.getChild(BOOK)).toMatchObject({ name: 'Asha' });
  }, 120_000);

  /** Every push answer P gets, with the op it answered, as the phone saw it (a lost answer included). */
  const watch = (inner: SupabaseLike = server.serverFor(MAMA)) => {
    const seen: Seen[] = [];
    const s: SupabaseLike = {
      rpc(fn, args) {
        return Promise.resolve(inner.rpc(fn, args)).then((res) => {
          if (fn === 'sync_push' && res.data) {
            const sent = (args as { p_ops: Record<string, unknown>[] }).p_ops;
            for (const a of (res.data as { results?: Answer[] }).results ?? []) {
              const o = sent.find((x) => x.op === a.op);
              if (o) seen.push({ type: String(o.type), id: String(o.id), op: String(o.op), sent: o, r: a });
            }
          }
          return res;
        });
      },
    };
    const of = (type: string, id: string) => seen.filter((x) => x.type === type && x.id === id);
    return { s, answers: (type: string, id: string) => of(type, id).map((x) => x.r), sent: (type: string, id: string) => of(type, id).map((x) => x.sent) };
  };
  const pushOnly = (inner: SupabaseLike) => flaky(inner, { failBefore: 1, only: 'sync_pull' }); // the push, then no pull
  const lost = (inner: SupabaseLike) => flaky(inner, { loseAnswer: 1, only: 'sync_push' }); // applied, the answer lost

  const held = async (id: string) =>
    (await server.sys('select typed_text, text_xid::text as v, occurred_on::text as occurred_on from held_drafts where id = $1', [id])).rows[0] as
      | { typed_text: string | null; v: string; occurred_on: string }
      | undefined;
  const marker = async (id: string) => (await server.sys('select gone from held_drafts_gone where id = $1', [id])).rows[0]?.gone as string | undefined;
  const letter = async (id: string) =>
    (await server.sys(
      `select final_text, raw_transcript, engine_version, in_book, text_xid::text as v,
              (extract(epoch from captured_at) * 1000)::bigint::text as captured_ms
         from entries where id = $1`, [id])).rows[0] as
      | { final_text: string; raw_transcript: string; engine_version: number; in_book: boolean; v: string; captured_ms: string }
      | undefined;
  /** entry_versions holds only words the author replaced by choice: never a Keep's lost words. */
  const history = async (id: string) =>
    (await server.sys('select final_text from entry_versions where entry_id = $1', [id])).rows.map((r) => r.final_text);
  const receipt = async (op: string) => (await server.sys('select 1 from sync_op_receipts where op_id = $1', [op])).rows.length === 1;

  const draft = (p: Phone, id: string) => p.store.listHeldDrafts(BOOK).find((d) => d.id === id);
  const heldV = (p: Phone, id: string) => p.db.get<{ held_v: string | null }>('SELECT held_v FROM drafts WHERE id = ?', id)?.held_v ?? null;
  const copies = (p: Phone, id: string) => p.store.listConflicts(id).map((c) => c.words.final_text);
  const refusedWrites = (p: Phone, id: string) => p.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes WHERE entity_id = ?', id)!.n;
  const local = (p: Phone, id: string) =>
    p.db.get<{ final_text: string; raw_transcript: string; engine_version: number; captured_at: string; in_book: number; deleted_at: string | null }>(
      'SELECT final_text, raw_transcript, engine_version, captured_at, in_book, deleted_at FROM entries WHERE id = ?', id);
  const queued = (p: Phone, type: string, id: string) => {
    const r = p.db.get<{ payload: string; op_id: string }>('SELECT payload, op_id FROM sync_outbox WHERE entity_id = ? AND type = ? ORDER BY seq DESC LIMIT 1', id, type);
    return r ? { opId: r.op_id, op: JSON.parse(r.payload) as Record<string, unknown> } : undefined;
  };

  const typed = (p: Phone, text: string) => {
    tick(5_000);
    return p.store.createDraft({ childId: BOOK, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text }).id;
  };
  /** State B at v on both phones: P holds a typed draft and uploads it; Q pulls it. */
  const shared = async (text: string) => {
    const id = typed(P, text);
    expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true);
    await P.sync();
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe(text);
    expect(heldV(P, id)).not.toBeNull();
    return id;
  };
  /** Keep after Plus, as review.tsx does: the held draft becomes the letter with the draft's words. */
  const keep = (p: Phone, id: string, over: Partial<Parameters<Store['saveLetterFromDraft']>[1]> = {}) => {
    tick(5_000);
    const d = draft(p, id)!;
    p.store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: iso().slice(0, 10), capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: d.typedText!, machineEdits: [], finalText: d.typedText!, inBook: true,
      soundsLikeMe: null, childId: BOOK, authorSignsAs: 'Mama', audioUri: null, ...over,
    });
  };
  const letGo = (p: Phone, id: string) => {
    expect(p.store.beginDiscard(id)).toBe(true);
    expect(p.store.finishDiscard(id)).toBe(true);
  };
  /** A voice-only letter waiting for its words (a waiting_letter row once uploaded). */
  const voiceOnly = (p: Phone, take: string) => {
    tick(5_000);
    const d = p.store.createDraft({ childId: BOOK, captureMode: 'spoken', promptKey: null, audioUri: `file:///asha/${take}.m4a`, audioDurationMs: 3_000 });
    return p.store.saveVoiceOnlyFromDraft(d, { childId: BOOK, authorSignsAs: 'Mama', inBook: true, engineVersion: 5, audioExists: true }).id;
  };
  const eraseNow = (p: Phone, id: string) => {
    tick();
    p.store.deleteEntry(id);
    expect(p.store.eraseEntry(id, () => {})).toBe(true);
  };

  // ── A. None: no held row, letter or marker for the id ────────────────────
  it('[table A, held.upsert] the first upload makes the row at v; this phone takes v; the other phone gets the draft', async () => {
    const w = watch();
    const id = typed(P, 'You found the blue cup.');
    expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true);
    await P.sync(w.s);
    const [a] = w.answers('held.upsert', id);
    expect(a).toMatchObject({ ok: true, held: { id } });
    expect(a.conflict_groups).toBeUndefined();
    expect(heldV(P, id)).toBe(a.held!.v);
    expect(await receipt(String(w.sent('held.upsert', id)[0].op))).toBe(true);
    expect((await held(id))?.typed_text).toBe('You found the blue cup.');
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe('You found the blue cup.');
  }, 60_000);

  it('[table A, held.discard] a let-go that reaches the server before its upload: missing, nothing changes, the words live nowhere', async () => {
    const w = watch();
    const id = typed(P, 'You waved at the bus.');
    expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true);
    await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' })); // the upload left but never arrived
    tick(10 * 60_000);
    await server.sensitiveConsent(MAMA, 'withdraw');
    letGo(P, id);
    expect(outbox(P)).toEqual(['held.upsert', 'held.discard']); // the upload may have arrived: the let-go follows it
    expect((await P.sync(w.s)).phase).toBe('paused_consent'); // the upload waits; the let-go still goes
    expect(w.answers('held.discard', id)).toEqual([expect.objectContaining({ ok: true, missing: true })]);
    expect(outbox(P)).toEqual([]); // the server took the let-go: the upload queued before it never goes
    await server.sensitiveConsent(MAMA, 'accept');
    await P.sync(w.s);
    expect(w.answers('held.upsert', id).filter((r) => r.ok)).toEqual([]);
    expect(await held(id)).toBeUndefined();
    expect(await marker(id)).toBeUndefined();
    await Q.sync();
    expect(draft(Q, id)).toBeUndefined();
  }, 60_000);

  it('[table A, Keep] a Keep of a draft the server never had makes the letter from this phone\'s words', async () => {
    const w = watch();
    const id = typed(P, 'You put your boots on the wrong feet.');
    expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true); // held, not uploaded yet
    keep(P, id);
    expect(outbox(P)).toEqual(['entry.upsert']); // the unsent upload went with the draft
    expect(queued(P, 'entry.upsert', id)?.op.held_base).toBe('0');
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id)).toEqual([expect.objectContaining({ ok: true, applied: true, entry: expect.objectContaining({ id }) })]);
    expect((await letter(id))?.final_text).toBe('You put your boots on the wrong feet.');
    expect(await held(id)).toBeUndefined();
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You put your boots on the wrong feet.');
  }, 60_000);

  it('[table A, entry.erase] Erase now on a waiting letter the server never had: missing, erased here, nothing anywhere', async () => {
    const w = watch();
    const e = voiceOnly(P, 'take-a4');
    expect(outbox(P)).toEqual(['held.upsert']);
    eraseNow(P, e);
    expect(outbox(P)).toEqual(['entry.erase']); // a waiting letter always sends its erase
    await P.sync(w.s);
    expect(w.answers('entry.erase', e)).toEqual([expect.objectContaining({ ok: true, missing: true })]);
    expect(local(P, e)).toBeNull();
    expect(await held(e)).toBeUndefined();
    await Q.sync();
    expect(local(Q, e)).toBeNull();
  }, 60_000);

  // ── B. Held at v ─────────────────────────────────────────────────────────
  it('[table B, held.upsert with text, base known] the words are written at v\'; this phone takes v\'; the other phone gets them', async () => {
    const id = await shared('You laughed at the kettle.');
    const v = heldV(P, id)!;
    P.store.setDraftTyped(id, 'You laughed at the kettle when it sang.');
    expect(queued(P, 'held.upsert', id)?.op).toMatchObject({ base: v, changed: expect.arrayContaining(['text']) });
    const w = watch();
    await P.sync(pushOnly(w.s));
    const [a] = w.answers('held.upsert', id);
    expect(a.conflict_groups).toBeUndefined();
    expect(BigInt(a.held!.v)).toBeGreaterThan(BigInt(v));
    expect(heldV(P, id)).toBe(a.held!.v);
    expect((await held(id))?.typed_text).toBe('You laughed at the kettle when it sang.');
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe('You laughed at the kettle when it sang.');
    expect([copies(P, id), copies(Q, id)]).toEqual([[], []]);
  }, 60_000);

  it('[table B, held.upsert with text, base stale, words differ] text refused, other fields applied; this phone keeps its words as a copy and takes the server\'s words at current.v (c1)', async () => {
    const id = await shared('You hid behind the curtain.');
    Q.store.setDraftTyped(id, 'You hid behind the curtain and giggled.');
    await Q.sync();
    P.store.setDraftTyped(id, 'You hid, and we all pretended not to see.'); // offline: its base is stale now
    expect(P.store.setDraftOccurred(id, '2026-10-02', 'day')).toBe(true);
    const w = watch();
    expect((await P.sync(pushOnly(w.s))).conflicts).toBe(1);
    const [a] = w.answers('held.upsert', id);
    expect(a).toMatchObject({ conflict_groups: ['text'], current: { typed_text: 'You hid behind the curtain and giggled.' } });
    expect(await held(id)).toMatchObject({ typed_text: 'You hid behind the curtain and giggled.', occurred_on: '2026-10-02', v: a.current!.v });
    expect(heldV(P, id)).toBe(a.current!.v); // c1: the version of the words this phone took, never the refused answer's held.v
    expect(draft(P, id)?.typedText).toBe('You hid behind the curtain and giggled.');
    expect(copies(P, id)).toEqual(['You hid, and we all pretended not to see.']);
    await Q.sync();
    expect(draft(Q, id)).toMatchObject({ typedText: 'You hid behind the curtain and giggled.', occurredOn: '2026-10-02' });
    expect(copies(Q, id)).toEqual([]);
  }, 60_000);

  it('[table B, held.upsert with text, base stale, the same words] nothing to refuse: applied at v\'', async () => {
    const id = await shared('You found a feather.');
    Q.store.setDraftTyped(id, 'You found a feather on the step.');
    await Q.sync();
    P.store.setDraftTyped(id, 'You found a feather on the step.'); // the same words, offline
    const w = watch();
    expect((await P.sync(pushOnly(w.s))).conflicts).toBe(0);
    const [a] = w.answers('held.upsert', id);
    expect(a.conflict_groups).toBeUndefined();
    expect(heldV(P, id)).toBe(a.held!.v);
    expect(copies(P, id)).toEqual([]);
    await P.sync();
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe('You found a feather on the step.');
  }, 60_000);

  it('[table B, held.upsert without text] a date change applies, the words version stays v, and held_v does not move (c1)', async () => {
    const id = await shared('Your first puddle.');
    const v = heldV(P, id);
    Q.store.setDraftTyped(id, 'Your first puddle, and both feet in it.');
    await Q.sync();
    expect(P.store.setDraftOccurred(id, '2026-10-03', 'day')).toBe(true); // before pulling the new words
    expect(queued(P, 'held.upsert', id)?.op.changed).not.toContain('text');
    const w = watch();
    expect((await P.sync(pushOnly(w.s))).conflicts).toBe(0);
    const [a] = w.answers('held.upsert', id);
    expect(a.conflict_groups).toBeUndefined();
    expect(a.held!.v).not.toBe(v);
    expect(heldV(P, id)).toBe(v); // an op without text never moves held_v: another phone's words may be newer
    expect(await held(id)).toMatchObject({ typed_text: 'Your first puddle, and both feet in it.', occurred_on: '2026-10-03' });
    await P.sync();
    expect(draft(P, id)?.typedText).toBe('Your first puddle, and both feet in it.');
    await Q.sync();
    expect(draft(Q, id)?.occurredOn).toBe('2026-10-03');
    expect([copies(P, id), copies(Q, id)]).toEqual([[], []]);
  }, 60_000);

  it('[table B, held.discard, base known] the row goes, marker discarded; the other phone lets its copy go at its next pull', async () => {
    const id = await shared('You chased the pigeons.');
    const v = heldV(P, id);
    letGo(P, id);
    expect(queued(P, 'held.discard', id)?.op.base).toBe(v);
    const w = watch();
    await P.sync(w.s);
    const [a] = w.answers('held.discard', id);
    expect(a.ok).toBe(true);
    expect([a.kept, a.missing]).toEqual([undefined, undefined]);
    expect(await held(id)).toBeUndefined();
    expect(await marker(id)).toBe('discarded');
    await Q.sync();
    expect(draft(Q, id)).toBeUndefined();
    expect(outbox(Q)).toEqual([]);
  }, 60_000);

  it('[table B, held.discard, base stale] the row stays (kept); the draft comes back to this phone with the newer words', async () => {
    const id = await shared('You sang to the moon again.');
    expect(P.store.beginDiscard(id)).toBe(true); // offline: the let-go waits
    Q.store.setDraftTyped(id, 'You sang to the moon, and it stayed up.');
    await Q.sync();
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.discard', id)).toEqual([expect.objectContaining({ ok: true, kept: true })]);
    expect((await held(id))?.typed_text).toBe('You sang to the moon, and it stayed up.');
    await P.sync();
    expect(draft(P, id)?.typedText).toBe('You sang to the moon, and it stayed up.');
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe('You sang to the moon, and it stayed up.');
  }, 60_000);

  it('[table B, Keep, held_base known or the same words] the letter is made from this phone\'s words, marker kept; the other phone adopts it and keeps its own changed words as a copy', async () => {
    const id = await shared('You read the book upside down.');
    const v = heldV(P, id);
    Q.store.setDraftTyped(id, 'You read the book upside down, to the cat.'); // offline on Q
    keep(P, id);
    expect(queued(P, 'entry.upsert', id)?.op.held_base).toBe(v);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id)).toEqual([expect.objectContaining({ applied: true, entry: expect.objectContaining({ id }) })]);
    expect(await held(id)).toBeUndefined();
    expect(await marker(id)).toBe('kept');
    expect((await letter(id))?.final_text).toBe('You read the book upside down.');
    await Q.sync();
    expect(draft(Q, id)).toBeUndefined();
    expect(local(Q, id)?.final_text).toBe('You read the book upside down.');
    expect(copies(Q, id)).toEqual(['You read the book upside down, to the cat.']);
    expect(await history(id)).toEqual([]);

    // A stale held_base with the words the server holds: nothing to refuse, the letter is made.
    const id2 = await shared('You made a hat from a bowl.');
    const v2 = heldV(P, id2);
    Q.store.setDraftTyped(id2, 'You made a hat from a bowl, and wore it.');
    await Q.sync();
    P.store.setDraftTyped(id2, 'You made a hat from a bowl, and wore it.'); // offline, the same words
    keep(P, id2);
    expect(queued(P, 'entry.upsert', id2)?.op.held_base).toBe(v2);
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id2)).toEqual([expect.objectContaining({ applied: true, entry: expect.objectContaining({ id: id2 }) })]);
    expect(copies(P, id2)).toEqual([]);
    await Q.sync();
    expect(local(Q, id2)?.final_text).toBe('You made a hat from a bowl, and wore it.');
    expect(copies(Q, id2)).toEqual([]);
  }, 60_000);

  it('[table B, Keep, held_base stale, words differ] refused, no letter (c2): this phone keeps its words as a copy, the letter takes the held words, and the Keep goes again with held_base = current.v', async () => {
    const id = await shared('You built a tower of blocks.');
    Q.store.setDraftTyped(id, 'You built a tower of blocks, then a bridge.');
    await Q.sync();
    keep(P, id); // P never pulled the newer words
    const w = watch();
    expect((await P.sync(w.s)).conflicts).toBe(1);
    const [first, again] = w.answers('entry.upsert', id);
    expect(first).toMatchObject({ ok: true, applied: false, conflict: true, conflict_groups: ['text'], current: { typed_text: 'You built a tower of blocks, then a bridge.' } });
    expect(first.entry ?? null).toBeNull();
    expect(w.sent('entry.upsert', id)[1].held_base).toBe(first.current!.v);
    expect(again).toMatchObject({ ok: true, applied: true, entry: { id } });
    expect((await letter(id))?.final_text).toBe('You built a tower of blocks, then a bridge.');
    expect(await held(id)).toBeUndefined();
    expect(local(P, id)?.final_text).toBe('You built a tower of blocks, then a bridge.');
    expect(copies(P, id)).toEqual(['You built a tower of blocks.']);
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You built a tower of blocks, then a bridge.');
    expect(draft(Q, id)).toBeUndefined();
    expect(await history(id)).toEqual([]);
  }, 60_000);

  it('[table B, held.upsert with text, base stale, words differ, the draft gone from this phone before the answer] nothing takes the words, so held_v, the Keep\'s held_base and the let-go\'s base stay (c1): both versions are kept (review K re-check R3)', async () => {
    // Kept here while its upload was on the way: the Keep is refused, and c2 keeps both versions.
    const id = await shared('You lined up the shoes.');
    const v = heldV(P, id);
    Q.store.setDraftTyped(id, 'You lined up the shoes by the door.');
    await Q.sync();
    P.store.setDraftTyped(id, 'You lined up all the shoes, even mine.');
    const w = watch();
    await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' })); // the upload left but never arrived
    keep(P, id); // the Keep queues behind it
    expect(outbox(P)).toEqual(['held.upsert', 'entry.upsert']);
    tick(10 * 60_000);
    expect((await P.sync(w.s)).conflicts).toBe(1);
    expect(w.answers('held.upsert', id)).toEqual([expect.objectContaining({ conflict_groups: ['text'], current: expect.objectContaining({ typed_text: 'You lined up the shoes by the door.' }) })]);
    expect(w.sent('entry.upsert', id)[0].held_base).toBe(v); // the refused answer moved nothing
    const [refusedKeep, again] = w.answers('entry.upsert', id);
    expect(refusedKeep).toMatchObject({ applied: false, conflict_groups: ['text'] });
    expect(again).toMatchObject({ applied: true, entry: { id } });
    expect((await letter(id))?.final_text).toBe('You lined up the shoes by the door.');
    expect(local(P, id)?.final_text).toBe('You lined up the shoes by the door.');
    expect(copies(P, id)).toEqual(['You lined up all the shoes, even mine.']);
    expect(await history(id)).not.toContain('You lined up the shoes by the door.');
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You lined up the shoes by the door.');

    // Let go here while its upload was on the way: the let-go keeps its base, so the server keeps the newer words.
    const id2 = await shared('You fed the fish.');
    const v2 = heldV(P, id2);
    Q.store.setDraftTyped(id2, 'You fed the fish and said goodnight to them.');
    await Q.sync();
    P.store.setDraftTyped(id2, 'You fed the fish twice.');
    await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' }));
    expect(P.store.beginDiscard(id2)).toBe(true); // the launch sweep has not finished it yet
    expect(outbox(P)).toEqual(['held.upsert', 'held.discard']);
    tick(10 * 60_000);
    await P.sync(w.s);
    expect(w.sent('held.discard', id2)[0].base).toBe(v2);
    expect(w.answers('held.discard', id2)).toEqual([expect.objectContaining({ ok: true, kept: true })]);
    expect((await held(id2))?.typed_text).toBe('You fed the fish and said goodnight to them.');
    await P.sync();
    expect(draft(P, id2)?.typedText).toBe('You fed the fish and said goodnight to them.');
    await Q.sync();
    expect(draft(Q, id2)?.typedText).toBe('You fed the fish and said goodnight to them.');
  }, 60_000);

  it('[table B, Keep with no held_base key] compared as held_base 0: the same refusal, and no words are left only in entry_versions', async () => {
    const id = await shared('You counted the ducks.');
    Q.store.setDraftTyped(id, 'You counted the ducks, all seven.');
    await Q.sync();
    keep(P, id);
    const q = P.db.get<{ seq: number; payload: string }>("SELECT seq, payload FROM sync_outbox WHERE entity_id = ? AND type = 'entry.upsert'", id)!;
    const op = JSON.parse(q.payload) as Record<string, unknown>;
    delete op.held_base; // as no shipped client sends it
    P.db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(op), q.seq);
    const w = watch();
    expect((await P.sync(w.s)).conflicts).toBe(1);
    const [first, again] = w.answers('entry.upsert', id);
    expect(first).toMatchObject({ applied: false, conflict_groups: ['text'], current: { typed_text: 'You counted the ducks, all seven.' } });
    expect(first.entry ?? null).toBeNull();
    expect(again).toMatchObject({ applied: true, entry: { id } });
    expect((await letter(id))?.final_text).toBe('You counted the ducks, all seven.');
    expect(copies(P, id)).toEqual(['You counted the ducks.']);
    expect(await history(id)).toEqual([]);
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You counted the ducks, all seven.');
  }, 60_000);

  it('[table B, entry.erase] Erase now on a waiting letter: the row goes, marker erased; the other phone erases its copy, whatever it has queued', async () => {
    const e = voiceOnly(P, 'take-b10');
    await P.sync();
    await Q.sync();
    expect(Q.store.listWaitingForWords(BOOK).map((x) => x.id)).toContain(e);
    expect(Q.store.setTypedWordsForWaitingEntry(e, 'You clapped for the bath.')).toBe(true); // offline on Q
    eraseNow(P, e);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.erase', e)).toEqual([expect.objectContaining({ ok: true, erased: true })]);
    expect(await held(e)).toBeUndefined();
    expect(await marker(e)).toBe('erased');
    await Q.sync();
    expect(local(Q, e)).toBeNull();
    expect(Q.store.listDeleted().map((x) => x.id)).not.toContain(e);
    expect(refusedWrites(Q, e)).toBe(0);
    expect(outbox(Q)).toEqual([]);
    expect(await letter(e)).toBeUndefined();
  }, 60_000);

  // ── C. Kept as a letter at v (another phone kept it first) ───────────────
  it('[table C, held.upsert] the letter is the row now (held: null): the draft adopts the letter, and changed words become a copy (none when they match)', async () => {
    const id = await shared('You fed the ducks.');
    P.store.setDraftTyped(id, 'You fed the ducks and one followed you.'); // offline on P
    keep(Q, id);
    await Q.sync();
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.upsert', id)).toEqual([expect.objectContaining({ ok: true, held: null })]);
    expect(draft(P, id)).toBeUndefined();
    expect(local(P, id)?.final_text).toBe('You fed the ducks.');
    expect(copies(P, id)).toEqual(['You fed the ducks and one followed you.']);
    expect((await letter(id))?.final_text).toBe('You fed the ducks.');

    const id2 = await shared('You wore the red hat.');
    expect(P.store.setDraftOccurred(id2, '2026-10-04', 'day')).toBe(true); // no words changed
    keep(Q, id2);
    await Q.sync();
    await P.sync(w.s);
    expect(w.answers('held.upsert', id2)).toEqual([expect.objectContaining({ ok: true, held: null })]);
    expect(local(P, id2)?.final_text).toBe('You wore the red hat.');
    expect(copies(P, id2)).toEqual([]);
    await Q.sync();
    expect([local(Q, id)?.final_text, copies(Q, id)]).toEqual(['You fed the ducks.', []]);
  }, 60_000);

  it('[table C, held.discard] missing: the letter stays (a Keep beats a let-go), and comes to this phone at its next pull', async () => {
    const id = await shared('You hugged the tree.');
    letGo(P, id); // offline on P
    keep(Q, id);
    await Q.sync();
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.discard', id)).toEqual([expect.objectContaining({ ok: true, missing: true })]);
    expect((await letter(id))?.final_text).toBe('You hugged the tree.');
    await P.sync();
    expect(local(P, id)).toMatchObject({ final_text: 'You hugged the tree.', deleted_at: null });
    expect(draft(P, id)).toBeUndefined();
  }, 60_000);

  it('[table C, Keep] a second Keep is a compare and set against the letter: text refused, other groups by later arrival, the first keep\'s provenance stands (never SCIMM); this phone takes it from its pull row', async () => {
    const id = await shared('You drew a sun.');
    Q.store.setDraftTyped(id, 'You drew a sun with a face.');
    keep(Q, id);
    await Q.sync();
    const first = (await letter(id))!;
    const v = heldV(P, id);
    P.store.setDraftTyped(id, 'You drew a sun, and gave it to me.'); // offline: this phone's own words
    tick(5_000);
    keep(P, id, { inBook: false, engineVersion: 6, capturedAt: iso() }); // a typed Keep: its raw transcript is its own words
    expect(queued(P, 'entry.upsert', id)?.op.held_base).toBe(v);
    const w = watch();
    const r = await P.sync(w.s);
    expect(r).toMatchObject({ conflicts: 1, rejected: 0 });
    const [a] = w.answers('entry.upsert', id);
    expect(a).toMatchObject({ ok: true, applied: true, conflict: true, conflict_groups: ['text'], current: { final_text: 'You drew a sun with a face.' }, entry: { id } });
    expect(await letter(id)).toMatchObject({
      final_text: 'You drew a sun with a face.', raw_transcript: 'You drew a sun with a face.', engine_version: 5,
      captured_ms: first.captured_ms, in_book: false,
    });
    expect(copies(P, id)).toEqual(['You drew a sun, and gave it to me.']);
    expect(local(P, id)).toMatchObject({ final_text: 'You drew a sun with a face.', raw_transcript: 'You drew a sun with a face.', engine_version: 5, in_book: 0 });
    expect(String(Date.parse(local(P, id)!.captured_at))).toBe(first.captured_ms);
    await Q.sync();
    expect(local(Q, id)).toMatchObject({ final_text: 'You drew a sun with a face.', in_book: 0 });
    expect(copies(Q, id)).toEqual([]);
    // This phone's refused words live in its copy, never only in the letter's history (which keeps the author's
    // own earlier choices: the edit on Q before its Keep, and the state before the in-book change).
    expect(await history(id)).not.toContain('You drew a sun, and gave it to me.');
  }, 60_000);

  it('[table C, an edit after a second Keep, before its pull row] the server keeps the first keep\'s raw transcript and refuses the edit (SCIMM): the edit stays as a conflict copy the author sees and goes up once picked; a pull row that comes while it waits gives it the letter\'s raw transcript, and it applies (review K re-check 4)', async () => {
    const id = await shared('You found the torch.');
    Q.store.setDraftTyped(id, 'You found the torch under the bed.');
    keep(Q, id);
    await Q.sync();
    P.store.setDraftTyped(id, 'You found the torch and lit the ceiling.');
    keep(P, id); // a typed Keep: its raw transcript is this phone's words
    const w = watch();
    await P.sync(pushOnly(w.s)); // refused by the letter (row C); the pull that would bring its raw transcript fails
    expect(w.answers('entry.upsert', id)[0]).toMatchObject({ applied: true, conflict_groups: ['text'] });
    expect(copies(P, id)).toEqual(['You found the torch and lit the ceiling.']);
    editWords(P, id, 'You found the torch under the bed, and read with it.'); // before the next sync
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id)[1]).toMatchObject({ ok: false, code: 'SCIMM' });
    // Never only in a refused write the author cannot see: the edit is a conflict copy.
    expect(P.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM rejected_writes WHERE entity_id = ? AND code <> 'conflict'", id)!.n).toBe(0);
    expect(copies(P, id)).toContain('You found the torch under the bed, and read with it.');
    expect(local(P, id)).toMatchObject({ final_text: 'You found the torch under the bed.', raw_transcript: 'You found the torch under the bed.' });
    // "Use this phone's version": it goes up with the letter's own raw transcript now, and applies.
    const copy = P.store.listConflicts(id).find((c) => c.words.final_text === 'You found the torch under the bed, and read with it.')!;
    expect(P.store.resolveConflict(copy.opId, 'mine')).toBe(true);
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id).at(-1)).toMatchObject({ ok: true, applied: true });
    expect(await letter(id)).toMatchObject({ final_text: 'You found the torch under the bed, and read with it.', raw_transcript: 'You found the torch under the bed.' });
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You found the torch under the bed, and read with it.');

    // When the pull row comes while the edit still waits (here a consent pause), the edit takes the letter's
    // raw transcript too, and applies as the letter.
    const id2 = await shared('You hid the spoon.');
    Q.store.setDraftTyped(id2, 'You hid the spoon in the plant.');
    keep(Q, id2);
    await Q.sync();
    P.store.setDraftTyped(id2, 'You hid the spoon and the fork.');
    keep(P, id2);
    await P.sync(pushOnly(w.s)); // refused by the letter (row C); its pull fails
    await server.sensitiveConsent(MAMA, 'withdraw');
    try {
      editWords(P, id2, 'You hid the spoon in the plant, and laughed.');
      expect((await P.sync(w.s)).phase).toBe('paused_consent'); // the edit waits; this pull brings the letter's row
      expect(local(P, id2)).toMatchObject({ final_text: 'You hid the spoon in the plant, and laughed.', raw_transcript: 'You hid the spoon in the plant.' });
      expect(queued(P, 'entry.upsert', id2)?.op.data).toMatchObject({ raw_transcript: 'You hid the spoon in the plant.' });
    } finally {
      await server.sensitiveConsent(MAMA, 'accept');
    }
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id2).at(-1)).toMatchObject({ ok: true, applied: true });
    expect(await letter(id2)).toMatchObject({ final_text: 'You hid the spoon in the plant, and laughed.', raw_transcript: 'You hid the spoon in the plant.' });
    expect(copies(P, id2)).toEqual(['You hid the spoon and the fork.']);
  }, 60_000);

  it('[table C, note: an upload refused SCIMM for another reason] its words are a copy and nothing is lost; "Keep the other one" leaves the letter showing this phone\'s words until a newer server row arrives (a lag)', async () => {
    const id = await shared('You found a snail on the step.');
    keep(P, id);
    await P.sync();
    await Q.sync();
    // A client bug changes this phone's raw transcript of a letter the server holds (not the second-Keep window).
    P.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', 'changed by a bug', id);
    editWords(P, id, 'You found a snail on the step and named it.');
    const w = watch();
    expect((await P.sync(w.s)).conflicts).toBe(1);
    expect(w.answers('entry.upsert', id)).toEqual([expect.objectContaining({ ok: false, code: 'SCIMM' })]);
    expect(copies(P, id)).toEqual(['You found a snail on the step and named it.']);
    expect(P.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM rejected_writes WHERE entity_id = ? AND code <> 'conflict'", id)!.n).toBe(0);
    expect((await letter(id))?.final_text).toBe('You found a snail on the step.');
    // No newer server row comes, so the letter still shows this phone's words. "Keep the other one" lets the copy go,
    // and the letter goes on showing them: the lag. Nothing is lost: the server keeps its words, nothing is queued.
    expect(local(P, id)?.final_text).toBe('You found a snail on the step and named it.');
    expect(P.store.resolveConflict(P.store.listConflicts(id)[0].opId, 'theirs')).toBe(true);
    await P.sync();
    expect(local(P, id)?.final_text).toBe('You found a snail on the step and named it.');
    expect(outbox(P)).toEqual([]);
    expect((await letter(id))?.final_text).toBe('You found a snail on the step.');
    // A newer server row ends the lag: the letter takes the server's words, and its raw transcript too.
    editWords(Q, id, 'You found a snail on the step, and it found you.');
    await Q.sync();
    await P.sync();
    expect(local(P, id)).toMatchObject({ final_text: 'You found a snail on the step, and it found you.', raw_transcript: 'You found a snail on the step.' });
  }, 60_000);

  it('[table C, Keep sent again on the letter version] a Keep refused by the held row, its answer lost, the letter then made elsewhere: the repeat names the letter as current, and the Keep sent again applies with the same words', async () => {
    const id = await shared('You splashed in the sink.');
    Q.store.setDraftTyped(id, 'You splashed in the sink and then in me.');
    await Q.sync();
    keep(P, id); // stale
    const w = watch();
    await P.sync(lost(w.s)); // refused by the held row; the answer is lost
    expect(w.answers('entry.upsert', id)[0]).toMatchObject({ applied: false, conflict_groups: ['text'] });
    keep(Q, id);
    await Q.sync();
    const made = (await letter(id))!;
    tick(2_000);
    expect((await P.sync(w.s)).conflicts).toBe(1);
    const [, repeat, again] = w.answers('entry.upsert', id);
    expect(repeat).toMatchObject({ dup: true, applied: false, conflict_groups: ['text'], current: { final_text: 'You splashed in the sink and then in me.', v: made.v } });
    expect(repeat.entry ?? null).toBeNull();
    expect(w.sent('entry.upsert', id)[2].held_base).toBe(made.v);
    expect(again).toMatchObject({ ok: true, applied: true, entry: { id } });
    expect(again.conflict_groups).toBeUndefined();
    expect(await letter(id)).toMatchObject({ final_text: 'You splashed in the sink and then in me.', v: made.v });
    expect(local(P, id)?.final_text).toBe('You splashed in the sink and then in me.');
    expect(copies(P, id)).toEqual(['You splashed in the sink.']);
    await Q.sync();
    expect([local(Q, id)?.final_text, copies(Q, id)]).toEqual(['You splashed in the sink and then in me.', []]);
  }, 60_000);

  it('[table C, entry.erase] Erase now on the kept letter: purged, marker erased; the other phone erases it at its next pull', async () => {
    const id = await shared('You kissed the window.');
    keep(Q, id);
    await Q.sync();
    await P.sync();
    expect(local(P, id)?.final_text).toBe('You kissed the window.');
    eraseNow(P, id);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.erase', id)).toEqual([expect.objectContaining({ ok: true, erased: true })]);
    expect(await letter(id)).toBeUndefined();
    expect(await marker(id)).toBe('erased');
    await Q.sync();
    expect(local(Q, id)).toBeNull();
    expect(Q.store.listDeleted().map((x) => x.id)).not.toContain(id);
  }, 60_000);

  // ── D. Discarded: marker discarded, no row, no letter ─────────────────────
  it('[table D, held.upsert] an edit after a let-go elsewhere makes the row again (marker cleared); the draft comes back to the other phone', async () => {
    const id = await shared('You counted the stairs.');
    P.store.setDraftTyped(id, 'You counted the stairs, all eleven.'); // offline on P
    letGo(Q, id);
    await Q.sync();
    expect(await marker(id)).toBe('discarded');
    const w = watch();
    await P.sync(w.s);
    const [a] = w.answers('held.upsert', id);
    expect(a).toMatchObject({ ok: true, held: { id } });
    expect(a.conflict_groups).toBeUndefined();
    expect(heldV(P, id)).toBe(a.held!.v);
    expect((await held(id))?.typed_text).toBe('You counted the stairs, all eleven.');
    expect(await marker(id)).toBeUndefined();
    await Q.sync();
    expect(draft(Q, id)?.typedText).toBe('You counted the stairs, all eleven.');
  }, 60_000);

  it('[table D, held.discard] missing: let go on both phones', async () => {
    const id = await shared('You named the snail.');
    letGo(Q, id);
    await Q.sync();
    letGo(P, id); // before P pulls
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.discard', id)).toEqual([expect.objectContaining({ ok: true, missing: true })]);
    expect(outbox(P)).toEqual([]);
    expect(await held(id)).toBeUndefined();
    expect(await marker(id)).toBe('discarded');
    await Q.sync();
    expect([draft(P, id), draft(Q, id)]).toEqual([undefined, undefined]);
  }, 60_000);

  it('[table D, Keep] the letter is made from this phone\'s words (no held row to compare); it reaches the other phone (a Keep beats a let-go)', async () => {
    const id = await shared('You found the moon in the puddle.');
    letGo(Q, id);
    await Q.sync();
    keep(P, id);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id)).toEqual([expect.objectContaining({ ok: true, applied: true, entry: expect.objectContaining({ id }) })]);
    expect((await letter(id))?.final_text).toBe('You found the moon in the puddle.');
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You found the moon in the puddle.');
  }, 60_000);

  it('[table D, entry.erase] Erase now on a waiting letter let go elsewhere: the marker becomes erased; the other phone\'s Recently deleted copy is erased', async () => {
    const e = voiceOnly(P, 'take-d4');
    await P.sync();
    await Q.sync();
    tick();
    Q.store.deleteEntry(e);
    await Q.sync(); // its held row is let go
    expect(await marker(e)).toBe('discarded');
    await P.sync();
    expect(P.store.listDeleted().map((x) => x.id)).toContain(e);
    expect(P.store.eraseEntry(e, () => {})).toBe(true);
    expect(outbox(P)).toEqual(['entry.erase']);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.erase', e)).toEqual([expect.objectContaining({ ok: true, erased: true })]);
    expect(await marker(e)).toBe('erased');
    expect(local(P, e)).toBeNull();
    await Q.sync();
    expect(local(Q, e)).toBeNull();
    expect(Q.store.listDeleted().map((x) => x.id)).not.toContain(e);
  }, 60_000);

  // ── E. Erased: marker erased, this author's erasure recorded ────────────
  /** State E: kept on Q, then erased there with Erase now; P still holds the draft, unpulled. */
  const erasedOnQ = async (text: string) => {
    const id = await shared(text);
    keep(Q, id);
    await Q.sync();
    eraseNow(Q, id);
    await Q.sync();
    expect(await marker(id)).toBe('erased');
    return id;
  };

  it('[table E, held.upsert] SCDEL purged, gone: this phone erases its copy, never restorable', async () => {
    const id = await erasedOnQ('You tasted the lemon.');
    P.store.setDraftTyped(id, 'You tasted the lemon and made a face.');
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.upsert', id)).toEqual([expect.objectContaining({ ok: false, code: 'SCDEL', gone: true })]);
    expect(draft(P, id)).toBeUndefined();
    expect(local(P, id)).toBeNull();
    expect([copies(P, id), refusedWrites(P, id), outbox(P)]).toEqual([[], 0, []]);
    expect(await held(id)).toBeUndefined();
    await Q.sync();
    expect(local(Q, id)).toBeNull();
  }, 60_000);

  it('[table E, held.discard] missing: gone on this phone, erased on the other', async () => {
    const id = await erasedOnQ('You hummed in the car.');
    letGo(P, id);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('held.discard', id)).toEqual([expect.objectContaining({ ok: true, missing: true })]);
    expect([draft(P, id), local(P, id), outbox(P)]).toEqual([undefined, null, []]);
    expect(await held(id)).toBeUndefined();
    expect(await letter(id)).toBeUndefined();
  }, 60_000);

  it('[table E, Keep] SCDEL purged, gone: this phone erases its letter (the marker arrives in the same sync), nothing goes up again', async () => {
    const id = await erasedOnQ('You pointed at the plane.');
    keep(P, id);
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.upsert', id)).toEqual([expect.objectContaining({ ok: false, code: 'SCDEL', gone: true })]);
    expect(await letter(id)).toBeUndefined();
    expect(local(P, id)).toBeNull();
    expect(P.store.listDeleted().map((x) => x.id)).not.toContain(id);
    expect([refusedWrites(P, id), outbox(P)]).toEqual([0, []]);
    await Q.sync();
    expect(local(Q, id)).toBeNull();
  }, 60_000);

  it('[table E, entry.erase] erased: erased on both phones', async () => {
    const id = await shared('You blew on the soup.');
    keep(Q, id);
    await Q.sync();
    await P.sync(); // P has the letter
    eraseNow(Q, id);
    await Q.sync();
    eraseNow(P, id); // before P pulls
    const w = watch();
    await P.sync(w.s);
    expect(w.answers('entry.erase', id)).toEqual([expect.objectContaining({ ok: true, erased: true })]);
    expect(local(P, id)).toBeNull();
    await Q.sync();
    expect(local(Q, id)).toBeNull();
  }, 60_000);

  // ── Repeats after a lost answer (the op committed; the receipt answers) ──
  it('[table repeat, held.upsert applied] dup with applied_v: the upload queued behind it is based on applied_v only (c1), never on the row as it is now', async () => {
    const id = await shared('You stacked the cups.');
    const w = watch();
    P.store.setDraftTyped(id, 'You stacked the cups, red on top.');
    await P.sync(lost(w.s));
    const first = w.answers('held.upsert', id)[0];
    P.store.setDraftTyped(id, 'You stacked the cups, red on top, then blue.'); // offline: queued behind the first
    await Q.sync();
    Q.store.setDraftTyped(id, 'You stacked the cups and knocked them over.');
    await Q.sync();
    tick(2_000);
    expect((await P.sync(w.s)).conflicts).toBe(1);
    const [, repeat, second] = w.answers('held.upsert', id);
    expect(repeat).toMatchObject({ dup: true, applied_v: first.held!.v });
    expect(w.sent('held.upsert', id)[2].base).toBe(first.held!.v);
    expect(second).toMatchObject({ conflict_groups: ['text'], current: { typed_text: 'You stacked the cups and knocked them over.' } });
    expect(draft(P, id)?.typedText).toBe('You stacked the cups and knocked them over.');
    expect(copies(P, id)).toEqual(['You stacked the cups, red on top, then blue.']);
  }, 60_000);

  it('[table repeat, held.upsert refused] dup with current recomputed: from the letter once kept elsewhere; null once let go elsewhere (a copy until the pull lets it go)', async () => {
    const id = await shared('You wore two socks on one foot.');
    Q.store.setDraftTyped(id, 'You wore two socks on one foot, proudly.');
    await Q.sync();
    P.store.setDraftTyped(id, 'You wore both socks on one foot.');
    const w = watch();
    await P.sync(lost(w.s)); // refused; the answer is lost
    expect(w.answers('held.upsert', id)[0]).toMatchObject({ conflict_groups: ['text'] });
    keep(Q, id);
    await Q.sync();
    tick(2_000);
    await P.sync(w.s);
    expect(w.answers('held.upsert', id)[1]).toMatchObject({ dup: true, conflict_groups: ['text'], held: null, current: { final_text: 'You wore two socks on one foot, proudly.' } });
    expect(draft(P, id)).toBeUndefined();
    expect(local(P, id)?.final_text).toBe('You wore two socks on one foot, proudly.');
    expect(copies(P, id)).toEqual(['You wore both socks on one foot.']);

    const id2 = await shared('You talked to the fridge.');
    Q.store.setDraftTyped(id2, 'You talked to the fridge, and it hummed back.');
    await Q.sync();
    P.store.setDraftTyped(id2, 'You told the fridge a story.');
    await P.sync(lost(w.s));
    letGo(Q, id2); // the author lets it go on the other phone
    await Q.sync();
    tick(2_000);
    await P.sync(pushOnly(w.s));
    const repeat = w.answers('held.upsert', id2)[1];
    expect(repeat).toMatchObject({ dup: true, conflict_groups: ['text'], held: null });
    expect(repeat.current ?? null).toBeNull();
    expect(copies(P, id2)).toEqual(['You told the fridge a story.']); // kept until the pull says what happened
    await P.sync();
    expect(draft(P, id2)).toBeUndefined(); // let go elsewhere (row B, held.discard): it goes, with this phone's copy
    expect(copies(P, id2)).toEqual([]);
  }, 60_000);

  it('[table repeat, held.discard] dup with the same answer: {} stays let go, kept brings the draft back, missing stays missing', async () => {
    const w = watch();
    const id = await shared('You played peekaboo with the towel.');
    letGo(P, id);
    await P.sync(lost(w.s));
    tick(2_000);
    await P.sync(w.s);
    const [d1, d2] = w.answers('held.discard', id);
    expect([d1.kept, d1.missing, d2.dup, d2.kept, d2.missing ?? false]).toEqual([undefined, undefined, true, undefined, false]);
    expect(await held(id)).toBeUndefined();
    await Q.sync();
    expect(draft(Q, id)).toBeUndefined();

    const id2 = await shared('You sang in the bath again.');
    expect(P.store.beginDiscard(id2)).toBe(true); // offline: the let-go waits
    Q.store.setDraftTyped(id2, 'You sang in the bath again, with the duck.');
    await Q.sync();
    await P.sync(lost(w.s)); // kept, the answer lost
    await P.sync(); // the let-go waits out its backoff
    tick(2_000);
    await P.sync(w.s);
    await P.sync();
    expect(w.answers('held.discard', id2)[1]).toMatchObject({ dup: true, kept: true });
    expect(draft(P, id2)?.typedText).toBe('You sang in the bath again, with the duck.');

    const id3 = await shared('You patted the dog.');
    letGo(Q, id3);
    await Q.sync();
    letGo(P, id3);
    await P.sync(lost(w.s));
    tick(2_000);
    await P.sync(w.s);
    const [m1, m2] = w.answers('held.discard', id3);
    expect(m1).toMatchObject({ missing: true });
    expect(m2).toMatchObject({ dup: true, missing: true });
    expect(outbox(P)).toEqual([]);
  }, 60_000);

  it('[table repeat, Keep applied] dup with entry and applied_v: an edit queued behind the Keep is based on applied_v only', async () => {
    const id = await shared('You found a button.');
    keep(P, id);
    const w = watch();
    await P.sync(lost(w.s)); // the letter is made; the answer lost
    const [first] = w.answers('entry.upsert', id);
    expect(first).toMatchObject({ applied: true, entry: { id } });
    editWords(P, id, 'You found a button and gave it to me.'); // offline: queued behind the Keep
    await Q.sync();
    editWords(Q, id, 'You found a button under the sofa.');
    await Q.sync();
    tick(2_000);
    expect((await P.sync(w.s)).conflicts).toBe(1);
    const [, repeat, edit] = w.answers('entry.upsert', id);
    expect(repeat).toMatchObject({ dup: true, entry: { id }, applied_v: first.entry!.v });
    expect(w.sent('entry.upsert', id)[2].base).toBe(first.entry!.v);
    expect(edit).toMatchObject({ conflict_groups: ['text'], current: { final_text: 'You found a button under the sofa.' } });
    expect(local(P, id)?.final_text).toBe('You found a button under the sofa.');
    expect(copies(P, id)).toEqual(['You found a button and gave it to me.']);
  }, 60_000);

  it('[table repeat, Keep refused by the held row] dup, applied false, no letter, current recomputed: let go elsewhere, so current is null and the Keep sent again makes the letter (row D)', async () => {
    const id = await shared('You drew on the steamy window.');
    const v = heldV(P, id);
    Q.store.setDraftTyped(id, 'You drew a face on the steamy window.');
    await Q.sync();
    keep(P, id); // stale
    const w = watch();
    await P.sync(lost(w.s)); // refused by the held row; the answer is lost
    expect(w.answers('entry.upsert', id)[0]).toMatchObject({ applied: false, conflict_groups: ['text'] });
    letGo(Q, id);
    await Q.sync();
    tick(2_000);
    await P.sync(w.s);
    const [, repeat, again] = w.answers('entry.upsert', id);
    expect(repeat).toMatchObject({ dup: true, applied: false, conflict_groups: ['text'] });
    expect([repeat.entry ?? null, repeat.current ?? null]).toEqual([null, null]);
    expect(w.sent('entry.upsert', id)[2].held_base).toBe(v); // nothing to take: held_base stays (c1)
    expect(again).toMatchObject({ ok: true, applied: true, entry: { id } });
    expect((await letter(id))?.final_text).toBe('You drew on the steamy window.');
    expect(copies(P, id)).toEqual([]);
    await Q.sync();
    expect(local(Q, id)?.final_text).toBe('You drew on the steamy window.');
  }, 60_000);

  it('[table repeat, Keep refused by the letter] dup with entry, conflict_groups and the letter\'s words now: as the first answer', async () => {
    const id = await shared('You tickled the cat.');
    Q.store.setDraftTyped(id, 'You tickled the cat, gently.');
    keep(Q, id);
    await Q.sync();
    P.store.setDraftTyped(id, 'You tickled the cat and it purred.');
    keep(P, id);
    const w = watch();
    await P.sync(lost(w.s));
    expect(w.answers('entry.upsert', id)[0]).toMatchObject({ applied: true, conflict_groups: ['text'] });
    tick(2_000);
    expect((await P.sync(w.s)).conflicts).toBe(1);
    expect(w.answers('entry.upsert', id)[1]).toMatchObject({ dup: true, entry: { id }, conflict_groups: ['text'], current: { final_text: 'You tickled the cat, gently.' } });
    expect(local(P, id)).toMatchObject({ final_text: 'You tickled the cat, gently.', raw_transcript: 'You tickled the cat, gently.' });
    expect(copies(P, id)).toEqual(['You tickled the cat and it purred.']);
    expect(await letter(id)).toMatchObject({ final_text: 'You tickled the cat, gently.', raw_transcript: 'You tickled the cat, gently.' });
  }, 60_000);

  it('[table repeat, entry.erase] dup with the same answer: erased stays erased, missing stays missing', async () => {
    const e = voiceOnly(P, 'take-r7');
    await P.sync();
    await Q.sync();
    eraseNow(P, e);
    const w = watch();
    await P.sync(lost(w.s));
    tick(2_000);
    await P.sync(w.s);
    const [e1, e2] = w.answers('entry.erase', e);
    expect(e1).toMatchObject({ erased: true });
    expect(e2).toMatchObject({ dup: true, erased: true });

    const e3 = voiceOnly(P, 'take-r7b');
    eraseNow(P, e3);
    await P.sync(lost(w.s));
    tick(2_000);
    await P.sync(w.s);
    const [m1, m2] = w.answers('entry.erase', e3);
    expect(m1).toMatchObject({ missing: true });
    expect(m2).toMatchObject({ dup: true, missing: true });
    expect(outbox(P)).toEqual([]);
    await Q.sync();
    expect([local(Q, e), local(Q, e3)]).toEqual([null, null]);
  }, 60_000);

  // ── The switch: app.held_sync = 'off' (S02's fallback for the alpha) ─────
  it('[switch off] held uploads and let-gos stay queued, unsent and not done; letters, Keep and Erase now keep working; the same op ids apply once it is on', async () => {
    const before = await shared('You drummed on the pot.'); // held on the server before the switch
    const w = watch();
    await server.sys("select set_config('app.held_sync', 'off', false)");
    let upOp = '';
    let goOp = '';
    const id = typed(P, 'You read to your bear.');
    try {
      expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true);
      upOp = queued(P, 'held.upsert', id)!.opId;
      await P.sync(w.s);
      expect(w.answers('held.upsert', id)).toEqual([expect.objectContaining({ ok: true, applied: false, held_off: true })]);
      expect(outbox(P)).toEqual(['held.upsert']); // not done
      expect(queued(P, 'held.upsert', id)?.opId).toBe(upOp);
      expect(await receipt(upOp)).toBe(false); // not claimed on the server
      expect(await held(id)).toBeUndefined();
      // Edits while it is off rewrite that one queued upload in place: the op is as if never sent (review L N1).
      P.store.setDraftTyped(id, 'You read to your bear, twice.');
      P.store.setDraftTyped(id, 'You read to your bear, then to me.');
      expect(outbox(P)).toEqual(['held.upsert']);
      expect(queued(P, 'held.upsert', id)?.op.data).toMatchObject({ typed_text: 'You read to your bear, then to me.' });

      // While it is off nothing held is sent again, and the pull carries no held section.
      letGo(P, before);
      goOp = queued(P, 'held.discard', before)!.opId;
      const r = await P.sync(w.s);
      expect(r.phase).toBe('idle');
      expect([w.answers('held.upsert', id).length, w.answers('held.discard', before).length]).toEqual([1, 0]);
      const pull = await server.serverFor(MAMA).rpc('sync_pull', { p_since: { books: { [BOOK]: {} }, held: { cursor: null } }, p_limit: 200 });
      expect((pull.data as Record<string, unknown>).held).toBeUndefined();

      // Letters, Keep and Erase now keep working.
      const words = writeLetter(P, BOOK, 'You said moon for the first time.');
      keep(P, id); // the Keep carries the words; the never-sent upload goes with the draft
      const gone = writeLetter(P, BOOK, 'You sneezed at the pepper.');
      await P.sync(w.s);
      eraseNow(P, gone);
      await P.sync(w.s);
      expect((await letter(words))?.final_text).toBe('You said moon for the first time.');
      expect((await letter(id))?.final_text).toBe('You read to your bear, then to me.');
      expect(await letter(gone)).toBeUndefined();
      expect(w.answers('entry.erase', gone)).toEqual([expect.objectContaining({ ok: true, erased: true })]);
      expect(outbox(P)).toEqual(['held.discard']); // only the let-go waits
      expect((await held(before))?.typed_text).toBe('You drummed on the pot.');
      await Q.sync();
      expect(draft(Q, before)?.typedText).toBe('You drummed on the pot.'); // the other phone keeps its held drafts
      expect(local(Q, id)?.final_text).toBe('You read to your bear, then to me.');
    } finally {
      await server.sys("select set_config('app.held_sync', '', false)");
    }

    // On again: the first pull carries the held section; then the same let-go op goes and applies.
    await P.sync(w.s);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect([await receipt(upOp), await receipt(goOp)]).toEqual([false, true]); // the upload never went again: the Keep carried its words
    expect(w.answers('held.upsert', id)).toHaveLength(1);
    expect(w.answers('held.discard', before).at(-1)).toMatchObject({ ok: true });
    expect(await held(before)).toBeUndefined();
    expect(await marker(before)).toBe('discarded');
    await Q.sync();
    expect(draft(Q, before)).toBeUndefined();
    expect(local(Q, id)?.final_text).toBe('You read to your bear, then to me.');
  }, 60_000);

  it('[switch off, after a lost answer] a retried held op answered held_off stays sent: an edit while off goes as a new op and reaches the other phone, and a let-go while off sticks on both (confirmation review)', async () => {
    const w = watch();
    const edited = typed(P, 'You found the red leaf.');
    const letGone = typed(P, 'You named every duck.');
    expect(P.store.holdDraft(edited, { inBookChoice: true })).toBe(true);
    expect(P.store.holdDraft(letGone, { inBookChoice: true })).toBe(true);
    await P.sync(lost(w.s)); // both applied and claimed; the one answer lost
    expect((await held(edited))?.typed_text).toBe('You found the red leaf.');
    expect((await held(letGone))?.typed_text).toBe('You named every duck.');
    const upOp = queued(P, 'held.upsert', edited)!.opId;
    await server.sys("select set_config('app.held_sync', 'off', false)");
    try {
      tick(2_000);
      await P.sync(w.s); // the retries are answered held_off, before the server looks at its receipts
      expect(w.answers('held.upsert', edited).at(-1)).toMatchObject({ held_off: true });
      P.store.setDraftTyped(edited, 'You found the red leaf and kept it.');
      const ups = P.db.all<{ op_id: string }>("SELECT op_id FROM sync_outbox WHERE entity_id = ? AND type = 'held.upsert' ORDER BY seq", edited).map((r) => r.op_id);
      expect(ups).toHaveLength(2); // the claimed op is left as sent; the edit is a new op
      expect(ups[0]).toBe(upOp);
      letGo(P, letGone);
      expect(outbox(P)).toEqual(['held.upsert', 'held.upsert', 'held.upsert', 'held.discard']); // the let-go goes; the upload before it stays
    } finally {
      await server.sys("select set_config('app.held_sync', '', false)");
    }
    // On again: the first ops answer dup; the edit applies; the let-go, rebased on the version the upload wrote, applies.
    await P.sync(w.s);
    await P.sync(w.s);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(w.answers('held.upsert', edited).filter((a) => a.dup)).toHaveLength(1);
    expect((await held(edited))?.typed_text).toBe('You found the red leaf and kept it.');
    expect(await held(letGone)).toBeUndefined();
    expect(await marker(letGone)).toBe('discarded');
    await Q.sync();
    expect(draft(Q, edited)?.typedText).toBe('You found the red leaf and kept it.');
    expect(draft(Q, letGone)).toBeUndefined();
    expect(draft(P, letGone)).toBeUndefined();
  }, 60_000);
});

describe('a refused op that runs again after a lost answer and meets SCCON: the ops behind it stay sent (#182 re-check)', () => {
  let P: Phone; // its push answer is lost
  let Q: Phone; // Mama's other phone, which erases
  let papa: Phone; // reads the book
  let BOOK = '';
  /** A terms version that asks every member to consent again: a major change, its 30 days' notice over, now in force. */
  const TERMS_AGAIN = '2.0.0';
  const publishTermsAgain = () => server.sys(
    `insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
     values ('terms', $1, 'major', true, now() - interval '31 days', now() - interval '31 days', now() - interval '1 minute',
             sha256(convert_to('terms ' || $1, 'UTF8')), 'https://example.invalid/terms/' || $1, 'Second version')
     on conflict do nothing`, [TERMS_AGAIN]);
  const acceptTerms = (uid: string, version: string) => server.userSql(uid,
    `select public.record_policy_act('terms', $1, 'accept', 'reconsent_sheet', 'auth.sheet', '1', 'ios', 'en-US')`, [version]);

  beforeEach(async () => {
    if (!server) return;
    await server.sys('delete from sync_rate_windows');
    // A case that failed midway never leaves consent withdrawn, or a newer terms version unaccepted, for the next one.
    const g = (await server.sys('select sensitive_data from public.content_gate_state($1)', [MAMA])).rows[0];
    if (g && !g.sensitive_data) await server.sensitiveConsent(MAMA, 'accept');
    for (const u of [MAMA, PAPA]) {
      const t = (await server.sys('select terms_current from public.content_gate_state($1)', [u])).rows[0];
      if (t && !t.terms_current) await acceptTerms(u, TERMS_AGAIN);
    }
  });

  beforeAll(async () => {
    server = await startSyncServer({ users: [MAMA, PAPA], protocol: 'v1' });
    await server.consent(MAMA, PAPA);
    P = await phone('P', MAMA);
    Q = await phone('Q', MAMA);
    papa = await phone('papa', PAPA);
    BOOK = P.store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Mama' }).id;
    await P.signIn();
    await Q.signIn();
    const token = (await server.userSql(MAMA, `select public.create_child_invite($1, 'parent') t`, [BOOK])).rows[0].t;
    await server.userSql(PAPA, 'select public.accept_child_invite($1)', [token]);
    await papa.signIn();
  }, 120_000);

  interface Push {
    ops: { op: string; type: string; id: string }[];
    res: { paused?: boolean; results?: { op: string; ok: boolean; code?: string; dup?: boolean }[] } | null;
  }
  /** Every push P sends with the server's answer, recorded before a lost answer is dropped. */
  const watch = () => {
    const pushes: Push[] = [];
    const s: SupabaseLike = {
      rpc(fn, args) {
        return Promise.resolve(server.serverFor(MAMA).rpc(fn, args)).then((res) => {
          if (fn === 'sync_push') {
            const ops = (args as { p_ops: Push['ops'] }).p_ops.map(({ op, type, id }) => ({ op, type, id }));
            pushes.push({ ops, res: res.data as Push['res'] });
          }
          return res;
        });
      },
    };
    return { s, pushes };
  };
  const receipt = async (op: string) => (await server.sys('select 1 from sync_op_receipts where op_id = $1', [op])).rows.length === 1;
  /** The queued ops of one letter or held draft, oldest first. */
  const queuedFor = (p: Phone, id: string) =>
    p.db.all<{ op_id: string; type: string; sent_at: string | null }>('SELECT op_id, type, sent_at FROM sync_outbox WHERE entity_id = ? ORDER BY seq', id);
  const words = (p: Phone, id: string) => p.db.get<{ final_text: string; sync_state: string }>('SELECT final_text, sync_state FROM entries WHERE id = ?', id);
  const heldText = async (id: string) => (await server.sys('select typed_text from held_drafts where id = $1', [id])).rows[0]?.typed_text as string | undefined;
  const draftText = (p: Phone, id: string) => p.store.listHeldDrafts(BOOK).find((d) => d.id === id)?.typedText;

  /**
   * The re-check's case on the real SQL. P edits a letter offline (op B) that Q has erased with Erase now, so
   * B is refused SCDEL purged: its block rolls back, and its claim with it. `queue` puts ops that apply behind
   * B in the same batch. The answer is lost. Consent is then withdrawn, so the retry runs B again, B meets
   * SCCON before anything else, and the server answers paused with no results. With `losePull`, the pull of
   * that paused cycle is lost too, so P learns nothing from it about the ops that applied.
   * - `refusal: 'scimm'`: B is refused SCIMM instead (a client bug changed P's raw transcript of the letter,
   *   as in table C's note), also unclaimed, and it meets SCCON first on the retry (entries_family_rules runs
   *   before entries_guard).
   * - `pause: 'terms'`: the pause is a terms version that asks every member to consent again (`requires_reconsent`),
   *   not a withdrawn consent; the server raises it from the same require_content_consent().
   * - `beforePause` runs after the lost answer and before the pause starts (another phone's change).
   * - `behindRefused` names ops behind B that the lost run refused too (every other op behind B applied).
   */
  const refusedThenPaused = async (
    queue: () => void,
    opts: {
      losePull?: boolean; refusal?: 'gone' | 'scimm'; pause?: 'sensitive' | 'terms'; beforePause?: () => Promise<void>;
      behindRefused?: () => string[];
    } = {},
  ) => {
    const scimm = opts.refusal === 'scimm';
    const erased = writeLetter(P, BOOK, 'You ate a whole pear.');
    await P.sync();
    await Q.sync();
    if (scimm) P.db.run('UPDATE entries SET raw_transcript = ? WHERE id = ?', 'changed by a bug', erased);
    editWords(P, erased, 'You ate a whole pear, and the core.'); // offline: op B
    const opB = queuedFor(P, erased)[0].op_id;
    queue();
    if (!scimm) {
      tick();
      Q.store.deleteEntry(erased);
      expect(Q.store.eraseEntry(erased, () => {})).toBe(true);
      await Q.sync();
    }

    const w = watch();
    expect((await P.sync(flaky(w.s, { loseAnswer: 1, only: 'sync_push' }))).phase).toBe('offline');
    const [first] = w.pushes;
    expect(first.ops[0].op).toBe(opB);
    expect(first.res?.results).toHaveLength(first.ops.length);
    expect(first.res?.results?.[0]).toEqual(scimm
      ? { op: opB, ok: false, code: 'SCIMM' }
      : { op: opB, ok: false, code: 'SCDEL', gone: true });
    const refusedBehind = opts.behindRefused?.() ?? [];
    expect(first.res?.results?.slice(1).filter((r) => !r.ok).map((r) => r.op)).toEqual(refusedBehind); // the other ops behind B applied
    expect(await receipt(opB)).toBe(false); // refused, so not claimed
    await opts.beforePause?.();

    if (opts.pause === 'terms') await publishTermsAgain();
    else await server.sensitiveConsent(MAMA, 'withdraw');
    tick(2_000);
    const retry = opts.losePull ? flaky(w.s, { failBefore: 1, only: 'sync_pull' }) : w.s;
    expect((await P.sync(retry)).phase).toBe(opts.losePull ? 'offline' : 'paused_consent');
    expect(w.pushes[1]).toMatchObject({
      ops: first.ops, res: { paused: true, results: [], consent: opts.pause === 'terms' ? 'terms' : 'sensitive-data' },
    }); // the same batch; B met SCCON
    return { erased, opB, w };
  };
  /** A typed draft P holds at the Keep gate and uploads; Q pulls it. */
  const heldOnBoth = async (text: string) => {
    tick(5_000);
    const id = P.store.createDraft({ childId: BOOK, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text }).id;
    expect(P.store.holdDraft(id, { inBookChoice: true })).toBe(true);
    await P.sync();
    await Q.sync();
    expect(draftText(Q, id)).toBe(text);
    return id;
  };
  /** Let it go, confirmed (F04-REQ-009): the store's two steps, with no file on disk. */
  const letGo = (p: Phone, id: string) => {
    expect(p.store.beginDiscard(id)).toBe(true);
    expect(p.store.finishDiscard(id)).toBe(true);
  };
  /** The pushes that carried an op of this id, with that op's answer. */
  const answersFor = (w: ReturnType<typeof watch>, type: string, id: string) =>
    w.pushes.flatMap((p) => {
      const op = p.ops.find((o) => o.type === type && o.id === id);
      if (!op) return [];
      return [{ alone: p.ops.length === 1, paused: !!p.res?.paused, answer: p.res?.results?.find((r) => r.op === op.op) ?? null }];
    });

  it('[F16-REQ-025] [LEGAL-REQ-009] an edit of the letter behind it, made while the retry waits for consent, reaches the server, the author\'s other phone and the co-parent', async () => {
    const bus = writeLetter(P, BOOK, 'You waved at the bus.');
    await P.sync();
    await Q.sync();
    await papa.sync();
    let opA = '';
    const { erased, opB, w } = await refusedThenPaused(() => {
      editWords(P, bus, 'You waved at the bus, and the driver waved back.'); // op A, behind B
      opA = queuedFor(P, bus)[0].op_id;
    });
    expect(await receipt(opA)).toBe(true);
    expect((await serverEntry(bus))?.final_text).toBe('You waved at the bus, and the driver waved back.'); // A applied on the first run

    // A may have applied under its op id (it did), so the paused answer leaves it as sent: never rewritten.
    // Before the fix it was reset to never sent, the edit below rewrote it in place under the same op id,
    // the server answered that op dup, and the newer words stayed on P alone, marked synced.
    expect(queuedFor(P, bus)).toEqual([{ op_id: opA, type: 'entry.upsert', sent_at: expect.any(String) }]);
    const latest = 'You waved at the bus, the driver waved back, and you laughed.';
    editWords(P, bus, latest);
    const ops = queuedFor(P, bus);
    expect(ops).toHaveLength(2);
    expect(ops[0]).toMatchObject({ op_id: opA, sent_at: expect.any(String) });
    expect(ops[1]).toMatchObject({ type: 'entry.upsert', sent_at: null });

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    expect(await P.sync(w.s)).toMatchObject({ rejected: 1, conflicts: 0, phase: 'idle' });
    const [retry, edit] = w.pushes.slice(-2);
    expect(retry.res?.results).toEqual([
      expect.objectContaining({ op: opB, ok: false, code: 'SCDEL' }), // refused for good this time
      expect.objectContaining({ op: opA, ok: true, dup: true }),
    ]);
    expect(edit).toMatchObject({ ops: [{ op: ops[1].op_id }], res: { results: [{ ok: true, applied: true }] } });
    expect(outbox(P)).toEqual([]);

    expect((await serverEntry(bus))?.final_text).toBe(latest);
    expect(words(P, bus)).toEqual({ final_text: latest, sync_state: 'synced' });
    expect(P.store.listConflicts(bus)).toEqual([]);
    expect(P.db.all('SELECT code FROM rejected_writes WHERE entity_id = ?', bus)).toEqual([]);
    // B's words are never lost either: refused as gone, its letter stays on P in Recently deleted.
    expect(P.db.all('SELECT op_id, code FROM rejected_writes WHERE entity_id = ?', erased)).toEqual([{ op_id: opB, code: 'SCDEL' }]);
    expect(P.store.listDeleted().map((e) => e.id)).toContain(erased);
    expect(await serverEntry(erased)).toBeUndefined();

    await Q.sync();
    await papa.sync();
    expect(words(Q, bus)?.final_text).toBe(latest);
    expect(words(papa, bus)?.final_text).toBe(latest);
    expect(Q.store.listConflicts(bus)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] a held draft edited and a new letter deleted behind it while the retry waits for consent: the edit reaches the other phone, and the letter stays deleted everywhere', async () => {
    tick(5_000);
    const hum = P.store.createDraft({ childId: BOOK, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You hummed at the rain.' }).id;
    expect(P.store.holdDraft(hum, { inBookChoice: true })).toBe(true);
    await P.sync();
    await Q.sync();
    expect(draftText(Q, hum)).toBe('You hummed at the rain.');
    let step = '';
    const { w } = await refusedThenPaused(() => {
      P.store.setDraftTyped(hum, 'You hummed at the rain, then at me.'); // a held.upsert behind B
      step = writeLetter(P, BOOK, 'You climbed the step.'); // a first upload behind B
    });
    expect(await heldText(hum)).toBe('You hummed at the rain, then at me.'); // both applied on the first run
    expect((await serverEntry(step))?.deleted_at).toBeNull();
    await papa.sync();
    expect(row(papa, step)).not.toBeNull();

    const latest = 'You hummed at the rain, then at me, then at the cat.';
    P.store.setDraftTyped(hum, latest);
    expect(queuedFor(P, hum).map((o) => [o.type, o.sent_at === null])).toEqual([['held.upsert', false], ['held.upsert', true]]); // a new op
    tick();
    P.store.deleteEntry(step);
    expect(queuedFor(P, step).map((o) => o.type)).toEqual(['entry.upsert', 'entry.delete']); // the upload may be on the server: the delete goes
    expect((await P.sync(w.s)).phase).toBe('paused_consent'); // deletions still go during the pause
    expect((await serverEntry(step))?.deleted_at).not.toBeNull();
    expect(queuedFor(P, step)).toEqual([]); // the delete the server took dropped the upload queued before it

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(await heldText(hum)).toBe(latest);
    expect((await serverEntry(step))?.deleted_at).not.toBeNull(); // the upload that waited never brought it back
    expect(draftText(P, hum)).toBe(latest);
    expect(P.store.listConflicts(hum)).toEqual([]);
    expect(P.store.listDeleted().map((e) => e.id)).toContain(step);

    await Q.sync();
    await papa.sync();
    expect(draftText(Q, hum)).toBe(latest);
    expect(Q.store.listHeldDrafts(BOOK).filter((d) => d.id === hum)).toHaveLength(1);
    expect(row(papa, step)).toBeNull();
    expect(row(Q, step)?.deleted_at).not.toBeNull();
  }, 60_000);
  it('[LEGAL-REQ-009] a new letter behind it, deleted while the retry waits for consent after the pull of that cycle was lost: the delete still reaches the server, it leaves Papa\'s phone, and it stays in P\'s Recently deleted', async () => {
    let stairs = '';
    const { w } = await refusedThenPaused(() => {
      stairs = writeLetter(P, BOOK, 'You climbed the stairs on your own.'); // a first upload behind B
    }, { losePull: true });
    expect((await serverEntry(stairs))?.deleted_at).toBeNull(); // applied on the first run
    await papa.sync();
    expect(row(papa, stairs)).not.toBeNull();

    // No pull has told P that the letter is on the server. Before the fix its upload was reset to never sent,
    // so this delete dropped it and sent nothing: the letter stayed in the book on the server and on Papa's phone.
    tick();
    P.store.deleteEntry(stairs);
    await P.sync(w.s); // deletions still go during the pause
    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect((await serverEntry(stairs))?.deleted_at).not.toBeNull();
    expect(P.store.listDeleted().map((e) => e.id)).toContain(stairs);
    await papa.sync();
    expect(row(papa, stairs)).toBeNull();
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] a held draft let go while its upload waits for consent, the upload having applied on the lost run: the let-go is not answered kept, and the draft leaves the server and both phones (review A N1 on #250)', async () => {
    const nap = await heldOnBoth('You napped in the sling.');
    let opH = '';
    const { w } = await refusedThenPaused(() => {
      P.store.setDraftTyped(nap, 'You napped in the sling, all the way home.'); // op H, behind B
      opH = queuedFor(P, nap)[0].op_id;
    });
    expect(await receipt(opH)).toBe(true);
    expect(await heldText(nap)).toBe('You napped in the sling, all the way home.'); // H applied on the first run
    await Q.sync();
    expect(draftText(Q, nap)).toBe('You napped in the sling, all the way home.');

    // P never heard H's answer, so its let-go names the version from before H: stale only because of P's own upload.
    letGo(P, nap);
    expect(queuedFor(P, nap).map((o) => [o.type, o.op_id === opH, o.sent_at === null])).toEqual([['held.upsert', true, false], ['held.discard', false, true]]);
    expect((await P.sync(w.s)).phase).toBe('paused_consent'); // deletions still go during the pause
    // Taken, not kept. Before the fix the let-go left first, on the older version, and was answered kept: the
    // draft came back on P at its next pull and stayed on Q and the server, until the author let it go again.
    expect(answersFor(w, 'held.discard', nap)).toEqual([{ alone: true, paused: false, answer: { op: expect.any(String), ok: true } }]);
    expect(await heldText(nap)).toBeUndefined();
    expect((await server.sys('select gone from held_drafts_gone where id = $1', [nap])).rows).toEqual([{ gone: 'discarded' }]);
    // How: the retry went ahead of the let-go, on its own, and the server answered it from its receipt (no consent
    // check runs for a repeat), so the let-go named the version H wrote.
    expect(answersFor(w, 'held.upsert', nap).at(-1)).toEqual({ alone: true, paused: false, answer: expect.objectContaining({ ok: true, dup: true, applied_v: expect.any(String) }) });
    expect(outbox(P)).toEqual([expect.any(String)]); // only B waits, for consent

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(await heldText(nap)).toBeUndefined();
    expect(draftText(P, nap)).toBeUndefined();
    expect(P.db.all('SELECT 1 FROM drafts WHERE id = ?', nap)).toEqual([]);
    expect(P.store.listConflicts(nap)).toEqual([]);
    await Q.sync();
    expect(draftText(Q, nap)).toBeUndefined(); // gone: discarded, at its next pull
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] the same let-go when the upload never reached the server and heads the queue: it meets SCCON itself (it never applied), so it does not go again ahead of the let-go, which leaves on its own base and is taken', async () => {
    const sock = await heldOnBoth('You lost a sock.');
    P.store.setDraftTyped(sock, 'You lost a sock under the sofa.'); // op H
    const opH = queuedFor(P, sock)[0].op_id;
    const w = watch();
    expect((await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' }))).phase).toBe('offline'); // H left the phone, never arrived
    expect(await receipt(opH)).toBe(false);
    await server.sensitiveConsent(MAMA, 'withdraw');
    tick(); // past H's backoff
    letGo(P, sock);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    // Alone at the head of the queue it met SCCON, so the server rolled it back: one request, not two.
    expect(answersFor(w, 'held.upsert', sock)).toEqual([{ alone: true, paused: true, answer: null }]);
    expect(answersFor(w, 'held.discard', sock)).toEqual([{ alone: true, paused: false, answer: { op: expect.any(String), ok: true } }]);
    expect(await heldText(sock)).toBeUndefined();
    expect(outbox(P)).toEqual([]); // the server took the let-go, so the upload queued before it is dropped

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(await heldText(sock)).toBeUndefined(); // nothing waited to bring it back
    await Q.sync();
    expect(draftText(Q, sock)).toBeUndefined();
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] the same let-go when the upload never reached the server behind an edit that meets SCCON first: it goes ahead of the let-go once, meets SCCON itself, and the let-go then leaves on its own base and is taken', async () => {
    const swing = writeLetter(P, BOOK, 'You rode the swing.');
    await P.sync();
    const mitt = await heldOnBoth('You lost a mitten.');
    editWords(P, swing, 'You rode the swing, higher and higher.'); // op E, ahead of H
    P.store.setDraftTyped(mitt, 'You lost a mitten in the snow.'); // op H
    const opH = queuedFor(P, mitt)[0].op_id;
    const w = watch();
    expect((await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' }))).phase).toBe('offline'); // E and H left, never arrived
    expect(await receipt(opH)).toBe(false);
    await server.sensitiveConsent(MAMA, 'withdraw');
    tick();
    letGo(P, mitt);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    // E met SCCON, so nothing tells H's fate; H then goes ahead of the let-go once, alone, and meets SCCON itself.
    expect(answersFor(w, 'held.upsert', mitt)).toEqual([{ alone: false, paused: true, answer: null }, { alone: true, paused: true, answer: null }]);
    expect(answersFor(w, 'held.discard', mitt)).toEqual([{ alone: true, paused: false, answer: { op: expect.any(String), ok: true } }]);
    expect(await heldText(mitt)).toBeUndefined();
    expect(outbox(P)).toEqual(['entry.upsert']); // only E waits, for consent

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect((await serverEntry(swing))?.final_text).toBe('You rode the swing, higher and higher.');
    expect(await heldText(mitt)).toBeUndefined();
    await Q.sync();
    expect(draftText(Q, mitt)).toBeUndefined();
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] two held uploads go ahead of their let-gos one at a time: the first never applied and meets SCCON, so the second, which applied, is still answered and its let-go is taken (review B N5 on #259)', async () => {
    const rain = await heldOnBoth('You splashed in the rain.');
    const moon = await heldOnBoth('You waved at the moon.');
    let opHa = '';
    let opHb = '';
    const { w } = await refusedThenPaused(() => {
      P.store.setDraftTyped(rain, 'You splashed in the rain in your new boots.'); // op Ha, behind B
      opHa = queuedFor(P, rain)[0].op_id;
      // A client bug sends a capture mode the server refuses (23514, held_drafts_write_checks), so Ha never
      // applies and is not claimed; in the pause it meets SCCON first (the consent gate runs before the check).
      const row = P.db.get<{ seq: number; payload: string }>('SELECT seq, payload FROM sync_outbox WHERE op_id = ?', opHa)!;
      const p = JSON.parse(row.payload) as { data: Record<string, unknown> };
      p.data.capture_mode = 'hummed';
      P.db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), row.seq);
      P.store.setDraftTyped(moon, 'You waved at the moon, and it followed the car.'); // op Hb, behind Ha
      opHb = queuedFor(P, moon)[0].op_id;
    }, { behindRefused: () => [opHa] });
    expect(await receipt(opHa)).toBe(false);
    expect(await receipt(opHb)).toBe(true);
    letGo(P, rain);
    letGo(P, moon);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    // Each goes alone, so a paused answer can only be about that one upload. Two in one batch would both look
    // unanswered, and the second let-go would leave on the version from before Hb and be answered kept.
    expect(answersFor(w, 'held.upsert', rain).at(-1)).toEqual({ alone: true, paused: true, answer: null });
    expect(answersFor(w, 'held.upsert', moon).at(-1)).toEqual({ alone: true, paused: false, answer: expect.objectContaining({ ok: true, dup: true }) });
    expect(answersFor(w, 'held.discard', moon)).toEqual([expect.objectContaining({ paused: false, answer: { op: expect.any(String), ok: true } })]);
    expect(answersFor(w, 'held.discard', rain)).toEqual([expect.objectContaining({ paused: false, answer: { op: expect.any(String), ok: true } })]);
    expect(await heldText(rain)).toBeUndefined();
    expect(await heldText(moon)).toBeUndefined();

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(P.db.all("SELECT op_id FROM rejected_writes WHERE entity_id IN (?, ?)", rain, moon)).toEqual([]);
    await Q.sync();
    expect([draftText(Q, rain), draftText(Q, moon)]).toEqual([undefined, undefined]);
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] the same let-go after the author\'s other phone changed the draft once this phone\'s upload applied: still answered kept, and the other phone\'s words stay on the server and come back to this phone', async () => {
    const tea = await heldOnBoth('You poured pretend tea.');
    let opH = '';
    const theirs = 'You poured pretend tea for the bear, and then for me.';
    const { w } = await refusedThenPaused(() => {
      P.store.setDraftTyped(tea, 'You poured pretend tea for the bear.'); // op H, behind B
      opH = queuedFor(P, tea)[0].op_id;
    }, {
      beforePause: async () => {
        await Q.sync();
        expect(draftText(Q, tea)).toBe('You poured pretend tea for the bear.');
        tick(5_000);
        Q.store.setDraftTyped(tea, theirs);
        await Q.sync(); // Q's words reach the server after H
      },
    });
    expect(await receipt(opH)).toBe(true);
    expect(await heldText(tea)).toBe(theirs);

    letGo(P, tea);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    // Rebased on the version P's own upload wrote, the let-go is still older than Q's words: a later edit on
    // another phone wins over a let-go (final review B-2), so the server keeps the row.
    expect(answersFor(w, 'held.upsert', tea).at(-1)?.answer).toMatchObject({ ok: true, dup: true });
    expect(answersFor(w, 'held.discard', tea)).toEqual([{ alone: true, paused: false, answer: expect.objectContaining({ ok: true, kept: true }) }]);
    expect(await heldText(tea)).toBe(theirs);

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(await heldText(tea)).toBe(theirs);
    expect(draftText(P, tea)).toBe(theirs); // back on P with Q's words
    await Q.sync();
    expect(draftText(Q, tea)).toBe(theirs);
    expect(Q.store.listHeldDrafts(BOOK).filter((d) => d.id === tea)).toHaveLength(1);
    expect(Q.store.listConflicts(tea)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] the same let-go while the other phone changes the draft during the pause: the let-go is taken, and the other phone\'s words, sent once consent returns, bring the draft back to both phones (a later edit wins over a let-go)', async () => {
    const hat = await heldOnBoth('You wore the paper hat.');
    const { w } = await refusedThenPaused(() => {
      P.store.setDraftTyped(hat, 'You wore the paper hat to bed.'); // op H, behind B
    });
    await Q.sync();
    expect(draftText(Q, hat)).toBe('You wore the paper hat to bed.');
    const theirs = 'You wore the paper hat to bed, and to breakfast.';
    tick(5_000);
    Q.store.setDraftTyped(hat, theirs);
    expect((await Q.sync()).phase).toBe('paused_consent'); // Q's upload waits for consent too (one author)

    letGo(P, hat);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    expect(answersFor(w, 'held.discard', hat)).toEqual([{ alone: true, paused: false, answer: { op: expect.any(String), ok: true } }]);
    expect(await heldText(hat)).toBeUndefined(); // the server never had Q's words: the let-go is taken

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await Q.sync(); // Q's upload (table D): the row is made again from Q's words
    expect(await heldText(hat)).toBe(theirs);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect(draftText(P, hat)).toBe(theirs);
    await Q.sync();
    expect(draftText(Q, hat)).toBe(theirs);
    expect(Q.store.listConflicts(hat)).toEqual([]);
  }, 60_000);

  it('[F16-REQ-025] [LEGAL-REQ-009] the retry pauses the same way when a new terms version asks for consent again: the ops behind it stay sent, and an edit made while it waits reaches the server, the other phone and the co-parent once the terms are accepted (review B on #250)', async () => {
    const kite = writeLetter(P, BOOK, 'You held the kite string.');
    await P.sync();
    await Q.sync();
    await papa.sync();
    let opA = '';
    const { opB, w } = await refusedThenPaused(() => {
      editWords(P, kite, 'You held the kite string with both hands.'); // op A, behind B
      opA = queuedFor(P, kite)[0].op_id;
    }, { pause: 'terms' });
    expect(P.db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'sync.pausedFor'")?.value).toBe('terms');
    expect(await receipt(opA)).toBe(true);
    expect(queuedFor(P, kite)).toEqual([{ op_id: opA, type: 'entry.upsert', sent_at: expect.any(String) }]); // left as sent
    const latest = 'You held the kite string with both hands, and it pulled you along.';
    editWords(P, kite, latest);
    expect(queuedFor(P, kite).map((o) => o.sent_at === null)).toEqual([false, true]); // a new op behind it

    await acceptTerms(MAMA, TERMS_AGAIN);
    await acceptTerms(PAPA, TERMS_AGAIN);
    tick(2_000);
    expect(await P.sync(w.s)).toMatchObject({ rejected: 1, conflicts: 0, phase: 'idle' });
    expect(w.pushes.at(-2)?.res?.results).toEqual([
      expect.objectContaining({ op: opB, ok: false, code: 'SCDEL' }),
      expect.objectContaining({ op: opA, ok: true, dup: true }),
    ]);
    expect(outbox(P)).toEqual([]);
    expect((await serverEntry(kite))?.final_text).toBe(latest);
    expect(words(P, kite)).toEqual({ final_text: latest, sync_state: 'synced' });
    expect(P.store.listConflicts(kite)).toEqual([]);
    await Q.sync();
    await papa.sync();
    expect(words(Q, kite)?.final_text).toBe(latest);
    expect(words(papa, kite)?.final_text).toBe(latest);
  }, 60_000);

  it('[F16-REQ-025] [LEGAL-REQ-009] a retry first refused SCIMM pauses the same way: it stays sent, is refused SCIMM again once consent returns and becomes a conflict copy the author sees, and an edit behind it reaches the server and both phones (review B on #250)', async () => {
    const shell = writeLetter(P, BOOK, 'You found a shell in the sand.');
    await P.sync();
    await Q.sync();
    await papa.sync();
    let opA = '';
    const { erased: odd, opB, w } = await refusedThenPaused(() => {
      editWords(P, shell, 'You found a shell in the sand and held it to your ear.'); // op A, behind B
      opA = queuedFor(P, shell)[0].op_id;
    }, { refusal: 'scimm' });
    expect(await receipt(opA)).toBe(true);
    expect(queuedFor(P, odd)).toEqual([{ op_id: opB, type: 'entry.upsert', sent_at: expect.any(String) }]); // B left as sent, never rewritten
    expect(queuedFor(P, shell)).toEqual([{ op_id: opA, type: 'entry.upsert', sent_at: expect.any(String) }]);
    const latest = 'You found a shell in the sand, held it to your ear, and heard the sea.';
    editWords(P, shell, latest);

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    expect(await P.sync(w.s)).toMatchObject({ rejected: 0, conflicts: 1, phase: 'idle' });
    expect(w.pushes.at(-2)?.res?.results).toEqual([
      { op: opB, ok: false, code: 'SCIMM' }, // refused again: the server keeps its raw transcript
      expect.objectContaining({ op: opA, ok: true, dup: true }),
    ]);
    expect(outbox(P)).toEqual([]);
    // B's words are never only in a refused write the author cannot see: they are a conflict copy.
    expect(P.store.listConflicts(odd).map((c) => c.words.final_text)).toEqual(['You ate a whole pear, and the core.']);
    expect(P.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM rejected_writes WHERE entity_id = ? AND code <> 'conflict'", odd)!.n).toBe(0);
    expect((await serverEntry(odd))?.final_text).toBe('You ate a whole pear.');
    expect((await serverEntry(shell))?.final_text).toBe(latest);
    expect(words(P, shell)).toEqual({ final_text: latest, sync_state: 'synced' });
    await Q.sync();
    await papa.sync();
    expect(words(Q, shell)?.final_text).toBe(latest);
    expect(words(papa, shell)?.final_text).toBe(latest);
    expect(words(Q, odd)?.final_text).toBe('You ate a whole pear.');
  }, 60_000);

  it('[F16-REQ-029] [LEGAL-REQ-009] the upload sent ahead of a let-go is refused (42501: the join was undone during the pause): it is dropped, not kept as a refused write, the let-go goes on its own base, and the server keeps the draft as it was (review B N4 on #259)', async () => {
    // Papa's own book for Asha, which Mama joins as a parent; Papa may undo that join for 72 hours (F11-REQ-008).
    const papas = papa.store.addChild({ name: 'Asha', birthday: '2025-04-12', dueDate: null, signsAs: 'Papa' }).id;
    await papa.sync();
    const token = (await server.userSql(PAPA, `select public.create_child_invite($1, 'parent') t`, [papas])).rows[0].t;
    await server.userSql(MAMA, 'select public.accept_child_invite($1)', [token]);
    const swing = writeLetter(P, BOOK, 'You pushed the swing.');
    await P.sync();
    expect(P.store.getChild(papas)).not.toBeNull();
    tick(5_000);
    const bath = P.store.createDraft({ childId: papas, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You sang in the bath.' }).id;
    expect(P.store.holdDraft(bath, { inBookChoice: true })).toBe(true);
    await P.sync();
    expect(await heldText(bath)).toBe('You sang in the bath.');

    editWords(P, swing, 'You pushed the swing all by yourself.'); // op E, ahead of H
    P.store.setDraftTyped(bath, 'You sang in the bath, and the duck sang back.'); // op H
    const w = watch();
    expect((await P.sync(flaky(w.s, { failBefore: 1, only: 'sync_push' }))).phase).toBe('offline'); // E and H never arrived
    await server.sensitiveConsent(MAMA, 'withdraw');
    expect((await server.userSql(PAPA, 'select public.undo_parent_join($1, $2) r', [papas, MAMA])).rows[0].r).toBe('undone');
    tick();
    letGo(P, bath);
    expect((await P.sync(w.s)).phase).toBe('paused_consent');
    // E met SCCON; H went ahead of the let-go and was refused before any write (not a parent of the book now).
    expect(answersFor(w, 'held.upsert', bath).at(-1)).toEqual({ alone: true, paused: false, answer: { op: expect.any(String), ok: false, code: '42501' } });
    // A refused op is not claimed, so it never applied: the let-go went on its own base. Mama is no longer a parent,
    // so the server answers missing and keeps the row (an undone join keeps the person's held drafts, 20261023010000).
    expect(answersFor(w, 'held.discard', bath)).toEqual([{ alone: true, paused: false, answer: { op: expect.any(String), ok: true, missing: true } }]);
    // The author let these words go after the upload was queued: no refused write keeps them (final review A-M3).
    expect(P.db.all('SELECT op_id, code FROM rejected_writes WHERE entity_id = ?', bath)).toEqual([]);
    expect((await P.sync(w.s)).rejected).toBe(0);
    // Nothing is lost: the server still holds the draft as it was before the upload, the author's own row.
    expect(await heldText(bath)).toBe('You sang in the bath.');

    await server.sensitiveConsent(MAMA, 'accept');
    tick(2_000);
    await P.sync(w.s);
    expect(outbox(P)).toEqual([]);
    expect((await serverEntry(swing))?.final_text).toBe('You pushed the swing all by yourself.');
  }, 60_000);
});
