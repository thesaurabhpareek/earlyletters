/** Whether the photo device has registered, and a stand-in native module for tests (undefined in the app, always). */
import type { ScribePhotoNative } from '../../../modules/scribe-photo';

export const deviceState: { registered: boolean; native: ScribePhotoNative | null | undefined } = { registered: false, native: undefined };
