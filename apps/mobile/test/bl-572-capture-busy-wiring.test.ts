/// <reference types="node" />
/**
 * BL-572: the capture layer itself says when a take is open (capture/busy.ts), so the transcription queue never
 * depends on the Listen screen. The real audio-mode.ts and recorder.ts run here with expo modules stood in.
 * A take opens when the session switches to recording (before the recorder is prepared) and closes only when the
 * session is idle and the take is kept (finalizeTake has saved it) or discarded (abandonTake). Fictional Asha family.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ drafts: new Map<string, any>(), n: 0 }));

vi.mock('expo-audio', () => ({ setAudioModeAsync: async () => {}, AudioQuality: { HIGH: 96 }, IOSOutputFormat: { MPEG4AAC: 'aac ' } }));
vi.mock('expo-crypto', () => ({ digest: async () => new ArrayBuffer(32), CryptoDigestAlgorithm: { SHA256: 'SHA-256' } }));
vi.mock('expo-file-system', () => ({
  File: class {
    exists = false;
    size = 0;
  },
}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../src/lib/store', () => ({
  createRecordingDraft: (i: { childId: string; audioUri: string | null }) => {
    const d = { id: `draft-${++fake.n}`, childId: i.childId, audioUri: i.audioUri };
    fake.drafts.set(d.id, d);
    return d;
  },
  finalizeDraftAudio: () => {},
  getDraft: (id: string) => fake.drafts.get(id) ?? null,
  setDraftAudioHash: () => {},
}));

function fakeRecorder() {
  return {
    uri: 'file:///rec/take.aac',
    prepareToRecordAsync: async () => {},
    record: () => {},
    stop: async () => {},
    getStatus: () => ({ durationMillis: 1000 }),
  } as any;
}

async function load() {
  vi.resetModules();
  const busy = await import('../src/lib/capture/busy');
  const audio = await import('../src/lib/audio-mode');
  const rec = await import('../src/lib/capture/recorder');
  const seen: boolean[] = [];
  busy.onCaptureBusy((b) => seen.push(b));
  return { busy, audio, rec, seen };
}

beforeEach(() => {
  fake.drafts.clear();
});

describe('[BL-572] the capture layer reports an open take', () => {
  it('opens with the recording session, stays open while the take is live, closes once it is kept', async () => {
    const { busy, audio, rec, seen } = await load();
    expect(busy.captureBusy()).toBe(false);
    await audio.setAudioMode('recording'); // Listen, before beginTake
    expect(busy.captureBusy()).toBe(true);
    const recorder = fakeRecorder();
    const draft = await rec.beginTake(recorder, { childId: 'child-asha', promptKey: null });
    expect(busy.captureBusy()).toBe(true);
    await rec.finalizeTake(recorder, draft.id, 'user', 1000);
    await new Promise((r) => setTimeout(r, 0));
    expect(busy.captureBusy()).toBe(false);
    expect(seen).toEqual([true, false]); // one open, one close: the queue is woken once each way
  });

  it('closes when the take is discarded', async () => {
    const { busy, audio, rec } = await load();
    await audio.setAudioMode('recording');
    const recorder = fakeRecorder();
    const draft = await rec.beginTake(recorder, { childId: 'child-asha', promptKey: null });
    await rec.abandonTake(recorder, draft.id);
    expect(busy.captureBusy()).toBe(false);
  });

  it('playback is not a take', async () => {
    const { busy, audio } = await load();
    await audio.setAudioMode('playback');
    expect(busy.captureBusy()).toBe(false);
  });
});
