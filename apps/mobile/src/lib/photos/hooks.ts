/** React hooks for the photo surfaces. Thin: the rules are in the files they call (surface, lens, pending, entry-media). */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { subscribe as subscribeStore } from '../store';

import { photoDeps } from './device';
import { adoptPending } from './adopt';
import { photoNotSaved, subscribePhotoNotSaved } from './failures';
import type { PendingPhoto } from './pending';
import { getPending } from './registry';
import { coveredForAppState } from './surface';
import type { StoredPhoto } from './types';

const noopSubscribe = () => () => {};

/** The app's phase, so a picture can be taken off the screen before the switcher snapshot is taken. */
export function useAppPhase(): AppStateStatus {
  const [phase, setPhase] = useState<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', setPhase);
    return () => sub.remove();
  }, []);
  return phase;
}

/** True while a picture must be blank (NS-01-R13, NX-39-R36; Karma's ruling in surface.ts). */
export function usePictureCovered(): boolean {
  const phase = useAppPhase();
  return coveredForAppState(phase);
}

/** The pending picture, re-rendering when it changes. Null when none is registered (switch off). */
export function usePendingPhoto(): PendingPhoto | null {
  const p = getPending();
  useSyncExternalStore(p ? p.subscribe : noopSubscribe, p ? p.getVersion : () => 0);
  return p;
}

const samePhoto = (a: StoredPhoto | null, b: StoredPhoto | null): boolean => a === b || (!!a && !!b && JSON.stringify(a) === JSON.stringify(b));

/** The kept letter's picture, not while its letter waits in Recently deleted. */
export function useLetterPhoto(entryId: string | null | undefined): StoredPhoto | null {
  const read = useCallback(() => {
    if (!entryId) return null;
    try {
      const p = photoDeps().store.get(entryId);
      return p && !p.deletedAt ? p : null;
    } catch {
      return null;
    }
  }, [entryId]);
  const [photo, setPhoto] = useState<StoredPhoto | null>(read);
  useEffect(() => {
    const update = () => {
      const next = read();
      setPhoto((prev) => (samePhoto(prev, next) ? prev : next)); // the same picture keeps its reference: no re-render per store event
    };
    update();
    return subscribeStore(update);
  }, [read]);
  return photo;
}

/** Back, Close or Let it go before Keep: nothing stays, the picker's original included (NS-01-R4). Safe with no photo. */
export function discardPendingPhoto(): void {
  void getPending()?.discard();
}

/** Stores the pending picture for an owner (adopt.ts), with this phone's stores. */
export const adoptPendingPhoto = (ownerId: string, finalText: string, requireWords: boolean): Promise<void> =>
  adoptPending(getPending(), photoDeps, ownerId, finalText, requireWords);

/** At Keep, for the letter that now exists: a picture still pending is stored with it. */
export const commitPendingPhoto = (entryId: string, finalText: string): Promise<void> => adoptPendingPhoto(entryId, finalText, true);

/** True while the letter page should say its photo did not come along. */
export function usePhotoNotSaved(ownerId: string): boolean {
  return useSyncExternalStore(subscribePhotoNotSaved, () => photoNotSaved(ownerId));
}

