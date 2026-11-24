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
  /** Assigned by the exec rulings of 24 Nov 2026 (2.9 had no row, or a different one): `wire` is the name step 2 renames to. */
  | { status: 'named'; wire: string; basis: string }
  /** Folded into another key. It has no name of its own (its target is the pattern name or perf metric that carries the signal). */
  | { status: 'merged'; into: 'screen_view' | 'perf_measured'; target: string; basis: string }
  /** No event: step 2a deletes the key and its call sites. It never gets a wire name. */
  | { status: 'dropped'; basis: string }
  /** The one key stands for a family of names generated per registered id (2.9, "Basics"). */
  | { status: 'pattern'; suffix: 'screen_view' | 'click' | 'view' | 'measure'; idKind: 'screen' | 'control' | 'element' | 'metric'; basis: string }
  /** 2.9 does not decide. `options` are candidates for the ruling, not decisions; `why` says what is missing. */
  | { status: 'needs_ruling'; why: string; options: readonly string[] };

const S = '2.9 domain table';
const ruled = (wire: string, basis: string): RowKind => ({ status: 'ruled', wire, basis });
const named = (wire: string, basis: string): RowKind => ({ status: 'named', wire, basis });
const merged = (into: 'screen_view' | 'perf_measured', target: string, basis: string): Extract<RowKind, { status: 'merged' }> => ({ status: 'merged', into, target, basis });
const drop = (basis: string): RowKind => ({ status: 'dropped', basis });

/**
 * Hand-decided rows, in catalogue order then registry-only. The generator checks that this covers every key exactly once.
 * The 39 keys 2.9 left open were ruled on 24 Nov 2026 (BL-1255 step 1b, `infra/exec-rulings-2026-11-24-wire-names.md`):
 * 17 named, 4 merged, 17 dropped, and `sync_failed`, which 2.9 already names. `letter_deleted` was ruled the same day to be
 * the 18th drop (`infra/exec-rulings-2026-11-24-letter-deleted.md`, CR-225). Step 2a (BL-2175) deletes the keys in two slices: the 4 merged keys first (slice 3a, now in `RETIRED_ROWS`), then the 18 dropped keys (slice 3b).
 */
