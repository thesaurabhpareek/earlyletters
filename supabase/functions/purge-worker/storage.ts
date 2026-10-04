/**
 * Storage deletion through the Storage API, never SQL (a SQL delete orphans
 * the file): draining storage_purge_queue, mirroring prefixes into every
 * registered bucket (TDD 05 X-04), and the ownership sweep that must run
 * before an Auth user can be deleted (TDD 02 finding 9).
 */
import { ANCHOR_BUCKET, LEDGER_BUCKET, mirrorPrefixes, ownedObjectAction, profilePrefixes, rehomedChildPhotoPath } from './lib/buckets.ts';
import { ServiceError } from './lib/http.ts';
import type { LoggableBucket } from '../_shared/log/log.ts';
import { LOGGABLE_BUCKETS } from '../_shared/log/log.ts';
import { codeOf, type Ctx, overBudget } from './context.ts';
import type { QueueRow } from './rpc.ts';

const CHUNK = 100;
const asBucket = (b: string): LoggableBucket | undefined =>
  (LOGGABLE_BUCKETS as readonly string[]).includes(b) ? (b as LoggableBucket) : undefined;

export async function existingBuckets(ctx: Ctx): Promise<Set<string>> {
  if (ctx.buckets) return ctx.buckets;
  const ids = await ctx.c.storage.listBuckets();
  ctx.buckets = new Set(ids);
  ctx.log.info('buckets.listed', { counts: { buckets: ids.length } });
  return ctx.buckets;
}

async function removeAll(ctx: Ctx, bucket: string, names: string[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < names.length; i += CHUNK) n += await ctx.c.storage.remove(bucket, names.slice(i, i + CHUNK));
  return n;
}

/** Deletes every object under a folder, page by page; returns how many were deleted. */
export async function removePrefix(ctx: Ctx, bucket: string, prefix: string): Promise<number> {
  if (bucket === LEDGER_BUCKET) throw new ServiceError('storage', 0, 'invalid_input');
  let total = 0;
  for (let round = 0; round < 50; round++) {
    const { names, truncated } = await ctx.c.storage.listAll(bucket, prefix, 1000);
    if (!names.length) return total;
    total += await removeAll(ctx, bucket, names);
    if (!truncated) {
      // One more listing proves the folder is empty (DATA-REQ-034: listing each prefix returns 0).
      const again = await ctx.c.storage.listAll(bucket, prefix, 1);
      if (!again.names.length) return total;
    }
  }
  throw new ServiceError('storage', 0, 'budget');
}

/** Drains queue rows; each row is marked done or retried with backoff (record_purge_attempt). */
export async function drainRows(ctx: Ctx, rows: QueueRow[]): Promise<{ done: number; failed: number; objects: number; pending: number }> {
  const buckets = await existingBuckets(ctx);
  let done = 0, failed = 0, objects = 0, pending = 0;
  for (const row of rows) {
    if (overBudget(ctx)) {
      pending++;
      continue;
    }
    try {
      if (row.bucket_id === LEDGER_BUCKET) throw new ServiceError('storage', 0, 'invalid_input');
      if (row.is_prefix) {
        const targets = [{ bucket: row.bucket_id, prefix: row.object_path }];
        if (row.bucket_id === ANCHOR_BUCKET) {
          const mirrors = mirrorPrefixes(row.object_path, buckets);
          targets.push(...mirrors);
          if (mirrors.length) ctx.log.info('queue.fanout', { counts: { buckets: mirrors.length } });
        }
        for (const t of targets) if (buckets.has(t.bucket)) objects += await removePrefix(ctx, t.bucket, t.prefix);
      } else if (buckets.has(row.bucket_id)) {
        objects += await ctx.c.storage.remove(row.bucket_id, [row.object_path]);
      }
      await ctx.d.recordPurgeAttempt(row.id, true);
      done++;
    } catch (e) {
      failed++;
      const code = codeOf(e);
      ctx.log.warn('queue.row_failed', {
        bucket: asBucket(row.bucket_id),
        code: e instanceof ServiceError ? e.code : 'error',
        status: e instanceof ServiceError ? e.status : undefined,
      });
      try {
        await ctx.d.recordPurgeAttempt(row.id, false, code);
      } catch {
        // the row stays due; next run retries
      }
    }
  }
  if (rows.length) ctx.log.info('queue.drained', { counts: { rows: done, failed, objects, skipped: pending } });
  return { done, failed, objects, pending };
}

/**
 * Everything the departing person still has in Storage: their queued folders,
 * person-scoped folders, and any object Supabase still records them as owning.
 * Throws when something is left, so the step retries with backoff.
 */
export async function purgeAccountStorage(ctx: Ctx, requestId: string, uid: string): Promise<{ objects: number; rehomed: number }> {
  const buckets = await existingBuckets(ctx);
  let objects = 0;

  // 1. Queue rows for this request (prepare_account_purge enqueued them).
  for (let round = 0; round < 10; round++) {
    const rows = await ctx.d.queueDue(500, requestId);
    if (!rows.length) break;
    const r = await drainRows(ctx, rows);
    objects += r.objects;
    if (r.failed || r.pending) throw new ServiceError('storage', 0, r.pending ? 'budget' : 'storage_error');
  }

  // 2. Person-scoped folders ({profile}/ in avatars, exports) once those buckets exist.
  for (const p of profilePrefixes(uid, buckets)) objects += await removePrefix(ctx, p.bucket, p.prefix);

  // 3. Ownership sweep: Supabase refuses to delete an Auth user who owns objects.
  const swept = await sweepOwned(ctx, uid);
  objects += swept.deleted;
  if (swept.reported) throw new ServiceError('storage', 0, 'ownership');
  const left = await ctx.d.ownedObjects(uid, 1);
  if (left.length) throw new ServiceError('storage', 0, 'ownership');
  return { objects, rehomed: swept.rehomed };
}

export async function sweepOwned(ctx: Ctx, uid: string): Promise<{ deleted: number; rehomed: number; reported: number }> {
  const owned = await ctx.d.ownedObjects(uid, 1000);
  let deleted = 0, rehomed = 0, reported = 0;
  const byBucket = new Map<string, string[]>();
  for (const o of owned) {
    const action = ownedObjectAction(o.bucket_id, o.name, uid);
    if (action.kind === 'delete') {
      byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) ?? []), o.name]);
    } else if (action.kind === 'rehome') {
      const target = rehomedChildPhotoPath(action.childId, o.name, ctx.newId());
      if (!target) {
        reported++;
        continue;
      }
      // Copy as the service (the copy has no owner), repoint the book, then delete the old object.
      await ctx.c.storage.copy(o.bucket_id, o.name, target);
      const repointed = await ctx.d.setChildPhotoPath(action.childId, o.name, target);
      if (!repointed) {
        // Not the book's current photo: an old upload of theirs. Drop the copy and the original.
        await ctx.c.storage.remove(o.bucket_id, [target]);
        deleted += await ctx.c.storage.remove(o.bucket_id, [o.name]);
      } else {
        await ctx.c.storage.remove(o.bucket_id, [o.name]);
        rehomed++;
      }
    } else {
      reported++;
    }
  }
  for (const [bucket, names] of byBucket) deleted += await removeAll(ctx, bucket, names);
  if (owned.length) ctx.log.info('ownership.swept', { counts: { objects: deleted, rehomed, residue: reported } });
  return { deleted, rehomed, reported };
}
