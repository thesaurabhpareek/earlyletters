/**
 * BL-1816: the first-run draft on the phone (child name and date typed before the book is made). The store reads and
 * writes live here so onboarding and the sign-out path share one delete (lib/first-run/draft.logic.ts holds the shape).
 */
import { deleteSetting, getSetting } from '@/lib/store';
import { FIRST_RUN_DRAFT_SETTING } from './draft.logic';

/** Removes the draft. Never throws: a store that cannot be read has nothing to clear. */
export function clearFirstRunDraft(): void {
  try {
    if (getSetting(FIRST_RUN_DRAFT_SETTING) !== null) deleteSetting(FIRST_RUN_DRAFT_SETTING);
  } catch {
    // Nothing to clear.
  }
}
