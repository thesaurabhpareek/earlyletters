/**
 * The Find switch (NS-02, PRD 02-find.md section 13). `EXPO_PUBLIC_BOOK_SEARCH=on` in the build, off by default; anything
 * else, or nothing, is off. The remote pause (`killSwitches.bookSearch`, packages/api) can hide the Find action and
 * never turn it on. Neither the build switch nor the pause touches the letters, the export or Erase everything: the
 * index is derived data that follows its letters whatever the switch says (lifecycle.ts).
 */
export const parseBookSearchFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

const BUILD_VALUE: boolean = parseBookSearchFlag(process.env.EXPO_PUBLIC_BOOK_SEARCH);
let testOverride: boolean | null = null;

/** Tests only. */
export function setFindForTest(value: boolean | null): void {
  testOverride = value;
}

export const findBuildEnabled = (): boolean => testOverride ?? BUILD_VALUE;

/** What the remote config says (`killSwitches.bookSearch`): true pauses. Absent config means not paused. */
export const findPaused = (config: { killSwitches?: { bookSearch?: boolean } } | null | undefined): boolean =>
  config?.killSwitches?.bookSearch === true;

/** Whether the Find action draws: the build switch on, the pause off, and a kept letter to find (absent, not greyed). */
export function findSurface(input: { build: boolean; paused: boolean; hasLetters: boolean }): boolean {
  return input.build && !input.paused && input.hasLetters;
}
