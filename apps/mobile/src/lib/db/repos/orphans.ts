/**
 * Recordings on this phone with no letter or draft (Settings > Recordings).
 * Keyed by file name, because iOS changes the container path across updates.
 * Never deleted automatically.
 */
import type { RepoContext } from './context';
import * as drafts from './drafts';
import type { Draft, DraftState, OrphanAudio } from './types';

export function list({ db }: RepoContext): OrphanAudio[] {
  return db
    .all<{ file_name: string; bytes: number | null; found_at: string }>(
      'SELECT file_name, bytes, found_at FROM orphan_audio ORDER BY found_at ASC, file_name ASC',
    )
    .map((r) => ({ fileName: r.file_name, bytes: r.bytes, foundAt: r.found_at }));
}

/** Reports a file once; a second report keeps the first time. */
export function report(ctx: RepoContext, fileName: string, bytes: number | null): void {
  ctx.db.run('INSERT OR IGNORE INTO orphan_audio (file_name, bytes, found_at) VALUES (?, ?, ?)', fileName, bytes, ctx.now());
}

/** A stray recording becomes a draft on a book, in one transaction with removing its report row. */
export function reattach(
  ctx: RepoContext,
  fileName: string,
  input: { childId: string; audioUri: string; createdAt: string; sha256: string | null; bytes: number | null; state: DraftState },
): Draft {
  const id = ctx.newId(Date.parse(input.createdAt) || undefined);
  ctx.db.transaction(() => {
    drafts.insert(ctx, id, {
      childId: input.childId,
      captureMode: 'spoken',
      promptKey: null,
      createdAt: input.createdAt,
      audioUri: input.audioUri,
      audioDurationMs: null,
      state: input.state,
      audioSha256: input.sha256,
      audioBytes: input.bytes,
      recoveredAt: ctx.now(),
    });
    ctx.db.run('DELETE FROM orphan_audio WHERE file_name = ?', fileName);
  });
  return drafts.get(ctx, id)!;
}
