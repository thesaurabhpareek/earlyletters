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
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { randomBytes } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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

  it('[LEGAL-REQ-009] a letter deleted during a consent pause stays deleted when consent returns (final review B-1, P10)', async () => {
    await server.sensitiveConsent(MAMA, 'withdraw');
    ids.paused = writeLetter(mama, ASHA, 'You held the spoon by yourself.');
    expect((await mama.sync()).phase).toBe('paused_consent'); // the upload met SCCON and waits
    tick();
    mama.store.deleteEntry(ids.paused);
    expect(outbox(mama)).toEqual([]); // it never reached the server: deleted before it left, nothing to send
    await mama.sync();
    await server.sensitiveConsent(MAMA, 'accept');
    await mama.sync();
    expect(await serverEntry(ids.paused)).toBeUndefined();
    expect(mama.store.listDeleted().map((e) => e.id)).toContain(ids.paused);
    await papa.sync();
    expect(row(papa, ids.paused)).toBeNull();
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
