/**
 * Someone else speaks (NS-16, BL-980): the From name a parent may type on Review for this one letter. Pure rules, no
 * store and no React, so they run in Node.
 *
 * The name is `entries.author_signs_as`: insert-only in sync (packages/api/src/server/sync.ts INSERT_ONLY_COLUMNS) and
 * on this phone (repos/entries.ts `upsert` never updates it on conflict). So it can be set only before Keep writes the
 * entry row, which is before the letter's first upload; after Keep the From line is read-only (NS-16-R17), and a later
 * value would be ignored by the server without an error, so the app never offers one.
 *
 * Length: 1 to 30 characters counted as the database counts them, code points after NFC (NS-16-R1; errata E10), the
 * rule `checkSignsAs` in packages/core already holds. Over 30 is refused at Keep, before anything is written or
 * uploaded (NS-16-R6), never silently cut. The hosted CHECK is 30 code points until migration 20261123210000 (BL-1572,
 * ceiling 480) is applied; counting code points keeps a name the app accepts from being refused by either.
 *
 * The flag is a `child-input` flag (PRIV-R20, LEGAL-REQ-059, BL-119): another adult's, or possibly a child's, voice on
 * the account holder's say-so. Counsel Q45, Q46, Q48 and Q54 gate turning it on (CPrivO-24), not this code.
 */
import { checkSignsAs } from '@scribe/core';

/** The build flag (CPrivO-24). Off unless the build says exactly "on"; listed in g6-production-flags-off.test.ts. */
export const SIGN_AS_OTHER_ENV = 'EXPO_PUBLIC_SIGN_AS_OTHER';
/** PRIV-R20: this flag stays off in production until counsel's written opinion (Q45) is linked. */
export const SIGN_AS_OTHER_TAGS: readonly string[] = Object.freeze(['child-input']);

export const parseSignAsOtherFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

/**
 * The remote pause (`killSwitches.signAsOther`, packages/api kill-switches.ts; GAP-LOG G-18). Only the boolean `true`
 * pauses: an absent config, a config signed before the key existed and any other value read as not paused. A pause
 * hides the From card for a draft with no typed name and never turns it on; the build flag alone does that. A draft
 * that already carries a typed name keeps it at Keep, shown and not editable (`signatureForKeep`, `paused`).
 */
export const signAsOtherPaused = (config: { killSwitches?: Readonly<Record<string, unknown>> | null } | null | undefined): boolean =>
  config?.killSwitches?.signAsOther === true;

/** Names used before on this phone (NS-16 section 10): L3, never synced, cleared at sign-out and by Erase everything. */
export const SIGN_AS_RECENT_SETTING = 'signAs.recent';
/**
 * The name typed for a draft not yet kept, so a call or a kill keeps it (NS-16 section 6): L3, same clearing, and it
 * goes with its draft (Keep, Let it go, Delete, a book's erase; repos/drafts.ts forgetDraftFromName).
 */
export const SIGN_AS_DRAFT_SETTING = 'signAs.draft';
/** The list holds at most this many names, most recent first (NS-16 section 6, "Many"). */
export const SIGN_AS_RECENT_MAX = 20;

/** The error code of a refused name (NS-16 section 10). Never logged with the value. */
export const SIGN_AS_TOO_LONG = 'sign_as_too_long';

/** A typed From name: empty means "signed as the parent", as today (NS-16 section 5). */
export type FromNameCheck = { ok: true; name: string | null } | { ok: false; code: typeof SIGN_AS_TOO_LONG };

export function checkFromName(raw: string): FromNameCheck {
  const c = checkSignsAs(raw);
  if (c.ok) return { ok: true, name: c.value };
  return c.reason === 'empty' ? { ok: true, name: null } : { ok: false, code: SIGN_AS_TOO_LONG };
}

/**
 * The signature Keep writes. With the control not offered (flag off, or a letter already kept) it is the parent's,
 * whatever was typed, so a stale typed name can never reach a build that does not show it.
 *
 * `paused` is the remote pause with the build flag on (GAP-LOG A G-18): the control is hidden, but a name already typed
 * for this draft is kept as its signature, shown and not editable, as a kept letter's name is (NS-16-R17); the pause
 * never changes who a letter says spoke. With no typed name it is the parent's. A typed name Keep would refuse (over
 * 30) cannot be put right while the control is hidden, and the pause never stops Keep, so that draft signs as the
 * parent; it is never cut to fit (NS-16-R6).
 */
export type KeepSignature = { ok: true; authorSignsAs: string; other: string | null } | { ok: false; code: typeof SIGN_AS_TOO_LONG };

export function signatureForKeep(input: { typed: string; parentSignsAs: string; offered: boolean; paused?: boolean }): KeepSignature {
  if (input.paused) {
    const c = checkFromName(input.typed);
    return c.ok && c.name !== null ? { ok: true, authorSignsAs: c.name, other: c.name } : { ok: true, authorSignsAs: input.parentSignsAs, other: null };
  }
  if (!input.offered) return { ok: true, authorSignsAs: input.parentSignsAs, other: null };
  const c = checkFromName(input.typed);
  if (!c.ok) return c;
  return c.name === null ? { ok: true, authorSignsAs: input.parentSignsAs, other: null } : { ok: true, authorSignsAs: c.name, other: c.name };
}

/** The list after `name` was kept: it moves to the front, appears once, and the list stops at 20. */
export function rememberName(list: readonly string[], name: string): string[] {
  return [name, ...list.filter((n) => n !== name)].slice(0, SIGN_AS_RECENT_MAX);
}

/** Reads the stored list; anything that is not a list of valid names is dropped, never thrown. */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((n): n is string => typeof n === 'string' && checkFromName(n).ok && n.trim() !== '').slice(0, SIGN_AS_RECENT_MAX);
  } catch {
    return [];
  }
}

/** The typed name kept for `draftId`, or '' when the stored one belongs to another draft or cannot be read. */
export function parseDraftName(raw: string | null, draftId: string): string {
  if (!raw) return '';
  try {
    const v = JSON.parse(raw) as { draftId?: unknown; name?: unknown };
    return v?.draftId === draftId && typeof v.name === 'string' ? v.name : '';
  } catch {
    return '';
  }
}

export const serializeDraftName = (draftId: string, name: string): string => JSON.stringify({ draftId, name });
