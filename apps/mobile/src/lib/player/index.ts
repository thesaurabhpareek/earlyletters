/**
 * Letter playback (COMPONENTS 2.21). v1.0 plays only the user's own
 * recordings from this phone (founder decision 3 Oct 2026); Read together
 * plays plainly, with no word highlighting. A cleaner listening copy plays
 * when the speech agent provides one (listening.ts); the original is one
 * switch away and is never altered.
 */
export { playerCopy } from './copy';
export { listeningCopyFor, prefersOriginal, provideListeningCopies, setPrefersOriginal, type ListeningCopyLookup } from './listening';
export {
  chooseSource,
  formatClock,
  handoffPosition,
  positionAt,
  progressOf,
  recordingAvailability,
  SCRUB_STEP_SECONDS,
  spokenDuration,
  stepPosition,
  usableListeningCopy,
  type ListeningCopy,
  type ListenSource,
  type RecordingAvailability,
} from './player.logic';
export { availabilityOf, useLetterPlayer, type LetterPlayer } from './use-letter-player';
