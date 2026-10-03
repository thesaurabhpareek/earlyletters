/**
 * Drift test: packages/api against supabase/migrations.
 *
 * MIGRATIONS_DIR overrides the migrations folder (default: the repo's
 * supabase/migrations). The contract describes the schema after PR #32
 * (fix/db-pending-hardening). While the migrations still contain the
 * entitlement objects that #32 removes, the drift checks are skipped with an
 * "EXPECTS #32" message; see packages/api/README.md to run them against the
 * #32 tree.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  API_ERRORS,
  AUDIT_ACTIONS,
  AUDIT_ACTOR_KINDS,
  AUDIT_SUBJECT_TYPES,
  BOOK_DELETION_OUTCOMES,
  CAPTURE_MODES,
  CLIENT_DELETION_SOURCES,
  DELETED_REASONS,
  DELETION_REQUEST_KINDS,
  DELETION_REQUEST_STATUSES,
  DELETION_SOURCES,
  DICTIONARY_TERM_KINDS,
  EDIT_LEVELS,
  ENTRY_IMMUTABLE_COLUMNS,
  ENTRY_KINDS,
  APPROVALS,
  ERROR_CODES,
  MEMBER_ROLES,
  PLATFORMS,
  POLICY_ACTIONS,
  POLICY_CHANGE_CLASSES,
  POLICY_CONTEXT_KEYS,
  POLICY_DOCUMENT_KEYS,
  POLICY_METHODS,
  RELATION_COLUMNS,
  REVIEW_DECISIONS,
  REVIEW_EXPECTED_STATES,
  RPC_CATALOG,
  RPC_NAMES,
} from '../src';
import {
  callableByAuthenticated,
  checkList,
  finalFunction,
  hasPlainRaise,
  header,
  loadStatements,
  quoted,
  raisedErrcodes,
  relationColumns,
  signature,
  type Statement,
} from './sql';

const dir =
  process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../../../supabase/migrations', import.meta.url));

function pre32Reason(stmts: Statement[]): string | null {
  const hits: string[] = [];
  for (const s of stmts) {
    const t = s.text.replace(/--[^\n]*/g, '');
    if (/errcode\s*=\s*'SCPLS'/i.test(t)) hits.push(`SCPLS raised in ${s.file}`);
    if (/^create\s+table\s+(?:if\s+not\s+exists\s+)?public\.store_subscriptions\b/i.test(header(s)))
      hits.push(`store_subscriptions created in ${s.file}`);
  }
  return hits.length ? [...new Set(hits)].join('; ') : null;
}

const stmts = existsSync(dir) ? loadStatements(dir) : [];
const reason = !existsSync(dir) ? `no migrations at ${dir}` : pre32Reason(stmts);
if (reason) {
  console.warn(
    `[packages/api drift] EXPECTS #32 (fix/db-pending-hardening): skipping drift checks because ${reason}. ` +
      'Run against the #32 tree with MIGRATIONS_DIR (see packages/api/README.md).',
  );
}

const sorted = (xs: readonly string[]) => [...xs].sort();

