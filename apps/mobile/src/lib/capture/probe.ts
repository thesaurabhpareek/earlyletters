/**
 * Playability probe for a take recovered after a kill (D-085, debate Q-014).
 *
 * An M4A that was not closed properly can lack its index and not play, even
 * with bytes on disk. The launch sweep asks this before it marks a recovered
 * take ready, so a take that will not play is kept and listed instead of
 * showing on Tonight as if it were fine. The file is only read; it is never
 * changed or deleted.
 *
 * Opens the file in a silent player (never started) and waits for it to load:
 * - loaded with a duration above zero: playable (true)
 * - loaded with no duration, or not loaded after the wait: false
 * - the player could not be made at all (web, or an engine error): null,
 *   meaning "not probed", which the sweep treats as it did before
 *
 * Only called for takes a kill cut off, one at a time, never for a live take.
 */
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

const WAIT_MS = 4000;
const STEP_MS = 100;

export async function probePlayable(uri: string, wait: { totalMs?: number } = {}): Promise<boolean | null> {
  if (Platform.OS === 'web') return null;
  let player: ReturnType<typeof createAudioPlayer> | null = null;
  try {
    player = createAudioPlayer({ uri });
    const deadline = Date.now() + (wait.totalMs ?? WAIT_MS);
    while (Date.now() < deadline) {
      if (player.isLoaded) return player.duration > 0;
      await new Promise((r) => setTimeout(r, STEP_MS));
    }
    return player.isLoaded ? player.duration > 0 : false;
  } catch {
    return null;
  } finally {
    try {
      player?.remove();
    } catch {
      // nothing to free
    }
  }
}
