/**
 * The id registry (ER-B01, BL-1254; 00-event-standard.md section 4): every
 * screen, control, element and metric id that a basics event may name, each
 * with one area and the IA-FINAL id of the place it lives. Data and pure
 * checks only: no import of the catalogue, the registry or the SDK.
 *
 * Rules (standard sections 3, 4 and 10):
 * - An id is a lowercase snake slug. It never comes from text on screen or
 *   from a person, child, book, letter, picture or typed day, so a renamed
 *   button keeps its id (V4).
 * - A dynamic list (letter cards) is ONE element id, never one per row.
 * - One id, one kind: a control that is also an element is registered once as
 *   an element (the standard, section 4).
 * - At most ID_KIND_CAP ids per kind (V16).
 * - Longest id is 31 characters: the allowlist drops any string of 32 or more
 *   [A-Za-z0-9_-] characters as a token-like blob (pii.ts), and an id is sent
 *   as an enum value.
 *
 * This file seeds screens only: the 29 routes of routes.ts plus the IA-FINAL
 * extras. Controls, elements and metrics are added by the rows that need them
 * (PM files add rows; ER-B02 and later). The Day sheet and whose-book sheet
 * are screens of kind `screen` with shape `sheet` (the standard has no fifth
 * kind).
 */
import { isPiiLike } from './pii';

/** The nine areas (standard section 3), the closed list. */
export const AREAS = ['onboarding', 'capture', 'book', 'family', 'keeping', 'me', 'plus', 'notifications', 'system'] as const;
export type Area = (typeof AREAS)[number];

export const ID_KINDS = ['screen', 'control', 'element', 'metric'] as const;
export type IdKind = (typeof ID_KINDS)[number];

/** V16: at most this many ids of one kind. */
export const ID_KIND_CAP = 300;
/** See the header: 32 characters would be dropped as a token-like blob. */
export const ID_MAX_LENGTH = 31;
export const ID_SLUG = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
/** An IA-FINAL screen id: area letter A to E, `-S`, two digits (`A-S01`). Shared by several slugs when one IA screen spans several routes. */
export const IA_ID = /^[A-E]-S\d{2}$/;

/** route: a file route; sheet: a named sheet over a screen; state: a full-screen state with no route of its own. */
export type ScreenShape = 'route' | 'sheet' | 'state';

export interface IdRow {
  readonly id: string;
  readonly kind: IdKind;
  readonly area: Area;
  /** IA-FINAL id (docs/design/IA-FINAL-20nov.md, e2e/INDEX.md), such as `A-S01`. */
  readonly ia: string;
  /** Screens only. */
  readonly shape?: ScreenShape;
  /** Screens only: the expo-router template (group folders removed), never a resolved path. */
  readonly route?: string;
  /** Screens only: the `ROUTE` value that `screen_view` sends today (routes.ts), kept until ER-B02 retires it. */
  readonly routeValue?: string;
  /** One line a reviewer reads: why this area or IA id, where the choice is a judgement. */
  readonly note?: string;
}

const r = (id: string, area: Area, ia: string, route: string, routeValue: string, note?: string): IdRow => ({
  id, kind: 'screen', area, ia, shape: 'route', route, routeValue, ...(note ? { note } : {}),
});
const x = (id: string, area: Area, ia: string, shape: ScreenShape, note?: string, route?: string): IdRow => ({
  id, kind: 'screen', area, ia, shape, ...(route ? { route } : {}), ...(note ? { note } : {}),
});

