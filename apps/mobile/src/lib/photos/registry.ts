/**
 * The device pieces of photo with a letter register here: the system picker, and later the file and row stores. Until
 * a picker is registered, Home draws no photo start (the button is absent, never dead). Nothing registers in this
 * change: the native picker package waits for the NX-39-R52 review (see the PR).
 */
import type { PhotoPicker, PickedAsset } from './types';

let picker: PhotoPicker | null = null;
let pending: PickedAsset | null = null;

export function registerPhotoPicker(p: PhotoPicker | null): void {
  picker = p;
}
export const getPhotoPicker = (): PhotoPicker | null => picker;

/** The picture chosen on Home, held in memory only until Keep. Nothing is stored (NS-01-R4). */
export function setPendingPhoto(asset: PickedAsset | null): void {
  pending = asset ? { uri: asset.uri } : null;
}
export const getPendingPhoto = (): PickedAsset | null => pending;
