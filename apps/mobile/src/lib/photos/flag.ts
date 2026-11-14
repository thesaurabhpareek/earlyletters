/**
 * The photo switch (NS-01-R19, NX-39-R37). `EXPO_PUBLIC_PHOTOS=on` in the build, off by default; anything else, or
 * nothing, is off. The remote pause can hide the surface and never turn it on. The switch removes the screens, not the
 * data rights: Export and Erase everything do not read it (see lifecycle.ts, export.ts).
 */
export const parsePhotosFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

const BUILD_VALUE: boolean = parsePhotosFlag(process.env.EXPO_PUBLIC_PHOTOS);
let testOverride: boolean | null = null;

/** Tests only. */
export function setPhotosForTest(value: boolean | null): void {
  testOverride = value;
}

export const photosBuildEnabled = (): boolean => testOverride ?? BUILD_VALUE;

/** What the remote config says (`killSwitches.photos`): true pauses. Absent config means not paused. */
export const photosPaused = (config: { killSwitches?: { photos?: boolean } } | null | undefined): boolean =>
  config?.killSwitches?.photos === true;

export interface PhotoSurfaces {
  /** Home's "Start from a photo". */
  start: boolean;
  /** The Book's Photos lens. */
  lens: boolean;
  /** "Add a photo" on Review and the letter page. */
  addActions: boolean;
}

/** Which new surfaces draw. Off means absent, not greyed. */
export function photoSurfaces(input: { build: boolean; paused: boolean }): PhotoSurfaces {
  const on = input.build && !input.paused;
  return { start: on, lens: on, addActions: on };
}
