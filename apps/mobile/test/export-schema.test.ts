/**
 * The export's data files match the JSON Schema that ships inside every
 * export (LEGAL-REQ-034 "Test: automated (ZIP schema check)"; DATA-REQ-055).
 * If this fails after a format change, bump EXPORT_SCHEMA_VERSION, update the
 * schema, and keep a reader fixture for the old version.
 */
import Ajv2020 from 'ajv/dist/2020';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { packExport } from '../src/lib/export/pack';
import { EXPORT_FORMAT, EXPORT_SCHEMA_VERSION, exportJsonSchema, type EntriesFile } from '../src/lib/export/schema';
import { ASHA_AUDIO, ashaSnapshot, sha256Hex } from './helpers/asha-export';

async function ashaZip(): Promise<Record<string, Uint8Array>> {
  const chunks: Uint8Array[] = [];
  await packExport(ashaSnapshot(), {
    readFile: async (uri) => ASHA_AUDIO[uri] ?? Promise.reject(new Error('missing')),
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

// Strict, except `required` inside if/then (a standard pattern Ajv's strictRequired cannot follow).
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
ajv.addSchema(exportJsonSchema);
const validator = (def: string) => ajv.getSchema(`${exportJsonSchema.$id}#/$defs/${def}`)!;
const json = (files: Record<string, Uint8Array>, path: string) => JSON.parse(strFromU8(files[path]));

describe('export schema', () => {
  it('is a valid JSON Schema and versioned as semver', () => {
    expect(EXPORT_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(EXPORT_FORMAT).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*-export$/);
    for (const def of ['entriesFile', 'childrenFile', 'accountFile', 'manifest']) expect(validator(def), def).toBeTypeOf('function');
  });

  it('every data file in the Asha export matches it', async () => {
    const files = await ashaZip();
    const cases: [string, string][] = [
      ['data/entries.json', 'entriesFile'],
      ['data/children.json', 'childrenFile'],
      ['data/account.json', 'accountFile'],
      ['manifest.json', 'manifest'],
    ];
    for (const [path, def] of cases) {
      const validate = validator(def);
      const ok = validate(json(files, path));
      expect(validate.errors ?? [], path).toEqual([]);
      expect(ok, path).toBe(true);
    }
  });

  it('ships the same schema inside the export', async () => {
    const files = await ashaZip();
    expect(json(files, 'schema/export-v1.schema.json')).toEqual(JSON.parse(JSON.stringify(exportJsonSchema)));
  });

  it('rejects a family letter that carries the author\'s working material', async () => {
    const entries = json(await ashaZip(), 'data/entries.json') as EntriesFile;
    const nani = entries.entries.find((e) => !e.author.is_exporter)!;
    const leaked = { ...entries, entries: [{ ...nani, raw_transcript: 'Your Nani made dal and uh nobody ate it.' }] };
    expect(validator('entriesFile')(leaked)).toBe(false);
  });

  it('rejects an own letter without its raw transcript, edits and hash', async () => {
    const entries = json(await ashaZip(), 'data/entries.json') as EntriesFile;
    const own = entries.entries.find((e) => e.author.is_exporter)!;
    const { raw_transcript: _r, ...withoutRaw } = own;
    expect(validator('entriesFile')({ ...entries, entries: [withoutRaw] })).toBe(false);
  });

  it('rejects unknown fields, a missing schema version and a malformed hash', async () => {
    const files = await ashaZip();
    const entries = json(files, 'data/entries.json') as EntriesFile;
    const v = validator('entriesFile');
    expect(v({ ...entries, extra: 1 })).toBe(false);
    const { schema_version: _s, ...noVersion } = entries;
    expect(v(noVersion)).toBe(false);
    const withAudio = entries.entries.find((e) => e.audio)!;
    expect(v({ ...entries, entries: [{ ...withAudio, audio: { ...withAudio.audio!, sha256: 'not-a-hash' } }] })).toBe(false);
  });
});
