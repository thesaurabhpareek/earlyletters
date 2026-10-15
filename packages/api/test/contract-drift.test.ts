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
  CONSENT_KINDS,
  ESCROW_ERROR_DETAILS,
  FIELD_GROUPS,
  INVITE_UNUSABLE_DETAILS,
  PLANNED_PREFS_KEYS,
  PLANNED_PUSH_OP_TYPES,
  PREFS_KEYS,
  PulledRowSchema,
  PUSH_OP_TYPES,
} from '../server';
import { KILL_SWITCH_KEYS } from '../src/kill-switches';

const MIGRATIONS = fileURLToPath(new URL('../../../supabase/migrations', import.meta.url));
const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const sql = files.map((f) => ({ f, text: readFileSync(join(MIGRATIONS, f), 'utf8') }));
const all = sql.map((s) => s.text).join('\n');

/** The body of the newest definition of a function (files sort by timestamp; last definition wins). */
function newestDefinition(fn: string): string {
  const re = new RegExp(`create or replace function public\\.${fn}\\s*\\(`, 'g');
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
  /** Columns S02's pending 20261015030000 adds to the own row; absent on develop until it merges. */
  const PENDING_PULL_COLUMNS = ['occurred_precision', 'base_direction', 'author_edits', 'locked_spans', 'pack_ref'];
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

describe('[ADR-0017] every live RPC in ENDPOINTS exists in the migrations', () => {
  const entries = Object.entries(ENDPOINTS) as [string, EndpointSpec][];
  const rpcs = entries.filter(([, e]) => e.path.startsWith('/rest/v1/rpc/'));
  it.each(rpcs)('%s', (_name, e) => {
    const fn = e.path.slice('/rest/v1/rpc/'.length);
    const defined = new RegExp(`create or replace function public\\.${fn}\\s*\\(`).test(all);
    if (e.status === 'live') expect(defined, `${fn} is live in ENDPOINTS but no migration defines it`).toBe(true);
  });
});
