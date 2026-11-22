/**
 * Stores the pending picture for an owner: a draft (Review opened, `requireWords` false) or a kept letter (Keep, words
 * required). Never throws and never un-keeps a letter (NS-01-R17). A picture that cannot be stored is marked so the
 * letter page can say so once (failures.ts); one that is stored clears that mark. Pure over its inputs, so Node tests it.
 */
import { clearPhotoNotSaved, markPhotoNotSaved } from './failures';
import type { PendingPhoto } from './pending';
import type { PhotoDeps, PickedAsset } from './types';

/**
 * One adopt at a time, in the order asked (BL-1444 gap 2). A second adopt waits for the first and then looks at the
 * picture again, so it is neither dropped nor run twice: once the first has stored the picture there is nothing left
 * to adopt. `dropQueuedAdopts` ends the wait of every adopt that has not started (sign-out, account switch, Erase
 * everything), so a queued adopt cannot store a picture the parent has just left behind.
 */
let tail: Promise<void> = Promise.resolve();
let epoch = 0;

/** Adopts that have not started will not run. One already running finishes (it cannot be cancelled halfway). */
export function dropQueuedAdopts(): void {
  epoch++;
}

/** Resolves when no adopt is running or waiting (the ones asked before this call). Never rejects. */
export const adoptsIdle = (): Promise<void> => tail;

async function adoptNow(pending: PendingPhoto | null, source: PickedAsset, deps: () => PhotoDeps, ownerId: string, finalText: string, requireWords: boolean): Promise<void> {
  // The picture this adopt was asked for. If another was picked while it waited, that one belongs to its own Keep.
  if (!pending || pending.source !== source) return;
  try {
    const r = await pending.commit(deps(), { entryId: ownerId, finalText, requireWords });
    if (r === null || r.status === 'needs_words') return;
    if (r.status === 'stored') clearPhotoNotSaved(ownerId);
    else markPhotoNotSaved(ownerId);
  } catch {
    markPhotoNotSaved(ownerId);
  }
}

export function adoptPending(pending: PendingPhoto | null, deps: () => PhotoDeps, ownerId: string, finalText: string, requireWords: boolean): Promise<void> {
  const source = pending?.source;
  if (!source) return Promise.resolve();
  const asked = epoch;
  const run = tail.then(() => (asked === epoch ? adoptNow(pending, source, deps, ownerId, finalText, requireWords) : undefined));
  tail = run.catch(() => undefined);
  return run;
}
