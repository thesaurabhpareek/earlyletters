/// <reference types="node" />
/** Drafts, children, settings, orphan audio, change events and ids (MOB-04, MOB-05). Fictional Asha family only. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { children, createChangeBus, drafts, orphans, settings, uuidv7From, UUIDV7_RE } from '../src/lib/db/repos';
import { fixture, seedChild, type Fixture } from './helpers/store-fixture';

let f: Fixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => f.close());

describe('drafts', () => {
  const recording = () => {
    const id = f.ctx.newId();
    drafts.insert(f.ctx, id, { childId: 'child-asha', captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/recording-1.m4a', audioDurationMs: 0, state: 'recording' });
    return id;
  };

  it('[DATA-REQ-048] the raw transcript of a draft is set once', () => {
    const id = recording();
    expect(drafts.setTranscriptOnce(f.ctx, id, 'Asha you sang')).toBe(true);
    expect(drafts.setTranscriptOnce(f.ctx, id, 'a second hearing')).toBe(false);
    expect(drafts.get(f.ctx, id)!.rawTranscript).toBe('Asha you sang');
  });

  it('a take still recording is not listed; progress is written only while recording', () => {
    const id = recording();
    expect(drafts.listForChild(f.ctx, 'child-asha')).toEqual([]);
    drafts.setRecordingProgress(f.ctx, id, 4400.6);
    expect(drafts.get(f.ctx, id)!.audioDurationMs).toBe(4401);
    drafts.finalizeAudio(f.ctx, id, { sha256: 'a'.repeat(64), bytes: 48000, state: 'ready' });
    drafts.setRecordingProgress(f.ctx, id, 99999);
    const d = drafts.get(f.ctx, id)!;
    expect(d).toMatchObject({ state: 'ready', audioDurationMs: 4401, audioSha256: 'a'.repeat(64), audioUri: 'file:///Documents/recording-1.m4a', recoveredAt: null });
    expect(drafts.listForChild(f.ctx, 'child-asha').map((x) => x.id)).toEqual([id]);
  });

  it('finalizing a recovered take stamps recovered_at; an unknown state reads as ready', () => {
    const id = recording();
    drafts.finalizeAudio(f.ctx, id, { durationMs: 12000, sha256: null, bytes: 0, state: 'unrecoverable', recovered: true });
    expect(drafts.get(f.ctx, id)).toMatchObject({ state: 'unrecoverable', recoveredAt: '2026-10-03T09:00:00.000Z', audioDurationMs: 12000 });
    f.db.run("UPDATE drafts SET state = 'weird' WHERE id = ?", id);
    expect(drafts.get(f.ctx, id)!.state).toBe('ready');
  });

  it('removing a draft removes the row only', () => {
    const id = recording();
    drafts.remove(f.ctx, id);
    expect(drafts.get(f.ctx, id)).toBeNull();
  });
});

describe('children', () => {
  it('lists visible books oldest first, hides and unhides', () => {
    children.insert(f.ctx, 'c1', { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' });
    f.tick();
    children.insert(f.ctx, 'c2', { name: 'Ravi', birthday: null, dueDate: '2027-01-10', signsAs: 'Amma' });
    expect(children.listVisible(f.ctx).map((c) => c.id)).toEqual(['c1', 'c2']);
    children.hide(f.ctx, 'c1');
    expect(children.listVisible(f.ctx).map((c) => c.id)).toEqual(['c2']);
    expect(children.listHidden(f.ctx).map((c) => c.id)).toEqual(['c1']);
    children.unhide(f.ctx, 'c1');
    expect(children.listHidden(f.ctx)).toEqual([]);
  });

  it('update applies a patch and reports a missing child', () => {
    children.insert(f.ctx, 'c1', { name: 'Asha', birthday: null, dueDate: '2026-11-01', signsAs: 'Mama' });
    expect(children.update(f.ctx, 'c1', { birthday: '2026-10-30', dueDate: null, familyCanRead: true })).toBe(true);
    expect(children.get(f.ctx, 'c1')).toEqual({ id: 'c1', name: 'Asha', birthday: '2026-10-30', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: true });
    expect(children.update(f.ctx, 'nope', { name: 'x' })).toBe(false);
  });
});

describe('settings and orphan audio', () => {
  it('settings round-trip and delete', () => {
    settings.setSetting(f.ctx, 'appearance', 'dark');
    settings.setSetting(f.ctx, 'appearance', 'light');
    expect(settings.getSetting(f.ctx, 'appearance')).toBe('light');
    settings.deleteSetting(f.ctx, 'appearance');
    expect(settings.getSetting(f.ctx, 'appearance')).toBeNull();
  });

  it('a stray recording is reported once and re-attached as a draft in one transaction', () => {
    seedChild(f.db);
    orphans.report(f.ctx, 'recording-7.m4a', 1000);
    f.tick();
    orphans.report(f.ctx, 'recording-7.m4a', 2000);
    expect(orphans.list(f.ctx)).toEqual([{ fileName: 'recording-7.m4a', bytes: 1000, foundAt: '2026-10-03T09:00:00.000Z' }]);
    const d = orphans.reattach(f.ctx, 'recording-7.m4a', { childId: 'child-asha', audioUri: 'file:///Documents/recording-7.m4a', createdAt: '2026-10-02T20:00:00.000Z', sha256: null, bytes: 1000, state: 'ready' });
    expect(d).toMatchObject({ childId: 'child-asha', captureMode: 'spoken', createdAt: '2026-10-02T20:00:00.000Z', recoveredAt: '2026-10-03T09:01:00.000Z' });
    expect(d.id.startsWith(Date.parse('2026-10-02T20:00:00.000Z').toString(16).padStart(12, '0').slice(0, 8))).toBe(true);
    expect(orphans.list(f.ctx)).toEqual([]);
  });

  it('a failed re-attach keeps the report row and adds no draft', () => {
    orphans.report(f.ctx, 'recording-8.m4a', 1000);
    f.failNextRun(/DELETE FROM orphan_audio/);
    expect(() => orphans.reattach(f.ctx, 'recording-8.m4a', { childId: 'child-asha', audioUri: 'file:///Documents/recording-8.m4a', createdAt: 'not a date', sha256: null, bytes: 1000, state: 'ready' })).toThrow('injected_failure');
    expect(orphans.list(f.ctx)).toHaveLength(1);
    expect(drafts.audioRows(f.ctx)).toEqual([]);
  });
});

describe('change bus (MOB-05)', () => {
  it('table-scoped listeners fire only for their tables; plain subscribers fire for every write', () => {
    const bus = createChangeBus();
    const any = vi.fn();
    const onEntries = vi.fn();
    bus.subscribe(any);
    bus.subscribeTo('entries', onEntries);
    bus.emit('settings');
    expect(any).toHaveBeenCalledTimes(1);
    expect(onEntries).not.toHaveBeenCalled();
    bus.emit('entries', 'drafts');
    expect(onEntries).toHaveBeenCalledWith(['entries', 'drafts']);
    expect(any).toHaveBeenCalledTimes(2);
    bus.emit();
    expect(any).toHaveBeenCalledTimes(2);
  });

  it('unsubscribing during a notification is safe and stops later calls', () => {
    const bus = createChangeBus();
    const second = vi.fn();
    let offSecond = () => {};
    bus.subscribe(() => offSecond());
    offSecond = bus.subscribe(second);
    bus.emit('entries');
    bus.emit('entries');
    expect(second).not.toHaveBeenCalled();
  });
});

describe('uuidv7From', () => {
  it('produces a valid, time-ordered UUIDv7', () => {
    const r = new Uint8Array(16).fill(0xff);
    const a = uuidv7From(r, Date.parse('2026-10-03T09:00:00.000Z'));
    const b = uuidv7From(new Uint8Array(16), Date.parse('2026-10-03T09:00:00.001Z'));
    expect(a).toMatch(UUIDV7_RE);
    expect(b).toMatch(UUIDV7_RE);
    expect(a < b).toBe(true);
    expect(() => uuidv7From(new Uint8Array(8), 0)).toThrow('uuidv7_needs_16_bytes');
  });
});
