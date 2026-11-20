/**
 * The Book's Photos lens (NS-01-R10 to R12; design spec 01 section 5). A "Months / Photos" row that exists only when a
 * kept, open letter has a picture (no empty state, no count, no hint otherwise), and those letters as the Book's own
 * letter cards with a leading thumbnail, under the Book's own month openers, newest first. The Book draws both lenses
 * through its one SectionList (sections from photoChapters), so the row, which sits in the list's header, stays
 * mounted across the switch. A card opens its letter. It only reads: no add control and no grid of bare tiles
 * (NS-01-R11, R23).
 */
import { BookRow, LetterCard } from '@/components/book/letter-card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { photos } from '@/lib/photos/copy';
import { photoUri } from '@/lib/photos/device';
import { photoA11yLabel } from '@/lib/photos/text';
import type { StoredPhoto } from '@/lib/photos/types';
import type { Child, Entry } from '@/lib/store';
import { PhotoFrame } from './photo-frame';

export type LensMode = 'months' | 'photos';

/**
 * The Months / Photos choice: one radio group of two radios, exactly one checked, which VoiceOver reads as "radio
 * button" and "checked". The earlier row of selected buttons got no group trait on iOS, so it was heard as two
 * buttons (NS-33-R3). The options keep their ids, book.lens.months and book.lens.photos; ChoiceGroup stacks them at
 * large text sizes.
 */
export function LensRow({ mode, onChange }: { mode: LensMode; onChange: (m: LensMode) => void }) {
  return (
    <ChoiceGroup
      layout="segmented"
      label={photos.book.lens.label}
      options={[
        { value: 'months', label: photos.book.lens.months },
        { value: 'photos', label: photos.book.lens.photos },
      ]}
      value={mode}
      onChange={onChange}
      testID="book.lens"
    />
  );
}

/** The thumbnail a lens card leads with, about 72 pt (design spec 01 section 5.1). */
const THUMB_PT = 72;

/** One letter in the Photos lens: the Book's own LetterCard, leading with its thumbnail. A row of the Book's list. */
export function LensCard({ entry, picture, child, onOpen }: { entry: Entry; picture: StoredPhoto | undefined; child: Child; onOpen: (entryId: string) => void }) {
  if (!picture) return null;
  const label = photoA11yLabel(picture.text);
  return (
    <BookRow reduced>
      <LetterCard entry={entry} child={child} onPress={onOpen} photo={{ label, thumb: <PhotoFrame uri={photoUri(picture)} label={label} width={THUMB_PT} height={THUMB_PT} testID={`book.photos.thumb.${entry.id}`} /> }} />
    </BookRow>
  );
}
