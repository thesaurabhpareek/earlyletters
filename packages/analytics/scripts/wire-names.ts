/** Writes docs/analytics/instrumentation/WIRE-NAMES.md; with --check, exits 1 if the file is stale instead. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWireNames, WIRE_NAMES_PATH } from '../src/wire-names';

const file = resolve(__dirname, '../../..', WIRE_NAMES_PATH);
const want = renderWireNames();
const have = existsSync(file) ? readFileSync(file, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (have !== want) { console.error(`${WIRE_NAMES_PATH} is stale: run npm run wire-names -w @scribe/analytics`); process.exit(1); }
  console.log(`${WIRE_NAMES_PATH} is current`);
} else {
  if (have !== want) writeFileSync(file, want);
  console.log(have === want ? `${WIRE_NAMES_PATH} already current` : `${WIRE_NAMES_PATH} updated`);
}
