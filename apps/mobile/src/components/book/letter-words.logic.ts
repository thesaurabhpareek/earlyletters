/**
 * What a letter has to show for its words (card excerpt and the letter page).
 * Pure and tested (letter-words.logic.test.ts).
 *
 *   waiting      a recording kept before its words were written down (transcriptStatus 'waiting')
 *   nobodySpoke  a spoken letter whose words came back empty: nobody talked in the recording
 *                (transcription outcome no_speech). A calm note replaces an empty excerpt.
 *   words        everything else, typed letters included
 */
import type { Entry } from '@/lib/store';

export type LetterWords = 'waiting' | 'nobodySpoke' | 'words';

export function letterWords(e: Pick<Entry, 'captureMode' | 'transcriptStatus' | 'finalText'>): LetterWords {
  if (e.transcriptStatus === 'waiting') return 'waiting';
  if (e.captureMode !== 'typed' && e.finalText.trim() === '') return 'nobodySpoke';
  return 'words';
}