export const WIRE_ROWS: Readonly<Record<string, RowKind>> = {
  // app
  app_opened: ruled('system:app_open', `${S}: \`system.app.opened\``),
  app_backgrounded: drop('no PM row and no reader; it is not PM5 `system.session.ended` (which carries clean, fatal or killed), so `system:session_end` stays reserved for that'),
  screen_view: { status: 'pattern', suffix: 'screen_view', idKind: 'screen', basis: '2.9 Basics: `<area>:<screen_id>_screen_view`' },
  // consent
  analytics_opted_in: ruled('system:analytics_consent_accept', `${S}: \`system.consent.granted\` ("duplicates \`analytics_opted_in\`, so one event")`),
  // entry
  auth_method_selected: drop('inferred from auth state; `auth_succeeded` and `auth_failed` already carry `method`; no PM row, no reader'),
  auth_succeeded: ruled('onboarding:sign_in_complete', `${S}: \`onboarding.sign_in.completed\``),
  auth_failed: ruled('onboarding:sign_in_fail', `${S}: \`onboarding.sign_in.failed\``),
  auth_email_sent: drop('2.9 no-event list: sends are counted on the server; the phone sees a request accepted, not a send'),
  auth_deferred: named('onboarding:sign_in_dismiss', 'PM1 `onboarding.sign_in.dismissed` names this key; `dismiss` is the verb for closing a slip without acting'),
  signed_out: named('me:session_end', 'PM1 `me.session.closed` names this key; `reason` already carries the four causes'),
  invite_opened: ruled('family:invite_open', `${S}: \`family.invite.opened\` (phone side)`),
  local_merge_choice: drop('no emitter (F18), no PM row, no reader; needs server features'),
  // children
  child_added: named('onboarding:book_create', 'registry row whose decision is first-run completion; `create` is the verb of "a child book is created"; `book_save` is not used because PM1 makes `onboarding.book.saved` a server count'),
  child_switched: named('capture:child_update', 'PM1 `capture.child.selected` ("active book changed") lists this key as its Was; `selected` folds to `update`'),
  child_setting_changed: drop('no PM row, no reader, overlaps `settings_changed`; its `key` values name child-level acts: collect less'),
  make_it_yours_card: drop('no emitter; FR-DAT-26 lists it as stale, to be removed before any profile turns analytics on'),
  goals_set: drop('no emitter, no reader; goals are L4 and only a count was ever defined'),
  dictionary_term_added: drop('no emitter, no reader'),
  // capture
  capture_started: ruled('capture:take_start', '2.9 line 118, the seven examples: `capture_started` to `capture:take_start` (note: the table also holds `capture.letter.started`, `capture:letter_start`)'),
  capture_discarded: named('capture:take_cancel', 'registry row and insights reader; a drop-off shares its object with its start, and `capture_started` is `capture:take_start`; PM1 `letter_cancel` loses on pairing'),
  transcription_completed: ruled('capture:transcript_complete', `${S}: \`capture.transcript.completed\` (this key also carries failed and no-speech outcomes as a property)`),
  letter_saved: ruled('capture:letter_save', '2.9 line 118, the seven examples'),
  review_action: named('capture:review_update', 'PM1 `capture.review.selected`, a step of funnel F2; `selected` folds to `update`; `submit` is for forms'),
  machine_edit_reverted: named('capture:edit_restore', 'the 2.4 `restore` row names "a reverted machine edit"; PM1 `edit_cancel` loses; constitution guardrail and insights reader'),
  machine_edit_rejected: named('capture:edit_decline', 'PM1 `capture.edit.declined`; `decline` is "from us" (the verifier); same guardrail and reader'),
  letter_deleted: drop('retired under CR-225: no decision reads it, PM3 section 8 and R-K1 to R-K3 keep it at T0 (a per-id trace of what a family deleted, fired inside the deletion flows), and it was held, so it has no history; `keeping:letter_delete` and `keeping:letter_restore` are never assigned and are barred by pattern'),
  // languages
  language_set: ruled('me:language_update', `${S}: \`me.language.changed\``),
  pack_download: named('system:pack_download_update', 'PM1 maps four states to this one key and 2.9 only holds `pack_start`; `changed` folds to `update`; the `pack_download` object keeps it from reading as a pack version update'),
  // book
  playback_started: ruled('book:playback_start', `${S}: \`book.playback.started\``),
  read_together_started: ruled('book:read_together_start', `${S}: \`book.read_together.started\``),
  read_together_ended: ruled('book:read_together_end', `${S}: \`book.read_together.ended\``),
  // family
  invite_created: ruled('family:invite_create', '2.9 line 118, the seven examples'),
  invite_accepted: ruled('family:invite_accept', `${S}: \`family.invite.accepted\``),
  invite_failed: ruled('family:invite_fail', `${S}: \`family.invite.failed\``),
  family_letter_reviewed: drop('PM4: "1.1, no rows now"; no emitter; the co-parent work (BL-883 to BL-889) has not shipped'),
  member_removed: drop('PM4 CPO-3: no phone events, server counts only; no emitter'),
  member_left: drop('same as `member_removed`; its one emitter is a leave sheet that D-113 keeps unoffered'),
  // reminders (category: notifications)
  reminder_prime_shown: named('notifications:reminder_prime_view', 'the denominator of the reminder-fatigue guardrail; an impression of our own card'),
  reminder_prime_result: named('notifications:reminder_prime_submit', '`answered` folds to `submit`, as `os_permission_result` is `permission_submit`'),
  os_permission_result: ruled('notifications:permission_submit', `${S}: \`notifications.permission.answered\``),
  reminder_schedule_set: ruled('notifications:schedule_update', `${S}: \`notifications.schedule.changed\``),
  reminder_sent: drop('the registry forbids `reminder_sent` (20 Nov founder rules); the phone cannot observe delivery; 2.9 says (none); PM4 versus PM5 is settled as no delivered event'),
  reminder_suppressed: ruled('notifications:reminder_cancel', `${S}: \`notifications.reminder.suppressed\``),
  notification_opened: named('notifications:notification_open', 'one key with four types; 2.9 `reminder_open` and `plan_notice_open` have no key of their own and stay unassigned'),
  // celebrate and moments (neither is a category)
  moment_shown: drop('no emitter; FR-DAT-26 (stale letter-count types); the registry `^moment_` pin; area `celebrate` is not a category'),
  resurface_shown: drop('no emitter; the registry `^resurface_` pin; PM2 replaces it by an impression; a one_year card lands on the anniversary of a letter date (timing leak, TRACKING_PLAN 6.4)'),
  resurface_opened: drop('same as `resurface_shown`'),
  moments_card_impressed: named('book:moments_card_view', 'CDO-25 allows exactly two `moments_` names; Moments sits under Book'),
  moments_card_tapped: named('book:moments_card_open', '`click` is reserved for control ids (V2); `open` fits a card opened from the tab'),
  // settings
  settings_changed: ruled('me:setting_update', `${S}: \`me.setting.changed\``),
  export_started: named('keeping:export_start', 'the object must agree with `export_complete` and `export_fail`; `download_start` is retired; funnel F9 and the insights engine read it'),
  export_completed: ruled('keeping:export_complete', '2.9 line 118, the seven examples'),
  export_failed: ruled('keeping:export_fail', `${S}: \`keeping.export.failed\``),
  export_shared: drop('2.9 no-event list and FR-DAT-27 (no event on a share destination); no emitter; PM3 says fold it away'),
  account_deletion: drop('PM3 section 8 and IN-K3 retire it (deletion is never measured on the phone); the server RPC holds the count'),
  // plus
  plus_offer_viewed: ruled('plus:offer_view', '2.9 line 118, the seven examples'),
  plus_offer_closed: ruled('plus:offer_end', `${S}: \`plus.offer.closed\``),
  plan_changed: ruled('plus:plan_update', `${S}: \`plus.plan.changed\``),
  free_allowance_reached: ruled('plus:allowance_reach', `${S}: \`plus.allowance.reached\``),
  keep_gate_shown: named('plus:keep_gate_view', 'registry row; I3 and F7 read `letters_kept`, `allowance`, `lapsed`; no Keep sheet screen id exists, and a screen view carries none of those'),
  letter_held: ruled('plus:letter_hold_create', `${S}: \`plus.letter.held\``),
  plus_started_from_gate: named('plus:keep_gate_plan_start', 'keeps the gate in the name; `plus:plan_start` stays free for the broader PM5 event'),
  offer_code_redeemed: ruled('plus:code_submit', `${S}: \`plus.code.redeemed\``),
  restore_result: ruled('plus:restore_complete', `${S}: \`plus.restore.completed\` (the catalogue row also carries the failed outcome as a property)`),
  // errors
  error_shown: ruled('system:error_view', '2.9 line 118, the seven examples'),
  sync_failed: ruled('system:sync_fail', `${S}: \`system.sync.failed\` (#1044); the first generated table missed this row`),
  // registry-only today (BL-1235 P5 moves them into the catalogue)
  control_tapped: { status: 'pattern', suffix: 'click', idKind: 'control', basis: '2.9 Basics: `<area>:<control_id>_click`' },
  surface_impressed: { status: 'pattern', suffix: 'view', idKind: 'element', basis: '2.9 Basics: `<area>:<element_id>_view`' },
  perf_measured: { status: 'pattern', suffix: 'measure', idKind: 'metric', basis: '2.9 Basics: `<area>:<metric>_measure` (deviation); tier stays consented until FH-3' },
};

