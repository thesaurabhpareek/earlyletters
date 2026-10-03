/**
 * Shared enums (CORE-02, CORE-05): the value sets in @scribe/core must equal
 * the database CHECK constraints, and analytics must use them as-is.
 *
 * The migrations are parsed read-only. For each (table, column) the last
 * `check (column in (...))` across all files, in filename order, wins, which
 * is how a later `alter table ... add constraint` replaces an earlier one.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  APPROVALS,
  CAPTURE_MODES,
  DRAFT_STATES,
  EDIT_LEVELS,
  ENTRY_KINDS,
  isDomainValue,
  MEMBER_ROLES,
  OFFER_TRIGGERS,
  PLAN_STATES,
  TRANSCRIPT_STATUSES,
} from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { CAPTURE_MODE, EVENTS, INVITE_ROLE, MEMBER_ROLE, PLUS_TRIGGER, type PropSpec } from '../src';

const MIGRATIONS = resolve(__dirname, '../../../supabase/migrations');

/** Statements with dollar-quoted bodies and comments removed. */
function statements(): string[] {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const out: string[] = [];
  for (const f of files) {
    const sql = readFileSync(resolve(MIGRATIONS, f), 'utf8')
      .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''")
      .replace(/--[^\n]*/g, '');
    out.push(...sql.split(';'));
  }
  return out;
}

const STATEMENTS = statements();

function checkValues(table: string, column: string): string[] {
  const owns = new RegExp(`^\\s*(create table|alter table)\\s+(if not exists\\s+)?public\\.${table}\\b`, 'i');
  // Only a check that is exactly `column in (...)`; compound checks such as
  // `approval in (...) or not in_book` narrow a column, they do not define it.
  const check = new RegExp(`check\\s*\\(\\s*${column}\\s+in\\s*\\(([^)]*)\\)\\s*\\)`, 'gi');
  let found: string[] | null = null;
  for (const stmt of STATEMENTS) {
    if (!owns.test(stmt)) continue;
    for (const m of stmt.matchAll(check)) {
      found = [...m[1].matchAll(/'([^']*)'/g)].map((v) => v[1]);
    }
  }
  if (!found) throw new Error(`no CHECK constraint found for ${table}.${column}`);
  return found;
}

const sorted = (xs: readonly string[]) => [...xs].sort();

describe('core enums equal the migration CHECK constraints', () => {
  it.each([
    ['entries', 'kind', ENTRY_KINDS],
    ['entries', 'capture_mode', CAPTURE_MODES],
    ['entries', 'edit_level', EDIT_LEVELS],
    ['entries', 'approval', APPROVALS],
    ['child_members', 'role', MEMBER_ROLES],
    ['child_invites', 'role', MEMBER_ROLES],
  ] as const)('%s.%s', (table, column, values) => {
    expect(sorted(checkValues(table, column))).toEqual(sorted(values));
  });

  // Founder decision 3 (BRIEF 2026-10-03) removes server-side entitlements, and
  // PR #32 drops store_subscriptions from the pending migrations. Until that
  // merges the table exists and must match; after it, PLAN_STATES is device-only.
  const definesStoreSubscriptions = STATEMENTS.some((s) =>
    /^\s*create table\s+(if not exists\s+)?public\.store_subscriptions\b/i.test(s),
  );
  it.runIf(definesStoreSubscriptions)('store_subscriptions.status is PLAN_STATES without the device-only `none`', () => {
    expect(sorted(checkValues('store_subscriptions', 'status'))).toEqual(sorted(PLAN_STATES.filter((s) => s !== 'none')));
  });

  it('the parser really reads the files (a nonexistent column throws)', () => {
    expect(() => checkValues('entries', 'no_such_column')).toThrow(/no CHECK constraint/);
  });
});

describe('core enums are frozen and have no duplicates', () => {
  const all = {
    ENTRY_KINDS,
    CAPTURE_MODES,
    EDIT_LEVELS,
    MEMBER_ROLES,
    APPROVALS,
    TRANSCRIPT_STATUSES,
    DRAFT_STATES,
    PLAN_STATES,
    OFFER_TRIGGERS,
  };
  it.each(Object.entries(all))('%s', (_name, values) => {
    expect(Object.isFrozen(values)).toBe(true);
    expect(new Set(values).size).toBe(values.length);
    expect(() => (values as unknown as string[]).push('x')).toThrow();
  });

  it('isDomainValue narrows only exact members', () => {
    expect(isDomainValue(CAPTURE_MODES, 'mixed')).toBe(true);
    expect(isDomainValue(CAPTURE_MODES, 'Mixed')).toBe(false);
    expect(isDomainValue(CAPTURE_MODES, 1)).toBe(false);
  });
});

describe('analytics uses the core enums (CORE-05)', () => {
  const values = (p: PropSpec) => (p.type === 'enum' ? [...p.values] : []);

  it('capture mode includes mixed, so a mixed letter_saved is not stripped', () => {
    expect(values(CAPTURE_MODE)).toEqual([...CAPTURE_MODES]);
    expect(values(EVENTS.letter_saved.props.mode)).toContain('mixed');
  });

  it('roles use the DB value `parent`, never `co_parent`', () => {
    expect(values(MEMBER_ROLE)).toEqual([...MEMBER_ROLES]);
    expect(values(INVITE_ROLE)).toEqual([...MEMBER_ROLES]);
    expect(JSON.stringify(EVENTS)).not.toContain('co_parent');
    for (const name of ['invite_created', 'invite_accepted', 'member_removed', 'member_left'] as const) {
      expect(values(EVENTS[name].props.role), name).toEqual([...MEMBER_ROLES]);
    }
  });

  it('Plus triggers are the core OfferTrigger values', () => {
    expect(sorted(values(PLUS_TRIGGER))).toEqual(sorted(OFFER_TRIGGERS));
  });
});