describe.skipIf(Boolean(reason))(`drift against ${dir}`, () => {
  it('reads a plausible schema', () => {
    expect(stmts.length).toBeGreaterThan(100);
  });

  describe('errors', () => {
    const raised = raisedErrcodes(stmts);

    it('every SQLSTATE raised in the migrations is registered', () => {
      const missing = [...raised].filter((c) => !(c in API_ERRORS));
      expect(missing, `add to src/errors.ts: ${missing.join(', ')}`).toEqual([]);
    });

    it('every registered migration code is still raised', () => {
      const stale = ERROR_CODES.filter((c) => API_ERRORS[c].raisedBy === 'migration' && !raised.has(c));
      expect(stale, `no longer raised; remove or re-mark in src/errors.ts: ${stale.join(', ')}`).toEqual([]);
    });

    it('postgres-origin codes are not raised explicitly (otherwise mark them migration)', () => {
      const wrong = ERROR_CODES.filter((c) => API_ERRORS[c].raisedBy === 'postgres' && raised.has(c));
      expect(wrong).toEqual([]);
    });

    it('P0001 is registered exactly when a RAISE EXCEPTION has no errcode', () => {
      expect('P0001' in API_ERRORS).toBe(hasPlainRaise(stmts));
    });

    it('SCPLS is gone', () => {
      expect(raised.has('SCPLS')).toBe(false);
      expect('SCPLS' in API_ERRORS).toBe(false);
    });
  });

  describe('rpc', () => {
    const callable = callableByAuthenticated(stmts);
    const catalogSig = (n: keyof typeof RPC_CATALOG) =>
      signature(n, RPC_CATALOG[n].params.map((p) => p.sqlType.toLowerCase()));

    it('every function callable by authenticated has an rpc.ts entry with the same signature', () => {
      const ours = new Set(RPC_NAMES.map(catalogSig));
      const missing = [...callable.keys()].filter((sig) => !ours.has(sig));
      expect(missing, `add to src/rpc.ts: ${missing.join(', ')}`).toEqual([]);
    });

    it('every rpc.ts entry is callable by authenticated', () => {
      const extra = RPC_NAMES.map(catalogSig).filter((sig) => !callable.has(sig));
      expect(extra, `not granted to authenticated (or signature changed): ${extra.join(', ')}`).toEqual([]);
    });

    it.each(RPC_NAMES)('%s: parameter names, defaults and return type match the SQL', (name) => {
      const fn = callable.get(catalogSig(name));
      expect(fn, `${name} is not callable`).toBeDefined();
      const spec = RPC_CATALOG[name];
      expect(spec.params.map((p) => [p.name, p.sqlType, p.optional])).toEqual(
        fn!.params.map((p) => [p.name, p.type, p.optional]),
      );
      expect(spec.sqlReturns).toBe(fn!.returns);
    });

    it.each(RPC_NAMES)('%s: consentGated matches a require_content_consent call', (name) => {
      const fn = callable.get(catalogSig(name))!;
      // Direct call, or delegation to a helper that runs the same gate for a given person.
      const calls =
        /\b(require_content_consent|require_content_consent_of|join_book_by_invite)\s*\(/.test(fn.body) ||
        name === 'require_content_consent';
      expect(RPC_CATALOG[name].consentGated).toBe(calls);
    });

    it.each(RPC_NAMES)('%s: every listed error code is registered', (name) => {
      for (const c of RPC_CATALOG[name].errors) expect(API_ERRORS).toHaveProperty(c);
    });

    it.each(RPC_NAMES)('%s: codes raised in its own body are listed', (name) => {
      const fn = callable.get(catalogSig(name))!;
      const own = [...fn.body.matchAll(/errcode\s*=\s*'([0-9A-Z]{5})'/gi)].map((m) => m[1]);
      const listed = new Set<string>(RPC_CATALOG[name].errors);
      if (/\brequire_user\s*\(/.test(fn.body)) expect(listed.has('28000') && listed.has('SCANO')).toBe(true);
      expect(own.filter((c) => !listed.has(c))).toEqual([]);
    });

    it('client-id idempotency params are validated as UUIDv7', () => {
      for (const name of RPC_NAMES) {
        const idem = RPC_CATALOG[name].idempotency;
        if (idem.kind !== 'client_id') continue;
        const fn = callable.get(catalogSig(name))!;
        expect(fn.body).toMatch(new RegExp(`is_valid_client_uuid7\\s*\\(\\s*${idem.param}\\s*\\)`));
      }
    });
  });

  describe('enums match CHECK constraints', () => {
    const cases: [string, string, readonly string[]][] = [
      ['entries', 'kind', ENTRY_KINDS],
      ['entries', 'capture_mode', CAPTURE_MODES],
      ['entries', 'edit_level', EDIT_LEVELS],
      ['entries', 'deleted_reason', DELETED_REASONS],
      ['entries', 'approval', APPROVALS],
      ['child_members', 'role', MEMBER_ROLES],
      ['child_invites', 'role', MEMBER_ROLES],
      ['dictionary_terms', 'kind', DICTIONARY_TERM_KINDS],
      ['deletion_requests', 'kind', DELETION_REQUEST_KINDS],
      ['deletion_requests', 'status', DELETION_REQUEST_STATUSES],
      ['deletion_requests', 'source', DELETION_SOURCES],
      ['audit_events', 'actor_kind', AUDIT_ACTOR_KINDS],
      ['audit_events', 'action', AUDIT_ACTIONS],
      ['audit_events', 'subject_type', AUDIT_SUBJECT_TYPES],
      ['policy_acceptances', 'action', POLICY_ACTIONS],
      ['policy_acceptances', 'method', POLICY_METHODS],
      ['policy_acceptances', 'platform', PLATFORMS],
      ['policy_versions', 'change_class', POLICY_CHANGE_CLASSES],
    ];
    it.each(cases)('%s.%s', (table, column, values) => {
      const sql = checkList(stmts, table, column);
      expect(sql, `no CHECK list found for ${table}.${column}`).not.toBeNull();
      expect(sorted(values)).toEqual(sorted(sql!));
    });

    const argList = (fn: string, re: RegExp) => {
      const m = re.exec(finalFunction(stmts, fn).body);
      expect(m, `${fn}: pattern ${re} not found`).not.toBeNull();
      return quoted(m![1]);
    };

    it('client deletion sources (request_account_deletion, request_book_deletion)', () => {
      const re = /p_source\s+not\s+in\s*\(([^)]*)\)/i;
      expect(sorted(CLIENT_DELETION_SOURCES)).toEqual(sorted(argList('request_account_deletion', re)));
      expect(sorted(CLIENT_DELETION_SOURCES)).toEqual(sorted(argList('request_book_deletion', re)));
    });

    it('review decisions and expected states (review_family_letter)', () => {
      expect(sorted(REVIEW_DECISIONS)).toEqual(
        sorted(argList('review_family_letter', /p_decision\s+not\s+in\s*\(([^)]*)\)/i)),
      );
      expect(sorted(REVIEW_EXPECTED_STATES)).toEqual(
        sorted(argList('review_family_letter', /p_expected\s+not\s+in\s*\(([^)]*)\)/i)),
      );
    });

    it('policy context keys (record_policy_act)', () => {
      expect(sorted(POLICY_CONTEXT_KEYS)).toEqual(sorted(argList('record_policy_act', /\bk\s+not\s+in\s*\(([^)]*)\)/i)));
    });

    it('book deletion outcomes (request_book_deletion return values)', () => {
      const body = finalFunction(stmts, 'request_book_deletion').body;
      const returned = [...new Set([...body.matchAll(/\breturn\s+'(\w+)'/gi)].map((m) => m[1]))];
      expect(sorted(BOOK_DELETION_OUTCOMES)).toEqual(sorted(returned));
    });

    it('policy document keys (seed rows)', () => {
      const seed = stmts.find((s) => /^insert\s+into\s+public\.policy_documents\b/i.test(s.text));
      expect(seed).toBeDefined();
      const values = seed!.text.slice(seed!.text.search(/\bvalues\b/i));
      const keys = [...values.matchAll(/\(\s*'([^']+)'\s*,/g)].map((m) => m[1]);
      expect(sorted(POLICY_DOCUMENT_KEYS)).toEqual(sorted(keys));
    });
  });

  describe('rows', () => {
    const rel = relationColumns(stmts);

    it.each(Object.keys(RELATION_COLUMNS) as (keyof typeof RELATION_COLUMNS)[])(
      '%s columns match the migrations',
      (name) => {
        const sql = rel.get(name);
        expect(sql, `${name} not found in the migrations`).toBeDefined();
        expect(sorted(RELATION_COLUMNS[name])).toEqual(sorted(sql!));
      },
    );

    it('entry immutable columns match entries_guard_immutable', () => {
      const body = finalFunction(stmts, 'entries_guard_immutable').body;
      const firstIf = body.slice(0, body.search(/\bthen\b/i));
      const cols = [...firstIf.matchAll(/new\.(\w+)\s+is\s+distinct\s+from\s+old\.\1/gi)].map((m) => m[1]);
      expect(sorted(ENTRY_IMMUTABLE_COLUMNS)).toEqual(sorted(cols));
    });
  });
});
