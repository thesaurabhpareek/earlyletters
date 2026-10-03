/**
 * Storage bucket registry (TDD 05 X-04, TDD 02 section 5, DATA-REQ-011, -047).
 *
 * The one list of buckets the deletion pipeline must reach, and how each is
 * keyed. `purge_due()` and `prepare_account_purge()` enqueue `entry-photos`
 * prefixes only; the purge worker mirrors every such prefix into the other
 * buckets of the same scope that exist in the project, and adds the
 * person-scoped folders for an account. A bucket listed here but not yet
 * created (audio, inbox and avatars arrive after v1.0) is skipped, so adding
 * it later needs no worker change.
 *
 * v1.0 (founder, 3 Oct 2026): Storage holds photos only. No audio is uploaded
 * until v1.1, so `entry-audio` and `inbox` stay empty or absent.
 */

export type BucketScope =
  /** `{child_id}/{author_id}/...`: one person's files inside one book. */
  | 'child_author'
  /** `{child_id}/...`: the book's own files (child photo). Uploaded by a parent, belong to the book. */
  | 'child'
  /** `{profile_id}/...`: one person's files outside any book. */
  | 'profile'
  /** Service files (ledger). Never purged by an account or book deletion. */
  | 'system';

export interface BucketSpec {
  id: string;
  scope: BucketScope;
  /** Level of the content (DATA_CLASSIFICATION). */
  level: 'L3' | 'L4';
  /** Release in which the bucket starts holding objects. */
  since: 'v1.0' | 'v1.1' | 'P1';
  note: string;
}

export const BUCKETS: readonly BucketSpec[] = [
  { id: 'entry-photos', scope: 'child_author', level: 'L4', since: 'v1.0', note: 'Letter photos, {child}/{author}/{entry}.{jpg|jpeg|heic|png}' },
  { id: 'entry-audio', scope: 'child_author', level: 'L4', since: 'v1.1', note: 'Encrypted recordings, {child}/{author}/{entry}.m4a.enc' },
  { id: 'inbox', scope: 'child_author', level: 'L4', since: 'v1.1', note: 'Web contributor audio, {child}/{contributor}/{entry}.enc' },
  { id: 'child-photos', scope: 'child', level: 'L4', since: 'v1.0', note: 'Child profile photo, {child}/{uuid}.{ext}; re-owned, not deleted, when the uploader leaves a surviving book' },
  { id: 'avatars', scope: 'profile', level: 'L3', since: 'P1', note: 'Member photo, {profile}/{uuid}.{ext}' },
  { id: 'exports', scope: 'profile', level: 'L4', since: 'P1', note: 'Server-built export ZIPs, {profile}/{export}.zip, 7 days' },
  { id: 'ops-ledger', scope: 'system', level: 'L3', since: 'v1.0', note: 'Purged ids, purges/YYYY-MM-DD.jsonl, 60 days (DATA-REQ-030)' },
];

/** The anchor bucket the SQL purge functions enqueue into. */
export const ANCHOR_BUCKET = 'entry-photos';
export const LEDGER_BUCKET = 'ops-ledger';

export const bucketIds = (): string[] => BUCKETS.map((b) => b.id);
export const bucketsOfScope = (scope: BucketScope): BucketSpec[] => BUCKETS.filter((b) => b.scope === scope);

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const CHILD_PREFIX = new RegExp(`^(${UUID})/$`, 'i');
const CHILD_AUTHOR_PREFIX = new RegExp(`^(${UUID})/(${UUID})/$`, 'i');

/**
 * Given an anchor-bucket prefix (`{child}/` for a whole book, or
 * `{child}/{author}/` for one person in a book), the same prefix in every other
 * existing bucket that is keyed the same way.
 *  - `{child}/` (whole book) reaches every child-keyed bucket: child_author and child scopes.
 *  - `{child}/{author}/` reaches the other child_author buckets only.
 */
export function mirrorPrefixes(anchorPrefix: string, existing: ReadonlySet<string>): { bucket: string; prefix: string }[] {
  const whole = CHILD_PREFIX.exec(anchorPrefix);
  const person = CHILD_AUTHOR_PREFIX.exec(anchorPrefix);
  if (!whole && !person) return [];
  const scopes: BucketScope[] = whole ? ['child_author', 'child'] : ['child_author'];
  return BUCKETS.filter((b) => b.id !== ANCHOR_BUCKET && scopes.includes(b.scope) && existing.has(b.id)).map((b) => ({
    bucket: b.id,
    prefix: anchorPrefix,
  }));
}

/** Person-scoped folders to remove for an account (`{profile}/` in every profile bucket that exists). */
export function profilePrefixes(profileId: string, existing: ReadonlySet<string>): { bucket: string; prefix: string }[] {
  if (!new RegExp(`^${UUID}$`, 'i').test(profileId)) return [];
  return bucketsOfScope('profile')
    .filter((b) => existing.has(b.id))
    .map((b) => ({ bucket: b.id, prefix: `${profileId}/` }));
}

/** A new path for a child photo that is re-owned by the service (children_photo_path_scoped). */
export function rehomedChildPhotoPath(childId: string, oldName: string, newId: string): string | null {
  const m = /\.(jpg|jpeg|heic|png)$/i.exec(oldName);
  if (!m || !new RegExp(`^${UUID}$`, 'i').test(childId) || !new RegExp(`^${UUID}$`, 'i').test(newId)) return null;
  return `${childId}/${newId.toLowerCase()}.${m[1].toLowerCase()}`;
}
