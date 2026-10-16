-- TEST STAND-IN, NOT A MIGRATION. Loaded by apps/mobile/test/helpers/sync-server.ts
-- for protocol v1 after sync-v1-standin.sql, and only while no migration defines
-- public.held_drafts. It is S03's request to S02 for WP-F16-17 (F16 6.2 I) in
-- runnable form; S02 owns the table, sync_push and sync_pull. When S02's
-- migration lands this file stops loading by itself. Delete it then.
--
-- What it adds (docs/adr/0025-sync-protocol-v1.md section 12):
--   1. held_drafts: author-only rows for letters held at the Keep gate and voice-only
--      letters waiting for their words. RLS: the author, while a parent of the book.
--      The consent gate (SCCON), raw_transcript immutable once non-empty (SCIMM),
--      child_id and author_id fixed, size caps without values in the message.
--   2. held_drafts.text_xid: the words version (words group plus typed_text), as for
--      entries; held.upsert compares it with the op's base.
--   3. held_drafts_gone: what a phone of the same author needs to drop or adopt its
--      copy ('discarded' or 'kept'). Ids and times only, never words.
--   4. An entries insert for a held id deletes the held row in the same transaction
--      (a kept letter never exists twice).
--   5. sync_private.held_upsert and held_discard, called from sync_push's two new
--      branches (anchored edits in sync-v1-standin.ts); the held receipt outcome.
--   6. public.sync_pull wraps the migrations' sync_pull (moved to sync_private) and
--      adds the held section only when the request asks for it, so an older app and
--      every other member see exactly what they saw before.
-- Not here (S02): purge_ledger 'held_draft', backup_discard of the recording
-- (F08 6.5 D5), account deletion and book purge of the rows.

-- Present already when sync-v1-standin.sql loaded; repeated so this file also runs on S02's v1.
create schema if not exists sync_private;
revoke all on schema sync_private from public, anon;
grant usage on schema sync_private to authenticated;
alter table public.sync_op_receipts add column if not exists words_conflict boolean not null default false;
alter table public.sync_op_receipts add column if not exists words_refused boolean not null default false;

create table public.held_drafts (
  id uuid primary key,
  author_id uuid not null references auth.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null check (kind in ('held_letter', 'waiting_letter', 'held_words')),
  capture_mode text not null,
  created_at timestamptz not null,
  occurred_on date not null,
  occurred_precision text not null default 'day' check (occurred_precision in ('day', 'month')),
  language text,
  base_direction text not null default 'ltr' check (base_direction in ('ltr', 'rtl')),
  prompt_key text,
  in_book_choice boolean,
  raw_transcript text,
  final_text text,
  machine_edits jsonb,
  edit_level text,
  author_edits jsonb,
  locked_spans jsonb,
  typed_text text,
  engine_version int,
  pack_ref text,
  audio_kept_on_device boolean not null default false,
  sync_xid xid8 not null default '0',
  text_xid xid8 not null default '0',
  updated_at timestamptz not null default now(),
  constraint held_drafts_sizes check (
    coalesce(length(raw_transcript), 0) <= 100000 and coalesce(length(final_text), 0) <= 100000
    and coalesce(length(typed_text), 0) <= 100000 and coalesce(length(prompt_key), 0) <= 200
    and coalesce(octet_length(machine_edits::text), 0) <= 200000)
);
create index held_drafts_author_cursor_idx on public.held_drafts (author_id, sync_xid, id);
alter table public.held_drafts enable row level security;
create policy held_drafts_author on public.held_drafts for all to authenticated
  using (author_id = auth.uid() and public.is_child_parent(child_id))
  with check (author_id = auth.uid() and public.is_child_parent(child_id));
revoke all on public.held_drafts from anon;

create table public.held_drafts_gone (
  id uuid primary key,
  author_id uuid not null,
  gone text not null check (gone in ('discarded', 'kept', 'erased')),
  updated_at timestamptz not null default now(),
  sync_xid xid8 not null default pg_current_xact_id()
);
create index held_drafts_gone_cursor_idx on public.held_drafts_gone (author_id, sync_xid, id);
alter table public.held_drafts_gone enable row level security;   -- no policy: definer code only
revoke all on public.held_drafts_gone from anon, authenticated;

