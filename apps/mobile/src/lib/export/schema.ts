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

/**
 * 1.1.0 (15 Oct 2026; G-19, LEGAL-REQ-034; decision of 15 Oct, delegated by
 * the founder): account.json gains `consent_on_this_phone`, the choices this
 * phone holds (the 18+ answer and the usage-sharing choice). It carries no
 * server consent history; when sign-in is on, that record is added in a later
 * version as its own optional field. Optional in the schema, so 1.0.0 exports
 * still validate; this version always writes it. Compatibility is one way: the
 * 1.0.0 schema closes account.json (additionalProperties: false), so it
 * rejects a 1.1.0 file. Validate each export against the schema it carries in
 * schema/export-v1.schema.json (the $id names the format major, not the
 * version). Each v1 minor reads every earlier v1 file, so anything published
 * at the $id URL must be the newest v1 minor.
 *
 * 1.2.0 (17 Oct 2026; ADR 0027, coordinator decision of 17 Oct): a recording
 * may also be an ADTS stream. Its file is `audio/<entry id>.aac` with
 * `media_type: 'audio/aac'`; an M4A stays `audio/<entry id>.m4a` with
 * `audio/mp4`, exactly as before. The codec is AAC-LC either way, and the
 * file is the original, byte for byte. Only allowed values widen, so 1.0.0
 * and 1.1.0 exports still validate. The same one-way rule applies: the 1.1.0
 * schema rejects a 1.2.0 export that holds an `.aac` recording. (Open PR #161
 * also proposes a 1.2.0; whichever lands second takes 1.3.0.)
 */
/**
 * Also in 1.2.0 (F16-REQ-023, PR #146): `data/other-versions.json`, present only
 * when this phone keeps another version of a letter's words that the letter does
 * not show (a conflict copy from a second phone's edit). A new optional file, so
 * every earlier v1 export still validates. It was written as part of 1.1.0 on the
 * sync stack before develop's 1.1.0 and 1.2.0 landed; no export from the stack has
 * left a phone, so it joins 1.2.0 here.
 */
/**
 * 1.3.0 (BL-323, LEGAL-REQ-034; proposed as 1.2.0 in PR #161, renumbered
 * because ADR 0027 landed 1.2.0 first): account.json gains `consent_history`
 * (the server's consent record: every act in `policy_acceptances` and the
 * latest per document from `my_policy_state`, when it could be read) and
 * `dictionary` (the names and words the transcriber spells your way, as kept
 * on this phone).
 * `memberships[].role` and `manifest.scope.exporter_role` now say the real
 * role. Both fields are optional in the schema, so every earlier v1 export
 * still validates; this version always writes them. The same one-way rule
 * applies: the 1.2.0 schema rejects a 1.3.0 account.json.
 */
export const EXPORT_SCHEMA_VERSION = '1.3.0';

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
  /** Since 1.2.0 also `audio/aac` (an ADTS `.aac` file, ADR 0027). */
  media_type: 'audio/mp4' | 'audio/aac';
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
  /** Since 1.1.0. */
  consent_on_this_phone: ExportPhoneConsent;
  /** Since 1.3.0. */
  consent_history: ExportConsentHistory;
  /** Since 1.3.0. */
  dictionary: ExportDictionaryTerm[];
}

export type PolicyAction = 'accept' | 'decline' | 'withdraw' | 'acknowledge';

/** One row of the server's consent record (`policy_acceptances`), without the account id. */
export interface ExportPolicyAct {
  id: string;
  /** `terms`, `sensitive-data`, `analytics`, ... (POLICY_VERSIONING.md). */
  document: string;
  version: string;
  action: PolicyAction;
  method: string;
  surface: string;
  /** Server time of the act. */
  at: string;
  client_recorded_at: string | null;
  app_version: string;
  platform: 'ios' | 'android' | 'web';
  locale: string | null;
  /** SHA-256 of the text shown, when the app sent one. */
  rendered_sha256: string | null;
  /** Enums only, as stored (sign-in method, `age_attested`). */
  context: Record<string, unknown>;
}

