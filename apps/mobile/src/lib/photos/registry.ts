/**
 * The device pieces of photo with a letter register here: the system picker, and later the file and row stores. Until
 * a picker is registered, Home draws no photo start (the button is absent, never dead). `registerPhotoDevice` (device.ts) registers them when the photos switch is on.
 */
import type { PendingPhoto } from './pending';
import type { PhotoPicker } from './types';

let picker: PhotoPicker | null = null;

export function registerPhotoPicker(p: PhotoPicker | null): void {
  picker = p;
}
export const getPhotoPicker = (): PhotoPicker | null => picker;

/** The picture chosen before a letter exists (pending.ts): in memory until Keep. Nothing is stored (NS-01-R4). */
let pending: PendingPhoto | null = null;
export function registerPending(p: PendingPhoto | null): void {
  pending = p;
}
export const getPending = (): PendingPhoto | null => pending;
