/**
 * One idempotency key per consent answer (NS-10-R7; keeping design K11). When the reply to Agree is lost, the parent
 * taps again; that retry must be the same request, so `record_policy_act` replays the first row instead of writing a
 * second one. The server de-duplicates on the `idempotency-key` header for 24 hours and refuses a key reused with other
 * arguments (22023; supabase/migrations/20261005000000 `idempotency_claim`).
 *
 * So an answer holds its key, and the client time of the first tap, until the server confirms it. The caller names
 * the answer by everything the server fingerprints (consent.ts `answerId`), so a new document version, another step
 * or another person never reuses a held key. Held in memory only: after a relaunch the gate is read again, and it no
 * longer asks for an answer the server already holds. Pure: the caller mints keys and reads the clock.
 */
export interface HeldAnswer {
  key: string;
  /** The client time of the first tap, resent on every retry. */
  recordedAt: string;
}

export interface HeldAnswers {
  /** This answer's key and time: made on the first tap, the same on every retry until `confirmed`. */
  hold(answerId: string, now: () => string): HeldAnswer;
  /** The server stored or replayed this answer; the next answer is a new request. */
  confirmed(answerId: string): void;
}

export function heldAnswers(mint: () => string): HeldAnswers {
  const held = new Map<string, HeldAnswer>();
  return {
    hold(answerId, now) {
      let h = held.get(answerId);
      if (!h) {
        h = { key: mint(), recordedAt: now() };
        held.set(answerId, h);
      }
      return h;
    },
    confirmed(answerId) {
      held.delete(answerId);
    },
  };
}
