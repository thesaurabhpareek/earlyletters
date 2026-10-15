/**
 * The launch sweep as a truth table (TDD 01 3.2.4; DATA-REQ-048; D-085): every
 * combination of a killed take's file state and the probe's answer, the file
 * name matching rules, and the claim rules between drafts, letters and stray
 * files. Pure plan over a snapshot; nothing here touches a disk.
 */
import { describe, expect, it } from 'vitest';
import { fileNameOf, isAudioFile, planLaunchSweep, type SweepAction, type SweepFile, type SweepSnapshot } from '../src/lib/capture/sweep.logic';

const DOCS = 'file:///var/mobile/Containers/Data/Application/NEW/Documents/';
const OLD = 'file:///var/mobile/Containers/Data/Application/OLD/Documents/';
const snap = (p: Partial<SweepSnapshot>): SweepSnapshot => ({ files: [], drafts: [], entries: [], reported: [], activeChildId: 'asha', skipDraftIds: [], ...p });
const kinds = (a: SweepAction[]) => a.map((x) => x.kind);

describe('a take cut off by a kill (draft state recording)', () => {
  const take = (file: SweepFile | null, skip = false) =>
    planLaunchSweep(snap({ files: file ? [file] : [], drafts: [{ id: 'd1', audioUri: `${DOCS}take.m4a`, state: 'recording' }], skipDraftIds: skip ? ['d1'] : [] }));

  it.each<[string, SweepFile | null, SweepAction['kind'] | null]>([
    ['no file at all', null, 'drop-empty-recording'],
    ['empty file, probe says playable', { uri: `${DOCS}take.m4a`, bytes: 0, playable: true }, 'unrecoverable-recording'],
    ['empty file, probe says not playable', { uri: `${DOCS}take.m4a`, bytes: 0, playable: false }, 'unrecoverable-recording'],
    ['empty file, not probed', { uri: `${DOCS}take.m4a`, bytes: 0, playable: null }, 'unrecoverable-recording'],
    ['empty file, probe absent', { uri: `${DOCS}take.m4a`, bytes: 0 }, 'unrecoverable-recording'],
    ['bytes, probe says playable', { uri: `${DOCS}take.m4a`, bytes: 4096, playable: true }, 'finalize-recording'],
    ['bytes, probe says not playable', { uri: `${DOCS}take.m4a`, bytes: 4096, playable: false }, 'unplayable-recording'],
    ['bytes, not probed', { uri: `${DOCS}take.m4a`, bytes: 4096, playable: null }, 'finalize-recording'],
    ['bytes, probe absent', { uri: `${DOCS}take.m4a`, bytes: 4096 }, 'finalize-recording'],
    ['one byte, probe absent', { uri: `${DOCS}take.m4a`, bytes: 1 }, 'finalize-recording'],
  ])('[D-085] %s', (_name, file, expected) => {
    const a = take(file);
    expect(a).toHaveLength(1);
    expect(a[0].kind).toBe(expected);
    if (file && expected !== 'drop-empty-recording') expect(a[0]).toMatchObject({ draftId: 'd1', uri: file.uri });
  });

  it('a live recording session is never touched, whatever its file looks like', () => {
    expect(take(null, true)).toEqual([]);
    expect(take({ uri: `${DOCS}take.m4a`, bytes: 0, playable: false }, true)).toEqual([]);
    expect(take({ uri: `${DOCS}take.m4a`, bytes: 100, playable: true }, true)).toEqual([]);
  });

  it('a recording draft with no path at all is dropped unless it belongs to a live session', () => {
    expect(planLaunchSweep(snap({ drafts: [{ id: 'd1', audioUri: null, state: 'recording' }] }))).toEqual([{ kind: 'drop-empty-recording', draftId: 'd1' }]);
    expect(planLaunchSweep(snap({ drafts: [{ id: 'd1', audioUri: null, state: 'recording' }], skipDraftIds: ['d1'] }))).toEqual([]);
    expect(planLaunchSweep(snap({ drafts: [{ id: 'd1', audioUri: null, state: 'ready' }] }))).toEqual([]);
  });

  it('[DATA-REQ-048] no plan ever deletes a file: the only drop is a row that never had one', () => {
    const files: SweepFile[] = [0, 1, 4096].flatMap((bytes) => [true, false, null, undefined].map((playable) => ({ uri: `${DOCS}t${bytes}-${String(playable)}.m4a`, bytes, playable })));
    const drafts = files.map((f, i) => ({ id: `d${i}`, audioUri: f.uri, state: 'recording' }));
    const a = planLaunchSweep(snap({ files, drafts }));
    expect(a).toHaveLength(files.length);
    expect(a.every((x) => !/delete|erase|remove|drop/.test(x.kind))).toBe(true);
  });
});

