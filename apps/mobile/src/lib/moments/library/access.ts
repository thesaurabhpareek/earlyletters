import type { AccessState, NativeAccessStatus } from './types';

/**
 * Map the phone's status to the app's access state. Pure, over a value passed in. A flag off, an unavailable module
 * or a value we do not know is `off`: never access by accident.
 */
export function accessStateFor(native: NativeAccessStatus, opts: { libraryOn: boolean }): AccessState {
  if (!opts.libraryOn) return 'off';
  switch (native) {
    case 'notDetermined':
    case 'full':
    case 'limited':
    case 'denied':
    case 'restricted':
      return native;
    default:
      return 'off';
  }
}

export type AccessCase = 'ACC-0' | 'ACC-1' | 'ACC-2' | 'ACC-3' | 'ACC-4' | 'ACC-5' | 'FLAG_OFF';

/** The row of spec 8.1 a state shows. Not now (ACC-1) is a local flag and only matters before the phone is asked. */
export function accessCase(state: AccessState, opts: { notNow: boolean }): AccessCase {
  switch (state) {
    case 'notDetermined':
      return opts.notNow ? 'ACC-1' : 'ACC-0';
    case 'full':
      return 'ACC-2';
    case 'limited':
      return 'ACC-3';
    case 'denied':
      return 'ACC-4';
    case 'restricted':
      return 'ACC-5';
    default:
      return 'FLAG_OFF';
  }
}
