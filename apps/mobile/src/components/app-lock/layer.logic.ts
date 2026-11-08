/**
 * When the lock layer is mounted (components/app-lock/app-lock-layer.tsx), worked out during render so the overlay
 * never unmounts between "unlocked" and the end of its fade (Review A on #640: unmounting for one render let the
 * book show for a frame, then the cover came back at full opacity and faded).
 *
 * - Up: whenever the machine says cover (`show`).
 * - Leaving: the cover of an episode that was locked at any point goes away with one fade (fadeMs). The unlock lands
 *   while the system sheet still has the app inactive, so "was locked" has to stick through that, until the cover
 *   comes down.
 * - A cover that was never locked (in front again within the grace) goes at once.
 */
export type LayerState = {
  show: boolean;
  /** This cover episode was locked at some point. */
  wasLocked: boolean;
  /** Fading out: mounted, not taking touches. */
  leaving: boolean;
};

export const LAYER_HIDDEN: LayerState = { show: false, wasLocked: false, leaving: false };

export function layerStep(prev: LayerState, next: { show: boolean; locked: boolean }): LayerState {
  if (next.show) return { show: true, wasLocked: (prev.show && prev.wasLocked) || next.locked, leaving: false };
  return { show: false, wasLocked: false, leaving: prev.leaving || (prev.show && prev.wasLocked) };
}

/** The fade finished: now it may unmount. */
export function fadeDone(prev: LayerState): LayerState {
  return prev.show ? prev : { ...prev, leaving: false };
}

export function layerMounted(l: LayerState): boolean {
  return l.show || l.leaving;
}