/**
 * The keys step 2a (BL-2175) deleted from the catalogue and registry, with the reason each went and, for a merge, where its
 * signal lives now. They are not keys any more: `WIRE_ROWS` has no row for them, a test fails if one comes back, and the
 * generated table lists them last so the reasons survive the deletion. Nothing reads this record but the table and its tests.
 */
export const RETIRED_ROWS: Readonly<Record<string, Extract<RowKind, { status: 'merged' | 'dropped' }>>> = {
  app_cold_start: merged('perf_measured', 'system:cold_start_measure', '`cold_start` is already a PERF_METRIC; PM1 lists it under the perf pattern; its metric id (area `system`) is registered in the step 2 PR that needs it'),
  auth_sheet_shown: merged('screen_view', 'onboarding:sign_in_screen_view', 'the sheet is registered screen id `sign_in`; its `trigger` property has no reader'),
  book_opened: merged('screen_view', 'book:book_screen_view', 'PM2 deprecates it into the Book screen view ("counts are not wanted"); funnel `f_return_book_read` is re-expressed on the screen names'),
  letter_opened: merged('screen_view', 'book:letter_detail_screen_view', 'same PM2 line; screen id `letter_detail` is one id for every letter'),
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
  const live = count('ruled') + count('named');
  const retired = Object.entries(RETIRED_ROWS);
  const out: string[] = [
    '# Wire names: the mapping table (generated)',
    '',
    'Generated from `packages/analytics/src/wire-names.ts` by `npm run wire-names -w @scribe/analytics`; do not edit by hand. `npm run wire-names -w @scribe/analytics -- --check` and `packages/analytics/test/wire-names.test.ts` fail when this file differs from that output. BL-1255 step 1 (CR-212): this is the table `posthog-standard.md` section 2.9 points to as "IN-03".',
    '',
    'Nothing here renames anything. The catalogue and registry still hold the old names; the rename PRs (step 2) read this table. The tier column is today\'s tier from the catalogue and registry rows, and the basics set stays pinned to `screen_view` by `test/tiers.test.ts`.',
    '',
    `Counts: ${keys.length} keys: ${count('ruled')} ruled by 2.9, ${count('named')} named by the 24 Nov rulings, ${count('dropped')} dropped, ${count('pattern')} patterns generated per registered id, ${count('needs_ruling')} NEEDS RULING. Step 2a (BL-2175) has deleted ${retired.length} keys so far, the merged ones (see Retired keys); the ${count('dropped')} dropped keys go in its next slice, after which the table has ${keys.length - count('dropped')} keys, ${live} with a name of their own.`,
    '',
    'Reading a row. "Ruled" means 2.9 names this event (a domain row, the seven examples of line 118, or the Basics patterns) and the catalogue meaning matches it. "Named" means 2.9 did not decide and the exec rulings of 24 Nov 2026 (BL-1255 step 1b) assigned the name. "Dropped" means no event: step 2a deletes the key and its call sites. Keys ruled "merged" are no longer keys: step 2a deleted them, and they are listed under Retired keys. NEEDS RULING (none today) would mean a new key with no decision.',
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
    if (r.status === 'ruled' || r.status === 'named') out.push(`${common} | ${r.status} | \`${r.wire}\` | ${cell(r.basis)} |`);
    else if (r.status === 'merged') out.push(`${common} | merged | (none) merged into \`${r.target}\` | ${cell(r.basis)} |`);
    else if (r.status === 'dropped') out.push(`${common} | dropped | (none) | ${cell(r.basis)} |`);
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
    '## Retired keys',
    '',
    `Step 2a (BL-2175; CR-213) deleted these ${retired.length} keys from the catalogue and registry, with the call sites that fired them. None was ever sent: analytics are off in every profile (CR-186). "Merged" means the signal is carried by the target shown. A retired key is not a key: \`wire-names.test.ts\` fails if one reappears in the catalogue or registry. Bringing one back is a new row with a decision.`,
    '',
    '| Key | Status | Replaced by | Basis |',
    '|---|---|---|---|',
    ...retired.map(([k, r]) => `| \`${k}\` | ${r.status} | ${r.status === 'merged' ? `\`${r.target}\`` : '(none)'} | ${cell(r.basis)} |`),
    '',
    '## Open items',
    '',
    '1. Privacy advice on the 1.0 candidate list (CPrivO-52, CR-212; advisory, not a decision, no code change here). `ENGINEERING-REQUIREMENTS-21nov.md` ER-B02 lists seven candidate funnel-step names for the basics tier. Advice, ruled on 24 Nov 2026: drop `family:invite_create` and `family:invite_accept` (D-161 and D-162: no 1.0 build has an invite door), and strike `onboarding:first_letter_complete` (a server count, with no key, and opt-in comes after the first letter). That leaves four: `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete`, each with counts and enums only. Privacy decides them at step 3, its own PR, which edits the set pinned in `test/tiers.test.ts`; the basics set stays `screen_view` only until then.',
    '2. The registry-only keys `control_tapped`, `surface_impressed`, `perf_measured` stand for names generated per id; no control, element or metric id is registered yet, so none is generated today.',
    '',
  );
  return out.join('\n');
}
