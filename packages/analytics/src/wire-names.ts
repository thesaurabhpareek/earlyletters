/**
 * The wire-name mapping table (BL-1255 step 1, CR-212). One row per key of `EVENTS` and `REGISTRY`, giving the
 * wire name `docs/analytics/instrumentation/posthog-standard.md` section 2.9 decides for it, or marking the row
 * NEEDS RULING with the options when 2.9 does not decide. Renders `docs/analytics/instrumentation/WIRE-NAMES.md`.
 *
 * This file renames nothing. No call site, catalogue row, registry row or property reads it; it is a bridge for the
 * rename PRs (step 2) and for privacy's review (step 3). A key with no row here fails `test/wire-names.test.ts`, so a
 * new event cannot be added without a decision about its wire name. Keep this module out of `index.ts`: the app has
 * no use for it.
 */
import { EVENTS } from './catalog';
import { AREAS, ID_ROWS } from './ids';
import { REGISTRY } from './registry';

export const WIRE_NAMES_PATH = 'docs/analytics/instrumentation/WIRE-NAMES.md';

/** The closed verb list of standard section 2.4: fourteen of PostHog's plus nine deviations. */
export const WIRE_VERBS = [
  'click', 'submit', 'create', 'view', 'add', 'invite', 'update', 'delete', 'remove', 'start', 'end', 'cancel', 'fail', 'send',
  'save', 'complete', 'measure', 'open', 'restore', 'accept', 'decline', 'dismiss', 'reach',
] as const;

/** Section 2.2 grammar, with the nine areas of 2.3 (the `_v2` version suffix is not used by any row here). */
export const WIRE_NAME_RE = new RegExp(`^(${AREAS.join('|')}):[a-z][a-z0-9]*(_[a-z0-9]+)*_(${WIRE_VERBS.join('|')})$`);
export const WIRE_NAME_MAX = 60;

export type RowKind =
  | { status: 'ruled'; wire: string; basis: string }
  /** The one key stands for a family of names generated per registered id (2.9, "Basics"). */
  | { status: 'pattern'; suffix: 'screen_view' | 'click' | 'view' | 'measure'; idKind: 'screen' | 'control' | 'element' | 'metric'; basis: string }
  /** 2.9 does not decide. `options` are candidates for the ruling, not decisions; `why` says what is missing. */
  | { status: 'needs_ruling'; why: string; options: readonly string[] };

const S = '2.9 domain table';
const ruled = (wire: string, basis: string): RowKind => ({ status: 'ruled', wire, basis });
const ask = (why: string, ...options: string[]): RowKind => ({ status: 'needs_ruling', why, options });
const NO_ROW = 'no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4';
const NO_AREA = 'the catalogue area is not one of the nine categories of 2.3';

