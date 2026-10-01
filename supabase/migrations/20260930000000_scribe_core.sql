-- scribe: standalone schema for the independent product (own Supabase project).
-- PRD v2 sections 19 and 21, adapted Sept 30 2026: no dependency on Lumira.
--
-- Scale decisions:
--  * entry ids are generated on device (UUIDv7, time-ordered): offline saves
--    and sync retries are idempotent upserts.
--  * deletes are tombstones (deleted_at) so every device learns of them;
--    a scheduled purge hard-deletes after 30 days.
--  * raw_transcript, captured_at, author_id, child_id, engine_version are
--    immutable after insert (trigger-enforced).
--  * every change to final_text / in_book is versioned server-side.
--  * multi-child and multi-guardian from day one (child_members), even
--    though v1 ships one child and two parents.
--  * children and membership are created through security-definer
--    functions, so clients never write membership rows directly.

-- ─── Profiles (one per auth user) ───────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  -- What the child calls this parent ("Papa", "Mumma"): used in "From Papa".
  signs_as text check (char_length(signs_as) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Children and guardians ─────────────────────────────────────────────
create table public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  date_of_birth date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_members (
  child_id uuid not null references public.children(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'contributor')),
  joined_at timestamptz not null default now(),
  primary key (child_id, profile_id)
);
create index child_members_profile_idx on public.child_members (profile_id);

create or replace function public.is_child_member(p_child uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from child_members where child_id = p_child and profile_id = auth.uid());
$$;

-- Invites: only a SHA-256 hash of the token is stored; the raw token is
-- returned once to the inviter and travels in the invite link.
create table public.child_invites (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token_hash bytea not null unique,
  role text not null default 'parent' check (role in ('parent', 'contributor')),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.create_child(p_name text, p_date_of_birth date)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into children (name, date_of_birth, created_by) values (p_name, p_date_of_birth, auth.uid())
    returning id into v_id;
  insert into child_members (child_id, profile_id, role) values (v_id, auth.uid(), 'parent');
  return v_id;
end;
$$;

create or replace function public.create_child_invite(p_child uuid)
returns text language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_token text;
begin
  if not public.is_child_member(p_child) then raise exception 'not a member of this child'; end if;
  -- 244 random bits from two v4 UUIDs; core Postgres, no extension needed.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into child_invites (child_id, invited_by, token_hash)
    values (p_child, auth.uid(), sha256(convert_to(v_token, 'UTF8')));
  return v_token;
end;
$$;

create or replace function public.accept_child_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_inv child_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_inv from child_invites
    where token_hash = sha256(convert_to(p_token, 'UTF8'))
    for update;
  if not found then raise exception 'invite not found'; end if;
  if v_inv.accepted_at is not null then raise exception 'invite already used'; end if;
  if v_inv.expires_at < now() then raise exception 'invite expired'; end if;
  insert into child_members (child_id, profile_id, role)
    values (v_inv.child_id, auth.uid(), v_inv.role) on conflict do nothing;
  update child_invites set accepted_by = auth.uid(), accepted_at = now() where id = v_inv.id;
  return v_inv.child_id;
end;
$$;

-- ─── Entries ────────────────────────────────────────────────────────────
create table public.entries (
  id uuid primary key,
  child_id uuid not null references public.children(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('note', 'letter', 'not_much')),
  occurred_on date not null,
  captured_at timestamptz not null,
  capture_mode text not null check (capture_mode in ('spoken', 'typed', 'mixed')),
  edit_level text not null default 'clean' check (edit_level in ('clean', 'verbatim')),
  prompt_key text,
  prompt_library_version int,
  engine_version int not null,
  raw_transcript text not null,
  stt_meta jsonb,
  machine_edits jsonb not null default '[]'::jsonb,
  final_text text not null,
  in_book boolean not null default false,
  photo_path text,
  audio_kept_on_device boolean not null default false,
  sounds_like_me boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(final_text, ''))) stored,
  constraint entries_final_text_length check (char_length(final_text) <= 20000),
  constraint entries_raw_length check (char_length(raw_transcript) <= 40000)
);

comment on table public.entries is
  'A parent''s note or letter to a child. raw_transcript is immutable; final_text is what the book renders.';

create index entries_book_idx on public.entries (child_id, occurred_on) where deleted_at is null;
create index entries_sync_idx on public.entries (author_id, updated_at);
create index entries_search_idx on public.entries using gin (search);

create table public.entry_versions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  final_text text not null,
  in_book boolean not null,
  created_at timestamptz not null default now()
);
create index entry_versions_entry_idx on public.entry_versions (entry_id, created_at);

-- ─── Names and words dictionary ─────────────────────────────────────────
create table public.dictionary_terms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  term text not null check (char_length(term) between 1 and 80),
  kind text not null check (kind in ('child', 'nickname', 'family', 'word', 'place', 'self')),
  heard_as text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, term)
);

