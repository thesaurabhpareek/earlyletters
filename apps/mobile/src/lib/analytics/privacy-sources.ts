/**
 * Settings > Privacy shows the sensitive-data consent (LEGAL-REQ-006) but
 * does not own it: the sign-in and sync owners know whether the person is
 * signed in and what `my_policy_state` says for `sensitive-data`. They
 * register a source here; until then the row reads "Not signed in", which is
 * true while sign-in does not exist (`currentUserId()` is null).
 */
import { useEffect, useState } from 'react';

export type SensitiveDataStatus = 'on' | 'off' | 'signed_out';

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

export function useSensitiveDataStatus(): { status: SensitiveDataStatus; open?: () => void } {
  const [status, setStatus] = useState<SensitiveDataStatus>(() => source.read());
  useEffect(() => {
    const refresh = () => setStatus(source.read());
    listeners.add(refresh);
    const unsub = source.subscribe?.(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
      unsub?.();
    };
  }, []);
  return { status, open: source.open };
}