/** Hand-decided rows, in catalogue order then registry-only. The generator checks that this covers every key exactly once. */
export const WIRE_ROWS: Readonly<Record<string, RowKind>> = {
  // app
  app_cold_start: ask('2.9 has no cold-start row (`perf.cold_start` is a perf metric, `system.app.opened` is app_opened)', 'system:app_start', '(none): perf `cold_start` already measures it'),
  app_opened: ruled('system:app_open', `${S}: \`system.app.opened\``),
  app_backgrounded: ask('2.9 has `system.session.ended` (`system:session_end`), which fits only if this event is that one', 'system:session_end', 'system:app_end'),
  screen_view: { status: 'pattern', suffix: 'screen_view', idKind: 'screen', basis: '2.9 Basics: `<area>:<screen_id>_screen_view`' },
  // consent
  analytics_opted_in: ruled('system:analytics_consent_accept', `${S}: \`system.consent.granted\` ("duplicates \`analytics_opted_in\`, so one event")`),
  // entry
  auth_sheet_shown: ask(`${NO_ROW}`, 'onboarding:sign_in_sheet_view'),
  auth_method_selected: ask(`${NO_ROW}`, 'onboarding:sign_in_method_update', 'onboarding:sign_in_method_submit'),
  auth_succeeded: ruled('onboarding:sign_in_complete', `${S}: \`onboarding.sign_in.completed\``),
  auth_failed: ruled('onboarding:sign_in_fail', `${S}: \`onboarding.sign_in.failed\``),
  auth_email_sent: ask('2.9 lists `onboarding.email.sent` as (none), server-only; this row says the phone observes the send', 'onboarding:sign_in_email_send', '(none): server-only per 2.9'),
  auth_deferred: ask('2.9 has `onboarding.sign_in.dismissed`; whether "chose Later" is that event is a meaning call', 'onboarding:sign_in_dismiss'),
  signed_out: ask('2.9 has `me.session.closed` (`me:session_end`) but the catalogue event also covers a lost or revoked session', 'me:session_end', 'system:session_end'),
  invite_opened: ruled('family:invite_open', `${S}: \`family.invite.opened\` (phone side)`),
  local_merge_choice: ask(NO_ROW, 'onboarding:local_merge_submit'),
  // children
  child_added: ask('2.9 has `onboarding.book.saved` (`onboarding:book_save`) for the first book only; a later add has no row', 'onboarding:book_save', 'me:child_add'),
  child_switched: ask('2.9 has `capture.child.selected` (`capture:child_update`), a capture-time choice; this is the book switcher', 'capture:child_update', 'book:child_update'),
  child_setting_changed: ask('2.9 has `me.setting.changed` (`me:setting_update`), already taken by `settings_changed`', 'me:child_setting_update'),
  make_it_yours_card: ask(NO_ROW, 'onboarding:make_it_yours_submit', 'onboarding:make_it_yours_dismiss'),
  goals_set: ask(NO_ROW, 'me:goals_update', 'onboarding:goals_save'),
  dictionary_term_added: ask(NO_ROW, 'me:dictionary_term_add', 'capture:dictionary_term_add'),
  // capture
  capture_started: ruled('capture:take_start', '2.9 line 118, the seven examples: `capture_started` to `capture:take_start` (note: the table also holds `capture.letter.started`, `capture:letter_start`)'),
  capture_discarded: ask('2.9 holds both `capture.take.discarded` (`capture:take_cancel`) and `capture.letter.discarded` (`capture:letter_cancel`); the catalogue says "a letter in progress", while `capture_started` is a take', 'capture:take_cancel', 'capture:letter_cancel'),
  transcription_completed: ruled('capture:transcript_complete', `${S}: \`capture.transcript.completed\` (this key also carries failed and no-speech outcomes as a property)`),
  letter_saved: ruled('capture:letter_save', '2.9 line 118, the seven examples'),
  review_action: ask('2.9 has `capture.review.selected` (`capture:review_update`); this key carries several actions', 'capture:review_update', 'capture:review_submit'),
  machine_edit_reverted: ask('2.9 has `capture.edit.discarded` and `keeping.version.restored`; "undo one machine edit" fits either', 'capture:edit_cancel', 'keeping:version_restore'),
  machine_edit_rejected: ask('2.9 has `capture.edit.declined` (`capture:edit_decline`); unclear whether that is the verifier refusing', 'capture:edit_decline'),
  letter_deleted: ruled('keeping:letter_delete', `${S}: \`keeping.letter.deleted\` (the catalogue row also covers restore, which 2.9 names \`keeping:letter_restore\`; any split is a property question for the rename PR)`),
  // languages
  language_set: ruled('me:language_update', `${S}: \`me.language.changed\``),
  pack_download: ask('2.9 has only `system.pack.started` (`system:pack_start`); the catalogue row carries every state change', 'system:pack_start', 'system:pack_complete'),
  // book
  book_opened: ask(NO_ROW, 'book:book_view'),
  letter_opened: ask(NO_ROW, 'book:letter_view', 'book:letter_open'),
  playback_started: ruled('book:playback_start', `${S}: \`book.playback.started\``),
  read_together_started: ruled('book:read_together_start', `${S}: \`book.read_together.started\``),
  read_together_ended: ruled('book:read_together_end', `${S}: \`book.read_together.ended\``),
  // family
  invite_created: ruled('family:invite_create', '2.9 line 118, the seven examples'),
  invite_accepted: ruled('family:invite_accept', `${S}: \`family.invite.accepted\``),
  invite_failed: ruled('family:invite_fail', `${S}: \`family.invite.failed\``),
  family_letter_reviewed: ask(NO_ROW, 'family:family_letter_review_submit', 'family:letter_review_submit'),
  member_removed: ask(NO_ROW, 'family:member_remove'),
  member_left: ask(NO_ROW, 'family:member_end', 'family:member_leave_submit'),
  // reminders (category: notifications)
  reminder_prime_shown: ask(NO_ROW, 'notifications:reminder_prime_view'),
  reminder_prime_result: ask(NO_ROW, 'notifications:reminder_prime_submit'),
  os_permission_result: ruled('notifications:permission_submit', `${S}: \`notifications.permission.answered\``),
  reminder_schedule_set: ruled('notifications:schedule_update', `${S}: \`notifications.schedule.changed\``),
  reminder_sent: ask('2.9 lists `notifications.reminder.delivered` as (none) and notes PM4 and PM5 disagree; this key is the phone-side "fired, seen on next foreground" log, which 2.9 does not name', '(none): drop the row, per the 2.9 (none) entry', 'notifications:reminder_send'),
  reminder_suppressed: ruled('notifications:reminder_cancel', `${S}: \`notifications.reminder.suppressed\``),
  notification_opened: ask('2.9 has `notifications.reminder.opened` and `notifications.plan_notice.opened`; this key covers any notification', 'notifications:reminder_open', 'notifications:plan_notice_open'),
  // celebrate and moments (neither is a category)
  moment_shown: ask(NO_AREA, 'book:moment_view'),
  resurface_shown: ask(NO_AREA, 'book:resurface_view'),
  resurface_opened: ask(NO_AREA, 'book:resurface_open'),
  moments_card_impressed: ask(`${NO_AREA}; also a basics-style impression, but its id is a slot, not a registered element id`, 'book:moments_card_view'),
  moments_card_tapped: ask(`${NO_AREA}; also a basics-style tap, but its id is a slot, not a registered control id`, 'book:moments_card_click'),
  // settings
  settings_changed: ruled('me:setting_update', `${S}: \`me.setting.changed\``),
  export_started: ask('2.9 has `keeping.download.started` (`keeping:download_start`) but the other export rows say "export"; the verb object must agree', 'keeping:export_start', 'keeping:download_start'),
  export_completed: ruled('keeping:export_complete', '2.9 line 118, the seven examples'),
  export_failed: ruled('keeping:export_fail', `${S}: \`keeping.export.failed\``),
  export_shared: ask('2.9 lists `keeping.export.shared` as (none): "NO EVENT (FR-DAT-27: no event on the share destination)", yet the catalogue holds this row. Conflict, not a naming gap', '(none): drop the row, per 2.9 and FR-DAT-27', 'keeping:export_share_end'),
  account_deletion: ask('2.9 has three rows (`account_deletion_start`, `_restore`, `account_delete`); the catalogue has one key with a step property, and one key cannot have three names', 'keeping:account_deletion_start (and split)', 'keeping:account_delete (the confirmed step only)'),
  // plus
  plus_offer_viewed: ruled('plus:offer_view', '2.9 line 118, the seven examples'),
  plus_offer_closed: ruled('plus:offer_end', `${S}: \`plus.offer.closed\``),
  plan_changed: ruled('plus:plan_update', `${S}: \`plus.plan.changed\``),
  free_allowance_reached: ruled('plus:allowance_reach', `${S}: \`plus.allowance.reached\``),
  keep_gate_shown: ask(NO_ROW, 'plus:keep_gate_view'),
  letter_held: ruled('plus:letter_hold_create', `${S}: \`plus.letter.held\``),
  plus_started_from_gate: ask('2.9 has `plus.plan.started` (`plus:plan_start`); this key is the narrower "after the Keep sheet" step, which a funnel needs apart', 'plus:plan_start', 'plus:gate_plan_start'),
  offer_code_redeemed: ruled('plus:code_submit', `${S}: \`plus.code.redeemed\``),
  restore_result: ruled('plus:restore_complete', `${S}: \`plus.restore.completed\` (the catalogue row also carries the failed outcome as a property)`),
  // errors
  error_shown: ruled('system:error_view', '2.9 line 118, the seven examples'),
  sync_failed: ask('2.9 has `system.error.raised` (`system:error_fail`), a different row', 'system:sync_fail', 'system:error_fail'),
  // registry-only today (BL-1235 P5 moves them into the catalogue)
  control_tapped: { status: 'pattern', suffix: 'click', idKind: 'control', basis: '2.9 Basics: `<area>:<control_id>_click`' },
  surface_impressed: { status: 'pattern', suffix: 'view', idKind: 'element', basis: '2.9 Basics: `<area>:<element_id>_view`' },
  perf_measured: { status: 'pattern', suffix: 'measure', idKind: 'metric', basis: '2.9 Basics: `<area>:<metric>_measure` (deviation); tier stays consented until FH-3' },
};

