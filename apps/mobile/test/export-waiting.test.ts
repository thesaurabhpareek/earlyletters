/**
 * Letters that are waiting are in the export (PL-2, F14-REQ-039, F15-REQ-018; founder decision F5;
 * data design docs/data/account-experience-schema.md section 5, E-1; schema 1.6.0).
 *
 * The fictional Asha family has four waiting letters: two held at the Keep step (one spoken, one
 * typed), one spoken and not read back, one typed and not kept. A fifth is being let go and a sixth
 * is still recording: neither is in the export. Each waiting letter has its own words in waiting/
 * and data/waiting.json; each spoken one has its original recording, and the hash in the manifest,
 * in waiting.json and of the bytes in the ZIP equal the hash of the file on the phone. The export
 * is the same with Plus on or off (a plan that ended is off: the snapshot's plan comes from hasPlus()), and needs no
 * connection (it reads nothing but the phone).
 *
 * Dates are the phone's own local day, as Review gives them: this file runs in America/Los_Angeles (pinned below,
 * before any Date is made), where 8 pm is already the next day in UTC.
 */
process.env.TZ = 'America/Los_Angeles';
import Ajv2020 from 'ajv/dist/2020';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { planExport, type ExportSnapshot, type SnapshotWaiting } from '../src/lib/export/build.logic';
import { packExport } from '../src/lib/export/pack';
import { EXPORT_SCHEMA_VERSION, exportJsonSchema, type Manifest, type WaitingFile } from '../src/lib/export/schema';
import { verifyExport, type RandomAccess } from '../src/lib/export/verify';
import { drafts } from '../src/lib/db/repos';
import { fixture, insertBook } from './helpers/store-fixture';
import { ASHA_AUDIO, ashaSnapshot, fakeAudio, sha256Hex } from './helpers/asha-export';

const ASHA = 'child-asha-0001';
const DEV = 'child-dev-0002';

/** Recordings of waiting letters "on the phone", by uri. One is an ADTS .aac (ADR 0027). */
const WAITING_AUDIO: Record<string, Uint8Array> = {
  'file:///doc/audio/w1.m4a': fakeAudio('w1', 3_000),
  'file:///doc/audio/w3.aac': fakeAudio('w3', 1_700),
  'file:///doc/audio/w5.m4a': fakeAudio('w5', 800),
  'file:///doc/audio/w6.m4a': fakeAudio('w6', 900),
};

function draft(p: Partial<SnapshotWaiting> & Pick<SnapshotWaiting, 'id' | 'createdAt'>): SnapshotWaiting {
  const bytes = p.audioUri ? WAITING_AUDIO[p.audioUri] : undefined;
  return {
    childId: ASHA,
    captureMode: 'spoken',
    promptKey: null,
    audioUri: null,
    audioDurationMs: bytes ? 41_000 : null,
    rawTranscript: null,
    typedText: null,
    state: 'ready',
    audioSha256: bytes ? sha256Hex(bytes) : null,
    audioBytes: bytes?.length ?? null,
    recoveredAt: null,
    kind: 'letter',
    occurredOn: null,
    occurredPrecision: 'day',
    language: null,
    baseDirection: 'ltr',
    held: false,
    inBookChoice: null,
    audioOnPhone: !!bytes,
    audioSizeOnPhone: bytes?.length ?? null,
    ...p,
  };
}

const HELD_SPOKEN = 'You fell asleep on my shoulder at the window, um, and I did not move for an hour.';
const HELD_TYPED = 'Today you said ball. Then you said it eleven more times.';
const NOT_READ_BACK = 'Asha, the rain stopped just for your walk.';
const TYPED = 'A note for later: the blue hat.';

