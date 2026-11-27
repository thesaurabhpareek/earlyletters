/**
 * [PER4-018, BL-1953] Say a live region's line to VoiceOver when it changes, once.
 *
 * iOS ignores accessibilityLiveRegion (it is Android's), so a file that draws a live region passes the line the region
 * shows here, with `say` calling announce() from `@/lib/a11y`. A live region reads a change, not what is there when the
 * screen first draws it, so the first line is never said: a screen that opens on a line says it the way it says its
 * arrival, or not at all. The same line again (a re-render, or a percent the caller folded into its phase) says nothing.
 * A line that goes away and comes back is a change, and is said again.
 *
 * `fromNothing: false` says only a change of a line that was already showing: for a shared component whose callers
 * already speak the moment it appears (StateScreen), so the appearance is not said twice.
 */
import { useEffect, useRef } from 'react';

export type SaidOnChangeOptions = { fromNothing?: boolean };

/** What to say when the shown line goes from `prev` to `next`: the new line, or null. Pure. */
export function lineToSay(prev: string | null, next: string | null, { fromNothing = true }: SaidOnChangeOptions = {}): string | null {
  if (!next || next === prev) return null;
  if (!prev && !fromNothing) return null;
  return next;
}

export function useSaidOnChange(line: string | null, say: (line: string) => void, { fromNothing = true }: SaidOnChangeOptions = {}): void {
  const last = useRef(line);
  useEffect(() => {
    const next = lineToSay(last.current, line, { fromNothing });
    last.current = line;
    if (next) say(next);
    // `say` is a fresh arrow on every render; only the line decides whether anything is said.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, fromNothing]);
}
