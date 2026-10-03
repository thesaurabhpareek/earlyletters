// Structural invariants read from the catalog after all migrations.
//
// Trigger order (DB-10): Postgres fires triggers with the same timing and event
// in name order (byte order). Several rules depend on that order, so a rename
// can silently break them. This test pins the order each rule needs.
import { createDb } from './harness.mjs';

const { check, sys, done } = await createDb(process.argv.slice(2));

// Row-level triggers on public tables, by (table, timing, event), in firing order.
const rows = (await sys(`
  select c.relname as rel, t.tgname as name, t.tgtype as type
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where not t.tgisinternal and n.nspname = 'public'
   order by c.relname, t.tgname collate "C"`)).rows;

const ROW = 1, BEFORE = 2, INSERT = 4, DELETE = 8, UPDATE = 16;
const order = {}; // "entries BEFORE UPDATE" -> [names in firing order]
for (const r of rows) {
  if (!(r.type & ROW)) continue;
  const timing = r.type & BEFORE ? 'BEFORE' : 'AFTER';
  for (const [bit, ev] of [[INSERT, 'INSERT'], [UPDATE, 'UPDATE'], [DELETE, 'DELETE']]) {
    if (r.type & bit) (order[`${r.rel} ${timing} ${ev}`] ??= []).push(r.name);
  }
}
for (const [k, v] of Object.entries(order)) console.log(`      ${k}: ${v.join(' -> ')}`);

const fires = (key, first, second) => {
  const list = order[key] ?? [];
  const a = list.indexOf(first), b = list.indexOf(second);
  check(`${key}: ${first} fires before ${second}`, a >= 0 && b >= 0 && a < b);
};

// entries_family_rules derives approval/in_book for client writes and must run
// before the guards that check them (comment in security_and_family.sql).
fires('entries BEFORE INSERT', 'entries_family_rules', 'entries_insert_guard');
fires('entries BEFORE UPDATE', 'entries_family_rules', 'entries_guard');
// Consent gates refuse the write before any guard or touch does work.
fires('children BEFORE UPDATE', 'children_consent_gate', 'children_guard');
fires('dictionary_terms BEFORE UPDATE', 'dictionary_terms_consent_gate', 'dictionary_terms_touch');
fires('child_member_prefs BEFORE UPDATE', 'child_member_prefs_consent_gate', 'child_member_prefs_touch');
// The deletion guard runs before the delete is audited.
check('child_members: child_members_guard is BEFORE DELETE and child_members_audit is AFTER DELETE',
  (order['child_members BEFORE DELETE'] ?? []).includes('child_members_guard') &&
  (order['child_members AFTER DELETE'] ?? []).includes('child_members_audit'));

// Any *_touch trigger (sets updated_at) fires last among its table's BEFORE
// UPDATE row triggers, so a guard that refuses the write never races it and
// the stamp reflects the final row.
const touchNotLast = Object.entries(order)
  .filter(([k]) => k.endsWith(' BEFORE UPDATE'))
  .filter(([, list]) => list.some((n) => n.endsWith('_touch')) && !list[list.length - 1].endsWith('_touch'));
for (const [k, list] of touchNotLast) console.log(`      touch not last: ${k}: ${list.join(' -> ')}`);
check('every *_touch trigger fires last among its BEFORE UPDATE triggers', touchNotLast.length === 0);

done();
