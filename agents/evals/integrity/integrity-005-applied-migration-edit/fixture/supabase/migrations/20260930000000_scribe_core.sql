-- Core schema (slice for the eval: only what the other files refer to).
create table if not exists public.entries (id uuid primary key, author_id uuid not null, child_id uuid not null, in_book boolean not null default false, deleted_at timestamptz);
