/**
 * Drift report: which corpus items changed between two ENGINE_VERSION snapshots.
 *
 *   npx tsx packages/core/test/regression/drift-report.ts --from 8 --to 9
 *   npx tsx packages/core/test/regression/drift-report.ts --from 8 --to current
 *   SCRIBE_ENGINE_SRC=/abs/path/to/other/src npx tsx packages/core/test/regression/drift-report.ts --from 8 --to current
 *
 * `current` runs the live engine (this checkout, or SCRIBE_ENGINE_SRC) over the corpus instead of reading a file.
 * Exit code 0 always: this is a report for the engine bump PR, not a gate (the test is the gate).
 * Prints item ids, edit kinds and counts. It prints the corpus text, which is fictional by rule.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { snapshotNow, type SnapshotEntry, type SnapshotFile } from './engine-run';

const DIR = join(__dirname, 'snapshots');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function load(which: string | undefined): Promise<SnapshotFile> {
  if (which === 'current') return snapshotNow();
  const file = join(DIR, `engine-v${Number(which)}.json`);
  if (!which || !Number.isInteger(Number(which)) || !existsSync(file)) {
    throw new Error(`No snapshot "${which}". Use --from <N> --to <M|current>; snapshots in ${DIR}.`);
  }
  return JSON.parse(readFileSync(file, 'utf8')) as SnapshotFile;
}

const brief = (e: SnapshotEntry) => ({
  text: e.text,
  applied: e.applied.map((a) => `${a.type}:${a.source}:${JSON.stringify(a.original)}>${JSON.stringify(a.replacement)}`),
  rejected: e.rejected,
});

export function diffSnapshots(from: SnapshotFile, to: SnapshotFile): { changed: string[]; added: string[]; removed: string[]; report: string } {
  const ids = [...new Set([...Object.keys(from.items), ...Object.keys(to.items)])];
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const lines: string[] = [];
  for (const id of ids) {
    const a = from.items[id];
    const b = to.items[id];
    if (!a) { added.push(id); continue; }
    if (!b) { removed.push(id); continue; }
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    changed.push(id);
    const x = brief(a);
    const y = brief(b);
    lines.push(`CHANGED ${id}`);
    if (x.text !== y.text) lines.push(`  text:     ${JSON.stringify(x.text)} -> ${JSON.stringify(y.text)}`);
    if (JSON.stringify(x.applied) !== JSON.stringify(y.applied)) lines.push(`  applied:  ${x.applied.join(' | ') || '(none)'} -> ${y.applied.join(' | ') || '(none)'}`);
    if (JSON.stringify(x.rejected) !== JSON.stringify(y.rejected)) lines.push(`  rejected: ${x.rejected.join(' | ') || '(none)'} -> ${y.rejected.join(' | ') || '(none)'}`);
  }
  const head = `Drift report: engine ${from.engineVersion} -> ${to.engineVersion}. ${ids.length} items: ${changed.length} changed, ${added.length} new, ${removed.length} removed, ${ids.length - changed.length - added.length - removed.length} unchanged.`;
  return { changed, added, removed, report: [head, ...lines, ...added.map((i) => `NEW     ${i}`), ...removed.map((i) => `REMOVED ${i}`)].join('\n') };
}

if (process.argv[1] && /drift-report\.ts$/.test(process.argv[1])) {
  (async () => {
    const from = await load(arg('from'));
    const to = await load(arg('to') ?? 'current');
    console.log(diffSnapshots(from, to).report);
  })().catch((e: Error) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
