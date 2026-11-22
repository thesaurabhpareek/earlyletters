// Tests only: stand in the scribe-photo module (Node never has it) and start again from an unregistered phone.
import { deviceState } from '../../src/lib/photos/device-state';
import type { ScribePhotoNative } from '../../modules/scribe-photo';

export function resetPhotoDeviceForTest(native: ScribePhotoNative | null | undefined): void {
  deviceState.registered = false;
  deviceState.native = native;
}