/**
 * The server's consent record (LEGAL-REQ-034: `my_policy_state` and the full
 * acceptance rows). It lives on the server and the phone keeps no copy, so it
 * is read while the export is made. `status` says whether it is here:
 *  - `included`: read for the signed-in account that owns this phone's letters;
 *  - `not_signed_in`: no account on this phone, so there is no server record;
 *  - `different_account`: the signed-in account does not own this phone's letters;
 *  - `unavailable`: signed in, but it could not be read (offline, timeout, error).
 * Only `included` carries rows. The phone's own answers are in `consent_on_this_phone`.
 */
export interface ExportConsentHistory {
  status: 'included' | 'not_signed_in' | 'different_account' | 'unavailable';
  /** When the record was read; null unless `included`. */
  read_at: string | null;
  /** Latest act per document (`my_policy_state`), by document. */
  current: { document: string; version: string; action: PolicyAction; at: string }[];
  /** Every act, oldest first. */
  acts: ExportPolicyAct[];
}

/** A name or word the transcriber spells your way (DictionaryTerm in packages/core). */
export interface ExportDictionaryTerm {
  /** The book it belongs to; null for a word kept for every book. */
  child_id: string | null;
  term: string;
  kind: 'child' | 'nickname' | 'family' | 'word' | 'place' | 'self';
  heard_as: string[];
  /** `phone`: kept on this phone (each book's child name and your signature). `server` is for a server-built export (DATA-REQ-054); the phone never writes it. */
  source: 'phone' | 'server';
}

/**
 * The consent choices as this phone's settings hold them (`ageGate.passed`,
 * D-026; the analytics consent setting). Not a server record: with sign-in on,
 * the server keeps its own record of the Terms acceptance with the 18+
 * attestation (and, with analytics on, of the usage choice), which this field
 * does not carry.
 */
export interface ExportPhoneConsent {
  /** The "18 or older" question on this phone was answered yes. */
  age_confirmed: boolean;
  /** Sharing usage and crash reports (the Settings, Privacy switch), as answered on this phone. Builds with analytics off never ask, so it is `not_answered` unless an earlier answer is stored. */
  usage_sharing: 'granted' | 'denied' | 'not_answered';
}

/**
 * 1.1.0: another version of a letter's words that this phone keeps and the
 * letter does not show: the author's own words from a second phone's edit
 * that the server did not take (a conflict copy, F16-REQ-023). Kept until the
 * author picks; exported so no version of their words exists only on a phone.
 */
export interface ExportOtherVersion {
  entry_id: string;
  reason: 'conflict_copy';
  final_text: string;
  edit_level: string;
  machine_edits: ExportMachineEdit[];
  /** When this phone kept it (device time). */
  kept_at: string;
}