create trigger held_drafts_consent_gate before insert or update on public.held_drafts
  for each row execute function public.client_content_gate();

create function public.held_drafts_stamp()
returns trigger language plpgsql set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if new.author_id is distinct from old.author_id or new.child_id is distinct from old.child_id
       or new.created_at is distinct from old.created_at then
      raise exception 'held_drafts: author_id, child_id and created_at are immutable' using errcode = 'SCIMM';
    end if;
    if coalesce(old.raw_transcript, '') <> '' and new.raw_transcript is distinct from old.raw_transcript then
      raise exception 'held_drafts: raw_transcript is immutable once set' using errcode = 'SCIMM';
    end if;
  end if;
  new.sync_xid := pg_current_xact_id();
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.text_xid := pg_current_xact_id();
  elsif (new.final_text, new.machine_edits, new.edit_level, new.author_edits, new.locked_spans, new.typed_text)
        is distinct from (old.final_text, old.machine_edits, old.edit_level, old.author_edits, old.locked_spans, old.typed_text) then
    -- Same rule as entries.text_xid: never behind a version already handed out.
    new.text_xid := case when pg_current_xact_id() > old.sync_xid then pg_current_xact_id()
                         else ((old.sync_xid::text)::numeric + 1)::text::xid8 end;
  end if;
  return new;
end;
$$;
create trigger held_drafts_stamp before insert or update on public.held_drafts
  for each row execute function public.held_drafts_stamp();
revoke execute on function public.held_drafts_stamp() from public, anon, authenticated;

-- The tombstone the author's other phones read. Definer: clients cannot write it.
create function public.held_drafts_note_gone()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    delete from public.held_drafts_gone g where g.id = new.id;
    return new;
  end if;
  insert into public.held_drafts_gone as g (id, author_id, gone)
  values (old.id, old.author_id,
          case when current_setting('scribe.held_erase', true) = 'on' then 'erased'
               when exists (select 1 from public.entries e where e.id = old.id) then 'kept' else 'discarded' end)
  on conflict (id) do update set gone = excluded.gone, updated_at = now(), sync_xid = pg_current_xact_id();
  return old;
end;
$$;
create trigger held_drafts_gone_on_delete after delete on public.held_drafts
  for each row execute function public.held_drafts_note_gone();
create trigger held_drafts_gone_on_insert after insert on public.held_drafts
  for each row execute function public.held_drafts_note_gone();
revoke execute on function public.held_drafts_note_gone() from public, anon, authenticated;

-- Keep: the letter takes the draft's id, and its held row goes in the same transaction.
create function public.entries_drop_held()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  delete from public.held_drafts h where h.id = new.id and h.author_id = new.author_id;
  return new;
end;
$$;
create trigger entries_drop_held after insert on public.entries
  for each row execute function public.entries_drop_held();
revoke execute on function public.entries_drop_held() from public, anon, authenticated;

