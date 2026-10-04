/**
 * The export format (DELETION_AND_EXPORT_SPEC 4.2 and 4.3; LEGAL-REQ-034;
 * DATA-REQ-050, -051, -055). Plain types plus the JSON Schema that ships
 * inside every export as `schema/export-v1.schema.json`, so a family can
 * read their book in 2044 with no app.
 *
 * Versioning: `EXPORT_SCHEMA_VERSION` is semver. Adding an optional field is
 * a minor bump; renaming or removing one is a major bump and needs a reader
 * and a fixture kept in `apps/mobile/test` (DATA-REQ-055). The schema test
 * (test/export-schema.test.ts) fails if the data and the schema drift.
 *
 * Pure: no React Native, so Node tests and a future server export
 * (DATA-REQ-054) can share it.
 */
import { brand } from '@scribe/brand';

export const EXPORT_SCHEMA_VERSION = '1.0.0';

/** "early-letters-export", from packages/brand (the name lives only there). */
export const EXPORT_FORMAT = `${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-export`;

export type AudioMissingReason = 'not_on_this_device' | 'offline' | 'vault_mode';
export type AudioIntegrity = 'ok' | 'mismatch' | 'unchecked';

export interface ExportAudio {
  path: string;
  sha256: string;
  bytes: number;
  duration_ms: number | null;
  codec: 'aac-lc';
  media_type: 'audio/mp4';
  /** `mismatch` when the file no longer matches the hash taken when recording stopped (DATA-REQ-046, -051). */
  integrity: AudioIntegrity;
  /** The hash taken at capture, when there was one. */
  recorded_sha256: string | null;
}

export interface ExportMachineEdit {
  type: string;
  start: number;
  end: number;
  original: string;
  replacement: string;
  source: string;
}

export interface ExportEntry {
  id: string;
  child_id: string;
  author: { signs_as: string; is_exporter: boolean };
  kind: 'letter' | 'note' | 'not_much';
  occurred_on: string;
  captured_at: string;
  capture_mode: 'spoken' | 'typed' | 'mixed';
  edit_level: 'clean' | 'verbatim';
  /** BCP-47 when known. The phone does not record it yet. */
  language: string | null;
  /** `waiting_for_words`: a recording kept before its words were written down. */
  words: 'ready' | 'waiting_for_words';
  final_text: string;
  in_book: boolean;
  /** Plain-text copy of this letter inside the export. */
  text_file: string;
  photo: null;
  audio: ExportAudio | null;
  audio_missing: { reason: AudioMissingReason } | null;
  /** Own letters only (others' working material is never exported). */
  raw_transcript?: string;
  raw_sha256?: string;
  machine_edits?: ExportMachineEdit[];
  engine_version?: number;
  prompt_key?: string | null;
  sounds_like_me?: boolean | null;
  stt_meta?: { engine: string | null } | null;
  alignment?: null;
}

export interface EntriesFile {
  schema_version: string;
  format: string;
  generated_at: string;
  entries: ExportEntry[];
}

export interface ExportChild {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  /** What this child calls the person who made the export. */
  signs_as: string;
  /** Every signature used on this child's letters in the export. */
  signatures: string[];
  hidden: boolean;
  /** The printable book for this child, when it has letters in the book. */
  book_file: string | null;
}

export interface ChildrenFile {
  schema_version: string;
  format: string;
  children: ExportChild[];
}

export interface AccountFile {
  schema_version: string;
  format: string;
  /** False until sign-in ships; everything here then comes from this phone. */
  signed_in: boolean;
  plan: 'free' | 'plus';
  exported_from: 'phone';
  memberships: { child_id: string; role: 'parent' | 'contributor'; signs_as: string }[];
}

export interface ManifestFile {
  path: string;
  bytes: number;
  sha256: string;
  media_type: string;
}

