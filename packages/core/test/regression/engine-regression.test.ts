/**
 * Engine regression (RB-20): the fixed Asha corpus (engine-corpus.ts) through
 * the real faithfulClean, checked three ways:
 *  1. each item against the expectation written from the constitution;
 *  2. invariants that hold for every item whatever the expectations say (only
 *     allowlisted edit types, no word that was not said, no negation or number
 *     gained or lost, dictionary names kept);
 *  3. the whole output against snapshots/engine-v<ENGINE_VERSION>.json, so a
 *     change in output without an ENGINE_VERSION bump and a dated comment fails.
 *
 * To record after a deliberate bump:
 *   SCRIBE_REGRESSION_RECORD=1 npx vitest run test/regression/engine-regression.test.ts
 * Never re-record an existing version's file; bump ENGINE_VERSION instead.
 *
 * SCRIBE_ENGINE_SRC=<abs path to a src folder> runs the same checks against another copy of the engine.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CORPUS, DICT, EDIT_TYPES, ENGINE_SRC, loadEngine } from './engine-corpus';
import { runItem, snapshotNow, type SnapshotFile } from './engine-run';

const engine = await loadEngine();
const V = engine.ENGINE_VERSION;
const SNAP_DIR = join(__dirname, 'snapshots');
const FILE = join(SNAP_DIR, `engine-v${V}.json`);
const PIPELINE_SRC = join(ENGINE_SRC || join(__dirname, '../../src'), 'pipeline.ts');
const ITEMS = CORPUS.filter((i) => i.added <= V);

if (process.env.SCRIBE_REGRESSION_RECORD === '1') {
  if (existsSync(FILE)) throw new Error(`${FILE} exists. Bump ENGINE_VERSION instead of re-recording a released version.`);
  writeFileSync(FILE, `${JSON.stringify(await snapshotNow(), null, 2)}\n`);
}

/** Independent of src/meaning.ts on purpose: the test must not share a bug with the code it checks. */
const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/’/g, "'");
const words = (s: string) => norm(s).split(/[^\p{L}\p{M}\p{N}']+/u).filter(Boolean);
const NEGATIONS = new Set(['no', 'not', 'never', 'cannot', 'nothing', 'nobody', 'none', 'neither', 'nor', "didn't", "don't", "doesn't", "isn't", "wasn't", "can't", "won't", "couldn't", "wouldn't"]);
const NUMBERS = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'once', 'twice', 'first', 'second', 'third']);
const isNumberWord = (w: string) => /\d/.test(w) || NUMBERS.has(w);
const count = (ws: string[], pick: (w: string) => boolean) => {
  const m = new Map<string, number>();
  for (const w of ws.filter(pick)) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
};

describe('engine regression corpus: the corpus itself', () => {
  it('has an item for every EditType, and the type list matches src/types.ts (a new type needs a human here)', () => {
    const typesSrc = readFileSync(join(ENGINE_SRC || join(__dirname, '../../src'), 'types.ts'), 'utf8');
    const block = /export type EditType =([\s\S]*?)\n\n/.exec(typesSrc)?.[1] ?? '';
    const declared = [...block.matchAll(/^\s*\| '([a-z_]+)'/gm)].map((m) => m[1]).sort();
    expect(declared).toEqual([...EDIT_TYPES].sort());
    const covered = new Set(ITEMS.flatMap((i) => i.expect.applied.map((a) => a.split(':')[0])));
    for (const t of EDIT_TYPES) expect(covered.has(t), `no corpus item applies a ${t} edit`).toBe(true);
  });

  it('has adversarial items for negation, numbers, added content, corrections and names, with unique ids', () => {
    expect(new Set(CORPUS.map((i) => i.id)).size).toBe(CORPUS.length);
    for (const prefix of ['neg-', 'num-', 'add-', 'fix-', 'name-']) {
      expect(ITEMS.filter((i) => i.category === 'adversarial' && i.id.startsWith(prefix)).length, prefix).toBeGreaterThanOrEqual(4);
    }
  });

  it('every adversarial model edit is expected to be refused: nothing applied, something rejected', () => {
    for (const i of ITEMS.filter((x) => x.category === 'adversarial' && x.model)) {
      expect(i.expect.applied, i.id).toEqual([]);
      expect(i.expect.rejected.length, i.id).toBeGreaterThan(0);
      expect(i.expect.text, i.id).toBe(i.raw);
    }
  });

  it('uses only the fictional family and no content-rule characters', () => {
    const bad = /[—–‘’“”…]|\p{Extended_Pictographic}/u;
    for (const i of CORPUS) expect(bad.test(JSON.stringify(i)), i.id).toBe(false);
  });
});

describe('engine regression corpus: each item does what the constitution says', () => {
  it.each(ITEMS.map((i) => [i.id, i] as const))('%s', async (_id, item) => {
    const { entry } = await runItem(item);
    expect({ text: entry.text, applied: entry.applied.map((e) => `${e.type}:${e.source}`), rejected: entry.rejected }).toEqual(item.expect);
  });
});

