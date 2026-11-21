// Fixture helper (BL-870). Since 20261110000000 no client and no function can put a photo_path on an
// entry, so tests that need a legacy row (a path written before the server closed) switch the guard
// off for one statement, as the owner does. It is test setup only; photo_bucket_closed.test.mjs proves
// the guard itself. Fictional family "Asha" only.
export const legacyPhotoPath = async (sys, id, path) => {
  await sys(`alter table public.entries disable trigger entries_15_photo_closed`);
  try { await sys(`update public.entries set photo_path = $1 where id = $2`, [path, id]); }
  finally { await sys(`alter table public.entries enable trigger entries_15_photo_closed`); }
};

// For purge tests that seed many legacy rows with a path: the guard stays off for the whole file.
export const allowLegacyPhotos = (sys) => sys(`alter table public.entries disable trigger entries_15_photo_closed`);
