/**
 * Read together allowance (PRD-REQ-020; founder decisions of 2 and 3 Oct
 * 2026): free for a few sessions in each Free book, then part of Plus. The
 * decision is the plan engine's (decide() in packages/core, through
 * lib/billing), from Plus as StoreKit reports it on this phone.
 *
 * The number of free sessions comes from remote config, which may only raise
 * the reviewed default (3). Sessions are counted per book on this phone, only
 * when they ran on a free try (never under Plus). The count is a plain number
 * in device settings; nothing about what was read.
 */
import type { Decision } from '@scribe/core';
import { READ_TOGETHER_SESSIONS_KEY } from './billing/config';
import { bookFactsOf, gateContext } from './billing/gates';
import { countsAsFreeSession, freeSessionsFrom, readTogetherDecision, sessionsFrom } from './billing/plan.logic';
import { getActiveChild, getChild, getSetting, setSetting, type Child } from './store';

let remoteFreeSessions: () => unknown = () => undefined;

/**
 * Platform wiring (coordinator): pass a reader of the current remote config,
 * for example `() => effectiveFreeSessions(currentConfig())` from packages/api.
 * Until then the reviewed default applies.
 */
export function setReadTogetherFreeSessionsSource(source: () => unknown): void {
  remoteFreeSessions = source;
}

/** Free Read together sessions per Free book (default 3; remote config may raise it). */
export function freeReadTogetherSessions(): number {
  try {
    return freeSessionsFrom(remoteFreeSessions());
  } catch {
    return freeSessionsFrom(undefined);
  }
}

const keyFor = (childId: string) => `${READ_TOGETHER_SESSIONS_KEY}.${childId}`;

function bookFor(childId?: string | null): Child | null {
  return (childId ? getChild(childId) : null) ?? getActiveChild();
}

/** Free sessions already used in one book. */
export function readTogetherSessions(childId: string): number {
  return sessionsFrom(getSetting(keyFor(childId)));
}

/** The plan engine's decision for starting a session in this book (the active book when none is given). */
export function readTogetherGate(childId?: string | null): Decision {
  const child = bookFor(childId);
  return readTogetherDecision({
    ...gateContext(),
    book: child ? bookFactsOf(child) : null,
    sessionsUsed: child ? readTogetherSessions(child.id) : 0,
    freeSessions: freeReadTogetherSessions(),
  });
}

/** True when a new session may start: Plus, or free sessions left in this book. */
export function canStartReadTogether(childId?: string | null): boolean {
  return readTogetherGate(childId).kind === 'allow';
}

/** Call once when a session starts. Counts it only when it ran on a free try. */
export function recordReadTogetherSession(childId?: string | null): void {
  const child = bookFor(childId);
  if (!child) return;
  if (countsAsFreeSession(readTogetherGate(child.id))) {
    setSetting(keyFor(child.id), String(readTogetherSessions(child.id) + 1));
  }
}