function waitingLetters(): SnapshotWaiting[] {
  return [
    // Held at the Keep step: a spoken letter (the third, with Plus off) and a typed one.
    draft({ id: 'w1', createdAt: '2027-03-11T20:00:00.000Z', audioUri: 'file:///doc/audio/w1.m4a', rawTranscript: HELD_SPOKEN, held: true, inBookChoice: true }),
    draft({ id: 'w2', createdAt: '2027-03-12T20:00:00.000Z', captureMode: 'typed', typedText: HELD_TYPED, held: true, occurredOn: '2027-03-12' }),
    // Spoken, words written down, not read back yet; an ADTS recording.
    draft({ id: 'w3', createdAt: '2027-03-13T20:00:00.000Z', audioUri: 'file:///doc/audio/w3.aac', rawTranscript: NOT_READ_BACK }),
    // Typed and not kept.
    draft({ id: 'w4', createdAt: '2027-03-14T08:00:00.000Z', captureMode: 'typed', typedText: TYPED }),
    // Being let go: never exported.
    draft({ id: 'w5', createdAt: '2027-03-14T09:00:00.000Z', audioUri: 'file:///doc/audio/w5.m4a', rawTranscript: 'Let this one go.', state: 'discarding' }),
    // Still recording: never exported.
    draft({ id: 'w6', createdAt: '2027-03-15T09:59:00.000Z', audioUri: 'file:///doc/audio/w6.m4a', state: 'recording' }),
  ];
}

function snapshot(over: Partial<ExportSnapshot> = {}): ExportSnapshot {
  return { ...ashaSnapshot(), waiting: waitingLetters(), ...over };
}

async function zipOf(snap: ExportSnapshot, readFile?: (uri: string) => Promise<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  const read = readFile ?? (async (uri: string) => ASHA_AUDIO[uri] ?? WAITING_AUDIO[uri] ?? Promise.reject(new Error('missing')));
  const result = await packExport(snap, {
    readFile: read,
    sha256: async (d) => sha256Hex(d),
    renderPdf: async () => new TextEncoder().encode('%PDF-1.4\n%%EOF\n'),
    sink: { write: (c) => chunks.push(c.slice()) },
  });
  const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) {
    all.set(c, o);
    o += c.length;
  }
  return { zip: all, files: unzipSync(all), result };
}

const waitingJson = (files: Record<string, Uint8Array>) => JSON.parse(strFromU8(files['data/waiting.json'])) as WaitingFile;
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
ajv.addSchema(exportJsonSchema);
const validator = (def: string) => ajv.getSchema(`${exportJsonSchema.$id}#/$defs/${def}`)!;

