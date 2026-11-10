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
  waitMs?: number;
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, deps.waitMs ?? SETTLE_WAIT_MS);
  });
  try {
    await Promise.race([job.then(() => undefined, () => undefined), late]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return deps.getDraft(id) ?? first;
}
