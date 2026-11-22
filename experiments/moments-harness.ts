/**
 * Moments real-library harness (BL-1449). Local only. Reads two files, prints counts to the screen,
 * writes nothing.   npm run moments-harness -w @scribe/experiments -- <export.json> <junk-days.txt>
 * See README section 9.
 */
import { readFileSync } from 'node:fs';
import { parseExport, parseJunk, render, runGrid } from './moments-harness-lib';

export function main(argv: readonly string[], read: (p: string) => string, out: (s: string) => void): number {
  if (argv.length !== 2) {
    out('usage: moments-harness <export.json> <junk-days.txt>');
    return 1;
  }
  try {
    out(render(runGrid(parseExport(read(argv[0])), parseJunk(read(argv[1])))));
    return 0;
  } catch (e) {
    // The message names the problem, never a row, a date or a place.
    out(`failed: ${e instanceof Error ? e.message.split('\n')[0].slice(0, 120) : 'unknown'}`);
    return 1;
  }
}

if (process.argv[1] && /moments-harness\.ts$/.test(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2), (p) => readFileSync(p, 'utf8'), (s) => console.log(s));
}
