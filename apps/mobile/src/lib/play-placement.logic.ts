/**
 * Where Play sits on the letter page and in Read together, by text size (BL-1789, PER3-008, CDESO-1). Pure and tested
 * (test/play-placement.test.ts); the screens only apply the order and the carry rule.
 *
 * At the usual sizes nothing changes: the letter page reads dateline, picture, words, signature, then Play; Read
 * together reads dateline, words, signature, Play, the "Keep playing" chip. From the first accessibility size (AX1)
 * up, the person who came for the voice should not scroll past a whole letter, or a full-width picture, to reach it:
 * Play sits directly under the dateline, above any picture, and on Read together the "Keep playing" chip stays
 * directly under it (it governs Play). A pinned Play bar is not built. Letter text stays uncapped (D-027).
 *
 * The card-to-page word travel moves the dateline and the words as one rigid block, so anything between them (a
 * picture, or now Play) splits it: the hand-off is then the plain 200 ms fade, the one Reduce Motion users get.
 */
import { isAccessibilitySize } from './a11y.logic';

/** True from AX1 up: Play sits directly under the dateline. The same threshold the page buttons and stacking use. */
export function playUnderDateline(fontScale: number): boolean {
  return isAccessibilitySize(fontScale);
}

/** CDESO-1: the card's words travel into the page only with no picture and with Play not under the dateline. */
export function carriesWords(o: { hasPicture: boolean; fontScale: number }): boolean {
  return !o.hasPicture && !playUnderDateline(o.fontScale);
}

export type LetterPagePart = 'dateline' | 'play' | 'picture' | 'words' | 'signature';

/** The letter page, top to bottom, for what is on it (the order VoiceOver follows as well). `playFirst` is `playUnderDateline(fontScale)`. */
export function letterPageOrder(o: { playFirst: boolean; hasPicture: boolean; spoken: boolean; signature?: boolean }): LetterPagePart[] {
  const sig: LetterPagePart[] = o.signature === false ? [] : ['signature'];
  const play: LetterPagePart[] = o.spoken ? ['play'] : [];
  const picture: LetterPagePart[] = o.hasPicture ? ['picture'] : [];
  return o.playFirst
    ? ['dateline', ...play, ...picture, 'words', ...sig]
    : ['dateline', ...picture, 'words', ...sig, ...play];
}

export type ReadTogetherPart = 'dateline' | 'play' | 'noRecording' | 'keepPlaying' | 'words' | 'signature' | 'pageButtons';

/**
 * Read together's scroll, top to bottom. The page buttons are the end of the scroll from AX1 up (BL-1791); at the usual
 * sizes they are pinned under the scroll, so they are not part of it. A letter with no recording shows its note where
 * Play would be.
 */
export function readTogetherOrder(o: { playFirst: boolean; spoken: boolean; signature?: boolean }): ReadTogetherPart[] {
  const sig: ReadTogetherPart[] = o.signature === false ? [] : ['signature'];
  const player: ReadTogetherPart = o.spoken ? 'play' : 'noRecording';
  return o.playFirst
    ? ['dateline', player, 'keepPlaying', 'words', ...sig, 'pageButtons']
    : ['dateline', 'words', ...sig, player, 'keepPlaying'];
}
