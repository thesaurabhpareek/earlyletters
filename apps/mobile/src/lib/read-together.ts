/**
 * Read together allowance (founder decision, Oct 2 2026): free for a few
 * sessions, then part of Plus. Sessions are counted on this phone only; the
 * count is a plain number in device settings, nothing about what was read.
 */
import { getSetting, hasPlus, setSetting } from './store';

/** Free Read together sessions before the Plus gate. Change it here only. */
export const FREE_READ_TOGETHER_SESSIONS = 3;

const KEY = 'readTogether.sessions';

export function readTogetherSessions(): number {
  const n = Number(getSetting(KEY) ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** True when a new session may start: Plus, or free sessions left. */
export function canStartReadTogether(): boolean {
  return hasPlus() || readTogetherSessions() < FREE_READ_TOGETHER_SESSIONS;
}

/** Call once when a session starts. */
export function recordReadTogetherSession(): void {
  setSetting(KEY, String(readTogetherSessions() + 1));
}
