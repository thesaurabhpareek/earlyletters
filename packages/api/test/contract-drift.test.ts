/// <reference types="node" />
/**
 * Contract drift (ADR 0017 rule 8, F16-REQ-028, F11 WP-F11-04 "error enums
 * equal the migration's codes"): reads every file in supabase/migrations and
 * fails when the SQL and the contracts in this package disagree.
 *
 * Planned parts (S02's pending work, listed in each contract) may be missing
 * from the SQL; built parts may not. When S02 lands a planned RPC, op or key,
 * flip its status here in the same wave (S07 owns this package).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifySqlstate, ENDPOINTS, ERROR_DETAILS, SQLSTATE_RULES, type EndpointName, type EndpointSpec } from '../src';
import {
  AUTHOR_ONLY_COLUMNS,
  BookInviteSchema,
  BookMemberSchema,
  BOOK_UPDATE_KEYS,
  ConflictCurrentSchema,
  CONSENT_KINDS,
  EntryStateSchema,
  ESCROW_ERROR_DETAILS,
  FIELD_GROUPS,
  HELD_DRAFT_DATA_KEYS,
  HELD_GONE_KINDS,
  INVITE_UNUSABLE_DETAILS,
  PLANNED_PREFS_KEYS,
  PLANNED_PUSH_OP_TYPES,
  ENTRY_DATA_KEYS,
  GoneBookSchema,
  PREFS_KEYS,
  PulledHeldSchema,
  PulledRowSchema,
  PullResponseSchema,
  PushResponseSchema,
  PushResultErrSchema,
  PushResultOkSchema,
  PUSH_OP_TYPES,
  SyncBookSchema,
  SyncBooksResponseSchema,
  WORDS_VERSION_COLUMNS,
  type AcceptInviteArgs,
  type CreateInviteArgs,
  type CreateInviteArgsV0,
  type LeaveChildArgs,
  type PeekInviteArgs,
  type RemoveMemberArgs,
  type RevokeInviteArgs,
  type SyncPullArgs,
  type SyncPushArgs,
  type UndoJoinArgs,
} from '../server';
import { KILL_SWITCH_KEYS } from '../src/kill-switches';

const MIGRATIONS = fileURLToPath(new URL('../../../supabase/migrations', import.meta.url));
const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const sql = files.map((f) => ({ f, text: readFileSync(join(MIGRATIONS, f), 'utf8') }));
const all = sql.map((s) => s.text).join('\n');

/** The body of the newest definition of a function (files sort by timestamp; last definition wins). */
function newestDefinition(fn: string, schema = 'public'): string {
  const re = new RegExp(`create or replace function ${schema}\\.${fn}\\s*\\(`, 'g');
  let body = '';
  for (const { text } of sql) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const end = text.indexOf('\n$$;', m.index);
      body = text.slice(m.index, end > 0 ? end : undefined);
    }
  }
  return body;
}

/** SQLSTATEs never raised by any file yet, with the reason they are already in the contract. */
const PLANNED_SQLSTATES: Record<string, string> = {
  SCVER: 'F16-REQ-019, WP-F16-16 (S02): sync API version refused',
  SCKIL: 'request to S02: SQL-side kill switch for the PostgREST paths (detail: the switch name)',
  SCBKO: 'S05 PR #151 (20261015230000, pending): backup or escrow off on the server',
  SCQTA: 'S05 PR #151 (20261015230000, pending): backup quota reached',
  SCSTP: 'S05 PR #151 (20261015230000, pending): step-up needed (sign in again, then retry)',
};