describe('[PL-2, F14-REQ-039] letters that are waiting are in the export (schema 1.6.0)', () => {
  it('is format 1.6.0, a minor bump', () => {
    expect(EXPORT_SCHEMA_VERSION).toBe('1.6.0');
  });

  it('lists four waiting letters with four text files and two recordings; nothing being let go or still recording', async () => {
    const { files } = await zipOf(snapshot());
    const w = waitingJson(files);
    expect(w.schema_version).toBe(EXPORT_SCHEMA_VERSION);
    expect(w.waiting.map((x) => [x.id, x.reason])).toEqual([
      ['w1', 'held_at_keep'],
      ['w2', 'held_at_keep'],
      ['w3', 'not_read_back'],
      ['w4', 'typed_draft'],
    ]);
    const paths = Object.keys(files).filter((p) => p.startsWith('waiting/')).sort();
    expect(paths).toEqual(['waiting/w1.m4a', 'waiting/w1.txt', 'waiting/w2.txt', 'waiting/w3.aac', 'waiting/w3.txt', 'waiting/w4.txt']);
    expect(Object.keys(files).some((p) => p.includes('w5') || p.includes('w6'))).toBe(false);
  });

  it("a held letter's own words are in its text file and in waiting.json, word for word and never tidied", async () => {
    const { files } = await zipOf(snapshot());
    const w1 = strFromU8(files['waiting/w1.txt']);
    expect(w1).toContain('To: Asha');
    expect(w1).toContain('From: Mama');
    expect(w1).toContain('Recording: waiting/w1.m4a');
    expect(w1).toContain('Waiting: Not kept yet. It waits on this phone until you keep it.');
    expect(w1).toContain(`Exactly what you said:\n${HELD_SPOKEN}`); // the "um" stays: nothing was kept, so nothing was tidied
    expect(strFromU8(files['waiting/w2.txt'])).toContain(HELD_TYPED);
    expect(strFromU8(files['waiting/w4.txt'])).toContain(TYPED);
    const byId = new Map(waitingJson(files).waiting.map((x) => [x.id, x]));
    expect(byId.get('w1')).toMatchObject({ raw_transcript: HELD_SPOKEN, typed_text: null, changed_words: null, text_file: 'waiting/w1.txt', capture_mode: 'spoken' });
    expect(byId.get('w2')).toMatchObject({ typed_text: HELD_TYPED, raw_transcript: null, occurred_on: '2027-03-12', audio: null, audio_missing: null });
  });

  it("[hash test] a held letter's recording is in the export byte for byte: ZIP bytes, waiting.json and manifest all equal the original", async () => {
    const { files } = await zipOf(snapshot());
    const manifest = JSON.parse(strFromU8(files['manifest.json'])) as Manifest;
    const listed = new Map(manifest.files.map((f) => [f.path, f]));
    const byId = new Map(waitingJson(files).waiting.map((x) => [x.id, x]));
    for (const [id, uri, path, media] of [
      ['w1', 'file:///doc/audio/w1.m4a', 'waiting/w1.m4a', 'audio/mp4'],
      ['w3', 'file:///doc/audio/w3.aac', 'waiting/w3.aac', 'audio/aac'],
    ] as const) {
      const original = sha256Hex(WAITING_AUDIO[uri]);
      expect(sha256Hex(files[path]), path).toBe(original);
      expect(files[path].length).toBe(WAITING_AUDIO[uri].length);
      expect(byId.get(id)!.audio).toEqual({
        path, sha256: original, bytes: WAITING_AUDIO[uri].length, duration_ms: 41_000, codec: 'aac-lc', media_type: media, integrity: 'ok', recorded_sha256: original,
      });
      expect(listed.get(path)).toEqual({ path, bytes: WAITING_AUDIO[uri].length, sha256: original, media_type: media });
    }
    // Every waiting file, text too, is in the manifest with the hash of its bytes in the ZIP.
    for (const p of Object.keys(files).filter((f) => f.startsWith('waiting/') || f === 'data/waiting.json')) {
      expect(listed.get(p)?.sha256, p).toBe(sha256Hex(files[p]));
    }
  });

  it('the export check re-reads every waiting file and passes', async () => {
    const { zip, result } = await zipOf(snapshot());
    const access: RandomAccess = { size: zip.length, read: (o, l) => zip.subarray(o, o + l) };
    const sha = async (d: Uint8Array) => sha256Hex(d);
    const check = await verifyExport(access, result.manifest, result.manifestSha256, sha);
    expect(check).toEqual(expect.objectContaining({ ok: true }));
  });

  it('a recording that changed after capture goes in as it is and is marked', async () => {
    const waiting = waitingLetters().map((d) => (d.id === 'w1' ? { ...d, audioSha256: sha256Hex('the original take') } : d));
    const { files, result } = await zipOf(snapshot({ waiting }));
    expect(waitingJson(files).waiting[0].audio!.integrity).toBe('mismatch');
    expect(result.mismatched).toContain('w1');
    expect(result.manifest.counts.audio_mismatch).toBe(1); // the Asha letter e3 only: counts are letters, as before 1.6.0
  });

  it('a recording that is not on this phone is listed with audio_missing; an unrecoverable take says it is empty', async () => {
    const waiting = [
      draft({ id: 'w7', createdAt: '2027-03-01T20:00:00.000Z', audioUri: 'file:///doc/audio/w7.m4a', held: true, audioOnPhone: false, audioSizeOnPhone: null }),
      draft({ id: 'w8', createdAt: '2027-03-02T20:00:00.000Z', audioUri: 'file:///doc/audio/w8.m4a', state: 'unrecoverable', audioOnPhone: true }),
      // On the phone when the snapshot was taken, gone by the time it is packed.
      draft({ id: 'w9', createdAt: '2027-03-03T20:00:00.000Z', audioUri: 'file:///doc/audio/w9.m4a', audioOnPhone: true, audioSizeOnPhone: 10 }),
    ];
    const { files } = await zipOf(snapshot({ waiting }));
    const byId = new Map(waitingJson(files).waiting.map((x) => [x.id, x]));
    expect(byId.get('w7')).toMatchObject({ reason: 'held_at_keep', audio: null, audio_missing: { reason: 'not_on_this_device' } });
    expect(byId.get('w8')).toMatchObject({ reason: 'unrecoverable', audio: null, audio_missing: { reason: 'empty' } });
    expect(byId.get('w9')).toMatchObject({ reason: 'waiting_for_words', audio: null, audio_missing: { reason: 'not_on_this_device' } });
    expect(Object.keys(files).filter((p) => p.startsWith('waiting/') && !p.endsWith('.txt'))).toEqual([]);
    expect(strFromU8(files['waiting/w8.txt'])).toContain('Waiting: This recording has no sound in it.');
  });

  it('is the same with Plus on or off, ended included (it is off), and reads nothing but the phone (works offline)', async () => {
    const reads: string[] = [];
    const offline = async (uri: string) => {
      reads.push(uri);
      const bytes = ASHA_AUDIO[uri] ?? WAITING_AUDIO[uri];
      if (!bytes) throw new Error('missing');
      return bytes;
    };
    const free = await zipOf(snapshot({ plan: 'free' }), offline);
    const plus = await zipOf(snapshot({ plan: 'plus' }), offline);
    for (const p of ['data/waiting.json', 'waiting/w1.txt', 'waiting/w1.m4a', 'waiting/w3.aac']) {
      expect(sha256Hex(plus.files[p]), p).toBe(sha256Hex(free.files[p]));
    }
    expect(reads.every((u) => u.startsWith('file:///'))).toBe(true);
  });

  it('only waiting letters of books in this export; a hidden book counts', async () => {
    const waiting = [
      draft({ id: 'wd', childId: DEV, createdAt: '2027-03-01T20:00:00.000Z', captureMode: 'typed', typedText: 'Snow again.' }),
      draft({ id: 'wx', childId: 'child-gone', createdAt: '2027-03-01T20:00:00.000Z', captureMode: 'typed', typedText: 'No book.' }),
    ];
    const { files } = await zipOf(snapshot({ waiting }));
    expect(waitingJson(files).waiting.map((x) => x.id)).toEqual(['wd']);
    expect(files['waiting/wx.txt']).toBeUndefined();
  });

  it('matches the golden text of every waiting file (test/__golden__/export-asha-waiting)', async () => {
    const { files } = await zipOf(snapshot());
    for (const p of Object.keys(files).filter((f) => (f.startsWith('waiting/') && f.endsWith('.txt')) || f === 'data/waiting.json').sort()) {
      await expect(strFromU8(files[p]), p).toMatchFileSnapshot(`./__golden__/export-asha-waiting/${p}`);
    }
  });

  it("[local day] a letter made at 8 pm in California keeps that day, not the next day in UTC (Review's todayISO rule)", async () => {
    expect(new Date('2027-03-12T04:00:00.000Z').getHours()).toBe(20); // the pin took: 04:00Z is 8 pm PST on March 11
    const late = draft({ id: 'w8pm', createdAt: '2027-03-12T04:00:00.000Z', captureMode: 'typed', typedText: 'Bath, then the moon.' });
    const { files } = await zipOf(snapshot({ waiting: [late] }));
    const text = strFromU8(files['waiting/w8pm.txt']);
    expect(text).toContain('Date: Thursday, March 11, 2027.');
    expect(text).not.toContain('March 12');
    // The parent's own date always wins over the day it was made.
    const chosen = await zipOf(snapshot({ waiting: [{ ...late, occurredOn: '2027-03-10' }] }));
    expect(strFromU8(chosen.files['waiting/w8pm.txt'])).toContain('Date: Wednesday, March 10, 2027.');
  });

  it('writes no waiting folder and no waiting.json when nothing is waiting', async () => {
    const { files } = await zipOf(snapshot({ waiting: [] }));
    expect(Object.keys(files).filter((p) => p.startsWith('waiting/') || p === 'data/waiting.json')).toEqual([]);
  });

  it('waiting.json matches the schema shipped in the export, and the schema rejects what it must', async () => {
    const { files } = await zipOf(snapshot());
    const validate = validator('waitingFile');
    const w = waitingJson(files);
    expect(validate(w), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...w, waiting: [{ ...w.waiting[0], final_text: 'tidied' }] })).toBe(false);
    expect(validate({ ...w, waiting: [{ ...w.waiting[0], reason: 'paywalled' }] })).toBe(false);
    expect(validate({ ...w, waiting: [{ ...w.waiting[0], audio: { ...w.waiting[0].audio!, path: 'audio/w1.m4a' } }] })).toBe(false);
    // The rest of the export still validates with waiting letters in it.
    for (const [path, def] of [['data/entries.json', 'entriesFile'], ['data/account.json', 'accountFile'], ['manifest.json', 'manifest']] as const) {
      const v = validator(def);
      expect(v(JSON.parse(strFromU8(files[path]))), path).toBe(true);
    }
  });

  it('plans one text file per waiting letter and one recording per spoken one on this phone', () => {
    const plan = planExport(snapshot());
    expect(plan.waitingAudio.map((j) => j.path)).toEqual(['waiting/w1.m4a', 'waiting/w3.aac']);
    expect(plan.textFiles.filter((f) => f.path.startsWith('waiting/')).map((f) => f.path)).toEqual(['waiting/w1.txt', 'waiting/w2.txt', 'waiting/w3.txt', 'waiting/w4.txt']);
  });
});

