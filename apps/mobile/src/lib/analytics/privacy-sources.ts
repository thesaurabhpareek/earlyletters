/**
 * Settings > Privacy shows the sensitive-data consent (LEGAL-REQ-006) but
 * does not own it: the sign-in and sync owners know whether the person is
 * signed in and what `my_policy_state` says for `sensitive-data`. They
 * register a source here. The session provider registers one (lib/auth/
 * sensitive-row.ts, BL-485 option (b)): it reads and subscribes only, so a
 * signed-in person sees On, Off or Waiting for a connection, and a signed-out
 * phone reads "Not signed in". It registers no `open`: there is still no
 * control that withdraws the consent (BL-485 option (a)), so the row is not
 * pressable. With no source registered the row reads "Not signed in".
 */
import { useEffect, useState } from 'react';
import { authCopy } from '@/lib/auth/copy';
import { copy } from '@/lib/copy';

/**
 * 'unknown': signed in, but the server's answer has not been read (offline at launch, a failed read, or the read
 * still running). The row says so with the Account row's own words; it never claims On or Off.
 */
export type SensitiveDataStatus = 'on' | 'off' | 'unknown' | 'signed_out';

interface Source {
  read: () => SensitiveDataStatus;
  subscribe?: (listener: () => void) => () => void;
  /** Opens the owner's flow to change it (turn on, or turn off with the deletion offer). */
  open?: () => void;
}

let source: Source = { read: () => 'signed_out' };
const listeners = new Set<() => void>();

export function setSensitiveDataSource(next: Source): void {
  source = next;
  listeners.forEach((l) => l());
}

/** The value beside "Sync and family sharing". Every status has words (the record is exhaustive); no new words for 'unknown'. */
export function sensitiveStatusWords(status: SensitiveDataStatus): string {
  const p = copy.settings.privacy;
  const words: Record<SensitiveDataStatus, string> = {
    on: p.sensitiveOn,
    off: p.sensitiveOff,
    unknown: authCopy.account.sync.unknown,
    signed_out: p.sensitiveSignedOut,
  };
  return words[status];
}

export function useSensitiveDataStatus(): { status: SensitiveDataStatus; open?: () => void } {
  // Status and open live together in state: a source that registers an `open` later with the same status still
  // re-renders a mounted row (BL-504). Reading `source.open` at render would miss it.
  const snapshot = (): { status: SensitiveDataStatus; open?: () => void } => ({ status: source.read(), open: source.open });
  const [state, setState] = useState(snapshot);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const sync = () =>
      setState((prev) => {
        const next = snapshot();
        return prev.status === next.status && prev.open === next.open ? prev : next;
      });
    // Runs now and again whenever the owner registers a source, so a screen that mounted first (a deep link straight to
    // Privacy, a provider remount) still follows the new source instead of staying on the one it started with.
    const attach = () => {
      unsub?.();
      unsub = source.subscribe?.(sync);
      sync();
    };
    listeners.add(attach);
    attach();
    return () => {
      listeners.delete(attach);
      unsub?.();
    };
  }, []);
  return state;
}
