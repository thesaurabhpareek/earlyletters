/**
 * Type and schema tests for the server-feature contracts (@scribe/api/server):
 * sync v1, family, subscription status, recovery key, push. Fixtures use the
 * fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import { classifySqlstate, ENDPOINTS, ERROR_DETAILS, failure, newRequestId } from '../src';
import {
  AUTHOR_ONLY_COLUMNS,
  buildPushPayload,
  FIELD_GROUP_COLUMNS,
  FIELD_GROUPS,
  holdUntil,
  ESCROW_ERROR_DETAILS,
  currentEscrowKey,
  newestAmrTimestamp,
  parseEscrowKeys,
  SEAL_INFO,
  sealAad,
  CreateRequestResultSchema,
  INVITE_CODE_RE,
  INVITE_REDEEM_PATH,
  INVITE_TOKEN_RE,
  inviteErrorKindFor,
  inviteTokenHashReference,
  byteaHex,
  isOpenInvite,
  isWordsConflict,
  parseSyncBooks,
  pushBatchBytes,
  PUSH_OP_TYPES,
  sendablePrefsKeys,
  sendablePushOpTypes,
  enqueueStatusReport,
  settleQueued,
  PendingPurchaseSchema,
  pendingMatches,
  reportFromPending,
  parsePullResponse,
  parsePushResponse,
  parseRedeemRequest,
  parseStatusReport,
  passesStepUp,
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

  it('parses an own row exactly as S02\'s sync_pull sends it: null author layer, photo_path, prompt_library_version, the review mark', () => {
    const row = {
      id: ASHA_ENTRY, child_id: ASHA_CHILD, author_id: '11111111-1111-4111-8111-111111111111', author_signs_as: 'Papa', kind: 'letter',
      occurred_on: '2026-10-01', captured_at: '2026-10-15T19:00:00Z', capture_mode: 'spoken', edit_level: 'clean', prompt_key: null,
      prompt_library_version: null, engine_version: 6, raw_transcript: 'Asha laughed', machine_edits: [], final_text: 'Asha laughed.',
      in_book: true, sounds_like_me: null, approval: 'not_needed', photo_path: null, audio_kept_on_device: true, language: null,
      created_at: '2026-10-15T19:00:00Z', updated_at: '2026-10-15T19:00:00Z', deleted_at: null, own: true,
      occurred_precision: 'day', base_direction: 'ltr', author_edits: null, locked_spans: null, pack_ref: null,
      words_reviewed_at: '2026-10-15T19:00:05Z', v: '812',
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
    // notify_letters is built (20261015030000); hidden and quiet are still planned, so never sent.
    expect(sendablePrefsKeys()).toEqual(['signs_as', 'include_in_reminders', 'notify_letters']);
  });

  it('[F16-REQ-024] the erase op and the held ops are built (20261016000000), so they are sendable; the drift test proves sync_push parses each', () => {
    expect(PUSH_OP_TYPES).toContain('entry.erase');
    for (const t of ['entry.erase', 'held.upsert', 'held.discard'] as const) expect(sendablePushOpTypes()).toContain(t);
    expect(sendablePushOpTypes()).toEqual([...PUSH_OP_TYPES]);
  });

  it('[F16-REQ-010] a words refusal is conflict_groups with text, with or without conflict: a duplicate, a refused held.upsert, a refused Keep and its repeat', () => {
    const entry = { id: ASHA_ENTRY, v: '900', updated_at: '2026-10-15T19:00:01Z', deleted_at: null, in_book: true, approval: 'not_needed' };
    const r = parsePushResponse({
      results: [
        // A duplicate of a refused entry.upsert (dup_outcome): no conflict key.
        { op: OP, ok: true, dup: true, entry, conflict_groups: ['text'], current: { final_text: 'Asha laughed.', machine_edits: [], edit_level: 'clean', v: '900' } },
        // A refused held.upsert (held_state): the held words, which may have none yet, and typed_text.
        { op: OP, ok: true, held: { id: ASHA_ENTRY, v: '41', updated_at: '2026-10-15T19:00:02Z' }, conflict_groups: ['text'],
          current: { final_text: null, machine_edits: null, edit_level: null, typed_text: 'Asha found the puddle first', v: '41' } },
        // A refused Keep (keep_check): no letter, the held row stays, and conflict: true.
        { op: OP, ok: true, applied: false, conflict: true, entry: null, held: { id: ASHA_ENTRY, v: '41', updated_at: '2026-10-15T19:00:02Z' },
          conflict_groups: ['text'], current: { final_text: 'Asha found the puddle first.', machine_edits: [], edit_level: 'clean', typed_text: null, v: '41' } },
        // Its repeat (dup_answer, then held_state): the same refusal, conflict: true again.
        { op: OP, ok: true, dup: true, applied: false, conflict: true, entry: null, held: { id: ASHA_ENTRY, v: '41', updated_at: '2026-10-15T19:00:02Z' },
          conflict_groups: ['text'], current: { final_text: 'Asha found the puddle first.', machine_edits: [], edit_level: 'clean', typed_text: null, v: '41' } },
      ],
      paused: false, stopped: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const x of r.value.results) expect(isWordsConflict(x)).toBe(true);
    const held = r.value.results[1];
    expect(held.ok && held.current?.typed_text).toBe('Asha found the puddle first');
  });

  it('[F16 6.2 I] held and erase answers as built: held null, held_off, kept, erased, deferred, missing', () => {
    const r = parsePushResponse({
      results: [
        { op: OP, ok: true, held: null },
        { op: OP, ok: true, applied: false, held_off: true },
        { op: OP, ok: true, kept: true },
        { op: OP, ok: true, erased: true },
        { op: OP, ok: true, deferred: true },
        { op: OP, ok: true, missing: true },
      ],
      paused: false, stopped: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.results.map((x) => (x.ok ? [x.held, x.held_off, x.kept, x.erased, x.deferred, x.missing] : null))).toEqual([
      [null, undefined, undefined, undefined, undefined, undefined],
      [undefined, true, undefined, undefined, undefined, undefined],
      [undefined, undefined, true, undefined, undefined, undefined],
      [undefined, undefined, undefined, true, undefined, undefined],
      [undefined, undefined, undefined, undefined, true, undefined],
      [undefined, undefined, undefined, undefined, undefined, true],
    ]);
    for (const x of r.value.results) expect(isWordsConflict(x)).toBe(false);
  });

  it('[F16-REQ-024] an erased held marker parses; an unknown marker is dropped and counted, never adopted', () => {
    const pull = (gone: string) => parsePullResponse({
      reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z',
      held: { rows: [{ id: ASHA_ENTRY, gone, updated_at: '2026-10-15T19:00:00Z', v: '9' }], cursor: '9', more: false },
    });
    for (const g of ['discarded', 'kept', 'erased']) {
      const r = pull(g);
      expect(r.ok && r.value.held, g).toMatchObject({ rows: [{ id: ASHA_ENTRY, gone: g }], rejected: 0 });
    }
    const unknown = pull('vanished');
    expect(unknown.ok && unknown.value.held).toEqual({ rows: [], cursor: '9', more: false, rejected: 1 });
  });

  it('[F16 6.2 I] one malformed held row is dropped and counted; the good rows and the books still parse (review A 3 on #138)', () => {
    const book = { id: ASHA_CHILD, access: 'parent', repull: false, meta_hash: 'x', rows: [], cursor: '20:0', more: false };
    const draft = {
      id: ASHA_ENTRY, child_id: ASHA_CHILD, kind: 'held_letter', capture_mode: 'typed', created_at: '2026-10-15T19:00:00Z',
      occurred_on: '2026-10-15', occurred_precision: 'day', language: null, base_direction: 'ltr', prompt_key: null, in_book_choice: true,
      raw_transcript: null, final_text: null, machine_edits: null, edit_level: null, author_edits: null, locked_spans: null,
      typed_text: 'Asha found the puddle first', engine_version: null, pack_ref: null, audio_kept_on_device: false,
      updated_at: '2026-10-15T19:00:01Z', v: '12',
    };
    const marker = { id: '0192e000-0000-7000-8000-00000000e002', gone: 'discarded', updated_at: '2026-10-15T19:00:02Z', v: '13' };
    // held_drafts checks neither column (20261016000000), so a phone can store these through held.upsert.
    const badMode = { ...draft, id: '0192e000-0000-7000-8000-00000000e0b1', capture_mode: 'dictated', typed_text: 'Asha splashed in the big puddle' };
    const badEdits = { ...draft, id: '0192e000-0000-7000-8000-00000000e0b2', author_edits: {}, typed_text: 'Asha splashed in the big puddle' };
    const r = parsePullResponse({
      reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z', books: [book], gone: [],
      held: { rows: [draft, badMode, marker, badEdits, null], cursor: '14:0', more: false },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.books).toEqual([book]);
    expect(r.value.held).toEqual({ rows: [draft, marker], cursor: '14:0', more: false, rejected: 3 });
    // The report is a count: nothing of a dropped row (its id or its words) is in the result.
    const out = JSON.stringify(r.value);
    for (const s of ['Asha splashed in the big puddle', 'e0b1', 'e0b2', 'dictated']) expect(out).not.toContain(s);
    // The envelope is still strict: a held section without its rows array is refused.
    expect(parsePullResponse({ reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z', held: { rows: {}, cursor: null, more: false } }).ok).toBe(false);
  });

  it('[M17] the review mark travels on own rows and in entry.upsert, author-only', () => {
    expect(AUTHOR_ONLY_COLUMNS as readonly string[]).toContain('words_reviewed_at');
    const op: EntryUpsertOp = {
      op: OP, type: 'entry.upsert', id: ASHA_ENTRY, changed: ['text'], base: null, held_base: '41',
      data: {
        id: ASHA_ENTRY, child_id: ASHA_CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: '2026-10-15T19:00:00.000Z',
        capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 6, raw_transcript: 'Asha found the puddle first.',
        machine_edits: [], final_text: 'Asha found the puddle first.', in_book: true, sounds_like_me: null, author_signs_as: 'Papa',
        audio_kept_on_device: false, words_reviewed_at: '2026-10-15T19:00:05.000Z',
      },
    };
    expect(op.data.words_reviewed_at).toBe('2026-10-15T19:00:05.000Z');
  });

  it('[F16-REQ-025] held_base is sent only on a Keep, always with a value: its presence alone makes the op a Keep (review A 5 on #138)', () => {
    const data: EntryUpsertOp['data'] = {
      id: ASHA_ENTRY, child_id: ASHA_CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: '2026-10-15T19:00:00.000Z',
      capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 6, raw_transcript: 'Asha found the puddle first.',
      machine_edits: [], final_text: 'Asha found the puddle first.', in_book: true, sounds_like_me: null, author_signs_as: 'Papa',
      audio_kept_on_device: false,
    };
    const keep: EntryUpsertOp = { op: OP, type: 'entry.upsert', id: ASHA_ENTRY, changed: ['text'], base: null, held_base: '41', data };
    const edit: EntryUpsertOp = { op: OP, type: 'entry.upsert', id: ASHA_ENTRY, changed: ['text'], base: '812', data };
    expect('held_base' in edit).toBe(false);
    // @ts-expect-error null still makes the op a Keep on the server (counted as 0), so the contract refuses it.
    const nullKeep: EntryUpsertOp = { ...keep, held_base: null };
    expect(nullKeep.held_base).toBeNull();
  });

  it('[F16-REQ-025] applied_v comes only on a duplicate and is a row version; a first answer rebases on entry.v (review A 4 on #138)', () => {
    const entry = { id: ASHA_ENTRY, v: '905', updated_at: '2026-10-15T19:00:03Z', deleted_at: null, in_book: true, approval: 'not_needed' };
    const r = parsePushResponse({
      results: [
        // First answer (sync_push): applied, entry.v is the row version this op wrote; no applied_v.
        { op: OP, ok: true, applied: true, conflict: false, entry: { ...entry, v: '900' } },
        // Its repeat (dup_outcome): the letter as it is now, plus applied_v, the row version the op wrote.
        { op: OP, ok: true, dup: true, entry, applied_v: '900' },
        // A held.upsert's repeat (held_dup): the held row now, plus applied_v.
        { op: OP, ok: true, dup: true, held: { id: ASHA_ENTRY, v: '44', updated_at: '2026-10-15T19:00:04Z' }, applied_v: '41' },
      ],
      paused: false, stopped: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [first, dup, heldDup] = r.value.results;
    expect(first.ok && [first.applied_v, first.entry?.v]).toEqual([undefined, '900']);
    expect(dup.ok && [dup.applied_v, dup.entry?.v]).toEqual(['900', '905']);
    expect(heldDup.ok && heldDup.applied_v).toBe('41');
  });

  it('[F16-REQ-029] a held tombstone carries only id, gone, updated_at and v, and the pull still parses', () => {
    const r = parsePullResponse({
      reset: false, epoch: 1, epoch_started_at: '2026-10-01T00:00:00Z',
      held: { rows: [{ id: ASHA_ENTRY, gone: 'discarded', updated_at: '2026-10-15T19:00:00Z', v: '9' }], cursor: '9', more: false },
    });
    expect(r.ok).toBe(true);
  });

  it('[F16 6.2 D] parses sync_books as built, with the pending invites parents see', () => {
    const r = parseSyncBooks({
      epoch: 1, first_run_open: false,
      books: [{
        id: ASHA_CHILD, role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null,
        family_can_read: false, created_by_me: true, joined_at: '2026-03-02T00:00:00Z', auto_add: true, my_signs_as: 'Papa',
        members: [{ profile_id: '11111111-1111-4111-8111-111111111111', role: 'parent', is_me: true, joined_at: '2026-03-02T00:00:00Z', auto_add: true, signs_as: 'Papa' }],
        invites: [{ id: '0192e000-0000-7000-8000-0000000000c1', role: 'parent', signs_as: null, created_at: '2026-10-10T00:00:00Z', expires_at: '2026-10-17T00:00:00Z', status: 'open' }],
      }],
    });
    expect(r.ok).toBe(true);
  });

  it('[F16-REQ-002] the batch size is counted as Postgres counts octet_length(p_ops::text), not in UTF-16 units', () => {
    const ops = [
      { op: OP, type: 'entry.upsert', id: ASHA_ENTRY, changed: ['text'], base: null,
        data: { final_text: 'आशा बारिश पर हँसी।', machine_edits: [{ a: 1, b: [true, null, 2.5] }], in_book: true, empty: {}, list: [] } },
      { op: OP, type: 'entry.delete', id: ASHA_ENTRY, data: {} },
    ];
    // 454: measured with PGlite 0.5.8 (`select octet_length($1::jsonb::text)`) on 15 Oct 2026; JSON.stringify gives 391 UTF-16 units.
    expect(pushBatchBytes(ops as never)).toBe(454);
    expect(JSON.stringify(ops).length).toBe(391);
  });

  it('parses a pull response with the held section as built: rows, cursor and more, no digest', () => {
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

  it('[F11-REQ-019] pending invites come from sync_books; open means status open and not past expiry', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    expect(isOpenInvite({ status: 'open', expires_at: '2026-10-20T00:00:00Z' }, now)).toBe(true);
    expect(isOpenInvite({ status: 'open', expires_at: '2026-10-14T00:00:00Z' }, now)).toBe(false);
    expect(isOpenInvite({ status: 'expired', expires_at: '2026-10-20T00:00:00Z' }, now)).toBe(false);
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
  consent: { product_id: 'plus.annual', offer_type: 'introductory', terms_shown: '1.4.0', shown_at: '2026-10-15T18:59:00.000Z' },
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

  it('[F14-REQ-044] a win-back offer reports as itself (S06 #178)', () => {
    expect(parseStatusReport({ ...report, consent: { ...report.consent!, offer_type: 'win_back' } }).ok).toBe(true);
  });

  it('[F14-REQ-044] an outside offer code records none_outside_app; a bad version is refused', () => {
    expect(parseStatusReport({ ...report, consent: { ...report.consent!, offer_type: 'offer_code', terms_shown: 'none_outside_app' } }).ok).toBe(true);
    expect(parseStatusReport({ ...report, consent: { ...report.consent!, terms_shown: 'latest' } }).ok).toBe(false);
    expect(parseStatusReport({ ...report, environment: 'staging' }).ok).toBe(false);
  });

  it('[F14-REQ-043] the outbox keeps one report per purchase: newest status, first consent, never another purchase\'s', () => {
    let n = 0;
    const key = () => `0192e000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
    const q0 = enqueueStatusReport([], report, key);
    const later: StatusReport = { ...report, cancelled: true, reported_at: '2026-10-16T08:00:00.000Z', consent: undefined };
    const q1 = enqueueStatusReport(q0, later, key);
    expect(q1).toHaveLength(1);
    expect(q1[0].report.cancelled).toBe(true);
    expect(q1[0].report.consent).toEqual(report.consent);
    expect(q1[0].idempotency_key).not.toBe(q0[0].idempotency_key);
    expect(enqueueStatusReport(q1, report, key)[0].report.cancelled).toBe(true);
    expect(enqueueStatusReport(q1, q1[0].report, key)[0].idempotency_key).toBe(q1[0].idempotency_key);
    const other: StatusReport = { ...report, sub_ref: 'b'.repeat(64), consent: { ...report.consent!, product_id: 'plus.monthly' } };
    const q2 = enqueueStatusReport(q1, other, key);
    expect(q2.map((r) => r.report.consent?.product_id)).toEqual(['plus.annual', 'plus.monthly']);
  });

  it('[F14-REQ-043] an answer for an old key never drops a body merged while it was in flight', () => {
    let n = 0;
    const key = () => `0192e000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
    const q0 = enqueueStatusReport([], report, key);
    const sent = q0[0].idempotency_key;
    const q1 = enqueueStatusReport(q0, { ...report, cancelled: true, reported_at: '2026-10-16T08:00:00.000Z' }, key);
    expect(settleQueued(q1, sent)).toHaveLength(1);
    expect(settleQueued(q1, q1[0].idempotency_key)).toHaveLength(0);
  });

  it('subscribed_since is a date only', () => {
    expect(parseStatusReport({ ...report, subscribed_since: '2025-03-01' }).ok).toBe(true);
    expect(parseStatusReport({ ...report, subscribed_since: '2025-03-01T10:00:00Z' }).ok).toBe(false);
  });

  it('[F14-REQ-043] signed out, the consent moment waits keyed by product and first-purchase time until the salt exists', () => {
    const pending = { product_id: 'plus.annual', first_purchase_at: '2026-10-15T18:59:00.000Z', consent: report.consent!, queued_at: '2026-10-15T19:00:00.000Z' };
    expect(v.safeParse(PendingPurchaseSchema, pending).success).toBe(true);
    expect(v.safeParse(PendingPurchaseSchema, { ...pending, original_transaction_id: '2000000123456789' }).success).toBe(false);
    expect(pendingMatches(pending, 'plus.annual', '2026-10-15T18:59:00Z')).toBe(true);
    expect(pendingMatches(pending, 'plus.monthly', '2026-10-15T18:59:00Z')).toBe(false);
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

  it('[F08 6.5 C1] step-up reads the newest amr timestamp, which a refresh does not move', () => {
    expect(newestAmrTimestamp([{ method: 'otp', timestamp: 100 }, { method: 'password', timestamp: 300 }])).toBe(300);
    expect(newestAmrTimestamp('x')).toBeNull();
    expect(newestAmrTimestamp([])).toBeNull();
  });

  it('[WP-F08-B8] escrow keys come from the build, one environment, exactly one current; anything else fails closed', () => {
    const k = (version: number, current: boolean, environment = 'production') => ({ version, publicKey: `${'A'.repeat(43)}=`, environment, current });
    expect(parseEscrowKeys(undefined)).toEqual([]);
    expect(parseEscrowKeys('not json')).toEqual([]);
    const two = parseEscrowKeys(JSON.stringify([k(1, true), k(2, false)]));
    expect(currentEscrowKey(two)?.version).toBe(1);
    expect(parseEscrowKeys(JSON.stringify([k(1, true), k(2, true)]))).toEqual([]);
    expect(parseEscrowKeys(JSON.stringify([k(1, true), k(9, false, 'drill')]))).toEqual([]);
    expect(parseEscrowKeys(JSON.stringify([k(1, false)]))).toEqual([]);
    expect(currentEscrowKey([])).toBeNull();
  });

  it('[F08 6.5] HPKE labels and aad match the escrow function; the create answer has its own schema', () => {
    expect(SEAL_INFO.bookKey).toBe('scribe/escrow/book-key/v1');
    expect(sealAad.bookKey('P', 'C', 1, 2)).toBe('p|c|1|2');
    expect(sealAad.release('P', 'D', 'R', 'C', 3)).toBe('p|d|r|c|3');
    const created = { request_id: '0192e000-0000-7000-8000-0000000000aa', state: 'requested', hold_until: '2026-10-18T12:00:00Z', is_this_device: true };
    expect(v.safeParse(CreateRequestResultSchema, created).success).toBe(true);
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

describe('[F08 6.5] the S05 backup-server codes and details', () => {
  it('SCRAT pending, SCIMM restore_open, SCBKO rotation, 28000 session_ended and SCSTP survive the envelope', () => {
    const id = newRequestId();
    for (const detail of ['pending', 'restore_open', 'rotation', 'session_ended'] as const) {
      expect(ERROR_DETAILS).toContain(detail);
      expect(ESCROW_ERROR_DETAILS).toContain(detail);
      expect(failure({ code: 'conflict', retryable: false, detail }, id).error.detail).toBe(detail);
    }
    // As #151's integrated head raises them: 28000 with detail session_ended (Stop link), SCSTP step_up_required.
    expect(classifySqlstate('28000')).toEqual({ code: 'unauthorized', action: 'reauth', retryable: true });
    expect(failure({ code: 'unauthorized', retryable: true, sqlstate: '28000', detail: 'session_ended' }, id).error).toEqual({ code: 'unauthorized', retryable: true, sqlstate: '28000', detail: 'session_ended' });
    expect(classifySqlstate('SCSTP')).toEqual({ code: 'reauth_required', action: 'tell_user', retryable: false });
    expect(classifySqlstate('SCSES').code).toBe('bad_request');
    expect(classifySqlstate('SCBKO')).toEqual({ code: 'paused', action: 'retry', retryable: true });
    expect(classifySqlstate('SCIMM').action).toBe('reject');
    expect(classifySqlstate('SCRAT', 'queue').action).toBe('retry');
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
