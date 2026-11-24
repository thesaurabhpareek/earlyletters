/**
 * One idempotency key per consent answer (NS-10-R7; keeping design K11). When the reply to Agree is lost, the parent
 * taps again; that retry must be the same request, so `record_policy_act` replays the first row instead of writing a
 * second one. The server de-duplicates on the `idempotency-key` header for 24 hours and refuses a key reused with other
 * arguments (22023; supabase/migrations/20261005000000 `idempotency_claim`).
 *
 * So an answer holds its key, and the client time of its first tap, until the server confirms it. The caller names
 * the answer by everything the server fingerprints (consent.ts `answerId`), so a new document version, another step
 * or another person never reuses a held key. Answers are grouped by person and document: holding or confirming one
 * answer drops every other answer held in its group, so a later different answer (a decline after a lost Agree) ends
 * the earlier hold, and agreeing again after it is a new act with its own key and time. A hold also ends before the
 * server's 24-hour window does (`HOLD_MS`). Held in memory only: after a relaunch the gate is read again, and it no
 * longer asks for an answer the server already holds. Pure: the caller mints keys and reads the clock.
 */
export interface HeldAnswer {
  key: string;
  /** The client time of the first tap, resent on every retry. */
  recordedAt: string;
}

export interface HeldAnswers {
  /** This answer's key and time: made on the first tap, the same on every retry until `confirmed`. */
  hold(group: string, answerId: string, now: () => string): HeldAnswer;
  /** The server stored or replayed this answer; the next answer in its group is a new request. */
  confirmed(group: string): void;
}

/** A hold ends before the server forgets the key (24 hours), so a late retry never writes a row with a stale time. */
export const HOLD_MS = 23 * 60 * 60 * 1000;

export function heldAnswers(mint: () => string): HeldAnswers {
  const held = new Map<string, HeldAnswer & { group: string }>();
  const dropGroup = (group: string, keep?: string) => {
    for (const [id, h] of held) if (h.group === group && id !== keep) held.delete(id);
  };
  return {
    hold(group, answerId, now) {
      dropGroup(group, answerId);
      const t = now();
      let h = held.get(answerId);
      if (h && !(Date.parse(t) - Date.parse(h.recordedAt) < HOLD_MS)) h = undefined;
      if (!h) {
        h = { key: mint(), recordedAt: t, group };
        held.set(answerId, h);
      }
      return { key: h.key, recordedAt: h.recordedAt };
    },
    confirmed(group) {
      dropGroup(group);
    },
  };
}
