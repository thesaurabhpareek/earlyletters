/**
 * Storage bucket registry (TDD 05 X-04, TDD 02 section 5, DATA-REQ-011, -047).
 *
 * The one list of buckets the deletion pipeline must reach, and how each is
 * keyed. `purge_due()` and `prepare_account_purge()` enqueue `entry-photos`
 * prefixes only; the worker mirrors every such prefix into the other buckets
 * of the same scope that exist in the project, and adds the person-scoped
 * folders for an account. A bucket listed here but not created yet is skipped,
 * so adding audio, inbox or avatars later needs no worker change.
 *
 * v1.0 (founder, 3 Oct 2026): Storage holds photos only. No audio is uploaded
 * until v1.1, so `entry-audio` and `inbox` stay absent.
 */

export type BucketScope =
  /** `{child_id}/{author_id}/...`: one person's files inside one book. */
  | 'child_author'
  /** `{child_id}/...`: the book's own files (child photo). Belong to the book, not the uploader. */
  | 'child'
  /** `{profile_id}/...`: one person's files outside any book. */
  | 'profile'
  /** Service files (ledger). Never purged by an account or book deletion. */
  | 'system';

export interface BucketSpec {
  id: string;
  scope: BucketScope;
  level: 'L3' | 'L4';
  since: 'v1.0' | 'v1.1' | 'P1';
  note: string;
}

export const BUCKETS: readonly BucketSpec[] = [
  { id: 'entry-photos', scope: 'child_author', level: 'L4', since: 'v1.0', note: '{child}/{author}/{entry}.{jpg|jpeg|heic|png}' },
  { id: 'entry-audio', scope: 'child_author', level: 'L4', since: 'v1.1', note: '{child}/{author}/{entry}.m4a.enc' },
  { id: 'inbox', scope: 'child_author', level: 'L4', since: 'v1.1', note: '{child}/{contributor}/{entry}.enc' },
  { id: 'child-photos', scope: 'child', level: 'L4', since: 'v1.0', note: '{child}/{uuid}.{ext}; re-homed, not deleted, when the uploader leaves a surviving book' },
  { id: 'avatars', scope: 'profile', level: 'L3', since: 'P1', note: '{profile}/{uuid}.{ext}' },
  { id: 'exports', scope: 'profile', level: 'L4', since: 'P1', note: '{profile}/{export}.zip, 7 days' },
  { id: 'ops-ledger', scope: 'system', level: 'L3', since: 'v1.0', note: 'purges/YYYY-MM-DD.jsonl, ids only, 60 days (DATA-REQ-030)' },
];

/** The bucket the SQL purge functions enqueue into. */
export const ANCHOR_BUCKET = 'entry-photos';
export const LEDGER_BUCKET = 'ops-ledger';

export const bucketIds = (): string[] => BUCKETS.map((b) => b.id);
export const bucketsOfScope = (scope: BucketScope): BucketSpec[] => BUCKETS.filter((b) => b.scope === scope);
export const scopeOf = (bucket: string): BucketScope | null => BUCKETS.find((b) => b.id === bucket)?.scope ?? null;

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const CHILD_PREFIX = new RegExp(`^(${UUID})/$`, 'i');
const CHILD_AUTHOR_PREFIX = new RegExp(`^(${UUID})/(${UUID})/$`, 'i');
const UUID_ONLY = new RegExp(`^${UUID}$`, 'i');

/**
 * Given an anchor-bucket prefix (`{child}/` for a whole book, or
 * `{child}/{author}/` for one person in a book), the same prefix in every other
 * existing bucket keyed the same way.
 *  - `{child}/` (whole book) reaches every child-keyed bucket (child_author and child).
 *  - `{child}/{author}/` reaches the other child_author buckets only.
 */
export function mirrorPrefixes(anchorPrefix: string, existing: ReadonlySet<string>): { bucket: string; prefix: string }[] {
  const whole = CHILD_PREFIX.test(anchorPrefix);
  const person = CHILD_AUTHOR_PREFIX.test(anchorPrefix);
  if (!whole && !person) return [];
  const scopes: BucketScope[] = whole ? ['child_author', 'child'] : ['child_author'];
  return BUCKETS.filter((b) => b.id !== ANCHOR_BUCKET && scopes.includes(b.scope) && existing.has(b.id)).map((b) => ({
    bucket: b.id,
    prefix: anchorPrefix,
  }));
}

/** Person-scoped folders to remove for an account (`{profile}/` in every profile bucket that exists). */
export function profilePrefixes(profileId: string, existing: ReadonlySet<string>): { bucket: string; prefix: string }[] {
  if (!UUID_ONLY.test(profileId)) return [];
  return bucketsOfScope('profile')
    .filter((b) => existing.has(b.id))
    .map((b) => ({ bucket: b.id, prefix: `${profileId}/` }));
}

export type OwnedObjectAction =
  /** The person's own file: delete it. */
  | { kind: 'delete' }
  /** A book's file the person uploaded, in a book that survives: copy to a service-owned name, repoint, delete the old one. */
  | { kind: 'rehome'; childId: string }
  /** Unexpected place (another person's folder, a system bucket): never touched automatically; reported as residue. */
  | { kind: 'report' };

/**
 * What to do with an object a departing person still owns (Supabase refuses to
 * delete an Auth user who owns Storage objects; TDD 02 finding 9).
 */
export function ownedObjectAction(bucket: string, name: string, profileId: string): OwnedObjectAction {
  const parts = name.split('/');
  const scope = scopeOf(bucket);
  const uid = profileId.toLowerCase();
  if (scope === 'child_author' && parts.length >= 3 && parts[1].toLowerCase() === uid) return { kind: 'delete' };
  if (scope === 'profile' && parts.length >= 2 && parts[0].toLowerCase() === uid) return { kind: 'delete' };
  if (scope === 'child' && parts.length === 2 && UUID_ONLY.test(parts[0])) return { kind: 'rehome', childId: parts[0] };
  return { kind: 'report' };
}

/** A new name for a child photo re-owned by the service (matches children_photo_path_scoped). */
export function rehomedChildPhotoPath(childId: string, oldName: string, newId: string): string | null {
  const m = /\.(jpg|jpeg|heic|png)$/i.exec(oldName);
  if (!m || !UUID_ONLY.test(childId) || !UUID_ONLY.test(newId)) return null;
  return `${childId.toLowerCase()}/${newId.toLowerCase()}.${m[1].toLowerCase()}`;
}
