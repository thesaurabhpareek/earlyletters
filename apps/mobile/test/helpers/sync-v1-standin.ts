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
 * their duplicate answer, the Keep's compare (with a held row, or with the letter
 * another phone kept first) and the switch, as in the state table of ADR 0025
 * section 9. Applied after SYNC_PUSH_V1_EDITS, only while no migration defines
 * held_drafts.
 */
export const SYNC_PUSH_HELD_EDITS: SyncPushEdit[] = [
  {
    why: "the switch (ADR 0025 section 9): with app.held_sync = 'off' a held op changes nothing and is not claimed",
    anchor: '      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.\n',
    becomes:
      "      if coalesce(current_setting('app.held_sync', true), '') = 'off' and v_type in ('held.upsert', 'held.discard') then\n" +
      "        v_results := v_results || jsonb_build_array(jsonb_build_object('op', v_op, 'ok', true, 'applied', false, 'held_off', true));\n" +
      '        continue;\n' +
      '      end if;\n\n' +
      '      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.\n',
  },
  {
    why: 'variables for a refused Keep and for a Keep onto an existing letter',
    anchor: '  v_newer boolean;\n  v_refused boolean;\n',
    becomes: '  v_newer boolean;\n  v_refused boolean;\n  v_keep jsonb;\n  v_keepto boolean;\n',
  },
  {
    why: 'a Keep onto a letter another phone kept first is a compare and set, held_base standing in for base (table row C)',
    anchor:
      "          elsif v_exists and nullif(o ->> 'base', '') is not null then\n" +
      "            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;\n" +
      "            v_newer := cur.text_xid > (o ->> 'base')::xid8 and cur.text_xid <> pg_current_xact_id();\n",
    becomes:
      "          elsif v_exists and (nullif(o ->> 'base', '') is not null or (v_type = 'entry.upsert' and o ? 'held_base')) then\n" +
      "            v_keepto := nullif(o ->> 'base', '') is null;\n" +
      "            v_conflict := cur.sync_xid > coalesce(nullif(o ->> 'base', ''), nullif(o ->> 'held_base', ''), '0')::xid8;\n" +
      "            v_newer := cur.text_xid > coalesce(nullif(o ->> 'base', ''), nullif(o ->> 'held_base', ''), '0')::xid8\n" +
      '                       and cur.text_xid <> pg_current_xact_id();\n',
  },
  {
    why: 'the first keep\'s provenance stands for a Keep onto a letter or refused words, so never SCIMM (set)',
    anchor: '                raw_transcript = excluded.raw_transcript,\n                captured_at = excluded.captured_at,\n',
    becomes:
      '                raw_transcript = case when v_keepto or v_refused then e.raw_transcript else excluded.raw_transcript end,\n' +
      '                captured_at = case when v_keepto or v_refused then e.captured_at else excluded.captured_at end,\n',
  },
  {
    why: 'the first keep\'s engine version stands as well (set)',
    anchor: 'engine_version = excluded.engine_version',
    becomes: 'engine_version = case when v_keepto or v_refused then e.engine_version else excluded.engine_version end',
  },
  {
    why: 'the first keep\'s provenance stands (the changed-row test)',
    anchor: 'excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,',
    becomes:
      'case when v_keepto or v_refused then e.raw_transcript else excluded.raw_transcript end,\n' +
      '                     case when v_keepto or v_refused then e.captured_at else excluded.captured_at end, excluded.child_id,\n' +
      '                     case when v_keepto or v_refused then e.engine_version else excluded.engine_version end,',
  },
  {
    why: 'the Keep of a held draft is compared with held_base before the letter is made (review K blocking 1)',
    anchor: '          v_conflict := false;\n          v_newer := false;\n          v_refused := false;\n',
    becomes:
      '          v_conflict := false;\n          v_newer := false;\n          v_refused := false;\n' +
      '          v_keep := null;\n          v_keepto := false;\n' +
      "          if not v_exists and v_type = 'entry.upsert' then\n" +
      '            v_keep := sync_private.held_keep_refusal(v_id, o);\n' +
      '            if v_keep is not null then\n' +
      '              v_apply := false;\n' +
      '            end if;\n' +
      '          end if;\n',
  },
  {
    why: 'a refused Keep answers the held words and notes the refusal on the receipt',
    anchor: '          perform sync_private.note_applied(v_op, v_id, v_refused, v_newer);\n',
    becomes:
      '          if v_keep is not null then\n' +
      '            v_res := v_keep;\n' +
      '            perform sync_private.note_keep_refused(v_op);\n' +
      '          else\n' +
      '            perform sync_private.note_applied(v_op, v_id, v_refused, v_newer);\n' +
      '          end if;\n',
  },
  {
    why: 'a duplicate held op repeats its first answer (the row state, and a words refusal again)',
    anchor: '        end if;\n      else\n        case v_type\n',
    becomes:
      "        elsif v_type like 'held.%' then\n" +
      "          v_res := v_res || case when v_type = 'held.upsert' then sync_private.held_dup(v_op, v_id)\n" +
      '                                 else coalesce(sync_private.receipt_answer(v_op), sync_private.held_discard_dup(v_id)) end;\n' +
      '        end if;\n      else\n        case v_type\n',
  },
  {
    why: 'held.upsert (whole row, words by compare and set) and held.discard',
    anchor: "        else\n          raise exception 'unknown op type' using errcode = '22023';",
    becomes:
      "        when 'held.upsert' then\n" +
      '          v_res := sync_private.held_upsert(v_op, v_id, o);\n\n' +
      "        when 'held.discard' then\n" +
      "          v_res := sync_private.held_discard(v_id, nullif(o ->> 'base', '')::xid8);\n" +
      '          perform sync_private.receipt_answer_note(v_op, v_res);\n\n' +
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
    why: 'an upload of an erased letter is gone, never a new insert, even once purge_ledger forgets it (the 60 day forget)',
    anchor: '          v_exists := found;\n',
    becomes:
      '          v_exists := found;\n' +
      "          if not v_exists and sync_private.was_erased(v_id) then\n" +
      "            raise exception 'this letter was erased' using errcode = 'SCDEL', detail = 'purged';\n" +
      '          end if;\n',
  },
  {
    why: 'entry.erase: the author purges a letter for good now',
    anchor: "        else\n          raise exception 'unknown op type' using errcode = '22023';",
    becomes:
      "        when 'entry.erase' then\n" +
      '          v_res := sync_private.erase_entry(v_id);\n' +
      '          perform sync_private.receipt_answer_note(v_op, v_res);\n\n' +
      "        else\n          raise exception 'unknown op type' using errcode = '22023';",
  },
  {
    why: 'a repeated erase says what its first answer said (erased, deferred or missing)',
    anchor: '            || sync_private.dup_outcome(v_op, v_id);\n',
    becomes: "            || sync_private.dup_outcome(v_op, v_id)\n            || coalesce(sync_private.receipt_answer(v_op), '{}'::jsonb);\n",
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
