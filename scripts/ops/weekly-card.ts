/**
 * The weekly request clock (BL-2102, FR-BKO-09): the data-request part of the Monday card.
 * docs/ops/runbooks/data-requests-by-email.md section 11 says when and how to run it.
 *
 *   node scripts/ops/weekly-card.ts --log <path to the request log CSV> [--today YYYY-MM-DD]
 *
 * Prints tickets, kinds, days and dates only. Exit 0 with nothing urgent, 1 when a request is at day 35 or later,
 * 2 when the log cannot be read or holds a field or value the runbook does not allow.
 */
import { readFileSync } from 'node:fs';
import { argv, exit, guardCrashes, parseArgs, print, printError } from './lib/cli.ts';
import { buildCard, iso, LogError } from './lib/weekly-card.ts';

const STOPPED = 'weekly card: stopped before it read the whole log; nothing below is the card';
guardCrashes(STOPPED, 2);
const { flags } = parseArgs(argv());
const log = flags.log;
if (typeof log !== 'string') {
  printError('usage: node scripts/ops/weekly-card.ts --log <request log CSV> [--today YYYY-MM-DD]');
  exit(2);
}
const today = typeof flags.today === 'string' ? flags.today : iso(Date.now() - (Date.now() % 86_400_000));
try {
  const card = buildCard(readFileSync(log as string, 'utf8'), today);
  for (const line of card.lines) print(line);
  exit(card.rows.some((r) => r.urgent) ? 1 : 0);
} catch (e) {
  printError(e instanceof LogError ? `weekly card: ${e.message}` : STOPPED);
  exit(2);
}
