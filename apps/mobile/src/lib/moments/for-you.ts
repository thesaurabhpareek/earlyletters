/**
 * The For you plan for the Moments tab (PRD 28 PR 9b, CPO-27, CPO-28, CDO-22). Pure apart from one read of the device-only
 * moments store: no clock, no network, no native call, no log. It is NOT exported from `./index` (the default bundle
 * imports that), and no default-bundle file imports this one: only the Moments screen may, behind `MOMENTS_TAB_ON`.
 *
 * Two rules live here and nowhere else in the app:
 * 1. `phoneCalm` is REQUIRED in the input type and always handed to `buildMoments` (core leaves it optional, so a
 *    caller that forgot it would show a library picture in a hard stretch or quiet book, R253).
 * 2. The hidden days come from the store (`dayKeys`) and go in as `excludedDays`. A store that cannot be read means the
 *    hidden days are unknown, so the plan is empty (fail closed): a hidden day must never show by accident.
 */
import { moments } from '@scribe/core';
import type { MomentsRead } from './store-file';

export interface ForYouStore {
  load(): MomentsRead;
}

/** Everything `buildMoments` takes except the hidden days (the store owns those) and with `phoneCalm` made required. */
export type ForYouInput = Omit<moments.BuildInput, 'excludedDays' | 'phoneCalm'> & {
  /** Any visible book on this phone is in a hard stretch or quiet (CPO-27, R253). Required: never defaulted here. */
  phoneCalm: boolean;
};

export function planForYou(store: ForYouStore, input: ForYouInput): moments.PlannedCard[] {
  const read = store.load();
  if (read.state === 'unreadable' || read.state === 'unavailable') return [];
  const excludedDays = read.state === 'ok' ? read.file.dayKeys : [];
  return moments.buildMoments({ ...input, excludedDays, phoneCalm: input.phoneCalm });
}
