/**
 * The tab manifest (design spec 06 section 10.1): one row per tab, the verb declared and never inferred from prose,
 * and which capture sources start from it. Only Home starts a letter (NAV-TAB-ROLES P1, PRD README ground rule).
 * Read by test/navigation-one-entry.test.ts (N1 to N3, N6); the tab layout keeps its own three screens until spec 06
 * step 3 wires it to this table.
 *
 * `tabsKey` is the label key in `en.tabs` as it is today (tonight, book, you; the values are Home, Book, Me). The key
 * rename to home and me is content's step 2 and changes `tabsKey` here in the same PR. The job sentences
 * (`tabsJob.*`) are content's and are not in this file; the verbs are internal words a parent never reads.
 */
import { HOME_CAPTURE_SOURCES, type CaptureSource } from '@/lib/capture/start-capture.logic';

export type TabJob = {
  /** The screen name in app/(tabs)/_layout.tsx. */
  id: 'index' | 'moments' | 'book' | 'you';
  /** The label key in `en.tabs`. */
  tabsKey: 'tonight' | 'moments' | 'book' | 'you';
  /** One or two lowercase words; no two tabs share one, or share a first word (N2). */
  verb: string;
  /** The capture sources this tab offers. Only Home's list is non-empty (N3). */
  captureEntries: readonly CaptureSource[];
};

export const TAB_JOBS = [
  { id: 'index', tabsKey: 'tonight', verb: 'say', captureEntries: HOME_CAPTURE_SOURCES },
  { id: 'book', tabsKey: 'book', verb: 'read', captureEntries: [] },
  { id: 'you', tabsKey: 'you', verb: 'look after', captureEntries: [] },
] as const satisfies readonly TabJob[];

/**
 * The fourth tab, second in the bar (CPO-17), built behind EXPO_PUBLIC_MOMENTS_TAB (lib/nav/moments-tab.ts). It is not in
 * TAB_JOBS: that list is the bar a build with the flag off draws. `tabJobs(true)` is the bar with the flag on. The
 * `tabsKey` is the PROPOSED `tabs.moments` content key (see momentsTabLabel); `say`, `read` and `look after` are
 * untouched, and Moments offers no capture entry (N3: only Home starts).
 */
export const MOMENTS_TAB_JOB: TabJob = { id: 'moments', tabsKey: 'moments', verb: 'choose', captureEntries: [] };

/** The manifest for a flag value: Home, Moments, Book, Me when on; the three as before when off. */
export function tabJobs(momentsOn: boolean): readonly TabJob[] {
  return momentsOn ? [TAB_JOBS[0], MOMENTS_TAB_JOB, TAB_JOBS[1], TAB_JOBS[2]] : TAB_JOBS;
}