export interface Manifest {
  format: string;
  format_version: string;
  generated_at: string;
  app_version: string;
  engine_version: number;
  scope: { exporter_role: 'parent' | 'contributor'; children: number; include_recently_deleted: boolean };
  counts: { entries: number; audio: number; audio_missing: number; audio_mismatch: number; photos: number; books: number };
  files: ManifestFile[];
}

// ── JSON Schema (draft 2020-12), published inside every export ───────────

const isoDate = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;
const isoDateOrNull = { type: ['string', 'null'], pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;
const sha256 = { type: 'string', pattern: '^[0-9a-f]{64}$' } as const;
const header = {
  schema_version: { type: 'string', pattern: '^1\\.\\d+\\.\\d+$' },
  format: { const: EXPORT_FORMAT },
} as const;

export const exportJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${brand.web.origin}/export-format/v1.schema.json`,
  title: `${brand.name} export, format 1`,
  description: 'Schema for data/entries.json, data/children.json, data/account.json and manifest.json in an export.',
  $defs: {
    audio: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'sha256', 'bytes', 'duration_ms', 'codec', 'media_type', 'integrity', 'recorded_sha256'],
      properties: {
        path: { type: 'string', pattern: '^audio/[^/]+\\.m4a$' },
        sha256,
        bytes: { type: 'integer', minimum: 0 },
        duration_ms: { type: ['integer', 'null'], minimum: 0 },
        codec: { const: 'aac-lc' },
        media_type: { const: 'audio/mp4' },
        integrity: { enum: ['ok', 'mismatch', 'unchecked'] },
        recorded_sha256: { anyOf: [sha256, { type: 'null' }] },
      },
    },
    edit: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'start', 'end', 'original', 'replacement', 'source'],
      properties: {
        type: { type: 'string' },
        start: { type: 'integer', minimum: 0 },
        end: { type: 'integer', minimum: 0 },
        original: { type: 'string' },
        replacement: { type: 'string' },
        source: { type: 'string' },
      },
    },
    entry: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id', 'child_id', 'author', 'kind', 'occurred_on', 'captured_at', 'capture_mode', 'edit_level', 'language',
        'words', 'final_text', 'in_book', 'text_file', 'photo', 'audio', 'audio_missing',
      ],
      properties: {
        id: { type: 'string', minLength: 1 },
        child_id: { type: 'string', minLength: 1 },
        author: {
          type: 'object',
          additionalProperties: false,
          required: ['signs_as', 'is_exporter'],
          properties: { signs_as: { type: 'string' }, is_exporter: { type: 'boolean' } },
        },
        kind: { enum: ['letter', 'note', 'not_much'] },
        occurred_on: isoDate,
        captured_at: { type: 'string', minLength: 10 },
        capture_mode: { enum: ['spoken', 'typed', 'mixed'] },
        edit_level: { enum: ['clean', 'verbatim'] },
        language: { type: ['string', 'null'] },
        words: { enum: ['ready', 'waiting_for_words'] },
        final_text: { type: 'string' },
        in_book: { type: 'boolean' },
        text_file: { type: 'string', pattern: '^letters/' },
        photo: { type: 'null' },
        audio: { anyOf: [{ $ref: '#/$defs/audio' }, { type: 'null' }] },
        audio_missing: {
          anyOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['reason'],
              properties: { reason: { enum: ['not_on_this_device', 'offline', 'vault_mode'] } },
            },
            { type: 'null' },
          ],
        },
        raw_transcript: { type: 'string' },
        raw_sha256: sha256,
        machine_edits: { type: 'array', items: { $ref: '#/$defs/edit' } },
        engine_version: { type: 'integer', minimum: 0 },
        prompt_key: { type: ['string', 'null'] },
        sounds_like_me: { type: ['boolean', 'null'] },
        stt_meta: {
          anyOf: [
            { type: 'object', additionalProperties: false, required: ['engine'], properties: { engine: { type: ['string', 'null'] } } },
            { type: 'null' },
          ],
        },
        alignment: { type: 'null' },
      },
      // Own letters carry their working material; others' never do.
      if: { type: 'object', properties: { author: { type: 'object', properties: { is_exporter: { const: true } } } } },
      then: { type: 'object', required: ['raw_transcript', 'raw_sha256', 'machine_edits', 'engine_version', 'prompt_key'] },
      else: {
        type: 'object',
        not: {
          type: 'object',
          anyOf: [
            { type: 'object', required: ['raw_transcript'] },
            { type: 'object', required: ['machine_edits'] },
            { type: 'object', required: ['raw_sha256'] },
          ],
        },
      },
    },
    entriesFile: {
      type: 'object',
      additionalProperties: false,
      required: ['schema_version', 'format', 'generated_at', 'entries'],
      properties: { ...header, generated_at: { type: 'string' }, entries: { type: 'array', items: { $ref: '#/$defs/entry' } } },
    },
    childrenFile: {
      type: 'object',
      additionalProperties: false,
      required: ['schema_version', 'format', 'children'],
      properties: {
        ...header,
        children: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'name', 'birthday', 'due_date', 'signs_as', 'signatures', 'hidden', 'book_file'],
            properties: {
              id: { type: 'string', minLength: 1 },
              name: { type: 'string' },
              birthday: isoDateOrNull,
              due_date: isoDateOrNull,
              signs_as: { type: 'string' },
              signatures: { type: 'array', items: { type: 'string' } },
              hidden: { type: 'boolean' },
              book_file: { type: ['string', 'null'], pattern: '^book/.+\\.pdf$' },
            },
          },
        },
      },
    },
    accountFile: {
      type: 'object',
      additionalProperties: false,
      required: ['schema_version', 'format', 'signed_in', 'plan', 'exported_from', 'memberships'],
      properties: {
        ...header,
        signed_in: { type: 'boolean' },
        plan: { enum: ['free', 'plus'] },
        exported_from: { const: 'phone' },
        memberships: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['child_id', 'role', 'signs_as'],
            properties: { child_id: { type: 'string' }, role: { enum: ['parent', 'contributor'] }, signs_as: { type: 'string' } },
          },
        },
      },
    },
    manifest: {
      type: 'object',
      additionalProperties: false,
      required: ['format', 'format_version', 'generated_at', 'app_version', 'engine_version', 'scope', 'counts', 'files'],
      properties: {
        format: { const: EXPORT_FORMAT },
        format_version: { type: 'string', pattern: '^1\\.\\d+\\.\\d+$' },
        generated_at: { type: 'string' },
        app_version: { type: 'string' },
        engine_version: { type: 'integer' },
        scope: {
          type: 'object',
          additionalProperties: false,
          required: ['exporter_role', 'children', 'include_recently_deleted'],
          properties: {
            exporter_role: { enum: ['parent', 'contributor'] },
            children: { type: 'integer', minimum: 0 },
            include_recently_deleted: { type: 'boolean' },
          },
        },
        counts: {
          type: 'object',
          additionalProperties: false,
          required: ['entries', 'audio', 'audio_missing', 'audio_mismatch', 'photos', 'books'],
          properties: Object.fromEntries(
            ['entries', 'audio', 'audio_missing', 'audio_mismatch', 'photos', 'books'].map((k) => [k, { type: 'integer', minimum: 0 }]),
          ),
        },
        files: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path', 'bytes', 'sha256', 'media_type'],
            properties: { path: { type: 'string' }, bytes: { type: 'integer', minimum: 0 }, sha256, media_type: { type: 'string' } },
          },
        },
      },
    },
  },
  anyOf: [
    { $ref: '#/$defs/entriesFile' },
    { $ref: '#/$defs/childrenFile' },
    { $ref: '#/$defs/accountFile' },
    { $ref: '#/$defs/manifest' },
  ],
} as const;
