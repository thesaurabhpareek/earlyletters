import { useEffect, useState } from 'react';
import { announce } from '@/lib/a11y';
import type { AuthState } from './machine.logic';
import { isRevocationWait, REVOCATION_WAIT_LINE_DELAY_MS } from './revocation-wait.logic';

/** The line to show, or null: null outside the revocation wait and before the delay has passed. Said once to VoiceOver. */
export function useRevocationWaitLine(state: AuthState, line: string, delayMs: number = REVOCATION_WAIT_LINE_DELAY_MS): string | null {
  const waiting = isRevocationWait(state);
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!waiting) {
      setLate(false);
      return;
    }
    const t = setTimeout(() => {
      setLate(true);
      announce(line);
    }, delayMs);
    return () => clearTimeout(t);
  }, [waiting, line, delayMs]);
  return waiting && late ? line : null;
}
