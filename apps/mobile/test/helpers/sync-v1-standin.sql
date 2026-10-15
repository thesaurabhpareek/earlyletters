-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- after every real file in supabase/migrations, and only when those files do not
-- already define protocol v1 (the check: sync_push mentions conflict_groups).
--
-- It is S03's request to S02 written as runnable SQL (docs/adr/0023-sync-protocol-v1.md
-- section 5 and "Requests"; WP-F16-14 words compare and set). S02 owns sync_push and
-- every migration. It wraps whichever sync_push the migrations define (develop's
-- 20261005000000, or S02's 20261015000000 and 20261015030000 once they land), so it
-- never puts back an older function. When S02's migration defines protocol v1, this
-- file stops loading by itself and the two-phone test runs against S02's real SQL.
-- Delete it then.
--
-- What it adds:
--   1. entries.text_xid: the transaction that last wrote the words group
--      (final_text, machine_edits, edit_level), stamped by trigger. The words
--      compare and set reads this, not sync_xid, so another phone's in_book or
--      date change never raises a words conflict (F16 C2 stays later-arrival-wins).
--   2. sync_op_receipts.applied_v: the version an op wrote when it first applied,
--      so a duplicate tells the phone what to rebase on (F16-REQ-025). Written by a
--      definer helper (clients cannot write receipts).
--   3. sync_push, entry.upsert with a base: when the words changed since base,
--        - text in changed: the text group is not applied; the other groups are;
--          the result has conflict_groups ['text'] and current (the caller's own
--          words: RLS limits the row to its author);
--        - text not in changed: everything applies, and current is returned too,
--          so the phone takes the newer words before it writes any of its own.
--      A duplicate returns applied_v and never a conflict. No base (an older app):
--      unchanged, later arrival wins.
-- What S02's real version must do that a test wrapper does not: compare under the
-- row lock inside the op (select ... for update), so a concurrent push of the same
-- letter between the check and the write cannot slip past it. This wrapper checks
-- before the batch, which is the same thing for a phone that sends one op per letter
-- per batch (lib/sync/outbox.ts takeBatch) on PGlite's single connection.

alter table public.entries add column if not exists text_xid xid8 not null default '0';
update public.entries set text_xid = sync_xid where text_xid = '0';

create or replace function public.entries_set_text_xid()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'INSERT'
     or (new.final_text, new.machine_edits, new.edit_level) is distinct from (old.final_text, old.machine_edits, old.edit_level) then
    new.text_xid := pg_current_xact_id();
  end if;
  return new;
end;
$$;
create or replace trigger entries_text_xid before insert or update on public.entries
  for each row execute function public.entries_set_text_xid();
revoke execute on function public.entries_set_text_xid() from public, anon, authenticated;

alter table public.sync_op_receipts add column if not exists applied_v xid8;

-- Clients cannot update receipts (20261004100000 revokes it; BL-331 moves every receipt
-- write into security definer helpers such as sync_claim_op), so the version is noted here.
create or replace function public.sync_note_applied(p_op uuid, p_entry uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  update sync_op_receipts r set applied_v = (select e.sync_xid from entries e where e.id = p_entry and e.author_id = auth.uid())
   where r.op_id = p_op and r.profile_id = auth.uid();
end;
$$;
revoke execute on function public.sync_note_applied(uuid, uuid) from public, anon;
grant execute on function public.sync_note_applied(uuid, uuid) to authenticated;

-- Keep the migrations' function under another name and put the v1 wrapper in front of it.
alter function public.sync_push(jsonb) rename to sync_push_before_v1;

create function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  c_groups constant jsonb := '["text", "in_book", "sounds_like_me", "occurred_on", "language"]';
  o jsonb;
  r jsonb;
  v_id uuid;
  v_base xid8;
  v_text xid8;
  v_changed jsonb;
  v_ops jsonb := '[]'::jsonb;
  v_newer text[] := '{}';
  v_refused text[] := '{}';
  v_res jsonb;
  v_out jsonb := '[]'::jsonb;
  v_dup boolean;
begin
  if jsonb_typeof(p_ops) is distinct from 'array' then
    return public.sync_push_before_v1(p_ops);
  end if;
  for o in select value from jsonb_array_elements(p_ops) loop
    if jsonb_typeof(o) = 'object' and o ->> 'type' = 'entry.upsert' and nullif(o ->> 'base', '') is not null then
      begin
        v_id := (o ->> 'id')::uuid;
        v_base := (o ->> 'base')::xid8;
        select e.text_xid into v_text from entries e where e.id = v_id;   -- RLS: the caller's own letters only
        if found and v_text > v_base then
          v_newer := v_newer || (o ->> 'op');
          v_changed := coalesce(o -> 'changed', c_groups);
          if jsonb_typeof(v_changed) = 'array' and v_changed ? 'text' then
            v_refused := v_refused || (o ->> 'op');
            o := jsonb_set(o, '{changed}',
                   coalesce((select jsonb_agg(g) from jsonb_array_elements(v_changed) g where g <> '"text"'::jsonb), '[]'::jsonb));
          end if;
        end if;
      exception when invalid_text_representation or data_exception then
        null;   -- a malformed op goes through unchanged; the migrations' function refuses it per op
      end;
    end if;
    v_ops := v_ops || jsonb_build_array(o);
  end loop;

  v_res := public.sync_push_before_v1(v_ops);

  for r in select value from jsonb_array_elements(coalesce(v_res -> 'results', '[]'::jsonb)) loop
    if (r ->> 'ok')::boolean and jsonb_typeof(r -> 'entry') = 'object' then
      v_dup := coalesce((r ->> 'dup')::boolean, false);
      if v_dup then
        r := r || jsonb_build_object('applied_v',
               (select x.applied_v::text from sync_op_receipts x where x.op_id = (r ->> 'op')::uuid and x.profile_id = auth.uid()));
      else
        perform public.sync_note_applied((r ->> 'op')::uuid, (r -> 'entry' ->> 'id')::uuid);
        if (r ->> 'op') = any(v_refused) then
          r := r || jsonb_build_object('conflict', true, 'conflict_groups', jsonb_build_array('text'));
        end if;
        if (r ->> 'op') = any(v_newer) then
          r := r || jsonb_build_object('current',
            (select jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,
                                       'edit_level', e.edit_level, 'v', e.text_xid::text)
               from entries e where e.id = (r -> 'entry' ->> 'id')::uuid));
        end if;
      end if;
    end if;
    v_out := v_out || jsonb_build_array(r);
  end loop;
  return jsonb_set(v_res, '{results}', v_out);
end;
$$;
revoke execute on function public.sync_push(jsonb) from public, anon;
grant execute on function public.sync_push(jsonb) to authenticated;
