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
import { classifySqlstate, ENDPOINTS, ERROR_DETAILS, SQLSTATE_RULES, type EndpointSpec } from '../src';
import {
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
  PREFS_KEYS,
  PulledHeldSchema,
  PulledRowSchema,
  PullResponseSchema,
  PushResponseSchema,
  PushResultErrSchema,
  PushResultOkSchema,
  PUSH_OP_TYPES,
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
    const cols = [...table![1].matchAll(/^\s{2}([a-z_]+)\s+(?:uuid|text|timestamptz|date|boolean|jsonb|int|xid8)\b/gm)].map((m) => m[1]);
    expect(cols.length).toBeGreaterThan(15);
    const sent = [...cols.filter((c) => !['author_id', 'sync_xid', 'text_xid'].includes(c)), 'v'].sort();
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

describe('[ADR-0017] every live RPC in ENDPOINTS exists in the migrations', () => {
  const entries = Object.entries(ENDPOINTS) as [string, EndpointSpec][];
  const rpcs = entries.filter(([, e]) => e.path.startsWith('/rest/v1/rpc/'));
  it.each(rpcs)('%s', (_name, e) => {
    const fn = e.path.slice('/rest/v1/rpc/'.length);
    const defined = new RegExp(`create or replace function public\\.${fn}\\s*\\(`).test(all);
    if (e.status === 'live') expect(defined, `${fn} is live in ENDPOINTS but no migration defines it`).toBe(true);
  });
});
