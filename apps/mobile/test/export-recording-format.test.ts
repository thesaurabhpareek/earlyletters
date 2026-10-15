/**
 * Export names and labels each recording by its own container (ADR 0027; schema 1.2.0; LEGAL-REQ-034,
 * DATA-REQ-050, -051, -055): an M4A stays `audio/<id>.m4a` with `audio/mp4`, exactly as before, and an
 * ADTS take is `audio/<id>.aac` with `audio/aac`. Either way the file is the original, byte for byte,
 * with the hash of what was exported. Old letters and old exports keep working. Fictional Asha family only.
 */
import Ajv2020 from 'ajv/dist/2020';
import { strFromU8, unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { containerOfRecording } from '../src/lib/capture/recording-file';
import { audioPath, planExport, recordingFileOf } from '../src/lib/export/build.logic';
import { packExport } from '../src/lib/export/pack';
import { EXPORT_SCHEMA_VERSION, exportJsonSchema, type EntriesFile, type Manifest } from '../src/lib/export/schema';
import { ASHA_AUDIO, ashaSnapshot, fakeAudio, sha256Hex } from './helpers/asha-export';

const AAC_URI = 'file:///doc/ExpoAudio/recording-2C3D4E5F-0000-4000-8000-00000000AAC3.aac';
const AAC_BYTES = fakeAudio('an ADTS take', 2048);

/** The Asha export with one M4A letter (e2, as always) and one ADTS letter (e8 recorded as `.aac`). */
function mixedSnapshot() {
  const s = ashaSnapshot();
  return { ...s, entries: s.entries.map((e) => (e.id === 'e8' ? { ...e, audioUri: AAC_URI, audioSha256: sha256Hex(AAC_BYTES), audioBytes: AAC_BYTES.length, audioSizeOnPhone: AAC_BYTES.length } : e)) };
}

async function zipOf(snapshot: ReturnType<typeof ashaSnapshot>): Promise<Record<string, Uint8Array>> {
  const audio: Record<string, Uint8Array> = { ...ASHA_AUDIO, [AAC_URI]: AAC_BYTES };
  const chunks: Uint8Array[] = [];
  await packExport(snapshot, {
    readFile: async (uri) => audio[uri] ?? Promise.reject(new Error('missing')),
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
  return unzipSync(all);
}

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
ajv.addSchema(exportJsonSchema);
const validator = (def: string) => ajv.getSchema(`${exportJsonSchema.$id}#/$defs/${def}`)!;
const json = (files: Record<string, Uint8Array>, path: string) => JSON.parse(strFromU8(files[path]));

describe('[ADR 0027] each recording is named and labelled by its own container', () => {
  it('the schema is 1.3.0', () => {
    expect(EXPORT_SCHEMA_VERSION).toBe('1.3.0');
  });

  it('reads the container from the stored file name: only `.aac` is ADTS, everything else stays M4A as before', () => {
    expect(containerOfRecording(AAC_URI)).toBe('adts');
    expect(containerOfRecording('file:///doc/ExpoAudio/recording-X.AAC')).toBe('adts');
    for (const old of ['file:///doc/audio/e2.m4a', 'file:///doc/Documents/recording-X.M4A', 'file:///doc/x.aac.part', '', null, undefined]) {
      expect(containerOfRecording(old), String(old)).toBe('m4a');
    }
    expect(recordingFileOf(AAC_URI)).toEqual({ extension: '.aac', mimeType: 'audio/aac' });
    expect(recordingFileOf('file:///doc/audio/e2.m4a')).toEqual({ extension: '.m4a', mimeType: 'audio/mp4' });
    expect(audioPath('e8', AAC_URI)).toBe('audio/e8.aac');
    expect(audioPath('e2', 'file:///doc/audio/e2.m4a')).toBe('audio/e2.m4a');
    expect(audioPath('e1')).toBe('audio/e1.m4a');
  });

  it('plans one of each with its own path and media type', () => {
    const plan = planExport(mixedSnapshot());
    const byId = new Map(plan.audio.map((j) => [j.entryId, j]));
    expect(byId.get('e2')).toMatchObject({ path: 'audio/e2.m4a', mediaType: 'audio/mp4' });
    expect(byId.get('e8')).toMatchObject({ path: 'audio/e8.aac', mediaType: 'audio/aac', uri: AAC_URI });
  });

  it('packs both byte for byte, labels each in entries.json and the manifest, and points the letter and the reader at it', async () => {
    const files = await zipOf(mixedSnapshot());
    expect(sha256Hex(files['audio/e8.aac'])).toBe(sha256Hex(AAC_BYTES));
    expect(sha256Hex(files['audio/e2.m4a'])).toBe(sha256Hex(ASHA_AUDIO['file:///doc/audio/e2.m4a']));
    expect(files['audio/e8.m4a']).toBeUndefined();

    const entries = json(files, 'data/entries.json') as EntriesFile;
    const e8 = entries.entries.find((e) => e.id === 'e8')!;
    const e2 = entries.entries.find((e) => e.id === 'e2')!;
    expect(e8.audio).toMatchObject({ path: 'audio/e8.aac', media_type: 'audio/aac', codec: 'aac-lc', sha256: sha256Hex(AAC_BYTES), integrity: 'ok' });
    expect(e2.audio).toMatchObject({ path: 'audio/e2.m4a', media_type: 'audio/mp4', codec: 'aac-lc', integrity: 'ok' });

    const manifest = json(files, 'manifest.json') as Manifest;
    expect(manifest.files.find((f) => f.path === 'audio/e8.aac')).toMatchObject({ media_type: 'audio/aac', sha256: sha256Hex(AAC_BYTES), bytes: AAC_BYTES.length });
    expect(manifest.files.find((f) => f.path === 'audio/e2.m4a')).toMatchObject({ media_type: 'audio/mp4' });

    expect(strFromU8(files[e8.text_file])).toContain('Recording: audio/e8.aac');
    expect(strFromU8(files['index.html'])).toContain('src="audio/e8.aac"');
    expect(strFromU8(files['index.html'])).toContain('src="audio/e2.m4a"');
  });

  it('the export with one of each matches the schema it carries', async () => {
    const files = await zipOf(mixedSnapshot());
    expect(json(files, 'schema/export-v1.schema.json')).toEqual(JSON.parse(JSON.stringify(exportJsonSchema)));
    for (const [path, def] of [['data/entries.json', 'entriesFile'], ['manifest.json', 'manifest']] as const) {
      const validate = validator(def);
      const ok = validate(json(files, path));
      expect(validate.errors ?? [], path).toEqual([]);
      expect(ok, path).toBe(true);
    }
  });

  it('the schema refuses a path and a media type that disagree, and any other container', async () => {
    const entries = json(await zipOf(mixedSnapshot()), 'data/entries.json') as EntriesFile;
    const e8 = entries.entries.find((e) => e.id === 'e8')!;
    const v = validator('entriesFile');
    const withAudio = (audio: object) => ({ ...entries, entries: [{ ...e8, audio: { ...e8.audio, ...audio } }] });
    expect(v(withAudio({}))).toBe(true);
    expect(v(withAudio({ media_type: 'audio/mp4' }))).toBe(false); // .aac labelled audio/mp4
    expect(v(withAudio({ path: 'audio/e8.m4a' }))).toBe(false); // .m4a labelled audio/aac
    expect(v(withAudio({ path: 'audio/e8.wav', media_type: 'audio/wav' }))).toBe(false);
  });
});

describe('[DATA-REQ-055] old letters and old exports keep working', () => {
  it('an all-M4A book exports exactly the names and labels it always had', async () => {
    const files = await zipOf(ashaSnapshot());
    expect(Object.keys(files).filter((p) => p.startsWith('audio/')).sort()).toEqual(['audio/e10.m4a', 'audio/e2.m4a', 'audio/e3.m4a', 'audio/e6.m4a', 'audio/e8.m4a']);
    const manifest = json(files, 'manifest.json') as Manifest;
    expect(new Set(manifest.files.filter((f) => f.path.startsWith('audio/')).map((f) => f.media_type))).toEqual(new Set(['audio/mp4']));
  });

  it('still reads every 1.1.0 file (kept in __golden__/export-asha/_v1.1.0)', () => {
    const dir = join(__dirname, '__golden__', 'export-asha', '_v1.1.0');
    const cases: [string, string][] = [
      ['data/entries.json', 'entriesFile'],
      ['data/children.json', 'childrenFile'],
      ['data/account.json', 'accountFile'],
      ['manifest.json', 'manifest'],
    ];
    for (const [path, def] of cases) {
      const data = JSON.parse(readFileSync(join(dir, path), 'utf8'));
      expect(data.schema_version ?? data.format_version, path).toBe('1.1.0');
      const validate = validator(def);
      const ok = validate(data);
      expect(validate.errors ?? [], path).toEqual([]);
      expect(ok, path).toBe(true);
    }
  });
});