describe('[PL-2] the phone lists every waiting letter for the export', () => {
  it('held, not read back and typed drafts in every book, oldest first; never one still recording or being let go', () => {
    const f = fixture();
    insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
    insertBook(f.db, { id: 'c2', name: 'Dev', signsAs: 'Mama' });
    const add = (id: string, childId: string, createdAt: string, typed: string | null) =>
      drafts.insert(f.ctx, id, { childId, captureMode: typed === null ? 'spoken' : 'typed', promptKey: null, audioUri: typed === null ? `file:///asha/${id}.m4a` : null, audioDurationMs: null, typedText: typed, createdAt });
    add('held', 'c1', '2027-03-01T20:00:00.000Z', null);
    add('typed', 'c2', '2027-03-02T20:00:00.000Z', 'The blue hat.');
    add('plain', 'c1', '2027-03-03T20:00:00.000Z', null);
    add('going', 'c1', '2027-03-04T20:00:00.000Z', null);
    add('live', 'c1', '2027-03-05T20:00:00.000Z', null);
    expect(drafts.markHeld(f.ctx, 'held', true)).toBe(true);
    drafts.beginDiscard(f.ctx, 'going');
    f.db.run("UPDATE drafts SET state = 'recording' WHERE id = 'live'");
    const listed = drafts.listForExport(f.ctx);
    expect(listed.map((d) => [d.id, d.held])).toEqual([['held', true], ['typed', false], ['plain', false]]);
  });
});
