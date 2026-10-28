-- Purpose: a rename (storage move/upsert is an UPDATE) may not land a photo on an erased letter's path.
-- Same condition the insert policy carries. Rollback: restate the policy without the last condition.
-- Ordering: after the migration that created entry_photos_author_update.
alter policy entry_photos_author_update on storage.objects
  with check (bucket_id = 'entry-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
              and public.is_child_member(((storage.foldername(name))[1])::uuid)
              and not public.photo_entry_is_purged(name));