export interface KeyFacts { key: string; where: 'catalogue' | 'registry' | 'both'; tier: string; area: string }

/** Every key of EVENTS and REGISTRY with where it lives and its tier today (the catalogue's, else the registry's). */
export function allKeys(): KeyFacts[] {
  const ev = EVENTS as Record<string, { tier: string; area: string }>;
  const rg = REGISTRY as Record<string, { tier: string; area: string }>;
  const names = [...Object.keys(ev), ...Object.keys(rg).filter((k) => !(k in ev))];
  return names.map((key) => ({
    key,
    where: key in ev && key in rg ? 'both' : key in ev ? 'catalogue' : 'registry',
    tier: (ev[key] ?? rg[key]!).tier,
    area: (ev[key] ?? rg[key]!).area,
  }));
}

/** The names a pattern row generates from the id registry (today only screens are registered). */
export function expandPattern(row: Extract<RowKind, { status: 'pattern' }>): string[] {
  return ID_ROWS.filter((r) => r.kind === row.idKind).map((r) => `${r.area}:${r.id}_${row.suffix}`);
}

const cell = (s: string) => s.replace(/\|/g, '\\|');

export function renderWireNames(): string {
  const keys = allKeys();
  const count = (s: RowKind['status']) => keys.filter((k) => WIRE_ROWS[k.key]?.status === s).length;
  const out: string[] = [
    '# Wire names: the mapping table (generated)',
    '',
    'Generated from `packages/analytics/src/wire-names.ts` by `npm run wire-names -w @scribe/analytics`; do not edit by hand. `npm run wire-names -w @scribe/analytics -- --check` and `packages/analytics/test/wire-names.test.ts` fail when this file differs from that output. BL-1255 step 1 (CR-212): this is the table `posthog-standard.md` section 2.9 points to as "IN-03".',
    '',
    'Nothing here renames anything. The catalogue and registry still hold the old names; the rename PRs (step 2) read this table. The tier column is today\'s tier from the catalogue and registry rows, and the basics set stays pinned to `screen_view` by `test/tiers.test.ts`.',
    '',
    `Counts: ${keys.length} keys (${count('ruled')} ruled by 2.9, ${count('pattern')} patterns generated per registered id, ${count('needs_ruling')} NEEDS RULING).`,
    '',
    'Reading a row. "Ruled" means 2.9 names this event (a domain row, the seven examples of line 118, or the Basics patterns) and the catalogue meaning matches it. NEEDS RULING means 2.9 does not decide, or decides something else (a conflict); the options are candidates for the ruling, not decisions, and no wire name is assigned until it is made.',
    '',
    '## Keys',
    '',
    '| Key | Lives in | Area today | Tier | Status | Wire name | Basis or what is missing |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const k of keys) {
    const r = WIRE_ROWS[k.key];
    if (!r) throw new Error(`wire-names: no row for ${k.key}`);
    const common = `| \`${k.key}\` | ${k.where} | ${k.area} | ${k.tier}`;
    if (r.status === 'ruled') out.push(`${common} | ruled | \`${r.wire}\` | ${cell(r.basis)} |`);
    else if (r.status === 'pattern') out.push(`${common} | pattern | \`<area>:<id>_${r.suffix}\` (${expandPattern(r).length} today) | ${cell(r.basis)} |`);
    else out.push(`${common} | NEEDS RULING | (none yet) | ${cell(r.why)}. Options: ${r.options.map((o) => (o.startsWith('(none)') ? o : `\`${o}\``)).join('; ')} |`);
  }
  out.push('', '## Generated names', '');
  for (const r of Object.entries(WIRE_ROWS).filter((e): e is [string, Extract<RowKind, { status: 'pattern' }>] => e[1].status === 'pattern')) {
    const names = expandPattern(r[1]);
    out.push(`### \`${r[0]}\``, '');
    if (names.length === 0) out.push(`No \`${r[1].idKind}\` id is registered yet in \`ids.ts\`, so no name is generated today.`, '');
    else out.push(`${names.length} names, one per registered \`${r[1].idKind}\` id (area from \`ids.ts\`):`, '', ...names.map((n) => `- \`${n}\``), '');
  }
  out.push(
    '## Open items',
    '',
    '1. Privacy advice on the 1.0 candidate list (CPrivO-52, CR-212; advisory, not a decision, no code change here). `ENGINEERING-REQUIREMENTS-21nov.md` ER-B02 lists seven candidate funnel-step names for the basics tier. Advice: drop `family:invite_create` and `family:invite_accept` from the 1.0 set. D-161 and D-162 mean no 1.0 build has an invite door, so those rows would never fire and would only widen the list; add them when the co-parent work (BL-883 to BL-889) ships. That leaves five: `onboarding:first_letter_complete`, `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete`, each with counts and enums only. `onboarding:first_letter_complete` (2.9: `onboarding.first_letter.completed`) has no key above today, so the rename work needs a row for it or a ruling that `letter_saved` carries it as a property. The basics set stays `screen_view` only until privacy signs a list (step 3, its own PR, which edits the set pinned in `test/tiers.test.ts`).',
    '2. `keeping.export.shared` is (none) in 2.9 (FR-DAT-27) while `export_shared` is in the catalogue: a ruling is needed before the rename drops or keeps it.',
    '3. The registry-only keys `control_tapped`, `surface_impressed`, `perf_measured` stand for names generated per id; no control, element or metric id is registered yet, so none is generated today.',
    '',
  );
  return out.join('\n');
}
