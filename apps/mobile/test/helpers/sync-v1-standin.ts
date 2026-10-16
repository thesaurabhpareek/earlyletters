/**
 * TEST STAND-IN, NOT A MIGRATION: the sync_push half of S03's request to S02
 * (docs/adr/0025-sync-protocol-v1.md section 5; WP-F16-14). The objects protocol
 * v1 adds are in sync-v1-standin.sql; this file makes six anchored edits to
 * whatever sync_push the real migrations define last, so the stand-in tracks
 * S02's newest body (20261005000000 on develop, 20261015030000 with the R-17
 * gate) and never undoes its hardening. If S02 reshapes sync_push, an anchor
 * goes missing and the server refuses to start, naming it: update the edit, never
 * fall back to an older body. Delete this file when S02's migration lands
 * (sync-server.ts then skips the stand-in by itself).
 */

export interface SyncPushEdit {
  /** Why the edit exists (the protocol rule it carries). */
  why: string;
  /** Exact text that must occur once in sync_push's definition. */
  anchor: string;
  /** What the anchor becomes. */
  becomes: string;
}

export const SYNC_PUSH_V1_EDITS: SyncPushEdit[] = [
  {
    why: 'two flags for the words outcome',
    anchor: '  v_conflict boolean;\n',
    becomes: '  v_conflict boolean;\n  v_newer boolean;\n  v_refused boolean;\n',
  },
  {
    why: 'a duplicate repeats its first words outcome (applied_v, or conflict_groups and current)',
    anchor: "            jsonb_build_object('missing', true));\n",
    becomes: "            jsonb_build_object('missing', true))\n            || sync_private.dup_outcome(v_op, v_id);\n",
  },
  {
    why: 'read the words version, under a row lock so a concurrent push of the letter waits, then compares',
    anchor:
      '          select e.sync_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur\n' +
      '            from entries e where e.id = v_id;',
    becomes:
      '          select e.sync_xid, e.text_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur\n' +
      '            from entries e where e.id = v_id for update;',
  },
  {
    why: 'reset the flags per op',
    anchor: '          v_conflict := false;\n',
    becomes: '          v_conflict := false;\n          v_newer := false;\n          v_refused := false;\n',
  },
  {
    why: 'the compare: words changed since base by another transaction; text is then not applied',
    anchor: "            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;\n",
    becomes:
      "            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;\n" +
      "            v_newer := cur.text_xid > (o ->> 'base')::xid8 and cur.text_xid <> pg_current_xact_id();\n" +
      "            if v_newer and 'text' = any(v_changed) then\n" +
      "              v_changed := array_remove(v_changed, 'text');\n" +
      '              v_refused := true;\n' +
      '            end if;\n',
  },
  {
    why: 'answer conflict_groups and current, and note the outcome on the receipt',
    anchor: "\n\n        when 'entry.delete' then",
    becomes:
      '\n' +
      "          if v_refused then\n" +
      "            v_res := v_res || jsonb_build_object('conflict_groups', jsonb_build_array('text'));\n" +
      '          end if;\n' +
      '          if v_newer then\n' +
      "            v_res := v_res || jsonb_build_object('current',\n" +
      "              (select jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,\n" +
      "                                         'edit_level', e.edit_level, 'v', e.text_xid::text)\n" +
      '                 from entries e where e.id = v_id));\n' +
      '          end if;\n' +
      '          perform sync_private.note_applied(v_op, v_id, v_refused, v_newer);\n' +
      "\n        when 'entry.delete' then",
  },
];

/**
 * Held drafts (WP-F16-17, F16 6.2 I; sync-v1-held-standin.sql): two op branches and
 * their duplicate answer. Applied after SYNC_PUSH_V1_EDITS, only while no migration
 * defines held_drafts.
 */
export const SYNC_PUSH_HELD_EDITS: SyncPushEdit[] = [
  {
    why: 'a duplicate held op repeats its first answer (the row state, and a words refusal again)',
    anchor: '        end if;\n      else\n        case v_type\n',
    becomes:
      "        elsif v_type like 'held.%' then\n" +
      "          v_res := v_res || case when v_type = 'held.upsert' then sync_private.held_dup(v_op, v_id) else '{}'::jsonb end;\n" +
      '        end if;\n      else\n        case v_type\n',
  },
  {
    why: 'held.upsert (whole row, words by compare and set) and held.discard',
    anchor: "        else\n          raise exception 'unknown op type' using errcode = '22023';",
    becomes:
      "        when 'held.upsert' then\n" +
      '          v_res := sync_private.held_upsert(v_op, v_id, o);\n\n' +
      "        when 'held.discard' then\n" +
      '          v_res := sync_private.held_discard(v_id);\n\n' +
      "        else\n          raise exception 'unknown op type' using errcode = '22023';",
  },
];

/**
 * Erase now in a sync build (WP-F16-13, F16-REQ-024; sync-v1-erase-standin.sql):
 * the entry.erase branch. A duplicate needs nothing new (the entry.% duplicate
 * answers the letter's state, or missing once it is erased).
 */
export const SYNC_PUSH_ERASE_EDITS: SyncPushEdit[] = [
  {
    why: 'entry.erase: the author purges a letter for good now',
    anchor: "        else\n          raise exception 'unknown op type' using errcode = '22023';",
    becomes:
      "        when 'entry.erase' then\n" +
      '          v_res := sync_private.erase_entry(v_id);\n\n' +
      "        else\n          raise exception 'unknown op type' using errcode = '22023';",
  },
];

/** The pull half: an erasure in a book makes its next pull recompute the removal digest. */
export const SYNC_PULL_ERASE_EDITS: SyncPushEdit[] = [
  {
    why: 'an erasure after the cursor recomputes the book digest',
    anchor: "                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)\n",
    becomes:
      "                 or coalesce((v_req ->> 'verify')::boolean, false) or coalesce((v_req ->> 'ids')::boolean, false)\n" +
      '                 or exists (select 1 from sync_private.entry_erasures x\n' +
      '                             where x.child_id = b.id and x.sync_xid > v_after_x and x.sync_xid < v_xmin)\n',
  },
];

/** Applies the edits to a sync_push definition (pg_get_functiondef). Throws on a missing or repeated anchor. */
export function patchSyncPush(definition: string, edits: SyncPushEdit[] = SYNC_PUSH_V1_EDITS): string {
  let out = definition;
  for (const e of edits) {
    const n = out.split(e.anchor).length - 1;
    if (n !== 1) {
      throw new Error(`sync-v1 stand-in: anchor for "${e.why}" found ${n} times; S02 changed the function's shape, update test/helpers/sync-v1-standin.ts`);
    }
    out = out.replace(e.anchor, () => e.becomes);
  }
  return out;
}