describe('closed drafts and letters', () => {
  it('a ready draft: missing file is reported, a moved container is rebased, the same path is left alone', () => {
    const draft = { id: 'd1', audioUri: `${OLD}a.m4a`, state: 'ready' };
    expect(planLaunchSweep(snap({ drafts: [draft] }))).toEqual([{ kind: 'missing-audio', ref: 'draft', id: 'd1' }]);
    expect(planLaunchSweep(snap({ drafts: [draft], files: [{ uri: `${DOCS}a.m4a`, bytes: 10 }] }))).toEqual([{ kind: 'rebase-draft', draftId: 'd1', uri: `${DOCS}a.m4a` }]);
    expect(planLaunchSweep(snap({ drafts: [draft], files: [{ uri: `${OLD}a.m4a`, bytes: 10 }] }))).toEqual([]);
  });

  it('an unrecoverable draft is treated like a ready one: kept, rebased, never finalized', () => {
    const draft = { id: 'd1', audioUri: `${OLD}a.m4a`, state: 'unrecoverable' };
    expect(planLaunchSweep(snap({ drafts: [draft], files: [{ uri: `${DOCS}a.m4a`, bytes: 0 }] }))).toEqual([{ kind: 'rebase-draft', draftId: 'd1', uri: `${DOCS}a.m4a` }]);
  });

  it('[D-085] a letter: live and missing is reported; deleted and missing is expected; present is rebased or left', () => {
    const live = { id: 'e1', audioUri: `${OLD}l.m4a` };
    const gone = { id: 'e2', audioUri: `${OLD}g.m4a`, deleted: true };
    expect(planLaunchSweep(snap({ entries: [live, gone] }))).toEqual([{ kind: 'missing-audio', ref: 'entry', id: 'e1' }]);
    expect(planLaunchSweep(snap({ entries: [gone], files: [{ uri: `${DOCS}g.m4a`, bytes: 5 }] }))).toEqual([{ kind: 'rebase-entry', entryId: 'e2', uri: `${DOCS}g.m4a` }]);
    expect(planLaunchSweep(snap({ entries: [live], files: [{ uri: `${OLD}l.m4a`, bytes: 5 }] }))).toEqual([]);
  });

  it('a letter without audio (typed) claims nothing and raises nothing', () => {
    expect(planLaunchSweep(snap({ entries: [{ id: 'e1', audioUri: null }], files: [{ uri: `${DOCS}x.m4a`, bytes: 5 }] }))).toEqual([
      { kind: 'reattach', uri: `${DOCS}x.m4a`, fileName: 'x.m4a', bytes: 5, childId: 'asha' },
    ]);
  });
});

describe('stray files', () => {
  it('[TDD-01 3.2.4] a file nobody claims is re-attached to the active book, or reported once when there is no book', () => {
    const files = [{ uri: `${DOCS}stray.m4a`, bytes: 777 }];
    expect(planLaunchSweep(snap({ files }))).toEqual([{ kind: 'reattach', uri: `${DOCS}stray.m4a`, fileName: 'stray.m4a', bytes: 777, childId: 'asha' }]);
    expect(planLaunchSweep(snap({ files, activeChildId: null }))).toEqual([{ kind: 'report', fileName: 'stray.m4a', bytes: 777 }]);
    expect(planLaunchSweep(snap({ files, activeChildId: null, reported: ['stray.m4a'] }))).toEqual([]);
  });

  it('a file claimed by a draft or a letter of any state is never a stray, even from another container', () => {
    const files = [{ uri: `${DOCS}a.m4a`, bytes: 1 }, { uri: `${DOCS}b.m4a`, bytes: 1 }];
    const a = planLaunchSweep(snap({ files, drafts: [{ id: 'd', audioUri: `${OLD}a.m4a`, state: 'recording' }], entries: [{ id: 'e', audioUri: `${OLD}b.m4a`, deleted: true }], skipDraftIds: ['d'] }));
    expect(kinds(a)).toEqual(['rebase-entry']);
  });

  it('only recordings count as files: the database, a model and a sidecar are ignored, in any letter case', () => {
    const files = ['scribe.db', 'ggml-small.bin', 'listen.json', 'take.M4A', 'take2.WAV', 'clip.caf', 'note.txt'].map((n) => ({ uri: `${DOCS}${n}`, bytes: 1 }));
    expect(planLaunchSweep(snap({ files })).map((x) => (x as { fileName: string }).fileName)).toEqual(['take.M4A', 'take2.WAV', 'clip.caf']);
  });
});

describe('file names', () => {
  it.each([
    [`${DOCS}recording-1.m4a`, 'recording-1.m4a'],
    [`${DOCS}recording%20one.m4a`, 'recording one.m4a'],
    [`${DOCS}take.m4a?x=1#frag`, 'take.m4a'],
    [`${DOCS}take.m4a/`, 'take.m4a'],
    ['take.m4a', 'take.m4a'],
    [`${DOCS}bad%E0%A4.m4a`, 'bad%E0%A4.m4a'],
    ['', ''],
  ])('fileNameOf(%s) is %s', (uri, name) => {
    expect(fileNameOf(uri)).toBe(name);
  });

  it.each([
    ['a.m4a', true],
    ['a.M4A', true],
    ['a.mp4', true],
    ['a.aac', true],
    ['a.caf', true],
    ['a.wav', true],
    ['a.3gp', true],
    ['a.webm', true],
    ['a.m4a.bak', false],
    ['a.bin', false],
    ['a.json', false],
    ['m4a', false],
    ['a.m4a?x', true],
  ])('isAudioFile(%s) is %s', (name, yes) => {
    expect(isAudioFile(`${DOCS}${name}`)).toBe(yes);
  });

  it('two files with the same name in different folders are one recording: the later listing wins, nothing is dropped', () => {
    const a = planLaunchSweep(snap({ files: [{ uri: `${OLD}same.m4a`, bytes: 1 }, { uri: `${DOCS}same.m4a`, bytes: 2 }] }));
    expect(a).toEqual([{ kind: 'reattach', uri: `${DOCS}same.m4a`, fileName: 'same.m4a', bytes: 2, childId: 'asha' }]);
  });
});