describe('[ADR-0017] error codes equal the migrations', () => {
  const raised = new Set([...all.matchAll(/errcode\s*=\s*'([0-9A-Z]{5})'/g)].map((m) => m[1]));

  it('finds the migrations', () => {
    expect(files.length).toBeGreaterThan(5);
    expect(raised.size).toBeGreaterThan(10);
  });

  it.each([...raised].filter((c) => c.startsWith('SC')))('%s raised in SQL has its own rule in SQLSTATE_RULES', (code) => {
    expect(SQLSTATE_RULES[code], `${code} needs a rule in packages/api/src/envelope.ts`).toBeDefined();
  });

  it('every SC rule in the contract is raised by a migration or is planned', () => {
    for (const code of Object.keys(SQLSTATE_RULES).filter((c) => c.startsWith('SC'))) {
      expect(raised.has(code) || code in PLANNED_SQLSTATES, `${code} is in the contract but no migration raises it`).toBe(true);
    }
  });

  it('[F11-REQ-026] SCCAP is mapped to parents_full and never retried', () => {
    expect(raised.has('SCCAP')).toBe(true);
    expect(classifySqlstate('SCCAP')).toEqual({ code: 'parents_full', action: 'tell_user', retryable: false });
  });

  it('every standard SQLSTATE raised in SQL classifies deterministically', () => {
    for (const code of [...raised].filter((c) => !c.startsWith('SC'))) {
      expect(['retry', 'reauth', 'reject', 'tell_user', 'pause_for_consent']).toContain(classifySqlstate(code).action);
    }
  });

  it('family, consent, escrow and kill-switch details are inside the closed ERROR_DETAILS list', () => {
    for (const d of [...INVITE_UNUSABLE_DETAILS, ...CONSENT_KINDS, ...ESCROW_ERROR_DETAILS, ...KILL_SWITCH_KEYS, 'purged']) {
      expect(ERROR_DETAILS as readonly string[]).toContain(d);
    }
  });
});

