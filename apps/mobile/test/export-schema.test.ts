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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ASHA_AUDIO, ashaSnapshot, sha256Hex } from './helpers/asha-export';

async function ashaZip(snapshot = ashaSnapshot()): Promise<Record<string, Uint8Array>> {
  const chunks: Uint8Array[] = [];
  await packExport(snapshot, {
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
    for (const def of ['entriesFile', 'childrenFile', 'accountFile', 'otherVersionsFile', 'manifest']) expect(validator(def), def).toBeTypeOf('function');
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

  it('[F16-REQ-023] a conflict copy is in the export word for word, in a file that matches the schema', async () => {
    const snap = ashaSnapshot();
    const own = snap.entries.find((e) => e.own)!;
    snap.otherVersions = [{
      entryId: own.id,
      finalText: 'You stood at the sofa and grinned.',
      editLevel: 'clean',
      machineEdits: [{ type: 'filler', start: 0, end: 3, original: 'um ', replacement: '', source: 'rule' }],
      keptAt: '2026-10-20T19:00:00.000Z',
    }];
    const files = await ashaZip(snap);
    const other = json(files, 'data/other-versions.json');
    const validate = validator('otherVersionsFile');
    expect(validate(other), JSON.stringify(validate.errors)).toBe(true);
    expect(other.versions).toEqual([expect.objectContaining({ entry_id: own.id, reason: 'conflict_copy', final_text: 'You stood at the sofa and grinned.' })]);
    const manifest = json(files, 'manifest.json') as { files: { path: string }[] };
    expect(manifest.files.map((f) => f.path)).toContain('data/other-versions.json');
  });

  it('writes no other-versions file when the phone keeps none', async () => {
    expect(Object.keys(await ashaZip())).not.toContain('data/other-versions.json');
  });

  it('[G-19] rejects a consent block with a server field or an unknown answer', async () => {
    const account = json(await ashaZip(), 'data/account.json');
    const validate = validator('accountFile');
    expect(validate({ ...account, consent_on_this_phone: { ...account.consent_on_this_phone, acts: [] } })).toBe(false);
    expect(validate({ ...account, consent_on_this_phone: { age_confirmed: true, usage_sharing: 'maybe' } })).toBe(false);
  });

  for (const version of ['1.0.0', '1.1.0', '1.2.0']) {
    it(`[DATA-REQ-055] still reads every ${version} file (kept in __golden__/export-asha/_v${version})`, () => {
      const dir = join(__dirname, '__golden__', 'export-asha', `_v${version}`);
      const cases: [string, string][] = [
        ['data/entries.json', 'entriesFile'],
        ['data/children.json', 'childrenFile'],
        ['data/account.json', 'accountFile'],
        ['manifest.json', 'manifest'],
      ];
      for (const [path, def] of cases) {
        const data = JSON.parse(readFileSync(join(dir, path), 'utf8'));
        expect(data.schema_version ?? data.format_version, path).toBe(version);
        const validate = validator(def);
        const ok = validate(data);
        expect(validate.errors ?? [], path).toEqual([]);
        expect(ok, path).toBe(true);
      }
    });
  }

  describe('[BL-323, LEGAL-REQ-034] consent_history (1.3.0)', () => {
    const act = {
      id: 'a1',
      document: 'terms',
      version: '1.0.0',
      action: 'accept',
      method: 'signin_sheet',
      surface: 'signin.terms',
      at: '2027-01-02T03:04:05.000Z',
      client_recorded_at: null,
      app_version: '1.0.0',
      platform: 'ios',
      locale: 'en-US',
      rendered_sha256: null,
      context: { auth: 'apple', age_attested: true },
    };
    const included = {
      status: 'included',
      read_at: '2027-03-15T10:00:00.000Z',
      current: [{ document: 'terms', version: '1.0.0', action: 'accept', at: act.at }],
      acts: [act],
    };
    const history = validator('consentHistory');

    it('accepts a record that was read, and an empty one that says why', () => {
      expect(history(included), JSON.stringify(history.errors)).toBe(true);
      for (const status of ['not_signed_in', 'unavailable', 'different_account']) {
        expect(history({ status, read_at: null, current: [], acts: [] }), status).toBe(true);
      }
    });

    it('rejects rows or a read time on a record that was not read', () => {
      expect(history({ ...included, status: 'unavailable' })).toBe(false);
      expect(history({ status: 'not_signed_in', read_at: null, current: [], acts: [act] })).toBe(false);
      expect(history({ status: 'not_signed_in', read_at: '2027-03-15T10:00:00.000Z', current: [], acts: [] })).toBe(false);
    });

    it('rejects an included record without a read time, an unknown action, and any account column', () => {
      expect(history({ ...included, read_at: null })).toBe(false);
      expect(history({ ...included, acts: [{ ...act, action: 'maybe' }] })).toBe(false);
      expect(history({ ...included, acts: [{ ...act, profile_id: 'u1' }] })).toBe(false);
      expect(history({ ...included, acts: [{ ...act, subject_hash: null }] })).toBe(false);
      expect(history({ ...included, acts: [{ ...act, rendered_sha256: 'abc' }] })).toBe(false);
    });

    it('an account.json carrying a server record validates', async () => {
      const account = json(await ashaZip(), 'data/account.json');
      const validate = validator('accountFile');
      expect(validate({ ...account, consent_history: included }), JSON.stringify(validate.errors)).toBe(true);
      expect(validate({ ...account, dictionary: [{ child_id: null, term: '', kind: 'word', heard_as: [], source: 'server' }] })).toBe(false);
      expect(validate({ ...account, memberships: [{ child_id: 'c', role: 'owner', signs_as: 'Mama' }] })).toBe(false);
    });
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
