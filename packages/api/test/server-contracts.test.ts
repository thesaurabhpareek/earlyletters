/**
 * Type and schema tests for the server-feature contracts (@scribe/api/server):
 * sync v1, family, subscription status, recovery key, push. Fixtures use the
 * fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import { ENDPOINTS, ERROR_DETAILS, failure, newRequestId } from '../src';
import {
  AUTHOR_ONLY_COLUMNS,
  buildPushPayload,
  FIELD_GROUP_COLUMNS,
  FIELD_GROUPS,
  holdUntil,
  INVITE_CODE_RE,
  INVITE_REDEEM_PATH,
  INVITE_TOKEN_RE,
  inviteErrorKindFor,
  inviteTokenHashReference,
  byteaHex,
  isOpenInvite,
  isWordsConflict,
  sendablePrefsKeys,
  sendablePushOpTypes,
  enqueueStatusReport,
  PendingPurchaseSchema,
  reportFromPending,
  parsePullResponse,
  parsePushResponse,
  parseRedeemRequest,
  parseStatusReport,
  passesStepUp,
  PENDING_INVITE_COLUMNS,
  PushPayloadSchema,
  SealedBoxSchema,
  STATUS_REPORT_PATH,
  STATUS_SALT_PATH,
  StatusReportSchema,
  subRefReference,
  SYNC_API_MIN_SUPPORTED,
  SYNC_API_VERSION,
  UnwrapNoticeSchema,
  WORDS_GROUP,
  type EntryUpsertOp,
  type StatusReport,
} from '../server';
import * as v from 'valibot';

const ASHA_CHILD = '0192e000-0000-7000-8000-00000000a5a5';
const ASHA_ENTRY = '0192e000-0000-7000-8000-00000000e001';
const OP = '0192e000-0000-7000-8000-0000000000f1';
const DEVICE = '0192e000-0000-7000-8000-0000000000d1';

describe('[F16-REQ-028] sync wire contract v1', () => {
  it('[F16-REQ-019] carries an API version with N-1 support', () => {
    expect(SYNC_API_VERSION).toBe(1);
    expect(SYNC_API_MIN_SUPPORTED).toBe(SYNC_API_VERSION - 1);
  });

  it('[F16-REQ-011] every column belongs to exactly one field group, and the words group holds the author layer', () => {
    const cols = Object.values(FIELD_GROUP_COLUMNS).flat();
    expect(new Set(cols).size).toBe(cols.length);
    expect(Object.keys(FIELD_GROUP_COLUMNS).sort()).toEqual([...FIELD_GROUPS].sort());
    expect(WORDS_GROUP).toBe('text');
    expect(FIELD_GROUP_COLUMNS.text).toEqual(['final_text', 'machine_edits', 'edit_level', 'author_edits', 'locked_spans']);
  });

  it('[F11-REQ-085] author-only columns include the v1.0 author layer and the language', () => {
    for (const c of ['raw_transcript', 'machine_edits', 'author_edits', 'locked_spans', 'pack_ref', 'language']) {
      expect(AUTHOR_ONLY_COLUMNS as readonly string[]).toContain(c);
    }
  });

  it('an entry.upsert op type-checks with every v1.0 column (nullable where not used yet)', () => {
    const op: EntryUpsertOp = {
      op: OP, type: 'entry.upsert', id: ASHA_ENTRY, changed: ['text', 'in_book'], base: '812',
      data: {
        id: ASHA_ENTRY, child_id: ASHA_CHILD, kind: 'letter', occurred_on: '2026-10-01', occurred_precision: 'month',
        captured_at: '2026-10-15T19:00:00.000Z', capture_mode: 'spoken', edit_level: 'clean', prompt_key: null,
        engine_version: 6, raw_transcript: 'Asha laughed at the rain', machine_edits: [], final_text: 'Asha laughed at the rain.',
        author_edits: [{ start: 0, end: 4, replacement: 'Asha' }], locked_spans: [], pack_ref: 'en@1.0.0', in_book: true,
        sounds_like_me: null, author_signs_as: 'Papa', audio_kept_on_device: true, language: 'en', base_direction: 'ltr',
      },
    };
    expect(op.changed).toContain('text');
  });

  it('parses a push response with a words conflict (planned fields) and ignores unknown keys', () => {
    const r = parsePushResponse({
      results: [
        { op: OP, ok: true, applied: true, conflict: true, conflict_groups: ['text'],
          current: { final_text: 'Asha laughed.', machine_edits: [], edit_level: 'clean', v: '900' },
          entry: { id: ASHA_ENTRY, v: '900', updated_at: '2026-10-15T19:00:01Z', deleted_at: null, in_book: true, approval: 'not_needed' },
          something_new: 1 },
        { op: '0192e000-0000-7000-8000-0000000000f2', ok: false, code: 'SCDEL', gone: true },
      ],
      paused: false, stopped: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(isWordsConflict(r.value.results[0])).toBe(true);
    expect(isWordsConflict(r.value.results[1])).toBe(false);
    expect('something_new' in r.value.results[0]).toBe(false);
  });

  it('[DATA-REQ-043] refuses a push error result that carries a message instead of a SQLSTATE', () => {
    expect(parsePushResponse({ results: [{ op: OP, ok: false, code: 'row Asha is bad' }], paused: false, stopped: false }).ok).toBe(false);
  });

  it('parses an own row exactly as S02\'s sync_pull sends it: null author layer, photo_path, prompt_library_version', () => {
    const row = {
      id: ASHA_ENTRY, child_id: ASHA_CHILD, author_id: '11111111-1111-4111-8111-111111111111', author_signs_as: 'Papa', kind: 'letter',
      occurred_on: '2026-10-01', captured_at: '2026-10-15T19:00:00Z', capture_mode: 'spoken', edit_level: 'clean', prompt_key: null,
      prompt_library_version: null, engine_version: 6, raw_transcript: 'Asha laughed', machine_edits: [], final_text: 'Asha laughed.',
      in_book: true, sounds_like_me: null, approval: 'not_needed', photo_path: null, audio_kept_on_device: true, language: null,
      created_at: '2026-10-15T19:00:00Z', updated_at: '2026-10-15T19:00:00Z', deleted_at: null, own: true,
      occurred_precision: 'day', base_direction: 'ltr', author_edits: null, locked_spans: null, pack_ref: null, v: '812',
    };
    const r = parsePullResponse({ reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z', books: [
      { id: ASHA_CHILD, access: 'parent', repull: false, meta_hash: 'x', rows: [row], cursor: null, more: false },
    ] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.books![0].rows[0]).toEqual(row);
  });

  it('[DATA-REQ-043] a malformed op gets a result with op null, and the batch still parses', () => {
    const r = parsePushResponse({ results: [{ op: null, ok: false, code: '22023' }, { op: OP, ok: true, applied: true }], paused: false, stopped: false });
    expect(r.ok).toBe(true);
  });

  it('as built, conflict without conflict_groups is advisory, not a words conflict', () => {
    const r = parsePushResponse({ results: [{ op: OP, ok: true, applied: true, conflict: true }], paused: false, stopped: false });
    expect(r.ok && isWordsConflict(r.value.results[0])).toBe(false);
    expect(sendablePushOpTypes()).not.toContain('held.upsert');
    expect(sendablePrefsKeys()).toEqual(['signs_as', 'include_in_reminders']);
  });

  it('parses a pull response with the planned held section', () => {
    const r = parsePullResponse({
      reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z', books: [], gone: [],
      held: { rows: [], cursor: null, more: false },
    });
    expect(r.ok).toBe(true);
    expect(parsePullResponse({ reset: 'no' }).ok).toBe(false);
  });
});

describe('[WP-F11-04] family contracts', () => {
  it('[F11-REQ-026] maps SCCAP to book_full and splits SCINV by detail only', () => {
    expect(inviteErrorKindFor('SCCAP', '2')).toBe('book_full');
    expect(inviteErrorKindFor('SCCON', 'family-share')).toBe('family_share_consent');
    expect(inviteErrorKindFor('SCCON', 'terms,sensitive-data')).toBe('consent_needed');
    expect(inviteErrorKindFor('SCINV', 'expired')).toBe('expired');
    expect(inviteErrorKindFor('SCINV', 'code_taken')).toBe('code_taken');
    expect(inviteErrorKindFor('SCINV', 'invite expired for Asha')).toBe('not_found');
    expect(inviteErrorKindFor('SCINV', null)).toBe('not_found');
    expect(inviteErrorKindFor('SCRAT')).toBe('rate_limited');
    expect(inviteErrorKindFor('XX000')).toBe('unknown');
  });

  it('[F11-REQ-002] codes are 8 Crockford base32 characters; tokens are device-made 32 bytes or the built 64 hex', () => {
    expect(INVITE_CODE_RE.test('7K3M9QXZ')).toBe(true);
    for (const bad of ['7k3m9qxz', '7K3M-9QXZ', 'OILU1234', '7K3M9QX']) expect(INVITE_CODE_RE.test(bad)).toBe(false);
    expect(INVITE_TOKEN_RE.test('A'.repeat(43))).toBe(true);
    expect(INVITE_TOKEN_RE.test('a'.repeat(64))).toBe(true);
    expect(INVITE_TOKEN_RE.test('asha-invite-token-fixture-7f3a9c')).toBe(false);
  });

  it('[B-NFR-002] the token hash is SHA-256 of the token text as UTF-8, as the SQL hashes p_token', async () => {
    const token = 'A'.repeat(43);
    const h = await inviteTokenHashReference(token);
    // Known vector: sha256 of the 43 ASCII characters, the bytes convert_to(p_token, 'UTF8') produces (not 32 decoded bytes).
    expect(h).toBe('0f007385b6f9d4b7eeb2748605afe1a984a0a3bfa3f014d09e2a784ce9e5cd1a');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    await expect(inviteTokenHashReference('short')).rejects.toThrow();
    expect(byteaHex(h)).toBe(`\\x${h}`);
  });

  it('[F11-REQ-007] the redeem request is strict: code, mode and a device id, nothing else', () => {
    expect(parseRedeemRequest({ code: '7K3M9QXZ', mode: 'peek', device: DEVICE }).ok).toBe(true);
    expect(parseRedeemRequest({ code: '7K3M9QXZ', mode: 'accept', device: DEVICE, child: ASHA_CHILD }).ok).toBe(false);
    expect(parseRedeemRequest({ code: '7K3M9QXZ', mode: 'join', device: DEVICE }).ok).toBe(false);
    expect(INVITE_REDEEM_PATH).toBe(ENDPOINTS.inviteRedeem.path);
  });

  it('[F11-REQ-019] pending invites never select a hash; open means not used, revoked or expired', () => {
    expect(PENDING_INVITE_COLUMNS.join(',')).not.toMatch(/hash|token|code/);
    const now = new Date('2026-10-15T12:00:00Z');
    expect(isOpenInvite({ accepted_at: null, revoked_at: null, expires_at: '2026-10-20T00:00:00Z' }, now)).toBe(true);
    expect(isOpenInvite({ accepted_at: null, revoked_at: null, expires_at: '2026-10-14T00:00:00Z' }, now)).toBe(false);
    expect(isOpenInvite({ accepted_at: '2026-10-15T00:00:00Z', revoked_at: null, expires_at: '2026-10-20T00:00:00Z' }, now)).toBe(false);
  });
});

const report: StatusReport = {
  schema_version: 1,
  sub_ref: 'a'.repeat(64),
  environment: 'production',
  plan: 'annual',
  trial_end: '2026-10-22T19:00:00.000Z',
  renewal_date: '2026-10-22T19:00:00.000Z',
  cancelled: false,
  free_period_days: 7,
  reported_at: '2026-10-15T19:00:00.000Z',
  consent: { product_id: 'plus.annual', offer_type: 'introductory', terms_version: '1.4.0', shown_at: '2026-10-15T18:59:00.000Z' },
};

describe('[D-080] subscription status report and [D-081] consent record', () => {
  it('[F14-REQ-032] accepts the D-080 fields with sub_ref and environment (R2 AR-13)', () => {
    expect(parseStatusReport(report).ok).toBe(true);
    expect(STATUS_REPORT_PATH).toBe(ENDPOINTS.statusReport.path);
    expect(STATUS_SALT_PATH).toBe(ENDPOINTS.statusSalt.path);
  });

  it('[F14-REQ-014] refuses any extra key, so purchase data can never be stored by accident', () => {
    for (const extra of [{ original_transaction_id: '2000000123456789' }, { price: 49.99 }, { receipt: 'MIIT' }, { jws: 'eyJ' }, { app_account_token: 'x' }]) {
      expect(parseStatusReport({ ...report, ...extra }).ok).toBe(false);
    }
    expect(parseStatusReport({ ...report, consent: { ...report.consent, price: '49.99' } }).ok).toBe(false);
  });

  it('[F14-REQ-014] no key of the schema looks like purchase data', () => {
    const keys = [...Object.keys(StatusReportSchema.entries), ...Object.keys(report.consent!)];
    for (const k of keys) expect(k).not.toMatch(/transaction|receipt|jws|price|amount|card|token|currency/i);
  });

  it('[F14-REQ-044] an outside offer code records none_outside_app; a bad version is refused', () => {
    expect(parseStatusReport({ ...report, consent: { ...report.consent!, offer_type: 'offer_code', terms_version: 'none_outside_app' } }).ok).toBe(true);
    expect(parseStatusReport({ ...report, consent: { ...report.consent!, terms_version: 'latest' } }).ok).toBe(false);
    expect(parseStatusReport({ ...report, environment: 'staging' }).ok).toBe(false);
  });

  it('[F14-REQ-043] the outbox keeps one report per purchase: newest status, first consent, never another purchase\'s', () => {
    const later: StatusReport = { ...report, cancelled: true, reported_at: '2026-10-16T08:00:00.000Z', consent: undefined };
    const q1 = enqueueStatusReport([report], later);
    expect(q1).toHaveLength(1);
    expect(q1[0].cancelled).toBe(true);
    expect(q1[0].consent).toEqual(report.consent);
    expect(enqueueStatusReport([later], report)[0].cancelled).toBe(true);
    const other: StatusReport = { ...report, sub_ref: 'b'.repeat(64), consent: { ...report.consent!, product_id: 'plus.monthly' } };
    const q2 = enqueueStatusReport([report], other);
    expect(q2).toHaveLength(2);
    expect(q2.map((r) => r.consent?.product_id)).toEqual(['plus.annual', 'plus.monthly']);
  });

  it('[F14-REQ-043] signed out, the consent moment waits under an opaque handle until the salt exists', () => {
    const pending = { local_ref: '0192e000-0000-7000-8000-0000000000aa', consent: report.consent!, queued_at: '2026-10-15T19:00:00.000Z' };
    expect(v.safeParse(PendingPurchaseSchema, pending).success).toBe(true);
    expect(v.safeParse(PendingPurchaseSchema, { ...pending, original_transaction_id: '2000000123456789' }).success).toBe(false);
    const { schema_version: _s, consent: _c, ...status } = report;
    const built = reportFromPending(pending, status);
    expect(parseStatusReport(built).ok).toBe(true);
    expect(built.consent).toEqual(report.consent);
  });

  it('sub_ref is SHA-256 of the salt bytes then the transaction id (reference for the Swift side)', async () => {
    const salt = 'A'.repeat(43);
    const a = await subRefReference(salt, '2000000123456789');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await subRefReference(salt, '2000000123456789')).toBe(a);
    expect(await subRefReference('B'.repeat(43), '2000000123456789')).not.toBe(a);
    expect(a).not.toContain('2000000123456789');
  });
});

describe('[F08 6.5] recovery-key contract', () => {
  it('[F08 6.5 C2] holds 72 hours with another enrolled device, 24 without', () => {
    const t = new Date('2026-10-15T12:00:00Z');
    expect(holdUntil(t, true).toISOString()).toBe('2026-10-18T12:00:00.000Z');
    expect(holdUntil(t, false).toISOString()).toBe('2026-10-16T12:00:00.000Z');
  });

  it('[F08 6.5 C1] step-up: a sign-in at most 10 minutes old', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const s = now.getTime() / 1000;
    expect(passesStepUp(s - 599, now)).toBe(true);
    expect(passesStepUp(s - 601, now)).toBe(false);
    expect(passesStepUp(null, now)).toBe(false);
  });

  it('a sealed box is HPKE X25519 with a 32-byte encapsulated key, and nothing else', () => {
    const box = { suite: 'hpke-x25519-sha256-aes256gcm', enc: `${'A'.repeat(43)}=`, ct: 'A'.repeat(64) };
    expect(v.safeParse(SealedBoxSchema, box).success).toBe(true);
    expect(v.safeParse(SealedBoxSchema, { ...box, key: 'plaintext' }).success).toBe(false);
    expect(v.safeParse(SealedBoxSchema, { ...box, suite: 'aes' }).success).toBe(false);
  });

  it('[M16] the unwrap notice is content-free: kind, time, a count, and for a request the Stop link', () => {
    const ok = { kind: 'restore_requested', occurred_at: '2026-10-15T12:00:00Z', books: 0, hold_until: '2026-10-18T12:00:00Z', stop_url: `https://earlyletters.com/stop#${'A'.repeat(43)}` };
    expect(v.safeParse(UnwrapNoticeSchema, ok).success).toBe(true);
    expect(v.safeParse(UnwrapNoticeSchema, { ...ok, child_name: 'Asha' }).success).toBe(false);
    expect(v.safeParse(UnwrapNoticeSchema, { ...ok, stop_url: 'https://earlyletters.com/stop?token=x' }).success).toBe(false);
  });
});

describe('[F11-REQ-084] push payloads carry no content', () => {
  it('holds only kind, title and body', () => {
    const p = buildPushPayload('co_parent_letter', 'A new letter in the book', 'Open the app to read it.');
    expect(p.aps['interruption-level']).toBe('passive');
    expect(v.safeParse(PushPayloadSchema, p).success).toBe(true);
    expect(v.safeParse(PushPayloadSchema, { ...p, child_id: ASHA_CHILD }).success).toBe(false);
    expect(buildPushPayload('restore_request', 't', 'b').aps['interruption-level']).toBe('time-sensitive');
  });
});

describe('[ADR-0017] versioned errors carry closed details only', () => {
  it('drops a detail that is not in the closed list', () => {
    const id = newRequestId();
    expect(failure({ code: 'invite_unusable', retryable: false, detail: 'expired' }, id).error.detail).toBe('expired');
    expect(failure({ code: 'invite_unusable', retryable: false, detail: 'Asha' as never }, id).error).not.toHaveProperty('detail');
    expect(ERROR_DETAILS.every((d) => /^[a-zA-Z-_]+$/.test(d))).toBe(true);
  });
});