describe('[F16-REQ-028] the sync wire contract equals the SQL parser', () => {
  const push = newestDefinition('sync_push');

  it('op types: every built op is in the SQL, and nothing in the SQL is missing from the contract', () => {
    const inSql = new Set([...push.matchAll(/'((?:entry|book|prefs|held)\.[a-z_]+)'/g)].map((m) => m[1]));
    const built = PUSH_OP_TYPES.filter((t) => !PLANNED_PUSH_OP_TYPES.includes(t));
    for (const t of built) expect(inSql.has(t), `${t} missing from sync_push`).toBe(true);
    for (const t of inSql) expect(PUSH_OP_TYPES as readonly string[], `${t} is parsed by SQL but not in the contract`).toContain(t);
  });

  it('field groups are exactly the SQL list', () => {
    const m = /c_groups\s+constant\s+text\[\]\s*:=\s*array\[([^\]]+)\]/.exec(push);
    expect(m, 'c_groups not found in the newest sync_push').not.toBeNull();
    const groups = [...m![1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
    expect([...groups].sort()).toEqual([...FIELD_GROUPS].sort());
  });

  it('book.update keys equal the SQL allowlist; prefs.upsert keys hold every built key and nothing unknown', () => {
    // book.update moves into book_update() in S02's v1 gate (G-08); read both places.
    const scope = `${push}\n${newestDefinition('book_update')}`;
    const lists = [...scope.matchAll(/x not in \(([^)]+)\)/g)].map((m) => [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort());
    expect(lists).toContainEqual([...BOOK_UPDATE_KEYS].sort());
    const prefs = lists.find((l) => l.includes('signs_as') && l.includes('include_in_reminders'));
    expect(prefs, 'prefs.upsert allowlist not found').toBeDefined();
    for (const k of prefs!) expect(PREFS_KEYS as readonly string[], `${k} is accepted by SQL but not in the contract`).toContain(k);
    for (const k of PREFS_KEYS.filter((x) => !PLANNED_PREFS_KEYS.includes(x))) expect(prefs).toContain(k);
  });
});

describe('[F16-REQ-028] the pull row equals what sync_pull sends on own rows, field for field', () => {
  /** Columns in the contract that develop's sync_pull does not send yet. None since 20261015030000 and 20261016000000. */
  const PENDING_PULL_COLUMNS: string[] = [];
  const pull = newestDefinition('sync_pull');
  const start = pull.indexOf('case when p.author_id = v_uid then');
  const end = pull.indexOf('else', start);
  const ownBlock = start > 0 && end > start ? pull.slice(start, end) : '';
  const sqlKeys = new Set([...ownBlock.matchAll(/'([a-z_]+)',\s*p\.[a-z_]+/g)].map((m) => m[1]));
  sqlKeys.add('own');
  sqlKeys.add('v');
  const schemaKeys = Object.keys(PulledRowSchema.entries);

  it('finds the own-row builder', () => {
    expect(sqlKeys.size).toBeGreaterThan(20);
  });

  it('every key the SQL sends is in PulledRowSchema (nothing is stripped silently)', () => {
    for (const k of sqlKeys) expect(schemaKeys, `${k} is sent by sync_pull but not in PulledRowSchema`).toContain(k);
  });

  it('every key in PulledRowSchema is sent by the SQL, or is a pending S02 column', () => {
    for (const k of schemaKeys) expect(sqlKeys.has(k) || PENDING_PULL_COLUMNS.includes(k), `${k} is in the contract but sync_pull never sends it`).toBe(true);
  });

  it('the left-book section sends the same own-row keys, and its book entry equals GoneBookSchema (review A 7 on #138)', () => {
    const start = pull.indexOf('where key::uuid <> all(v_live)');
    const goneAt = pull.indexOf('v_gone := v_gone ||', start);
    expect(start > 0 && goneAt > start, 'the gone-books builder not found in the newest sync_pull').toBe(true);
    const goneKeys = new Set([...pull.slice(start, goneAt).matchAll(/'([a-z_]+)',\s*p\.[a-z_]+/g)].map((m) => m[1]));
    goneKeys.add('own');
    expect([...goneKeys].sort()).toEqual([...sqlKeys].sort());
    const entry = builtKeys(callAt(pull, pull.indexOf('jsonb_build_object(', goneAt)));
    expect([...entry].sort()).toEqual(Object.keys(GoneBookSchema.entries).sort());
  });
});

describe('[F16-REQ-028] entry.upsert data equals the keys sync_push reads; others\' rows equal book_entries', () => {
  /** Keys in the contract that develop's SQL does not read yet. None since 20261015030000 and 20261016000000. */
  const PENDING_ENTRY_KEYS: string[] = [];
  const push = newestDefinition('sync_push');
  const start = push.indexOf("when 'entry.upsert', 'entry.reupload' then");
  const end = push.indexOf("when 'entry.delete' then", start);
  const branch = start > 0 && end > start ? push.slice(start, end) : '';
  const sqlKeys = new Set([...branch.matchAll(/\bd\s*(?:->>|->|\?)\s*'([a-z_]+)'/g)].map((m) => m[1]));

  it('every key the SQL reads is in EntryData, and every EntryData key is read (or pending in S02\'s file)', () => {
    expect(sqlKeys.size).toBeGreaterThan(10);
    for (const k of sqlKeys) expect(ENTRY_DATA_KEYS as readonly string[], `sync_push reads ${k}, EntryData lacks it`).toContain(k);
    // `id` travels on the op (o->>'id'); the data copy is the client's own.
    for (const k of ENTRY_DATA_KEYS.filter((x) => x !== 'id')) {
      expect(sqlKeys.has(k) || PENDING_ENTRY_KEYS.includes(k), `EntryData has ${k}, sync_push never reads it`).toBe(true);
    }
  });

  it('every book_entries column (what other members receive) is in PulledRowSchema', () => {
    const view = [...all.matchAll(/create or replace view public\.book_entries[^]*?\bselect\b([^]*?)\bfrom public\.entries\b/g)].pop();
    expect(view, 'book_entries view not found').toBeDefined();
    const cols = [...view![1].matchAll(/\be\.([a-z_]+)/g)].map((m) => m[1]).filter((c) => c !== 'search');
    expect(cols.length).toBeGreaterThan(10);
    const keys = Object.keys(PulledRowSchema.entries);
    for (const c of cols) expect(keys, `book_entries sends ${c}`).toContain(c);
  });

  it('[F11-REQ-085] book_entries carries no author-only column (review A 7 on #138)', () => {
    const view = [...all.matchAll(/create or replace view public\.book_entries[^]*?\bselect\b([^]*?)\bfrom public\.entries\b/g)].pop();
    expect(view![1], 'book_entries must name its columns, never e.*').not.toMatch(/\be\.\*/);
    const cols = [...view![1].matchAll(/\be\.([a-z_]+)/g)].map((m) => m[1]);
    for (const c of AUTHOR_ONLY_COLUMNS) expect(cols, `book_entries sends the author-only ${c} to other members`).not.toContain(c);
  });
});

describe('[F16 6.2 D] sync_books equals SyncBooksResponseSchema (review A 7 on #138)', () => {
  const built = builtKeys(newestDefinition('sync_books'));
  /** In the contract, not built in sync_books: requested from S02 (BookMemberSchema, shared with the pull meta). */
  const PENDING_BOOK_KEYS = ['undo_until'];
  const known = new Set([SyncBooksResponseSchema, SyncBookSchema, BookMemberSchema, BookInviteSchema].flatMap(schemaKeys));

  it('every key sync_books builds is in the contract, and every contract key is built or pending', () => {
    expect(built.size).toBeGreaterThan(15);
    for (const k of built) expect(known.has(k), `sync_books sends ${k}, which the contract would drop`).toBe(true);
    for (const k of known) expect(built.has(k) || PENDING_BOOK_KEYS.includes(k), `${k} is in the contract but sync_books never sends it`).toBe(true);
  });
});

/** The text of the call that opens at `at` (`name(` ... `)`), quote-aware. */
function callAt(body: string, at: number): string {
  const open = body.indexOf('(', at);
  let depth = 0;
  let quoted = false;
  for (let i = open; i < body.length; i++) {
    const c = body[i];
    if (quoted) {
      if (c === "'") quoted = false;
      continue;
    }
    if (c === "'") quoted = true;
    else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return body.slice(at, i + 1);
  }
  return '';
}

/** An object schema's keys, through optional, nullable and pipe wrappers. */
function schemaKeys(schema: unknown): string[] {
  let s = schema as { entries?: Record<string, unknown>; wrapped?: unknown; pipe?: unknown[] } | undefined;
  while (s && !s.entries && (s.wrapped || s.pipe)) s = (s.wrapped ?? s.pipe![0]) as typeof s;
  return s?.entries ? Object.keys(s.entries) : [];
}

/** The literal keys of every `jsonb_build_object(...)` call in a body: the even arguments that are string literals. */
function builtKeys(body: string): Set<string> {
  const keys = new Set<string>();
  const marker = 'jsonb_build_object(';
  for (let at = body.indexOf(marker); at >= 0; at = body.indexOf(marker, at + 1)) {
    const args: string[] = [];
    let depth = 0;
    let quoted = false;
    let cur = '';
    for (let i = at + marker.length; i < body.length; i++) {
      const c = body[i];
      if (quoted) {
        cur += c;
        if (c === "'") quoted = false;
        continue;
      }
      if (c === "'") quoted = true;
      if (c === '(') depth++;
      if (c === ')') {
        if (depth === 0) break;
        depth--;
      }
      if (c === ',' && depth === 0) {
        args.push(cur.trim());
        cur = '';
        continue;
      }
      cur += c;
    }
    args.push(cur.trim());
    args.forEach((a, i) => {
      const m = /^'([a-z_]+)'$/.exec(a);
      if (i % 2 === 0 && m) keys.add(m[1]);
    });
  }
  return keys;
}

describe('[F16 6.2 I] held drafts: the contract equals 20261016000000', () => {
  const table = /create table public\.held_drafts \(([^]*?)\n\);/.exec(all);
  const gone = /create table public\.held_drafts_gone \(([^]*?)\n\);/.exec(all);

  it('a pulled held row carries every held_drafts column except author_id, sync_xid and text_xid, plus v', () => {
    expect(table, 'held_drafts table not found').not.toBeNull();
    // Any type (review A 7 on #138: integer, bigint and numeric were skipped); table constraints are not columns.
    const cols = new Set([...table![1].matchAll(/^ {2}([a-z_]+) +[a-z]/gm)].map((m) => m[1])
      .filter((c) => !['constraint', 'primary', 'unique', 'check', 'foreign', 'exclude'].includes(c)));
    // And every later file's alter table, in file order: sync_pull sends the row whole (to_jsonb).
    for (const { text } of sql) {
      for (const m of text.matchAll(/alter table (?:if exists )?(?:only )?public\.held_drafts\s+([^;]+);/g)) {
        for (const a of m[1].matchAll(/\badd column (?:if not exists )?([a-z_]+)/g)) cols.add(a[1]);
        for (const d of m[1].matchAll(/\bdrop column (?:if exists )?([a-z_]+)/g)) cols.delete(d[1]);
      }
    }
    expect(cols.size).toBeGreaterThan(15);
    const sent = [...[...cols].filter((c) => !['author_id', 'sync_xid', 'text_xid'].includes(c)), 'v'].sort();
    expect(Object.keys(PulledHeldSchema.entries).sort()).toEqual(sent);
  });

  it('the gone markers equal the held_drafts_gone check', () => {
    expect(gone, 'held_drafts_gone table not found').not.toBeNull();
    const m = /gone in \(([^)]+)\)/.exec(gone![1]);
    expect([...m![1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort()).toEqual([...HELD_GONE_KINDS].sort());
  });

  it('the held request reads only its cursor and the held section answers rows, cursor and more: no digest (review A 2 on #138)', () => {
    const pull = newestDefinition('sync_pull');
    const read = new Set([...pull.matchAll(/\bv_held\s*(?:->>|->|\?)\s*'([a-z_]+)'/g)].map((m) => m[1]));
    expect([...read], 'sync_pull reads a new key of the held request: add it to PullSince.held').toEqual(['cursor']);
    const at = pull.indexOf("'held', jsonb_build_object(");
    expect(at, 'the held section builder not found in the newest sync_pull').toBeGreaterThan(0);
    const answered = [...builtKeys(callAt(pull, at + "'held', ".length))].sort();
    expect(answered, 'the held section changed shape: update PullResponseSchema.held').toEqual(['cursor', 'more', 'rows']);
    expect(schemaKeys((PullResponseSchema.entries as Record<string, unknown>).held).sort()).toEqual(answered);
  });

  it('held.upsert reads exactly the HeldDraftData keys', () => {
    const body = newestDefinition('held_upsert', 'sync_private');
    const read = new Set([...body.matchAll(/\bd\s*(?:->>|->|\?)\s*'([a-z_]+)'/g)].map((m) => m[1]));
    expect(read.size).toBeGreaterThan(10);
    for (const k of read) expect(HELD_DRAFT_DATA_KEYS as readonly string[], `held_upsert reads ${k}, HeldDraftData lacks it`).toContain(k);
    // `id` is checked against the op id; every other key is read.
    for (const k of HELD_DRAFT_DATA_KEYS) expect(read.has(k), `HeldDraftData has ${k}, held_upsert never reads it`).toBe(true);
  });
});

describe('[F16-REQ-028] every key sync_push answers with is in the push result contract (nothing is stripped silently)', () => {
  const bodies = [
    newestDefinition('sync_push'),
    ...['held_state', 'held_upsert', 'held_discard', 'held_dup', 'erase_entry', 'erase_held', 'keep_check', 'dup_outcome'].map((f) => newestDefinition(f, 'sync_private')),
  ];
  /** An object schema's keys, through optional and nullable wrappers. */
  const keysOf = (schema: unknown): string[] => {
    let s = schema as { entries?: Record<string, unknown>; wrapped?: unknown } | undefined;
    while (s && !s.entries && s.wrapped) s = s.wrapped as typeof s;
    return s?.entries ? Object.keys(s.entries) : [];
  };
  const objects = [PushResponseSchema, PushResultOkSchema, PushResultErrSchema, EntryStateSchema, ConflictCurrentSchema];
  // Plus the small objects on an op result: held { id, v, updated_at }, book { id }, prefs { child_id }.
  const nested = ['held', 'book', 'prefs'].map((k) => (PushResultOkSchema.entries as Record<string, unknown>)[k]);
  const known = new Set([...objects, ...nested].flatMap(keysOf));

  it('finds the push answer builders', () => {
    for (const b of bodies) expect(b.length).toBeGreaterThan(100);
  });

  it('each built key is known to the contract, and the v1 answer keys sit on an op result', () => {
    const keys = new Set(bodies.flatMap((b) => [...builtKeys(b)]));
    expect(keys.size).toBeGreaterThan(15);
    for (const k of keys) expect(known.has(k), `sync_push answers with ${k}, which the contract would drop`).toBe(true);
    for (const k of ['conflict_groups', 'current', 'applied_v', 'held', 'held_off', 'kept', 'erased', 'deferred', 'missing']) {
      expect(keys.has(k), `${k} is no longer built by the SQL`).toBe(true);
      expect(Object.keys(PushResultOkSchema.entries)).toContain(k);
    }
  });
});

describe('[F16 6.2 E] the words version and current equal the SQL (review A 6 on #138)', () => {
  /** The columns of the `(new.a, new.b, ...) is distinct from` tuple in a trigger body. */
  const versionTuple = (body: string) => {
    const m = /\(((?:\s*new\.[a-z_]+\s*,?)+)\)\s*is distinct from/.exec(body);
    return m ? [...m[1].matchAll(/new\.([a-z_]+)/g)].map((x) => x[1]) : [];
  };

  it('a letter\'s text_xid moves on final_text, machine_edits and edit_level only (entries_set_sync_xid)', () => {
    expect(versionTuple(newestDefinition('entries_set_sync_xid'))).toEqual([...WORDS_VERSION_COLUMNS.entry]);
  });

  it('a held draft\'s text_xid moves on the five group columns and typed_text (held_drafts_stamp)', () => {
    expect(versionTuple(newestDefinition('held_drafts_stamp'))).toEqual([...WORDS_VERSION_COLUMNS.held]);
  });

  it('every current the SQL builds has exactly the ConflictCurrentSchema keys: never the author layer', () => {
    const bodies = [newestDefinition('sync_push'), ...['held_state', 'dup_outcome'].map((f) => newestDefinition(f, 'sync_private'))];
    const keys = new Set<string>();
    let builders = 0;
    for (const body of bodies) {
      for (let at = body.indexOf("'current',"); at >= 0; at = body.indexOf("'current',", at + 1)) {
        const value = body.slice(at + "'current',".length).trimStart();
        const start = body.length - value.length;
        for (const k of builtKeys(callAt(body, start))) keys.add(k);
        builders++;
      }
    }
    expect(builders).toBeGreaterThanOrEqual(3);
    expect([...keys].sort()).toEqual(Object.keys(ConflictCurrentSchema.entries).sort());
    for (const c of ['author_edits', 'locked_spans']) expect(keys.has(c)).toBe(false);
  });
});

describe('[ADR-0017] every live RPC in ENDPOINTS exists in the migrations', () => {
  const entries = Object.entries(ENDPOINTS) as [string, EndpointSpec][];
  const rpcs = entries.filter(([, e]) => e.path.startsWith('/rest/v1/rpc/'));
  it.each(rpcs)('%s', (_name, e) => {
    const fn = e.path.slice('/rest/v1/rpc/'.length);
    const defined = new RegExp(`create or replace function public\\.${fn}\\s*\\(`).test(all);
    if (e.status === 'live') expect(defined, `${fn} is live in ENDPOINTS but no migration defines it`).toBe(true);
  });
});

describe('[ADR-0017] shared rate buckets are named on every row that shares them, with the SQL limit (review A 8 on #138)', () => {
  const WINDOW_SECONDS: Record<string, number> = { minute: 60, hour: 3600, day: 86_400 };
  const limits = new Map([...newestDefinition('rate_hit').matchAll(/\('([a-z_]+)',\s*(\d+),\s*interval '1 (minute|hour|day)'\)/g)]
    .map((m) => [m[1], { limit: Number(m[2]), windowSeconds: WINDOW_SECONDS[m[3]] }]));
  /** The buckets an RPC counts against: its newest definition of each parameter list. */
  const bucketsOf = (fn: string) => {
    const re = new RegExp(`create or replace function public\\.${fn}\\s*\\(`, 'g');
    const newest = new Map<string, string>();
    for (const { text } of sql) {
      for (const m of text.matchAll(re)) newest.set(callAt(text, m.index!), text.slice(m.index!, text.indexOf('\n$$;', m.index!)));
    }
    return new Set([...newest.values()].flatMap((body) => [...body.matchAll(/rate_hit\('([a-z_]+)'\)/g)].map((b) => b[1])));
  };
  const rpcs = (Object.entries(ENDPOINTS) as [string, EndpointSpec][])
    .filter(([, e]) => e.status === 'live' && e.path.startsWith('/rest/v1/rpc/'))
    .map(([name, e]) => ({ name, e, buckets: bucketsOf(e.path.slice('/rest/v1/rpc/'.length)) }));

  it('reads the bucket table', () => {
    expect(limits.get('membership')).toEqual({ limit: 120, windowSeconds: 3600 });
    expect(limits.get('pull')).toEqual({ limit: 120, windowSeconds: 60 });
  });

  it('a bucket two endpoints count against is named on both, and the row carries the SQL limit and window', () => {
    const users = new Map<string, string[]>();
    for (const r of rpcs) for (const b of r.buckets) users.set(b, [...(users.get(b) ?? []), r.name]);
    for (const [b, names] of users) {
      if (names.length < 2) continue;
      for (const r of rpcs.filter((x) => names.includes(x.name))) {
        expect(r.e.rateLimit.bucket, `${r.name} shares the ${b} bucket with ${names.join(', ')}`).toBe(b);
      }
    }
    for (const r of rpcs.filter((x) => x.e.rateLimit.bucket)) {
      const b = r.e.rateLimit.bucket!;
      expect(r.buckets.has(b), `${r.name} names the ${b} bucket, but its SQL never counts it`).toBe(true);
      expect({ limit: r.e.rateLimit.limit, windowSeconds: r.e.rateLimit.windowSeconds }, r.name).toEqual(limits.get(b));
    }
  });
});

/** Splits a parameter list on top-level commas, quote-aware. */
function splitArgs(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (const c of list) {
    if (quoted) {
      cur += c;
      if (c === "'") quoted = false;
      continue;
    }
    if (c === "'") quoted = true;
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const TYPE_ALIASES: Record<string, string> = { integer: 'int', int4: 'int', bool: 'boolean', 'timestamp with time zone': 'timestamptz' };
const normType = (t: string) => {
  const s = t.trim().toLowerCase().replace(/\s+/g, ' ');
  return TYPE_ALIASES[s] ?? s;
};

/** Each public function's live overloads (argument types to parameter names), after every create and drop in file order. */
function liveOverloads(): Map<string, Map<string, string[]>> {
  const fns = new Map<string, Map<string, string[]>>();
  for (const { text } of sql) {
    const re = /\b(create or replace function|drop function(?: if exists)?) public\.([a-z_][a-z0-9_]*)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const call = callAt(text, m.index + m[0].length - 1);
      const args = splitArgs(call.slice(1, -1));
      const overloads = fns.get(m[2]) ?? new Map<string, string[]>();
      fns.set(m[2], overloads);
      if (m[1].startsWith('create')) {
        const parsed = args.map((a) => /^([a-z_][a-z0-9_]*)\s+(.+?)(?:\s+default\b.*|\s*=.*)?$/is.exec(a)!);
        overloads.set(parsed.map((p) => normType(p[2])).join(','), parsed.map((p) => p[1]));
      } else {
        overloads.delete(args.map(normType).join(','));
      }
    }
  }
  return fns;
}

/** The keys of an argument interface, all of them (a missing key fails the type check). */
const argsOf = <T,>() => <const K extends readonly (keyof T & string)[]>(
  keys: K & ([Exclude<keyof T, K[number]>] extends [never] ? unknown : { missing: Exclude<keyof T, K[number]> }),
): readonly string[] => keys;

describe('[ADR-0017] every live RPC is called with a parameter list one of its live overloads has (review A 7 and B on #138)', () => {
  /** The argument names the contract sends to each live RPC, and those S02 has not added yet (planned). */
  const RPC_ARGS: Partial<Record<EndpointName, { args: readonly string[]; planned?: readonly string[] }>> = {
    syncPush: { args: argsOf<SyncPushArgs>()(['p_ops', 'p_api_version']), planned: ['p_api_version'] },
    syncPull: { args: argsOf<SyncPullArgs>()(['p_since', 'p_limit', 'p_api_version']), planned: ['p_api_version'] },
    syncBooks: { args: [] },
    policyActionsNeeded: { args: [] },
    createInvite: { args: argsOf<CreateInviteArgsV0>()(['p_child', 'p_role', 'p_signs_as']) },
    createInviteV2: { args: argsOf<CreateInviteArgs>()(['p_invite_id', 'p_child', 'p_role', 'p_token_hash', 'p_code_hash', 'p_signs_as']) },
    peekInvite: { args: argsOf<PeekInviteArgs>()(['p_token']) },
    acceptInvite: { args: argsOf<AcceptInviteArgs>()(['p_token']) },
    revokeInvite: { args: argsOf<RevokeInviteArgs>()(['p_invite']) },
    leaveChild: { args: argsOf<LeaveChildArgs>()(['p_child', 'p_keep_in_book']) },
    removeChildMember: { args: argsOf<RemoveMemberArgs>()(['p_child', 'p_member', 'p_set_aside']) },
    undoParentJoin: { args: argsOf<UndoJoinArgs>()(['p_child', 'p_member']) },
  };
  /** Live RPCs whose arguments this package does not type (the app types them where it calls). */
  const UNTYPED: EndpointName[] = ['createChild', 'recordPolicyAct'];
  const overloads = liveOverloads();
  const live = (Object.entries(ENDPOINTS) as [EndpointName, EndpointSpec][])
    .filter(([, e]) => e.status === 'live' && e.path.startsWith('/rest/v1/rpc/'));

  it('reads the overloads, drops included', () => {
    expect(overloads.get('create_child_invite')?.size).toBe(2);
    expect(overloads.get('sync_pull')?.size).toBe(1);
  });

  it.each(live)('%s', (name, e) => {
    const spec = RPC_ARGS[name];
    if (UNTYPED.includes(name)) return;
    expect(spec, `${name} is a live RPC: list its arguments in RPC_ARGS (or UNTYPED)`).toBeDefined();
    const fn = e.path.slice('/rest/v1/rpc/'.length);
    const have = [...(overloads.get(fn)?.values() ?? [])].map((n) => [...n].sort().join(','));
    const built = spec!.args.filter((a) => !(spec!.planned ?? []).includes(a));
    const wanted = [[...built].sort().join(','), [...spec!.args].sort().join(',')];
    expect(have.some((h) => wanted.includes(h)), `${fn}(${built.join(', ')}) is not a live overload; it has ${have.map((h) => `(${h})`).join(' ')}`).toBe(true);
  });
});