/** The 29 routes of routes.ts (same order), then the IA-FINAL extras. */
export const ID_ROWS: readonly IdRow[] = [
  r('home', 'capture', 'A-S01', '', 'tonight', 'Home is the capture cluster (IA-FINAL section 5); the route value stays `tonight` until ER-B02'),
  r('book', 'book', 'B-S01', 'book', 'book'),
  r('family', 'family', 'D-S18', 'family', 'family', 'the Family page'),
  r('listen', 'capture', 'A-S04', 'listen', 'listen', 'A-S05 (recording) is a state of the same route'),
  r('write', 'capture', 'A-S06', 'write', 'write'),
  r('review', 'capture', 'A-S07', 'review', 'review'),
  r('letter_detail', 'book', 'B-S08', 'letter/[id]', 'letter_detail', 'one id for every letter, never one per letter'),
  r('onboarding', 'onboarding', 'E-S08', 'onboarding', 'onboarding', 'first book steps'),
  r('read_together', 'book', 'B-S19', 'read-together', 'read_together'),
  r('sign_in', 'onboarding', 'E-S04', 'sign-in', 'sign_in'),
  r('sign_in_email', 'onboarding', 'E-S05', 'sign-in/email', 'sign_in_email'),
  r('sign_in_code', 'onboarding', 'E-S06', 'sign-in/code', 'sign_in_code', 'E-S06 covers code and verify'),
  r('sign_in_verify', 'onboarding', 'E-S06', 'sign-in/verify', 'sign_in_verify', 'E-S06 covers code and verify'),
  r('sign_in_consent', 'onboarding', 'E-S07', 'sign-in/consent', 'sign_in_consent', 'agreements and consent at sign-in'),
  r('invite', 'family', 'D-S15', 'invite', 'invite', 'the join ask'),
  r('invite_new', 'family', 'D-S13', 'invite/new', 'invite_new', 'the invite sheet'),
  r('settings', 'me', 'C-S01', 'settings', 'settings', 'the Me tab root'),
  r('settings_account', 'me', 'C-S02', 'settings/account', 'settings_account'),
  r('settings_appearance', 'me', 'E-S21', 'settings/appearance', 'settings_appearance'),
  r('settings_reminders', 'notifications', 'D-S06', 'settings/reminders', 'settings_reminders'),
  r('settings_recordings', 'keeping', 'C-S08', 'settings/recordings', 'settings_recordings', 'IA-FINAL replaces Recordings with Where your letters live (C-S08); judgement'),
  r('settings_child_detail', 'me', 'C-S15', 'settings/children/[id]', 'settings_child_detail', 'one id for every child, never one per child'),
  r('settings_child_new', 'me', 'E-S08', 'settings/children/new', 'settings_child_new', 'reuses the first-run form (IA-FINAL section 7.4)'),
  r('settings_privacy', 'me', 'C-S23', 'settings/privacy', 'settings_privacy'),
  r('settings_export', 'keeping', 'C-S04', 'settings/export', 'settings_export', 'Save a copy'),
  r('settings_language', 'me', 'A-S10', 'settings/language', 'settings_language', 'IA-FINAL section 7.4 names A-S10 and E-S08; A-S10 chosen'),
  r('settings_plus', 'plus', 'E-S11', 'settings/plus', 'settings_plus', 'the Plan page'),
  r('settings_storage', 'keeping', 'C-S18', 'settings/storage', 'settings_storage'),
  r('settings_delete_account', 'me', 'C-S20', 'settings/delete-account', 'settings_delete_account'),
  // IA-FINAL extras (standard section 4).
  x('age_gate', 'onboarding', 'E-S03', 'state', 'rendered by the root layout; no route of its own'),
  x('boot_error', 'system', 'E-S01', 'state', 'launch and boot failure; no route of its own'),
  x('plus_confirmed', 'plus', 'E-S12', 'route', undefined, 'plus/confirmed'),
  x('not_found', 'system', 'E-S20', 'route', 'any unmatched link', '+not-found'),
  x('invite_leave', 'family', 'D-S19', 'route', 'leaving a family; D-S19 chosen over D-S18; judgement', 'invite/leave'),
  x('whose_book', 'family', 'A-S02', 'sheet', 'IA-FINAL section 3 puts Whose book under the family area'),
  x('day_sheet', 'capture', 'A-S08', 'sheet', 'one DateSheet shared with B-S09; the area of the first place (Review)'),
];

export function idsOfKind(kind: IdKind, rows: readonly IdRow[] = ID_ROWS): string[] {
  return rows.filter((row) => row.kind === kind).map((row) => row.id);
}

/** V4: true when `id` is registered with this kind. */
export function isRegisteredId(kind: IdKind, id: string, rows: readonly IdRow[] = ID_ROWS): boolean {
  return rows.some((row) => row.kind === kind && row.id === id);
}

/** Every reason a set of rows breaks V4 or V16. Empty means the registry is sound. */
export function idProblems(rows: readonly IdRow[] = ID_ROWS): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const perKind = new Map<string, number>();
  for (const row of rows) {
    const at = `${row.kind} ${JSON.stringify(row.id)}`;
    if (!(ID_KINDS as readonly string[]).includes(row.kind)) out.push(`${at}: unknown kind`);
    if (!ID_SLUG.test(row.id)) out.push(`${at}: not a lowercase snake slug`);
    if (row.id.length > ID_MAX_LENGTH) out.push(`${at}: longer than ${ID_MAX_LENGTH} characters`);
    if (isPiiLike(row.id)) out.push(`${at}: looks like personal data`);
    if (!(AREAS as readonly string[]).includes(row.area)) out.push(`${at}: area is not one of the nine`);
    if (!IA_ID.test(row.ia)) out.push(`${at}: no IA-FINAL id`);
    if (seen.has(row.id)) out.push(`${at}: id already registered (one id, one kind)`);
    seen.add(row.id);
    perKind.set(row.kind, (perKind.get(row.kind) ?? 0) + 1);
    if (row.kind !== 'screen' && (row.shape || row.route || row.routeValue)) out.push(`${at}: shape and route belong to screens`);
  }
  for (const [kind, n] of perKind) if (n > ID_KIND_CAP) out.push(`${kind}: ${n} ids, the cap is ${ID_KIND_CAP}`);
  return out;
}