/** `data/other-versions.json`, present only when there is at least one (1.1.0). */
export interface OtherVersionsFile {
  schema_version: string;
  format: string;
  versions: ExportOtherVersion[];
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
const policyAction = { enum: ['accept', 'decline', 'withdraw', 'acknowledge'] } as const;
const header = {
  schema_version: { type: 'string', pattern: '^1\\.\\d+\\.\\d+$' },
  format: { const: EXPORT_FORMAT },
} as const;

export const exportJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${brand.web.origin}/export-format/v1.schema.json`,
  title: `${brand.name} export, format 1`,
  description: 'Schema for data/entries.json, data/children.json, data/account.json, data/other-versions.json (when present) and manifest.json in an export.',
  $defs: {
    audio: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'sha256', 'bytes', 'duration_ms', 'codec', 'media_type', 'integrity', 'recorded_sha256'],
      properties: {
        // Since 1.2.0 also `.aac` with `audio/aac` (ADR 0027); the extension and the media type always agree.
        path: { type: 'string', pattern: '^audio/[^/]+\\.(m4a|aac)$' },
        sha256,
        bytes: { type: 'integer', minimum: 0 },
        duration_ms: { type: ['integer', 'null'], minimum: 0 },
        codec: { const: 'aac-lc' },
        media_type: { enum: ['audio/mp4', 'audio/aac'] },
        integrity: { enum: ['ok', 'mismatch', 'unchecked'] },
        recorded_sha256: { anyOf: [sha256, { type: 'null' }] },
      },
      if: { type: 'object', properties: { media_type: { const: 'audio/aac' } } },
      then: { type: 'object', properties: { path: { type: 'string', pattern: '\\.aac$' } } },
      else: { type: 'object', properties: { path: { type: 'string', pattern: '\\.m4a$' } } },
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
    otherVersionsFile: {
      type: 'object',
      additionalProperties: false,
      required: ['schema_version', 'format', 'versions'],
      properties: {
        ...header,
        versions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['entry_id', 'reason', 'final_text', 'edit_level', 'machine_edits', 'kept_at'],
            properties: {
              entry_id: { type: 'string', minLength: 1 },
              reason: { enum: ['conflict_copy'] },
              final_text: { type: 'string' },
              edit_level: { type: 'string' },
              machine_edits: { type: 'array', items: { $ref: '#/$defs/edit' } },
              kept_at: { type: 'string', minLength: 10 },
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
        // Since 1.1.0; optional so 1.0.0 exports still validate.
        consent_on_this_phone: {
          type: 'object',
          additionalProperties: false,
          required: ['age_confirmed', 'usage_sharing'],
          properties: {
            age_confirmed: { type: 'boolean' },
            usage_sharing: { enum: ['granted', 'denied', 'not_answered'] },
          },
        },
        // Since 1.3.0; optional so every earlier v1 export still validates.
        consent_history: { $ref: '#/$defs/consentHistory' },
        dictionary: { type: 'array', items: { $ref: '#/$defs/dictionaryTerm' } },
      },
    },
    consentHistory: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'read_at', 'current', 'acts'],
      properties: {
        status: { enum: ['included', 'not_signed_in', 'different_account', 'unavailable'] },
        read_at: { type: ['string', 'null'] },
        current: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['document', 'version', 'action', 'at'],
            properties: { document: { type: 'string' }, version: { type: 'string' }, action: policyAction, at: { type: 'string' } },
          },
        },
        acts: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: [
              'id', 'document', 'version', 'action', 'method', 'surface', 'at', 'client_recorded_at', 'app_version', 'platform',
              'locale', 'rendered_sha256', 'context',
            ],
            properties: {
              id: { type: 'string' },
              document: { type: 'string' },
              version: { type: 'string' },
              action: policyAction,
              method: { type: 'string' },
              surface: { type: 'string' },
              at: { type: 'string' },
              client_recorded_at: { type: ['string', 'null'] },
              app_version: { type: 'string' },
              platform: { enum: ['ios', 'android', 'web'] },
              locale: { type: ['string', 'null'] },
              rendered_sha256: { anyOf: [sha256, { type: 'null' }] },
              context: { type: 'object' },
            },
          },
        },
      },
      // Only a record that was read carries rows and a read time.
      if: { type: 'object', properties: { status: { const: 'included' } } },
      then: { type: 'object', properties: { read_at: { type: 'string' } } },
      else: { type: 'object', properties: { read_at: { type: 'null' }, current: { type: 'array', maxItems: 0 }, acts: { type: 'array', maxItems: 0 } } },
    },
    dictionaryTerm: {
      type: 'object',
      additionalProperties: false,
      required: ['child_id', 'term', 'kind', 'heard_as', 'source'],
      properties: {
        child_id: { type: ['string', 'null'] },
        term: { type: 'string', minLength: 1 },
        kind: { enum: ['child', 'nickname', 'family', 'word', 'place', 'self'] },
        heard_as: { type: 'array', items: { type: 'string' } },
        source: { enum: ['phone', 'server'] },
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
