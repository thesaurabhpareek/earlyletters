/**
 * The fictional "Asha" family (CLAUDE.md privacy rules), as an export
 * snapshot. Fixed ids, dates and recording bytes, so the golden export is
 * the same on every machine. Covers: a letter before birth, tidied and
 * word-for-word spoken letters, a recording that changed after capture, a
 * private note, a recording that is not on this phone, a recording waiting
 * for its words, a family letter (not the exporter's), a Hindi letter in
 * Devanagari, an Arabic letter, Year 2, and a hidden second book. Two quiet-day marks (D-084): a
 * current one with no words, and one saved by an older build that holds the template sentence and
 * was moved into the book (the old menu allowed it): neither is a letter, neither may print.
 */
import { createHash } from 'node:crypto';
import type { Edit } from '@scribe/core';
import type { ExportSnapshot, SnapshotEntry } from '../../src/lib/export/build.logic';

/** Deterministic bytes standing in for an M4A. Includes ZIP signatures on purpose, as real audio can. */
export function fakeAudio(seed: string, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let block = createHash('sha256').update(seed).digest();
  for (let i = 0; i < length; i++) {
    if (i % 32 === 0 && i > 0) block = createHash('sha256').update(block).digest();
    out[i] = block[i % 32];
  }
  // "ftyp" box start, like an M4A, then a data descriptor and a local header signature mid-stream.
  out.set([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20], 0);
  if (length > 400) {
    out.set([0x50, 0x4b, 0x07, 0x08], 200);
    out.set([0x50, 0x4b, 0x03, 0x04], 300);
  }
  return out;
}

export const sha256Hex = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

const ASHA = 'child-asha-0001';
const DEV = 'child-dev-0002';

/** Audio files "on the phone", by uri. */
export const ASHA_AUDIO: Record<string, Uint8Array> = {
  'file:///doc/audio/e2.m4a': fakeAudio('e2', 4_096),
  'file:///doc/audio/e3.m4a': fakeAudio('e3', 2_500),
  'file:///doc/audio/e6.m4a': fakeAudio('e6', 1_200),
  'file:///doc/audio/e8.m4a': fakeAudio('e8', 3_333),
  'file:///doc/audio/e10.m4a': fakeAudio('e10', 900),
};

const filler = (raw: string, word: string): Edit => {
  const start = raw.indexOf(word);
  return { type: 'filler', start, end: start + word.length, original: word, replacement: '', source: 'rule' };
};

function entry(p: Partial<SnapshotEntry> & Pick<SnapshotEntry, 'id' | 'occurredOn' | 'finalText'>): SnapshotEntry {
  const uri = p.audioUri ?? null;
  const bytes = uri ? ASHA_AUDIO[uri] : undefined;
  return {
    kind: 'letter',
    capturedAt: `${p.occurredOn}T19:30:00.000Z`,
    captureMode: 'spoken',
    editLevel: 'clean',
    promptKey: null,
    engineVersion: 3,
    rawTranscript: p.finalText,
    machineEdits: [],
    inBook: true,
    soundsLikeMe: null,
    childId: ASHA,
    authorSignsAs: 'Mama',
    audioUri: uri,
    audioDurationMs: uri ? 12_000 : null,
    audioSha256: bytes ? sha256Hex(bytes) : null,
    audioBytes: bytes?.length ?? null,
    transcriptStatus: null,
    own: true,
    audioOnPhone: !!bytes,
    audioSizeOnPhone: bytes?.length ?? null,
    ...p,
  };
}

const e2raw = 'Asha, um, you are four days old and the whole house is quiet.';
const e2final = 'Asha, you are four days old and the whole house is quiet.';

export function ashaSnapshot(): ExportSnapshot {
  return {
    generatedAt: '2027-03-15T10:00:00.000Z',
    appVersion: '1.0.0',
    engineVersion: 3,
    locale: 'en-US',
    plan: 'free',
    signedIn: false,
    children: [
      { id: ASHA, name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false, hidden: false },
      { id: DEV, name: 'Dev', birthday: '2024-05-31', dueDate: null, signsAs: 'Mama', remindersOn: false, familyCanRead: false, hidden: true },
    ],
    entries: [
      entry({ id: 'e1', occurredOn: '2026-02-20', captureMode: 'typed', finalText: 'We painted your room yellow today.\n\nPapa says it looks like butter.', editLevel: 'verbatim' }),
      entry({
        id: 'e2',
        occurredOn: '2026-03-12',
        rawTranscript: e2raw,
        finalText: e2final,
        machineEdits: [filler(e2raw, ' um,')],
        promptKey: 'opening.any.know',
        audioUri: 'file:///doc/audio/e2.m4a',
        soundsLikeMe: true,
      }),
      // The file changed after capture: the hash taken when recording stopped no longer matches.
      entry({ id: 'e3', occurredOn: '2026-04-20', editLevel: 'verbatim', finalText: 'You laughed today. A real one.', audioUri: 'file:///doc/audio/e3.m4a', audioSha256: sha256Hex('the original take') }),
      entry({ id: 'e4', occurredOn: '2026-05-02', kind: 'note', captureMode: 'typed', finalText: 'Tired. Happy.', inBook: false }),
      // Recorded on this phone, but the file is gone (restored from an old backup, for example).
      entry({ id: 'e5', occurredOn: '2026-06-15', finalText: 'You tried to catch the rain on the glass.', audioUri: 'file:///doc/audio/e5.m4a', audioSha256: sha256Hex('gone'), audioOnPhone: false, audioSizeOnPhone: null }),
      entry({ id: 'e6', occurredOn: '2026-07-01', rawTranscript: '', finalText: '', transcriptStatus: 'waiting', inBook: false, audioUri: 'file:///doc/audio/e6.m4a' }),
      // A family letter: not the exporter's, so no raw transcript, edits or recording.
      entry({ id: 'e7', occurredOn: '2026-08-10', authorId: 'user-nani', authorSignsAs: 'Nani', own: false, finalText: 'Your Nani made dal and nobody ate it.', rawTranscript: 'Your Nani made dal and uh nobody ate it.', machineEdits: [filler('Your Nani made dal and uh nobody ate it.', ' uh')] }),
      entry({ id: 'e8', occurredOn: '2026-09-01', finalText: 'आशा, आज तुमने पहली बार ताली बजाई।', audioUri: 'file:///doc/audio/e8.m4a' }),
      entry({ id: 'e10', occurredOn: '2026-12-24', finalText: 'آشا، أنتِ نورُ بيتنا.', authorSignsAs: 'Mama', audioUri: 'file:///doc/audio/e10.m4a', editLevel: 'verbatim' }),
      entry({ id: 'q1', occurredOn: '2026-10-02', kind: 'not_much', captureMode: 'typed', editLevel: 'verbatim', rawTranscript: '', finalText: '', inBook: false }),
      entry({
        id: 'q2',
        occurredOn: '2026-10-03',
        kind: 'not_much',
        captureMode: 'typed',
        editLevel: 'verbatim',
        rawTranscript: 'Saturday. Not much today. Just Asha, and us, and an ordinary day.',
        finalText: 'Saturday. Not much today. Just Asha, and us, and an ordinary day.',
        inBook: true,
      }),
      entry({ id: 'e9', occurredOn: '2027-03-10', captureMode: 'typed', finalText: 'One year and two days. You walked to the door and waved.', editLevel: 'verbatim' }),
      entry({ id: 'd1', childId: DEV, occurredOn: '2025-01-05', captureMode: 'typed', finalText: 'First snow.', editLevel: 'verbatim' }),
    ],
  };
}
