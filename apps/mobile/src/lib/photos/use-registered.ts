/**
 * Registers the photo device once the screen has mounted, never in a render body (review B on #838, N6). Returns whether a
 * picker is registered, so a screen draws its photo control only when it can work. Nothing registers while the photos
 * switch is off (registerPhotoDevice reads it).
 */
import { useEffect, useState } from 'react';
import { registerPhotoDevice } from './device';
import { getPhotoPicker } from './registry';

export function useRegisteredPhotoDevice(): boolean {
  const [ready, setReady] = useState(() => getPhotoPicker() !== null);
  useEffect(() => {
    registerPhotoDevice(); // idempotent
    setReady(getPhotoPicker() !== null);
  }, []);
  return ready;
}
