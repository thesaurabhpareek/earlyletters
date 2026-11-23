/**
 * How many sessions have ended in a kept letter (NX-31-R14, R29): a count that stays on this phone, in the device
 * settings, as two plain numbers. Nothing here is sent anywhere, tracked, or shown; it is read by the future
 * lock-offer and reminder sequencer through `keptLetterSessions()`.
 *
 * A session is the one the ask rule already uses (a cold start, or a return after ASK_SESSION_GAP_MS or more away;
 * `sessionAfterForeground` in ./next-ask.logic). A session counts once, when its first letter is kept: a session that
 * has a kept letter has, by that, ended with at least one; a session where nothing was kept never calls this and is
 * never counted. A later letter in the same session adds nothing.
 *
 * | Key | Value |
 * |---|---|
 * | `asks.keptLetterSessions` | sessions counted so far |
 * | `asks.lastKeptSession` | session key (ms epoch) of the last counted session |
 */

export const KEPT_SESSIONS_KEY = 'asks.keptLetterSessions';
export const LAST_KEPT_SESSION_KEY = 'asks.lastKeptSession';

/** The device settings, as far as this counter needs them (lib/store getSetting and setSetting). */
export interface SettingsPort {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface KeptSessionCounter {
  /** Call once for each kept letter, with the key of the current session. Returns the count after it. */
  noteLetterKept(session: number): number;
  /** Sessions that ended in at least one kept letter. */
  keptLetterSessions(): number;
}

const wholeNumber = (raw: string | null): number => {
  const n = Number(raw ?? '0');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

export function createKeptSessionCounter(settings: SettingsPort): KeptSessionCounter {
  const read = () => wholeNumber(settings.get(KEPT_SESSIONS_KEY));
  return {
    keptLetterSessions: read,
    noteLetterKept(session) {
      if (wholeNumber(settings.get(LAST_KEPT_SESSION_KEY)) === session) return read();
      const next = read() + 1;
      settings.set(KEPT_SESSIONS_KEY, String(next));
      settings.set(LAST_KEPT_SESSION_KEY, String(session));
      return next;
    },
  };
}
