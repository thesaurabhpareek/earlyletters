/// <reference types="node" />
/**
 * NS-09 Let it go always finishes (BL-977): the failure count that survives a restart (R15) and the large sweep that
 * stays off the first frame (R13). Real SQLite engine, real store; fictional Asha family only.
 *
 * Mutants these tests were written to catch (each one failed a test here when it was made):
 *  R15 the count left behind when the draft row goes by finishDiscard;
 *  R15 the count left behind when a book is removed with its drafts (wipe.removeBook);
 *  R15 a count kept for a draft that is not being let go.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letItGo } from '../src/lib/capture/let-it-go.logic';
import { planLaunchSweep } from '../src/lib/capture/sweep.logic';
import { removeBook } from '../src/lib/db/repos/wipe';
import type { SqlDb } from '../src/lib/db/sql';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

let db: SqlDb;
let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
const open = () => expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId }).ok).toBe(true);
const keys = () => db.all<{ key: string }>("SELECT key FROM settings WHERE key LIKE 'discard.failures.%'").map((r) => r.key);

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  db = h.db;
  close = h.close;
  open();
});
afterEach(() => {
  store.closeStore();
  close();
});

function spokenDraft() {
  const childId = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  return store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///rec/take-1.m4a', audioDurationMs: 600, typedText: null });
}

/** One let-go whose file will not delete, as Review, Listen and the sweep run it. */
function stuckLetGo(id: string, uri: string | null): boolean {
  return letItGo(id, uri, {
    beginDiscard: store.beginDiscard,
    deleteFile: () => {
      throw new Error('permission');
    },
    finishDiscard: store.finishDiscard,
    onFailure: store.noteDiscardFailure,
  });
}

describe('[NS-09-R15] the failure count lives in settings key discard.failures.<draft id>', () => {
  it('[NS-09-R15] the failure count survives a relaunch', () => {
    const d = spokenDraft();
    expect(store.discardFailures(d.id)).toBe(0);
    expect(stuckLetGo(d.id, d.audioUri)).toBe(false);
    expect(stuckLetGo(d.id, d.audioUri)).toBe(false); // the sweep at the next launch: same draft, still marked
    expect(db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', `discard.failures.${d.id}`)?.value).toBe('2');

    store.closeStore(); // the app is killed and started again over the same file
    open();
    expect(store.getDraft(d.id)?.state).toBe('discarding');
    expect(store.discardFailures(d.id)).toBe(2); // mutant: count held in memory
  });

  it('[NS-09-R15] the count is removed with the draft when the delete finally works', () => {
    const d = spokenDraft();
    stuckLetGo(d.id, d.audioUri);
    expect(keys()).toEqual([`discard.failures.${d.id}`]);
    expect(letItGo(d.id, d.audioUri, { beginDiscard: store.beginDiscard, deleteFile: () => {}, finishDiscard: store.finishDiscard, onFailure: store.noteDiscardFailure })).toBe(true);
    expect(store.getDraft(d.id)).toBeNull();
    expect(keys()).toEqual([]); // mutant: the key left behind
  });

  it('[NS-09-R15] the count is removed when the draft row goes any other way', () => {
    const d = spokenDraft();
    stuckLetGo(d.id, d.audioUri);
    store.deleteDraft(d.id);
    expect(keys()).toEqual([]);
  });

  it('[NS-09-R15] a book removed with a stuck draft takes its count too', () => {
    const d = spokenDraft();
    stuckLetGo(d.id, d.audioUri);
    db.transaction(() => removeBook({ db, now: () => '2026-10-03T09:00:00.000Z', newId }, d.childId));
    expect(keys()).toEqual([]);
  });

  it('[NS-09-R15] a draft that is not being let go keeps no count, and a failed picture counts like a failed file', () => {
    const d = spokenDraft();
    expect(store.noteDiscardFailure(d.id)).toBe(0); // state is ready, not discarding (mutant: counts anyway)
    expect(keys()).toEqual([]);
    expect(store.noteDiscardFailure('no-such-draft')).toBe(0);
    store.beginDiscard(d.id);
    const ok = letItGo(d.id, null, { beginDiscard: () => true, deleteFile: () => {}, finishDiscard: () => false, onFailure: store.noteDiscardFailure });
    expect(ok).toBe(false);
    expect(store.discardFailures(d.id)).toBe(1);
  });

  it('[NS-09-R15] a counter that fails to write never changes the let-go result', () => {
    const r = letItGo('x', 'file:///a.m4a', {
      beginDiscard: () => true,
      deleteFile: () => {
        throw new Error('io');
      },
      finishDiscard: () => true,
      onFailure: () => {
        throw new Error('settings');
      },
    });
    expect(r).toBe(false);
  });

  it('[NS-09-R15] the count is never sent anywhere: no log line or event names the key', () => {
    const src = ['src/lib/db/repos/drafts.ts', 'src/lib/store.ts', 'src/lib/capture/let-it-go.logic.ts']
      .map((p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'))
      .join('\n');
    expect(src).not.toMatch(/(console\.\w+|track|capture\w*Event)\([^)]*[dD]iscardFail/);
  });
});

describe('[NS-09-R13] a large sweep stays off the first frame', () => {
  it('[NS-09-R13] 50 discarding drafts plan 50 finishes and nothing else, from one snapshot', () => {
    const drafts = Array.from({ length: 50 }, (_, i) => ({ id: `d${i}`, audioUri: `file:///Documents/ExpoAudio/recording-${i}.m4a`, state: 'discarding' }));
    const started = performance.now();
    const actions = planLaunchSweep({ files: [], drafts, entries: [], reported: [], activeChildId: 'asha', skipDraftIds: [] });
    expect(performance.now() - started).toBeLessThan(2000); // the plan alone; the 2 s on an SE 3 is the device row (BL-929)
    expect(actions).toEqual(drafts.map((d) => ({ kind: 'finish-discard', draftId: d.id })));
  });

  it('[NS-09-R13] launch starts the sweep after the first frame and never waits for it', () => {
    const layout = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');
    expect(layout).toMatch(/void runLaunchSweep\(\)/);
    expect(layout).not.toMatch(/await runLaunchSweep\(\)/);
  });
});