describe('engine regression corpus: invariants that hold for every item', () => {
  it('no edit outside the EditType set is ever applied', async () => {
    for (const item of ITEMS) {
      const { result } = await runItem(item);
      for (const e of result.applied) expect(EDIT_TYPES as readonly string[], `${item.id}: ${e.type}`).toContain(e.type);
    }
  });

  it('the final text never adds a word that was not said (names and agreement are the only replacements)', async () => {
    for (const item of ITEMS) {
      const { result } = await runItem(item);
      const allowed = new Set(words(item.raw));
      for (const e of result.applied) if (e.type === 'stt_fix' || e.type === 'agreement') for (const w of words(e.replacement)) allowed.add(w);
      // stt_fix may only write a dictionary term, whatever the engine says.
      for (const e of result.applied.filter((x) => x.type === 'stt_fix')) {
        expect(DICT.map((d) => norm(d.term)), `${item.id}: stt_fix wrote ${e.replacement}`).toContain(norm(e.replacement));
      }
      for (const w of words(result.text)) expect(allowed.has(w), `${item.id}: "${w}" was not said`).toBe(true);
    }
  });

  it('no negation or number is added or lost: the final text keeps what was said at least once, never more than said', async () => {
    for (const item of ITEMS) {
      const { result } = await runItem(item);
      for (const pick of [(w: string) => NEGATIONS.has(w), isNumberWord]) {
        const raw = count(words(item.raw), pick);
        const fin = count(words(result.text), pick);
        for (const [w, n] of raw) {
          expect(fin.get(w) ?? 0, `${item.id}: "${w}" lost`).toBeGreaterThanOrEqual(1);
          expect(fin.get(w) ?? 0, `${item.id}: "${w}" gained`).toBeLessThanOrEqual(n);
        }
        for (const w of fin.keys()) expect(raw.has(w), `${item.id}: "${w}" gained`).toBe(true);
      }
    }
  });

  it('a dictionary name spelled right in the raw text is still spelled right in the final text', async () => {
    for (const item of ITEMS) {
      const { result } = await runItem(item);
      for (const d of DICT) {
        const inRaw = item.raw.split(d.term).length - 1;
        if (inRaw > 0) expect(result.text.split(d.term).length - 1, `${item.id}: ${d.term}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every applied edit points at exactly the raw text it replaces (raw is only read, never written)', async () => {
    for (const item of ITEMS) {
      const { result } = await runItem(item);
      for (const e of result.applied) expect(item.raw.slice(e.start, e.end), `${item.id}: edit offsets`).toBe(e.original);
    }
  });
});

describe('engine regression corpus: the output is pinned to ENGINE_VERSION', () => {
  it('pipeline.ts has a dated changelog comment for the current ENGINE_VERSION', () => {
    const src = readFileSync(PIPELINE_SRC, 'utf8');
    expect(src, `ENGINE_VERSION ${V} needs a line "// ${V} (YYYY-MM-DD): why" in pipeline.ts`).toMatch(new RegExp(`^// ${V} \\(\\d{4}-\\d{2}-\\d{2}\\):`, 'm'));
  });

  it('has a snapshot for the current ENGINE_VERSION and no snapshot for a newer one', () => {
    expect(existsSync(FILE), `No snapshot for ENGINE_VERSION ${V}. Record one (see the header of this file).`).toBe(true);
    const versions = readdirSync(SNAP_DIR).map((f) => /^engine-v(\d+)\.json$/.exec(f)?.[1]).filter((v): v is string => !!v).map(Number);
    expect(Math.max(...versions)).toBe(V);
  });

  it('every item matches its snapshot; a change needs an ENGINE_VERSION bump with a dated comment', async () => {
    const snap = JSON.parse(readFileSync(FILE, 'utf8')) as SnapshotFile;
    expect(snap.engineVersion).toBe(V);
    expect(Object.keys(snap.items).sort()).toEqual(ITEMS.map((i) => i.id).sort());
    const now = await snapshotNow();
    const changed = Object.keys(now.items).filter((id) => JSON.stringify(now.items[id]) !== JSON.stringify(snap.items[id]));
    expect(
      changed,
      `Engine output changed for ${changed.length} item(s) without an ENGINE_VERSION bump. Bump it in pipeline.ts with a dated comment, record a new snapshot, and run: npx tsx packages/core/test/regression/drift-report.ts --from ${V} --to current`,
    ).toEqual([]);
  });

  it('older snapshots are frozen records: each is for its own version and keeps the same item ids it recorded', () => {
    for (const f of readdirSync(SNAP_DIR).filter((x) => /^engine-v\d+\.json$/.test(x))) {
      const snap = JSON.parse(readFileSync(join(SNAP_DIR, f), 'utf8')) as SnapshotFile;
      expect(`engine-v${snap.engineVersion}.json`).toBe(f);
      for (const id of Object.keys(snap.items)) expect(CORPUS.some((i) => i.id === id), `${f}: item ${id} was removed from the corpus`).toBe(true);
    }
  });
});
