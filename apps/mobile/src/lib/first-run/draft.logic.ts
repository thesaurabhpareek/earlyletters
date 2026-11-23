/**
 * BL-1816: first-run answers kept as she goes, so a relaunch resumes the step.
 *
 * What is kept: the step she is on and what she has typed or chosen (the names, the birthday or due date, what the
 * child calls her). It goes in the same device settings as the saved profile, under one key, and never leaves the
 * phone (no sync, no analytics, no log). The date of birth is never pre-set (D-087): the draft holds a date only
 * when she picked one, and an empty date stays empty. The order of the steps is not changed here (D-169).
 *
 * Pure and tested (test/first-run-draft.test.ts); `onboarding.tsx` reads it once at start and writes it on every change.
 */
import { CHILD_NAME_MAX, SIGNS_AS_MAX, clampText } from '@scribe/core';

export type DraftStep = 'welcome' | 'promise' | 'child' | 'signsAs' | 'finish';
export const DRAFT_STEPS: readonly DraftStep[] = ['welcome', 'promise', 'child', 'signsAs', 'finish'];
/** Twins, triplets or more (the same ceiling as first run's name list). */
export const DRAFT_MAX_NAMES = 6;
/** The one device setting. Cleared once the book is made, and with every other setting by erase everything. */
export const FIRST_RUN_DRAFT_SETTING = 'firstRun.draft';

export interface FirstRunDraft {
  step: DraftStep;
  names: string[];
  expecting: boolean;
  birthday: string | null;
  dueDate: string | null;
  signsAs: string;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (v: unknown): string | null => (typeof v === 'string' && ISO_DAY.test(v) ? v : null);

export function serializeDraft(d: FirstRunDraft): string {
  return JSON.stringify(d);
}

/** The draft as stored, or null when there is none or it cannot be read (a broken draft is no draft; first run starts as usual). */
export function parseDraft(raw: string | null): FirstRunDraft | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (!v || typeof v !== 'object') return null;
    if (!DRAFT_STEPS.includes(v.step as DraftStep)) return null;
    const names = Array.isArray(v.names) ? v.names.filter((n): n is string => typeof n === 'string').slice(0, DRAFT_MAX_NAMES).map((n) => clampText(n, CHILD_NAME_MAX)) : [];
    return {
      step: v.step as DraftStep,
      names: names.length > 0 ? names : [''],
      expecting: v.expecting === true,
      birthday: day(v.birthday),
      dueDate: day(v.dueDate),
      signsAs: typeof v.signsAs === 'string' ? clampText(v.signsAs, SIGNS_AS_MAX) : '',
    };
  } catch {
    return null;
  }
}

/** Nothing worth keeping yet: the welcome with nothing typed. */
export function draftIsEmpty(d: FirstRunDraft): boolean {
  return d.step === 'welcome' && d.names.every((n) => !n.trim()) && !d.expecting && !d.birthday && !d.dueDate && !d.signsAs.trim();
}

/**
 * The step first run opens on. With a draft, the step she was on, but never earlier than the step the build opens on
 * (a signed-in start is not sent back to the welcome), and never past the welcome while sign-in comes first and there is
 * no session: the account step is not skipped by a relaunch. Her answers are kept either way.
 */
export function resumeStep(input: { draft: FirstRunDraft | null; start: DraftStep; serverFeatures: boolean; hasSession: boolean }): DraftStep {
  const { draft, start } = input;
  if (!draft) return start;
  if (input.serverFeatures && !input.hasSession) return start;
  return DRAFT_STEPS.indexOf(draft.step) > DRAFT_STEPS.indexOf(start) ? draft.step : start;
}
