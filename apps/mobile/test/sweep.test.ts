import { describe, expect, it } from 'vitest';
import { fileNameOf, planLaunchSweep, type SweepSnapshot } from '../src/lib/capture/sweep.logic';

const DOCS = 'file:///var/mobile/Containers/Data/Application/NEW-UUID/Documents/';
const OLD = 'file:///var/mobile/Containers/Data/Application/OLD-UUID/Documents/';

function snap(p: Partial<SweepSnapshot>): SweepSnapshot {
  return { files: [], drafts: [], entries: [], reported: [], activeChildId: 'asha', skipDraftIds: [], ...p };
}

describe('launch sweep plan', () => {
  it('[LEGAL-REQ-011] a take cut off by a kill is finalized and kept when its file has audio', () => {
    const a = planLaunchSweep(
      snap({
        files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 48000 }],
        drafts: [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }],
      }),
    );
    expect(a).toEqual([{ kind: 'finalize-recording', draftId: 'd1', uri: `${DOCS}recording-1.m4a`, bytes: 48000 }]);
  });

  it('[DATA-REQ-048] an empty file from a killed take is kept and marked unrecoverable, not deleted', () => {
    const a = planLaunchSweep(
      snap({ files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 0 }], drafts: [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }] }),
    );
    expect(a).toEqual([{ kind: 'unrecoverable-recording', draftId: 'd1', uri: `${DOCS}recording-1.m4a` }]);
  });

  it('drops only a recording row that never got a file (nothing was captured)', () => {
    const a = planLaunchSweep(snap({ drafts: [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }, { id: 'd2', audioUri: null, state: 'recording' }] }));
    expect(a).toEqual([
      { kind: 'drop-empty-recording', draftId: 'd1' },
      { kind: 'drop-empty-recording', draftId: 'd2' },
    ]);
  });

  it('never touches the draft of a live recording session', () => {
    const a = planLaunchSweep(
      snap({
        files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 10 }],
        drafts: [{ id: 'live', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }],
        skipDraftIds: ['live'],
      }),
    );
    expect(a).toEqual([]);
  });

  it('[DATA-REQ-048] after an app update moves the container, rows are rebased to the same file, never orphaned', () => {
    const a = planLaunchSweep(
      snap({
        files: [
          { uri: `${DOCS}recording-1.m4a`, bytes: 10 },
          { uri: `${DOCS}recording-2.m4a`, bytes: 10 },
        ],
        drafts: [{ id: 'd1', audioUri: `${OLD}recording-1.m4a`, state: 'ready' }],
        entries: [{ id: 'e1', audioUri: `${OLD}recording-2.m4a` }],
      }),
    );
    expect(a).toEqual([
      { kind: 'rebase-draft', draftId: 'd1', uri: `${DOCS}recording-1.m4a` },
      { kind: 'rebase-entry', entryId: 'e1', uri: `${DOCS}recording-2.m4a` },
    ]);
  });

  it('[TDD-01 3.2.4] a recording with no row is re-attached to the active book as a draft', () => {
    const a = planLaunchSweep(snap({ files: [{ uri: `${DOCS}recording-9.m4a`, bytes: 5000 }] }));
    expect(a).toEqual([{ kind: 'reattach', uri: `${DOCS}recording-9.m4a`, fileName: 'recording-9.m4a', bytes: 5000, childId: 'asha' }]);
  });

  it('[TDD-01 3.2.4] with no book yet, a stray recording is reported once, never deleted', () => {
    const first = planLaunchSweep(snap({ activeChildId: null, files: [{ uri: `${DOCS}recording-9.m4a`, bytes: 5000 }] }));
    expect(first).toEqual([{ kind: 'report', fileName: 'recording-9.m4a', bytes: 5000 }]);
    const again = planLaunchSweep(snap({ activeChildId: null, files: [{ uri: `${DOCS}recording-9.m4a`, bytes: 5000 }], reported: ['recording-9.m4a'] }));
    expect(again).toEqual([]);
  });

  it('a deleted (tombstoned) letter still owns its file', () => {
    const a = planLaunchSweep(snap({ files: [{ uri: `${DOCS}recording-3.m4a`, bytes: 1 }], entries: [{ id: 'tomb', audioUri: `${DOCS}recording-3.m4a` }] }));
    expect(a).toEqual([]);
  });

  it('[D-085] a killed take whose file plays is finalized; one that is not probed is finalized as before', () => {
    const d = [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }];
    expect(planLaunchSweep(snap({ files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 48000, playable: true }], drafts: d }))[0].kind).toBe('finalize-recording');
    expect(planLaunchSweep(snap({ files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 48000, playable: null }], drafts: d }))[0].kind).toBe('finalize-recording');
  });

  it('[D-085] a killed take that will not play is kept and marked unrecoverable, never shown as ready, never deleted', () => {
    const a = planLaunchSweep(
      snap({
        files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 48000, playable: false }],
        drafts: [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }],
      }),
    );
    expect(a).toEqual([{ kind: 'unplayable-recording', draftId: 'd1', uri: `${DOCS}recording-1.m4a`, bytes: 48000 }]);
  });

  it('[D-085] an empty file stays unrecoverable whatever the probe says, and a missing file is dropped', () => {
    const d = [{ id: 'd1', audioUri: `${DOCS}recording-1.m4a`, state: 'recording' }];
    expect(planLaunchSweep(snap({ files: [{ uri: `${DOCS}recording-1.m4a`, bytes: 0, playable: false }], drafts: d }))[0].kind).toBe('unrecoverable-recording');
    expect(planLaunchSweep(snap({ drafts: d }))).toEqual([{ kind: 'drop-empty-recording', draftId: 'd1' }]);
  });

  it('[D-085] a deleted letter whose file was already erased raises no missing-audio report', () => {
    const a = planLaunchSweep(snap({ entries: [{ id: 'tomb', audioUri: `${DOCS}erased.m4a`, deleted: true }] }));
    expect(a).toEqual([]);
  });

  it('[D-085] a live letter with a missing file is still reported; a deleted letter with its file is still left alone', () => {
    expect(planLaunchSweep(snap({ entries: [{ id: 'e1', audioUri: `${DOCS}gone.m4a`, deleted: false }] }))).toEqual([{ kind: 'missing-audio', ref: 'entry', id: 'e1' }]);
    expect(planLaunchSweep(snap({ files: [{ uri: `${DOCS}kept.m4a`, bytes: 9 }], entries: [{ id: 'tomb', audioUri: `${DOCS}kept.m4a`, deleted: true }] }))).toEqual([]);
  });

  it('[D-085] the sweep still plans no deletion of audio: an unplayable take keeps its file', () => {
    const a = planLaunchSweep(
      snap({ files: [{ uri: `${DOCS}a.m4a`, bytes: 9, playable: false }], drafts: [{ id: 'd1', audioUri: `${DOCS}a.m4a`, state: 'recording' }] }),
    );
    expect(a.every((x) => !/delete|drop|erase/.test(x.kind))).toBe(true);
  });

  it('reports a letter whose file is missing without changing it', () => {
    const a = planLaunchSweep(snap({ entries: [{ id: 'e1', audioUri: `${DOCS}gone.m4a` }], drafts: [{ id: 'd1', audioUri: `${DOCS}gone2.m4a`, state: 'ready' }] }));
    expect(a).toEqual([
      { kind: 'missing-audio', ref: 'draft', id: 'd1' },
      { kind: 'missing-audio', ref: 'entry', id: 'e1' },
    ]);
  });

  it('ignores files that are not recordings (the database, models, anything else)', () => {
    const a = planLaunchSweep(
      snap({ files: [{ uri: `${DOCS}SQLite/scribe.db`, bytes: 1 }, { uri: `${DOCS}ggml-large-v3-turbo-q5_0.bin`, bytes: 1 }, { uri: `${DOCS}notes.txt`, bytes: 1 }] }),
    );
    expect(a).toEqual([]);
  });

  it('never plans to delete audio: every action keeps the file', () => {
    const a = planLaunchSweep(
      snap({
        files: [
          { uri: `${DOCS}a.m4a`, bytes: 0 },
          { uri: `${DOCS}b.m4a`, bytes: 9 },
          { uri: `${DOCS}c.m4a`, bytes: 9 },
        ],
        drafts: [{ id: 'd1', audioUri: `${DOCS}a.m4a`, state: 'recording' }],
      }),
    );
    expect(a.map((x) => x.kind).sort()).toEqual(['reattach', 'reattach', 'unrecoverable-recording']);
  });

  it('matches by file name, decoding percent-escapes and ignoring query strings', () => {
    expect(fileNameOf(`${DOCS}my%20take.m4a?x=1`)).toBe('my take.m4a');
  });
});
