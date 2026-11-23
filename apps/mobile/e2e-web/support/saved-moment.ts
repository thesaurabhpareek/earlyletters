/**
 * BL-1646 (BL-480 point 4): a step that records the saved moment waits until the chip and the confirmation line are
 * on screen, so the captured text and screenshot hold them. The recorder leaves out text that is not opaque, and the
 * chip fades in 250 ms after the save, so a fixed short settle can capture the card alone. Pure, so a Node test can
 * drive it with a fake reader and a fake clock. A need is a whole line (string) or a pattern. Messages name the needs,
 * never the lines read, because those hold the letter.
 */
export type Need = string | RegExp;

export interface WaitClock {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

/** The needs no visible line satisfies. A string must equal a whole line (trimmed). */
export function missingNeeds(lines: readonly string[], needs: readonly Need[]): Need[] {
  return needs.filter((n) => !lines.some((l) => (typeof n === 'string' ? l.trim() === n : n.test(l))));
}

/**
 * Reads the visible lines until every need shows, and returns that read. Throws when `timeoutMs` passes first. With no
 * needs it does not read at all and returns an empty list: the caller reads once, as it always did.
 */
export async function waitForNeeds(
  read: () => Promise<string[]>,
  needs: readonly Need[],
  opts: WaitClock & { timeoutMs: number; everyMs: number },
): Promise<string[]> {
  if (needs.length === 0) return [];
  const until = opts.now() + opts.timeoutMs;
  for (;;) {
    const lines = await read();
    const missing = missingNeeds(lines, needs);
    if (missing.length === 0) return lines;
    if (opts.now() >= until) {
      throw new Error(`the saved moment never showed in ${opts.timeoutMs} ms; missing: ${missing.map(String).join(', ')} (BL-1646)`);
    }
    await opts.sleep(opts.everyMs);
  }
}
