-- Purpose: definer helpers must name pg_temp last in search_path. Without it Postgres searches the session's temp
-- schema first for relations, so a caller's temp table named like ours is read with the owner's rights.
-- alter function keeps the bodies, grants and signatures. Rollback: alter function ... set search_path = <old value>.
alter function public.is_child_parent(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.member_count(uuid) set search_path = pg_catalog, public, pg_temp;
alter function public.my_role(uuid) set search_path = pg_catalog, public, pg_temp;
