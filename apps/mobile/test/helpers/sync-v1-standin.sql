-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- after every real file in supabase/migrations, and only when those files do not
-- already define protocol v1 (the check: sync_push mentions conflict_groups).
--
-- It is S03's request to S02 written as runnable SQL (docs/adr/0023-sync-protocol-v1.md
-- section "Requests"; WP-F16-14 words compare and set). S02 owns sync_push and every
-- migration; when S02's migration lands, this file stops loading by itself and the
-- two-phone test runs against S02's real SQL. Delete it then.
--
-- What it changes, against 20261005000000_family_cap_language_idempotency.sql:
--   1. entries.text_xid: the transaction that last wrote the words group
--      (final_text, machine_edits, edit_level), stamped by trigger. The words
--      compare and set reads this, not sync_xid, so another phone's in_book or
--      date change never raises a words conflict (F16 C2 stays later-arrival-wins).
--   2. sync_op_receipts.applied_v: the version an op wrote when it first applied,
--      so a duplicate can tell the phone what to rebase on (F16-REQ-025). Only when
--      this phone's words are the letter's words at that version: an op whose words
--      were refused, or that met newer words, notes words_conflict instead, and a
--      duplicate answers with conflict_groups and current again (a lost answer must
--      never turn a refusal into a silent rebase on words the phone never saw).
--   3. sync_push, entry.upsert with a base:
--        server words changed since base (text_xid > base, by another transaction):
--          - text in changed: the text group is not applied; the other groups are;
--            the result has conflict_groups ['text'] and current (the caller's own
--            words, so nothing leaks: RLS limits the row to its author);
--          - text not in changed: everything applies; current is returned too, so
--            the phone takes the newer words before it writes any of its own.
--        a duplicate returns applied_v from its receipt, or, when the first answer was a
--        refusal or carried current, conflict_groups and current (the letter's words now).
--   4. text_xid never goes backwards against a version already handed out: xid order
--      is not commit order, so a writer with an older xid that commits after a newer
--      one stamps old sync_xid + 1 (still compared with >; a false note at worst).
--   5. The receipt helper lives in sync_private, a schema the API does not expose:
--      only sync_push calls it, never a client RPC.
--      No base (an older app): unchanged, later arrival wins.
-- Everything else is byte for byte the function in 20261005000000.

alter table public.entries add column if not exists text_xid xid8 not null default '0';
update public.entries set text_xid = sync_xid where text_xid = '0';

create or replace function public.entries_set_text_xid()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if tg_op = 'INSERT' then
    new.text_xid := pg_current_xact_id();
  elsif (new.final_text, new.machine_edits, new.edit_level) is distinct from (old.final_text, old.machine_edits, old.edit_level) then
    -- The row lock orders writers, xids do not: a transaction with an older xid can commit its words
    -- after a newer one already answered a phone with v = old.sync_xid. Stamp past that version, so
    -- that phone's next base still sees these words as newer (a compare never passes over them).
    new.text_xid := case when pg_current_xact_id() > old.sync_xid then pg_current_xact_id()
                         else ((old.sync_xid::text)::numeric + 1)::text::xid8 end;
  end if;
  return new;
end;
$$;
create or replace trigger entries_text_xid before insert or update on public.entries
  for each row execute function public.entries_set_text_xid();
revoke execute on function public.entries_set_text_xid() from public, anon, authenticated;

alter table public.sync_op_receipts add column if not exists applied_v xid8;
-- The op's words were refused, or it met words newer than its base: its answer carried current.
alter table public.sync_op_receipts add column if not exists words_conflict boolean not null default false;
alter table public.sync_op_receipts add column if not exists words_refused boolean not null default false;

-- Clients cannot update receipts (20261004100000 revokes it; BL-331 moves every receipt
-- write into security definer helpers such as sync_claim_op), so the outcome is noted here.
-- Not in public: PostgREST exposes public only, so no client can call it as an RPC.
create schema if not exists sync_private;
revoke all on schema sync_private from public, anon;
grant usage on schema sync_private to authenticated;  -- sync_push is security invoker
drop function if exists public.sync_note_applied(uuid, uuid);
create or replace function sync_private.note_applied(p_op uuid, p_entry uuid, p_refused boolean, p_newer boolean)
returns void language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  update sync_op_receipts r
     set applied_v = case when p_refused or p_newer then null
                          else (select e.sync_xid from entries e where e.id = p_entry and e.author_id = auth.uid()) end,
         words_conflict = p_refused or p_newer,
         words_refused = p_refused
   where r.op_id = p_op and r.profile_id = auth.uid();
end;
$$;
revoke execute on function sync_private.note_applied(uuid, uuid, boolean, boolean) from public, anon;
grant execute on function sync_private.note_applied(uuid, uuid, boolean, boolean) to authenticated;

create or replace function public.sync_push(p_ops jsonb)
returns jsonb language plpgsql volatile security invoker set search_path = public, pg_catalog
  set plan_cache_mode = force_generic_plan as $$
declare
  v_uid uuid := public.require_user();
  c_groups constant text[] := array['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'];
  v_epoch_at timestamptz;
  o jsonb;
  d jsonb;
  v_op uuid;
  v_type text;
  v_id uuid;
  v_changed text[];
  v_known timestamptz;
  v_deleted boolean;
  cur record;
  v_exists boolean;
  v_apply boolean;
  v_conflict boolean;
  v_newer boolean;
  v_refused boolean;
  v_new boolean;
  v_res jsonb;
  v_results jsonb := '[]'::jsonb;
  v_code text;
  v_detail text;
  v_ids uuid[];
begin
  if jsonb_typeof(p_ops) is distinct from 'array' or jsonb_array_length(p_ops) > 50 then
    raise exception 'push takes 0 to 50 ops' using errcode = '22023';
  end if;
  if octet_length(p_ops::text) > 262144 then
    raise exception 'push batch is over 256 KB' using errcode = '22023';
  end if;

  perform public.rate_hit('push');                -- 60 per minute per person (SCRAT)

  select e.started_at into v_epoch_at from sync_epochs e order by e.epoch desc limit 1;

  for o in select value from jsonb_array_elements(p_ops) loop
    v_res := '{}'::jsonb;
    begin
      if jsonb_typeof(o) is distinct from 'object' then
        raise exception 'op must be an object' using errcode = '22023';
      end if;
      v_op := (o ->> 'op')::uuid;
      v_type := o ->> 'type';
      v_id := (o ->> 'id')::uuid;
      d := coalesce(o -> 'data', '{}'::jsonb);
      if v_op is null or v_id is null or v_type is null or jsonb_typeof(d) <> 'object' then
        raise exception 'op, type, id and data are required' using errcode = '22023';
      end if;

      -- Idempotency key first: a retry of an applied op changes nothing and reports the current state.
      insert into sync_op_receipts (op_id, profile_id) values (v_op, v_uid) on conflict (op_id) do nothing;
      v_new := found;

      if not v_new then
        v_res := jsonb_build_object('dup', true);
        if v_type like 'entry.%' then
          v_res := v_res || coalesce(
            (select jsonb_build_object('entry', jsonb_build_object(
                      'id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at, 'deleted_at', e.deleted_at,
                      'in_book', e.in_book, 'approval', e.approval))
               from entries e where e.id = v_id),
            jsonb_build_object('missing', true))
            -- v1: what this op wrote when it first applied (rebase point for the phone's later ops),
            -- or, when its first answer was a words conflict, that answer again with today's words.
            || coalesce(
                 (select case when r.words_conflict then
                           case when r.words_refused then jsonb_build_object('conflict_groups', jsonb_build_array('text')) else '{}'::jsonb end
                           || jsonb_build_object('current',
                                (select jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,
                                                           'edit_level', e.edit_level, 'v', e.text_xid::text)
                                   from entries e where e.id = v_id))
                         else jsonb_build_object('applied_v', r.applied_v::text) end
                    from sync_op_receipts r where r.op_id = v_op and r.profile_id = v_uid),
                 '{}'::jsonb);
        end if;
      else
        case v_type
        when 'entry.upsert', 'entry.reupload' then
          if o ? 'changed' then
            if jsonb_typeof(o -> 'changed') <> 'array' then
              raise exception 'changed must be an array' using errcode = '22023';
            end if;
            v_changed := array(select jsonb_array_elements_text(o -> 'changed'));
            if not v_changed <@ c_groups then
              raise exception 'unknown field group' using errcode = '22023';
            end if;
          else
            v_changed := c_groups;
          end if;
          -- v1: the row is locked, so a concurrent push of the same letter waits and then compares.
          select e.sync_xid, e.text_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur
            from entries e where e.id = v_id for update;  -- RLS: the caller's own letters only
          v_exists := found;
          v_apply := true;
          v_conflict := false;
          v_newer := false;
          v_refused := false;
          v_deleted := false;
          if v_type = 'entry.reupload' then
            v_known := (o ->> 'known_at')::timestamptz;
            if v_known is null then
              raise exception 'known_at is required for a re-upload' using errcode = '22023';
            end if;
            v_deleted := coalesce((d ->> 'deleted')::boolean, false);
            v_changed := c_groups;
            if v_exists then
              v_apply := case when cur.sync_restored_from is not null then v_known > cur.sync_restored_from
                              else cur.updated_at < v_epoch_at and v_known > cur.updated_at end;
            end if;
          elsif v_exists and nullif(o ->> 'base', '') is not null then
            v_conflict := cur.sync_xid > (o ->> 'base')::xid8;
            -- v1 words compare and set: the words changed since base, by another transaction.
            v_newer := cur.text_xid > (o ->> 'base')::xid8 and cur.text_xid <> pg_current_xact_id();
            if v_newer and 'text' = any(v_changed) then
              v_changed := array_remove(v_changed, 'text');
              v_refused := true;
            end if;
          end if;

          if v_apply then
            if v_type = 'entry.reupload' then
              perform set_config('scribe.sync_reupload', 'on', true);
              if v_exists and cur.deleted_at is not null and not v_deleted then
                perform public.restore_entry(v_id);
              end if;
            end if;
            if not (v_exists and v_type = 'entry.reupload' and cur.deleted_at is not null and v_deleted) then
              insert into entries as e (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode,
                                        edit_level, prompt_key, engine_version, raw_transcript, machine_edits,
                                        final_text, in_book, sounds_like_me, author_signs_as, audio_kept_on_device,
                                        deleted_at, language)
              values (v_id, (d ->> 'child_id')::uuid, v_uid, d ->> 'kind', (d ->> 'occurred_on')::date,
                      (d ->> 'captured_at')::timestamptz, d ->> 'capture_mode', coalesce(d ->> 'edit_level', 'clean'),
                      d ->> 'prompt_key', (d ->> 'engine_version')::int, d ->> 'raw_transcript',
                      coalesce(d -> 'machine_edits', '[]'::jsonb), d ->> 'final_text',
                      coalesce((d ->> 'in_book')::boolean, false), (d ->> 'sounds_like_me')::boolean,
                      nullif(d ->> 'author_signs_as', ''), coalesce((d ->> 'audio_kept_on_device')::boolean, false),
                      case when v_deleted then now() end, nullif(d ->> 'language', ''))
              on conflict (id) do update set
                final_text = case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                machine_edits = case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                edit_level = case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                in_book = case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                sounds_like_me = case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                occurred_on = case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                language = case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end,
                -- Never changed: passed through so entries_guard refuses a different value (SCIMM).
                raw_transcript = excluded.raw_transcript,
                captured_at = excluded.captured_at,
                child_id = excluded.child_id,
                engine_version = excluded.engine_version
              where (e.final_text, e.machine_edits, e.edit_level, e.in_book, e.sounds_like_me, e.occurred_on,
                     e.raw_transcript, e.captured_at, e.child_id, e.engine_version, e.language)
                    is distinct from
                    (case when 'text' = any(v_changed) then excluded.final_text else e.final_text end,
                     case when 'text' = any(v_changed) then excluded.machine_edits else e.machine_edits end,
                     case when 'text' = any(v_changed) then excluded.edit_level else e.edit_level end,
                     case when 'in_book' = any(v_changed) then excluded.in_book else e.in_book end,
                     case when 'sounds_like_me' = any(v_changed) then excluded.sounds_like_me else e.sounds_like_me end,
                     case when 'occurred_on' = any(v_changed) then excluded.occurred_on else e.occurred_on end,
                     excluded.raw_transcript, excluded.captured_at, excluded.child_id, excluded.engine_version,
                     case when 'language' = any(v_changed) and d ? 'language' then excluded.language else e.language end);
            end if;
            if v_type = 'entry.reupload' then
              if v_exists and cur.deleted_at is null and v_deleted then
                perform public.delete_entry(v_id);
              end if;
              update entries set sync_restored_from = v_known
               where id = v_id and sync_restored_from is distinct from v_known;
              perform set_config('scribe.sync_reupload', 'off', true);
            end if;
          end if;
          v_res := jsonb_build_object('applied', v_apply, 'conflict', v_conflict, 'entry',
            (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                       'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
               from entries e where e.id = v_id));
          if v_refused then
            v_res := v_res || jsonb_build_object('conflict_groups', jsonb_build_array('text'));
          end if;
          if v_newer then
            v_res := v_res || jsonb_build_object('current',
              (select jsonb_build_object('final_text', e.final_text, 'machine_edits', e.machine_edits,
                                         'edit_level', e.edit_level, 'v', e.text_xid::text)
                 from entries e where e.id = v_id));
          end if;
          perform sync_private.note_applied(v_op, v_id, v_refused, v_newer);

        when 'entry.delete' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.delete_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'entry.restore' then
          if exists (select 1 from entries e where e.id = v_id) then
            perform public.restore_entry(v_id);
            v_res := jsonb_build_object('entry',
              (select jsonb_build_object('id', e.id, 'v', e.sync_xid::text, 'updated_at', e.updated_at,
                                         'deleted_at', e.deleted_at, 'in_book', e.in_book, 'approval', e.approval)
                 from entries e where e.id = v_id));
          else
            v_res := jsonb_build_object('missing', true);
          end if;

        when 'book.first_run' then
          v_ids := public.create_first_run_children(d -> 'children');
          v_res := jsonb_build_object('books', to_jsonb(v_ids));

        when 'book.create' then
          perform public.create_child(v_id, d ->> 'name', (d ->> 'date_of_birth')::date, (d ->> 'due_date')::date);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'book.update' then
          if exists (select 1 from jsonb_object_keys(d) x
                      where x not in ('name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read')) then
            raise exception 'unknown book field' using errcode = '22023';
          end if;
          if not exists (select 1 from children c where c.id = v_id) then
            raise exception 'book not found' using errcode = 'P0002';
          end if;
          update children c set
            name = case when d ? 'name' then d ->> 'name' else c.name end,
            nickname = case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
            date_of_birth = case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
            due_date = case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
            family_can_read = case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end
          where c.id = v_id
            and (c.name, c.nickname, c.date_of_birth, c.due_date, c.family_can_read) is distinct from
                (case when d ? 'name' then d ->> 'name' else c.name end,
                 case when d ? 'nickname' then nullif(btrim(d ->> 'nickname'), '') else c.nickname end,
                 case when d ? 'date_of_birth' then (d ->> 'date_of_birth')::date else c.date_of_birth end,
                 case when d ? 'due_date' then (d ->> 'due_date')::date else c.due_date end,
                 case when d ? 'family_can_read' then (d ->> 'family_can_read')::boolean else c.family_can_read end);
          v_res := jsonb_build_object('book', jsonb_build_object('id', v_id));

        when 'prefs.upsert' then
          if exists (select 1 from jsonb_object_keys(d) x where x not in ('signs_as', 'include_in_reminders')) then
            raise exception 'unknown preference' using errcode = '22023';
          end if;
          insert into child_member_prefs as p (child_id, profile_id, signs_as, include_in_reminders)
          values (v_id, v_uid, nullif(btrim(d ->> 'signs_as'), ''), coalesce((d ->> 'include_in_reminders')::boolean, true))
          on conflict (child_id, profile_id) do update set
            signs_as = case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
            include_in_reminders = case when d ? 'include_in_reminders' then excluded.include_in_reminders
                                        else p.include_in_reminders end
          where (p.signs_as, p.include_in_reminders) is distinct from
                (case when d ? 'signs_as' then excluded.signs_as else p.signs_as end,
                 case when d ? 'include_in_reminders' then excluded.include_in_reminders else p.include_in_reminders end);
          v_res := jsonb_build_object('prefs', jsonb_build_object('child_id', v_id));

        else
          raise exception 'unknown op type' using errcode = '22023';
        end case;
      end if;
      v_results := v_results || jsonb_build_array(jsonb_build_object('op', v_op, 'ok', true) || v_res);
    exception when others then
      get stacked diagnostics v_code = returned_sqlstate, v_detail = pg_exception_detail;
      if v_code = 'SCCON' then
        -- Ops before this one are kept; this one and the rest wait for consent.
        return jsonb_build_object('results', v_results, 'paused', true, 'stopped', false, 'consent', v_detail);
      end if;
      if left(v_code, 2) in ('40', '53', '55', '57', '58', 'XX') then
        return jsonb_build_object('results', v_results, 'paused', false, 'stopped', true, 'code', v_code);
      end if;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('op', left(o ->> 'op', 36), 'ok', false, 'code', v_code)
        || case when v_code = 'SCDEL' and v_detail = 'purged' then jsonb_build_object('gone', true) else '{}'::jsonb end);
    end;
  end loop;

  -- Trim the caller's own old receipts (bounded; sync_housekeeping covers people who stopped syncing).
  delete from sync_op_receipts r
   where r.op_id in (select x.op_id from sync_op_receipts x
                      where x.profile_id = v_uid and x.applied_at < now() - interval '30 days'
                      order by x.applied_at limit 100);
  return jsonb_build_object('results', v_results, 'paused', false, 'stopped', false);
end;
$$;
