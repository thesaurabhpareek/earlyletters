/// <reference types="node" />
/**
 * A left book refuses writes (BL-1959): what the screens and the transcription queue do with the store's refusal.
 * Screens do not load in Node, so the two Home and Book lines are pinned in source; the queue runs for real against
 * the store. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

// The queue's native edges, stubbed as in bl-572; the store and read-it-back are the real ones.
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../modules/scribe-audio', () => ({ ScribeAudio: {} }));
vi.mock('../src/lib/build-env', () => ({ devShortcutsAllowed: false }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ copyForLetter: async () => {} }));
vi.mock('../src/lib/analytics/track', () => ({ trackTranscriptionCompleted: () => {} }));
vi.mock('../src/lib/language', () => ({ getSpokenLanguages: () => ({ languages: [] }) }));
vi.mock('../src/lib/transcribe-sample', () => ({ createSampleTranscriber: () => ({ id: 'sample', isSample: true, availability: async () => 'native-module-missing', transcribe: async () => { throw new Error('no sample'); } }) }));
vi.mock('../src/lib/models/whisper-runtime', () => ({ whisperModule: () => ({}), releaseContexts: async () => {} }));
vi.mock('../src/lib/models/speech-consent', () => ({ migrateSpeechConsent: () => {}, setSpeechDownloadChoice: () => {}, speechAutoStartAllowed: () => false }));
vi.mock('../src/lib/models/speech-packs', () => ({
  bindSpeechPacks: () => {}, combineProgress: () => null, speechDownloadMotion: () => ({ progress: null, stage: null }),
  ensureSpeechFor: async () => ({ ok: true }), installedPathsFor: () => ({ asr: '/a', vad: '/v', asrId: 'x' }),
  onSpeechPacksBound: () => () => {}, planFor: () => ({ packs: [], asr: {}, bytes: 0 }), recordMemoryFailure: () => {},
  speechPackHost: () => ({ onProgress: () => () => {}, packPath: () => '/p', removePack: async () => {} }), speechPacksForLanguage: () => [],
}));
vi.mock('../src/lib/transcribe-whisper', () => ({ createWhisperTranscriber: () => ({ id: 'whisper', isSample: false, availability: async () => null, transcribe: async () => ({ raw: '' }) }) }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native open must not be used in tests'); } }));

const store = await import('../src/lib/store');
const { isReadItBack, flagReadItBack } = await import('../src/lib/read-it-back');
const queue = await import('../src/lib/transcription-queue');

let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
afterEach(() => {
  store.closeStore();
  close();
  close = () => {};
});

function waitingLetter(): { id: string; childId: string } {
  const h = nodeDb();
  close = h.close;
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId });
  const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama' });
  const e = letter({ childId: asha.id, rawTranscript: '', finalText: '', transcriptStatus: 'waiting' } as never);
  store.saveEntry(e);
  return { id: e.id, childId: asha.id };
}
const arrive = (id: string) => queue.deliver(id, { raw: 'You laughed at the rain.' } as never, false);

describe('late words and a left book (BL-1959)', () => {
  it('words that arrive for a letter in a left book set no read-it-back flag', () => {
    const { id, childId } = waitingLetter();
    store.localSqlDb().run("UPDATE children SET server_state = 'left' WHERE id = ?", childId);
    arrive(id);
    expect(isReadItBack(id)).toBe(false);
    expect(store.getEntry(id)?.finalText).toBe('');
  });

  it('words that arrive for a letter in a book that is not left still flag it', () => {
    const { id } = waitingLetter();
    arrive(id);
    expect(isReadItBack(id)).toBe(true);
    expect(store.getEntry(id)?.finalText).toBe('You laughed at the rain.');
  });

  it('a flag already set is cleared when the write is refused', () => {
    const { id, childId } = waitingLetter();
    flagReadItBack(id);
    store.localSqlDb().run("UPDATE children SET server_state = 'left' WHERE id = ?", childId);
    arrive(id);
    expect(isReadItBack(id)).toBe(false);
  });
});

describe('screens act on the store refusing (BL-1959)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', 'app', p), 'utf8');

  it('the Book never says a quiet-day mark was removed, with Undo, when the delete was refused', () => {
    expect(src('(tabs)/book.tsx')).toMatch(/if \(!deleteEntry\(id\)\) return;[^\n]*\n\s*toast\.show\(\{ message: copy\.book\.quietDay\.removedToast/);
  });

  it('Home keeps the mark line when the delete was refused and the mark is still there', () => {
    expect(src('(tabs)/index.tsx')).toMatch(/if \(keptMark && !deleteEntry\(keptMark\) && getEntry\(keptMark\)\) return;\s*\n\s*setKeptMark\(null\)/);
  });

  it('Review says the save did not work when a letter is refused for a left book', () => {
    expect(src('review.tsx')).toMatch(/else if \(!saveLetterFromDraft\(/);
    expect(src('review.tsx')).toContain("throw new Error('book_left')");
  });
});

describe('a refused restore says so (BL-1959, entry.restore)', () => {
  const read = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

  it('[BL-1959] the store refuses to restore a deleted letter of a left book, and queues nothing', () => {
    const { id, childId } = waitingLetter();
    expect(store.deleteEntry(id)).toBe(true);
    store.localSqlDb().run("UPDATE children SET server_state = 'left' WHERE id = ?", childId);
    expect(store.undeleteEntry(id)).toBe(false);
    expect(store.listDeleted().some((e) => e.id === id)).toBe(true);
  });

  it('[BL-1959] Recently deleted fires no restored event and no restored toast on a refusal, and hides Restore for a left book', () => {
    const s = read('app/settings/recently-deleted.tsx');
    expect(s).toMatch(/const restored = undeleteEntry\(e\.id\);[\s\S]*?if \(!restored\) return toast\.show\(\{ message: d\.restoreRefusedToast \}\);\s*track\('letter_deleted', \{ action: 'restored'/);
    expect(s).toMatch(/canRestore=\{!\(e\.childId && isBookLeft\(e\.childId\)\)\}/);
  });

  it.each(['app/(tabs)/book.tsx', 'app/letter/[id].tsx'])('[BL-1959] Undo in %s reads the result before it tracks', (p) => {
    expect(read(p)).toMatch(/if \(!undeleteEntry\(gone\.id\)\) return toast\.show\(\{ message: copy\.settings\.delete\.restoreRefusedToast \}\);\s*track\('letter_deleted', \{ action: 'restored'/);
  });
});
