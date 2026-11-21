/**
 * Stores the pending picture for an owner: a draft (Review opened, `requireWords` false) or a kept letter (Keep, words
 * required). Never throws and never un-keeps a letter (NS-01-R17). A picture that cannot be stored is marked so the
 * letter page can say so once (failures.ts); one that is stored clears that mark. Pure over its inputs, so Node tests it.
 */
import { clearPhotoNotSaved, markPhotoNotSaved } from './failures';
import type { PendingPhoto } from './pending';
import type { PhotoDeps } from './types';

let adopting = false;

export async function adoptPending(pending: PendingPhoto | null, deps: () => PhotoDeps, ownerId: string, finalText: string, requireWords: boolean): Promise<void> {
  if (!pending?.source || adopting) return;
  adopting = true;
  try {
    const r = await pending.commit(deps(), { entryId: ownerId, finalText, requireWords });
    if (r === null || r.status === 'needs_words') return;
    if (r.status === 'stored') clearPhotoNotSaved(ownerId);
    else markPhotoNotSaved(ownerId);
  } catch {
    markPhotoNotSaved(ownerId);
  } finally {
    adopting = false;
  }
}
