/**
 * Moments real-library harness (BL-1449). Local only. Reads two files, prints counts to the screen,
 * writes nothing.   npm run moments-harness -w @scribe/experiments -- <export.json> <junk-days.txt>
 * See README section 9.
 */
import { readFileSync } from 'node:fs';
import { HarnessError, parseExport, parseJunk, render, runGrid } from './moments-harness-lib';

export function main(argv: readonly string[], read: (p: string) => string, out: (s: string) => void): number {
  if (argv.length !== 2) {
    out('usage: moments-harness <export.json> <junk-days.txt>');
    return 1;
  }
  // A read error from the system quotes the path, and a path can name a person or a place: print fixed words only.
  const safeRead = (p: string): string => {
    try {
      return read(p);
    } catch {
      throw new HarnessError('cannot read an input file (missing or unreadable)');
    }
  };
  try {
    out(render(runGrid(parseExport(safeRead(argv[0])), parseJunk(safeRead(argv[1])))));
    return 0;
  } catch (e) {
    // Only our own fixed messages are printed; anything else is reduced to fixed words. Never a row, a date, a place or a path.
    out(`failed: ${e instanceof HarnessError ? e.message : 'unexpected input; nothing was read out'}`);
    return 1;
  }
}

if (process.argv[1] && /moments-harness\.ts$/.test(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2), (p) => readFileSync(p, 'utf8'), (s) => console.log(s));
}
