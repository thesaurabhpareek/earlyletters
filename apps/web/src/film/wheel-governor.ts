/**
 * Keeps one hard flick from carrying the visitor through several parts of the film before they can read a line.
 * Wheels and trackpads send a stream of small scroll events; this limits how far any one event can move the page and how
 * far a short burst of them can, so the speed tops out at a pace the film can be read at. Slow and normal scrolling is
 * untouched (the limits sit well above it). Pure, so it is tested alone (test/wheel-governor.test.ts).
 */
export type Governor = (deltaY: number, nowMs: number) => number;

export function makeWheelGovernor(opts: { perEvent?: number; windowMs?: number; windowMax?: number } = {}): Governor {
  const perEvent = opts.perEvent ?? 100;
  const windowMs = opts.windowMs ?? 100;
  const windowMax = opts.windowMax ?? 200;
  const seen: { t: number; d: number }[] = [];
  return (deltaY, nowMs) => {
    while (seen.length && nowMs - seen[0].t > windowMs) seen.shift();
    const sign = deltaY < 0 ? -1 : 1;
    let d = Math.min(Math.abs(deltaY), perEvent);
    const used = seen.reduce((n, e) => n + e.d, 0);
    d = Math.max(0, Math.min(d, windowMax - used));
    seen.push({ t: nowMs, d });
    return sign * d;
  };
}
