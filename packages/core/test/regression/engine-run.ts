/**
 * Runs the corpus through the real pipeline and shapes the result for snapshots.
 * Shared by the regression test and the drift-report script so both see the same thing.
 */
import { CORPUS, DICT, loadEngine, type Item, type ModelSpec } from './engine-corpus';
import type { Edit } from '../../src';

export interface SnapshotEntry {
  text: string;
  applied: Array<Pick<Edit, 'type' | 'start' | 'end' | 'original' | 'replacement' | 'source'>>;
  rejected: string[];
}
export interface SnapshotFile {
  engineVersion: number;
  items: Record<string, SnapshotEntry>;
}

function modelEdits(raw: string, specs: ModelSpec[] = []): Edit[] {
  return specs.map((m) => {
    let start: number;
    let end: number;
    if (m.at) [start, end] = m.at;
    else {
      start = -1;
      for (let i = 0; i <= (m.nth ?? 0); i++) start = raw.indexOf(m.original, start + 1);
      if (start < 0) throw new Error(`corpus bug: "${m.original}" not in "${raw}"`);
      end = start + m.original.length;
    }
    // The type is cast: hostile items propose types outside the allowlist on purpose.
    return { type: m.type as Edit['type'], start, end, original: m.original, replacement: m.replacement, source: 'model' };
  });
}

export async function runItem(item: Item) {
  const engine = await loadEngine();
  const result = engine.faithfulClean(item.raw, {
    level: item.level ?? 'clean',
    dictionary: DICT,
    locked: item.locked,
    modelEdits: modelEdits(item.raw, item.model),
  });
  const entry: SnapshotEntry = {
    text: result.text,
    applied: result.applied.map(({ type, start, end, original, replacement, source }) => ({ type, start, end, original, replacement, source })),
    rejected: result.rejected.map((x) => `${x.edit.type}:${x.reason}`),
  };
  return { result, entry };
}

export async function snapshotNow(): Promise<SnapshotFile> {
  const engine = await loadEngine();
  const items: Record<string, SnapshotEntry> = {};
  for (const item of CORPUS.filter((i) => i.added <= engine.ENGINE_VERSION)) items[item.id] = (await runItem(item)).entry;
  return { engineVersion: engine.ENGINE_VERSION, items };
}
