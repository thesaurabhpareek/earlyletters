/**
 * A take that is still being kept (BL-563). Listen leaves after FINISH_TIMEOUT_MS even when the save is slow but
 * working, and opens Review on the known draft. Until `finalizeTake` has run, that draft is still `recording`: no
 * length, no hash, no byte count. Review must not read it, ask for words on it, or keep it as a letter until the save
 * has settled. Pure on purpose (Node cannot load the recorder); the screen passes the real reads.
 */

/** How long Review waits for a running save before it says so and leaves the take as it is. */
export const SETTLE_TIMEOUT_MS = 15000;

type HasState = { state: string };

/** Where Listen goes once the finishing wait is over. A slow save is not a failed one. */
export type AfterFinish =
  | { to: 'review'; draftId: string; reason: string }
  | { to: 'leave'; canGoBack: boolean };

/**
 * `outcome` is what `finishWithin` returned. A timeout still opens Review: the take is kept and Review waits for
 * it (see `settleTake`). Only a save that threw, or a take let go meanwhile (null draft), leaves without Review.
 */
export function afterFinish(
  outcome: { ok: true; value: { id: string } | null } | { ok: false; why: 'failed' | 'timeout' },
  draftId: string,
  reason: string,
  canGoBack: boolean,
): AfterFinish {
  if (outcome.ok) return outcome.value ? { to: 'review', draftId: outcome.value.id, reason } : { to: 'leave', canGoBack };
  if (outcome.why === 'timeout') return { to: 'review', draftId, reason };
  return { to: 'leave', canGoBack };
}

export type Settled<D extends HasState> =
  | { kind: 'settled'; draft: D } // finalized: ready, or unrecoverable (no sound), with length and hash
  | { kind: 'gone' } // the take was let go meanwhile
  | { kind: 'pending'; draft: D }; // still `recording` after the wait: do not use it yet

/**
 * Joins the save that is running for this draft (if any), then re-reads the row. Never throws, never waits longer
 * than `ms`. A draft that is not `recording` returns at once.
 */
export async function settleTake<D extends HasState>(
  deps: { running: () => Promise<unknown> | undefined; read: () => D | null },
  ms: number = SETTLE_TIMEOUT_MS,
): Promise<Settled<D>> {
  const first = deps.read();
  if (!first) return { kind: 'gone' };
  if (first.state !== 'recording') return { kind: 'settled', draft: first };
  const job = deps.running();
  if (job) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms);
    });
    try {
      await Promise.race([job.then(() => undefined, () => undefined), late]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  const now = deps.read();
  if (!now) return { kind: 'gone' };
  return now.state === 'recording' ? { kind: 'pending', draft: now } : { kind: 'settled', draft: now };
}