-- held.upsert (security invoker: RLS, the consent gate and the immutability trigger all apply).
-- Whole row; the words (words group and typed_text) by compare and set against text_xid, as
-- entries in 6.2 E: words changed since base by another transaction and different from the
-- op's are not applied; the answer carries conflict_groups and current.
create function sync_private.held_upsert(p_op uuid, p_id uuid, o jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  d jsonb := coalesce(o -> 'data', '{}'::jsonb);
  v_uid uuid := auth.uid();
  v_base xid8 := nullif(o ->> 'base', '')::xid8;
  cur record;
  v_refused boolean := false;
  -- The words are compared and written only when the op says it changes them (final review B-3).
  v_text boolean := not (o ? 'changed') or 'text' in (select jsonb_array_elements_text(o -> 'changed'));
  v_keep boolean;
  v_res jsonb;
begin
  if (d ->> 'id') is distinct from p_id::text then
    raise exception 'held id must match the op id' using errcode = '22023';
  end if;
  if exists (select 1 from public.entries e where e.id = p_id and e.author_id = v_uid) then
    -- Kept already (on another phone, or this op arrived late): the letter is the row now.
    return jsonb_build_object('held', null);
  end if;
  if sync_private.held_id_taken(p_id) then
    -- Another author's row (RLS hides it): one plain refusal, never a key-violation that names it.
    raise exception 'held id not available' using errcode = '22023';
  end if;
  select h.text_xid, h.final_text, h.machine_edits, h.edit_level, h.author_edits, h.locked_spans, h.typed_text into cur
    from public.held_drafts h where h.id = p_id for update;
  if found then
    v_refused := v_text and cur.text_xid > coalesce(v_base, '0'::xid8) and cur.text_xid <> pg_current_xact_id()
      and (cur.final_text, cur.machine_edits, cur.edit_level, cur.author_edits, cur.locked_spans, cur.typed_text)
          is distinct from (d ->> 'final_text', nullif(d -> 'machine_edits', 'null'::jsonb), d ->> 'edit_level',
                            nullif(d -> 'author_edits', 'null'::jsonb), nullif(d -> 'locked_spans', 'null'::jsonb), d ->> 'typed_text');
    update public.held_drafts h set
      kind = d ->> 'kind', capture_mode = d ->> 'capture_mode', occurred_on = (d ->> 'occurred_on')::date,
      occurred_precision = coalesce(d ->> 'occurred_precision', 'day'), language = nullif(d ->> 'language', ''),
      base_direction = coalesce(d ->> 'base_direction', 'ltr'), prompt_key = d ->> 'prompt_key',
      in_book_choice = (d ->> 'in_book_choice')::boolean,
      raw_transcript = coalesce(nullif(d ->> 'raw_transcript', ''), h.raw_transcript),
      final_text = case when v_refused or not v_text then h.final_text else d ->> 'final_text' end,
      machine_edits = case when v_refused or not v_text then h.machine_edits else nullif(d -> 'machine_edits', 'null'::jsonb) end,
      edit_level = case when v_refused or not v_text then h.edit_level else d ->> 'edit_level' end,
      author_edits = case when v_refused or not v_text then h.author_edits else nullif(d -> 'author_edits', 'null'::jsonb) end,
      locked_spans = case when v_refused or not v_text then h.locked_spans else nullif(d -> 'locked_spans', 'null'::jsonb) end,
      typed_text = case when v_refused or not v_text then h.typed_text else d ->> 'typed_text' end,
      engine_version = (d ->> 'engine_version')::int, pack_ref = d ->> 'pack_ref',
      audio_kept_on_device = coalesce((d ->> 'audio_kept_on_device')::boolean, false),
      child_id = (d ->> 'child_id')::uuid, created_at = (d ->> 'created_at')::timestamptz
    where h.id = p_id;
  else
    insert into public.held_drafts (id, author_id, child_id, kind, capture_mode, created_at, occurred_on, occurred_precision,
                                    language, base_direction, prompt_key, in_book_choice, raw_transcript, final_text,
                                    machine_edits, edit_level, author_edits, locked_spans, typed_text, engine_version,
                                    pack_ref, audio_kept_on_device)
    values (p_id, v_uid, (d ->> 'child_id')::uuid, d ->> 'kind', d ->> 'capture_mode', (d ->> 'created_at')::timestamptz,
            (d ->> 'occurred_on')::date, coalesce(d ->> 'occurred_precision', 'day'), nullif(d ->> 'language', ''),
            coalesce(d ->> 'base_direction', 'ltr'), d ->> 'prompt_key', (d ->> 'in_book_choice')::boolean,
            nullif(d ->> 'raw_transcript', ''), d ->> 'final_text', nullif(d -> 'machine_edits', 'null'::jsonb), d ->> 'edit_level',
            nullif(d -> 'author_edits', 'null'::jsonb), nullif(d -> 'locked_spans', 'null'::jsonb), d ->> 'typed_text',
            (d ->> 'engine_version')::int, d ->> 'pack_ref', coalesce((d ->> 'audio_kept_on_device')::boolean, false));
  end if;
  v_res := sync_private.held_state(p_id, v_refused);
  perform sync_private.note_held(p_op, p_id, v_refused);
  return v_res;
end;
$$;

-- Whether a held id belongs to someone else (definer: RLS hides other authors' rows).
create function sync_private.held_id_taken(p_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select exists (select 1 from public.held_drafts h where h.id = p_id and h.author_id is distinct from auth.uid());
$$;
revoke execute on function sync_private.held_id_taken(uuid) from public, anon;
grant execute on function sync_private.held_id_taken(uuid) to authenticated;

-- What the author's phone needs after held.upsert: the row's version, and on a refusal the words it keeps.
create function sync_private.held_state(p_id uuid, p_refused boolean)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
  select jsonb_build_object('held', (select jsonb_build_object('id', h.id, 'v', h.sync_xid::text, 'updated_at', h.updated_at)
                                       from public.held_drafts h where h.id = p_id))
         || case when p_refused then
              jsonb_build_object('conflict_groups', jsonb_build_array('text'), 'current',
                (select jsonb_build_object('final_text', h.final_text, 'machine_edits', h.machine_edits, 'edit_level', h.edit_level,
                                           'typed_text', h.typed_text, 'v', h.text_xid::text)
                   from public.held_drafts h where h.id = p_id))
            else '{}'::jsonb end;
$$;

create function sync_private.note_held(p_op uuid, p_id uuid, p_refused boolean)
returns void language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  -- applied_v: the version this op wrote, so a duplicate rebases on it and never on the row as it is now
  -- (which may hold another phone's words; final review A-B1). Null when its words were refused.
  update public.sync_op_receipts r set words_conflict = p_refused, words_refused = p_refused,
         applied_v = case when p_refused then null
                          else (select h.sync_xid from public.held_drafts h where h.id = p_id and h.author_id = auth.uid()) end
   where r.op_id = p_op and r.profile_id = auth.uid();
end;
$$;

-- A duplicate of a held op answers what its first answer said: applied_v, or a refusal again.
create function sync_private.held_dup(p_op uuid, p_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  r record;
begin
  select x.words_refused, x.applied_v into r from public.sync_op_receipts x where x.op_id = p_op and x.profile_id = auth.uid();
  return sync_private.held_state(p_id, coalesce(r.words_refused, false))
    || case when r.applied_v is null then '{}'::jsonb else jsonb_build_object('applied_v', r.applied_v::text) end;
end;
$$;

-- held.discard: the author let it go. The row goes (its tombstone says 'discarded'), unless its words
-- changed since the version this phone last saw (base): then the later edit wins and the row stays
-- ({ kept: true }); that phone gets it back at its next pull (final review B-2).
create function sync_private.held_discard(p_id uuid, p_base xid8)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public, pg_temp as $$
declare
  v_text xid8;
begin
  select h.text_xid into v_text from public.held_drafts h where h.id = p_id for update;
  if not found then
    return jsonb_build_object('missing', true);
  end if;
  if v_text > coalesce(p_base, '0'::xid8) then
    return jsonb_build_object('kept', true);
  end if;
  delete from public.held_drafts h where h.id = p_id;
  return '{}'::jsonb;
end;
$$;

-- Erase now on a voice-only letter waiting for its words (its only server copy is the held row, or the
-- marker of one let go): the row goes and the marker says 'erased', so every phone of the author erases
-- its copy, never restorable there. Called by sync_private.erase_entry when no letter has the id.
create function sync_private.erase_held(p_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  v_deleted boolean;
begin
  perform set_config('scribe.held_erase', 'on', true);
  delete from public.held_drafts h where h.id = p_id and h.author_id = auth.uid();
  v_deleted := found;
  perform set_config('scribe.held_erase', 'off', true);
  update public.held_drafts_gone g set gone = 'erased', updated_at = now(), sync_xid = pg_current_xact_id()
   where g.id = p_id and g.author_id = auth.uid();
  return case when v_deleted or found then jsonb_build_object('erased', true) else jsonb_build_object('missing', true) end;
end;
$$;
revoke execute on function sync_private.erase_held(uuid) from public, anon;
grant execute on function sync_private.erase_held(uuid) to authenticated;

revoke execute on function sync_private.held_upsert(uuid, uuid, jsonb), sync_private.held_state(uuid, boolean),
  sync_private.note_held(uuid, uuid, boolean), sync_private.held_dup(uuid, uuid), sync_private.held_discard(uuid, xid8)
  from public, anon;
grant execute on function sync_private.held_upsert(uuid, uuid, jsonb), sync_private.held_state(uuid, boolean),
  sync_private.note_held(uuid, uuid, boolean), sync_private.held_dup(uuid, uuid), sync_private.held_discard(uuid, xid8)
  to authenticated;

-- The pull: the migrations' sync_pull, unchanged, plus the held section for a request that asks.
alter function public.sync_pull(jsonb, int) set schema sync_private;
revoke execute on function sync_private.sync_pull(jsonb, int) from public, anon, authenticated;

create function public.sync_pull(p_since jsonb default '{}'::jsonb, p_limit int default 200)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  c_zero constant uuid := '00000000-0000-0000-0000-000000000000';
  v_snap pg_snapshot := pg_current_snapshot();
  v_xmin xid8 := pg_snapshot_xmin(v_snap);
  v_res jsonb;
  v_uid uuid;
  v_cur text;
  v_after_x xid8 := '0';
  v_after_i uuid := c_zero;
  v_rows jsonb;
  v_n int;
  v_last_x xid8;
  v_last_i uuid;
  v_more boolean;
begin
  v_res := sync_private.sync_pull(p_since, p_limit);
  if coalesce((v_res ->> 'reset')::boolean, false) or not (coalesce(p_since, '{}'::jsonb) ? 'held') then
    return v_res;
  end if;
  v_uid := auth.uid();
  begin
    v_cur := nullif(p_since -> 'held' ->> 'cursor', '');
    if v_cur is not null then
      if array_length(string_to_array(v_cur, ':'), 1) <> 2 then raise exception 'bad cursor'; end if;
      v_after_x := split_part(v_cur, ':', 1)::xid8;
      v_after_i := split_part(v_cur, ':', 2)::uuid;
    end if;
  exception when others then
    raise exception 'bad held request' using errcode = '22023';
  end;
  if v_after_x > pg_snapshot_xmax(v_snap) then
    return jsonb_build_object('reset', true, 'reason', 'cursor_ahead', 'epoch', v_res -> 'epoch', 'epoch_started_at', v_res -> 'epoch_started_at');
  end if;
  select coalesce(jsonb_agg(x.j order by x.sx, x.id), '[]'::jsonb), count(*),
         (array_agg(x.sx order by x.sx desc, x.id desc))[1], (array_agg(x.id order by x.sx desc, x.id desc))[1]
    into v_rows, v_n, v_last_x, v_last_i
    from (
      select * from (
        select h.sync_xid as sx, h.id,
               (to_jsonb(h) - 'author_id' - 'sync_xid' - 'text_xid') || jsonb_build_object('v', h.sync_xid::text) as j
          from public.held_drafts h
         where h.author_id = v_uid
           and exists (select 1 from public.child_members m where m.child_id = h.child_id and m.profile_id = v_uid and m.role = 'parent')
        union all
        -- Tombstones only for a phone that pulled before (a fresh pull has nothing to drop).
        select g.sync_xid, g.id, jsonb_build_object('id', g.id, 'gone', g.gone, 'updated_at', g.updated_at, 'v', g.sync_xid::text)
          from public.held_drafts_gone g
         where g.author_id = v_uid and v_cur is not null
      ) a
       where (a.sx, a.id) > (v_after_x, v_after_i) and a.sx < v_xmin
       order by a.sx, a.id
       limit p_limit
    ) x;
  v_more := v_n = p_limit;
  return v_res || jsonb_build_object(
    'held', jsonb_build_object('rows', v_rows, 'more', v_more,
                               'cursor', case when v_more then v_last_x::text || ':' || v_last_i::text
                                              else v_xmin::text || ':' || c_zero::text end),
    'more', coalesce((v_res ->> 'more')::boolean, false) or v_more);
end;
$$;
revoke execute on function public.sync_pull(jsonb, int) from public, anon;
grant execute on function public.sync_pull(jsonb, int) to authenticated;