-- ─── Safety events: tier and time only, never the text ─────────────────
create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  tier smallint not null check (tier between 0 and 2),
  engine_version int,
  created_at timestamptz not null default now()
);

-- ─── Triggers ───────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.entries_guard_immutable()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
  if new.raw_transcript is distinct from old.raw_transcript
     or new.captured_at is distinct from old.captured_at
     or new.author_id is distinct from old.author_id
     or new.child_id is distinct from old.child_id
     or new.engine_version is distinct from old.engine_version then
    raise exception 'entries: raw_transcript, captured_at, author_id, child_id and engine_version are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.entries_record_version()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if new.final_text is distinct from old.final_text or new.in_book is distinct from old.in_book then
    insert into entry_versions (entry_id, final_text, in_book) values (old.id, old.final_text, old.in_book);
  end if;
  return new;
end;
$$;

create trigger entries_guard before update on public.entries for each row execute function public.entries_guard_immutable();
create trigger entries_touch before update on public.entries for each row execute function public.touch_updated_at();
create trigger entries_version after update on public.entries for each row execute function public.entries_record_version();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger children_touch before update on public.children for each row execute function public.touch_updated_at();
create trigger dictionary_terms_touch before update on public.dictionary_terms for each row execute function public.touch_updated_at();

-- ─── Row level security ─────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_members enable row level security;
alter table public.child_invites enable row level security;
alter table public.entries enable row level security;
alter table public.entry_versions enable row level security;
alter table public.dictionary_terms enable row level security;
alter table public.safety_events enable row level security;

-- Profiles: read yourself and co-guardians (for "From Papa"); edit yourself.
create policy profiles_self_or_co_guardian on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or exists (
    select 1 from child_members mine join child_members theirs on mine.child_id = theirs.child_id
    where mine.profile_id = (select auth.uid()) and theirs.profile_id = profiles.id
  )
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Children: members read and edit; creation only via create_child().
create policy children_member_select on public.children for select to authenticated using (public.is_child_member(id));
create policy children_member_update on public.children for update to authenticated
  using (public.is_child_member(id)) with check (public.is_child_member(id));

-- Membership: visible to members of the same child; written only by functions.
create policy child_members_select on public.child_members for select to authenticated using (public.is_child_member(child_id));
-- A guardian may leave (removes their own membership).
create policy child_members_leave on public.child_members for delete to authenticated using (profile_id = (select auth.uid()));

-- Invites: members can see invites for their child (never the token).
create policy child_invites_select on public.child_invites for select to authenticated using (public.is_child_member(child_id));

-- Entries: authors own theirs; co-guardians read only what is in the book.
create policy entries_author_select on public.entries for select to authenticated using (author_id = (select auth.uid()));
create policy entries_author_insert on public.entries for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_child_member(child_id));
create policy entries_author_update on public.entries for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and public.is_child_member(child_id));
create policy entries_book_select on public.entries for select to authenticated
  using (in_book and deleted_at is null and public.is_child_member(child_id));
-- No delete policy: deletion is a tombstone; purge runs with the service role.

create policy entry_versions_author_select on public.entry_versions for select to authenticated
  using (exists (select 1 from entries e where e.id = entry_id and e.author_id = (select auth.uid())));

create policy dictionary_terms_owner on public.dictionary_terms for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (child_id is null or public.is_child_member(child_id)));

create policy safety_events_insert on public.safety_events for insert to authenticated
  with check (author_id = (select auth.uid()));

-- Functions callable by signed-in users only.
revoke execute on function public.create_child(text, date) from public, anon;
revoke execute on function public.create_child_invite(uuid) from public, anon;
revoke execute on function public.accept_child_invite(text) from public, anon;
grant execute on function public.create_child(text, date) to authenticated;
grant execute on function public.create_child_invite(uuid) to authenticated;
grant execute on function public.accept_child_invite(text) to authenticated;

-- ─── Photo storage: {child_id}/{author_id}/{entry_id}.jpg ───────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entry-photos', 'entry-photos', false, 10485760, array['image/jpeg', 'image/heic', 'image/png'])
on conflict (id) do nothing;

create policy entry_photos_author_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_child_member(((storage.foldername(name))[1])::uuid)
);
create policy entry_photos_author_update on storage.objects for update to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy entry_photos_author_delete on storage.objects for delete to authenticated
  using (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy entry_photos_read on storage.objects for select to authenticated using (
  bucket_id = 'entry-photos'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or exists (
      select 1 from public.entries e
      where e.photo_path = storage.objects.name and e.in_book and e.deleted_at is null
        and public.is_child_member(e.child_id)
    )
  )
);
