/**
 * Review opened on a take that Listen is still keeping (BL-563, follow-up to #595). Listen waits 3 s for the save, then
 * opens Review on the known draft anyway. The row is still `recording` then: no final length, no hash. Review joins the
 * running save, shows the finished row, and asks for words only once the row is no longer `recording`.
 *
 * Pure: the store and the recorder come in as functions, so a test gives a fake slow save.
 */
import type { Draft } from '@/lib/store';

/** How long Review waits for a save that is still running. A hung stop never blocks the screen past this. */
export const SETTLE_WAIT_MS = 15000;

export type SettleDeps = {
  getDraft: (id: string) => Draft | null;
  /** The save that is running for this take, or null when none is (recorder.finishingTake). */
  running: (id: string) => Promise<unknown> | null;
  /** Longest wait in ms; `null` waits for the save however long it takes (words start whenever it ends). */
  waitMs?: number | null;
};

/**
 * The draft as it is once its save has finished, or as it is after `waitMs` (or when no save is running). Never
 * throws: a failed save leaves the row as it was. The caller starts words only when `state` is not `recording`.
 */
export async function settleDraft(id: string, deps: SettleDeps): Promise<Draft | null> {
  const first = deps.getDraft(id);
  if (!first || first.state !== 'recording') return first;
  const job = deps.running(id);
  if (!job) return first;
  const done = job.then(() => undefined, () => undefined);
  if (deps.waitMs === null) {
    await done;
    return deps.getDraft(id) ?? first;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, deps.waitMs ?? SETTLE_WAIT_MS);
  });
  try {
    await Promise.race([done, late]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return deps.getDraft(id) ?? first;
}

/**
 * The row to keep as a recording, or null when it must not be kept yet: still `recording` after the wait (a save that
 * has not finished has no real length or hash, so keeping it now would keep the take wrong). The caller does nothing
 * then; the take stays on the phone and Review's own wait starts words when the save ends.
 */
export async function settleForKeep(id: string, deps: SettleDeps): Promise<Draft | null> {
  const row = await settleDraft(id, deps);
  return row && row.state !== 'recording' ? row : null;
}
