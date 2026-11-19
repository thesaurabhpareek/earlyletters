/**
 * The Book's Photos lens (NS-01-R10 to R12; design spec 01 section 5). A "Months / Photos" row that exists only when a
 * kept, open letter has a picture (no empty state, no count, no hint otherwise), and those letters as the Book's own
 * letter cards with a leading thumbnail, under the Book's own month openers, newest first. A card opens its letter. It
 * only reads: no add control and no grid of bare tiles (NS-01-R11, R23).
 */
import { View } from 'react-native';
import { openerOf, type Chapter } from '@/components/book/chapters';
import { BookRow, LetterCard } from '@/components/book/letter-card';
import { MonthOpener } from '@/components/book/month-opener';
import { Button } from '@/components/ui/button';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { photos } from '@/lib/photos/copy';
import { photoUri } from '@/lib/photos/device';
import { photoA11yLabel } from '@/lib/photos/text';
import type { StoredPhoto } from '@/lib/photos/types';
import type { Child } from '@/lib/store';
import { PhotoFrame } from './photo-frame';

export type LensMode = 'months' | 'photos';

export function LensRow({ mode, onChange }: { mode: LensMode; onChange: (m: LensMode) => void }) {
  const large = useIsAccessibilitySize();
  return (
    <View className={large ? 'flex-row flex-wrap gap-2' : 'flex-row gap-2'} accessibilityRole="tablist" testID="book.lens">
      <Button variant={mode === 'months' ? 'default' : 'quiet'} size="md" label={photos.book.lens.months} onPress={() => onChange('months')} accessibilityState={{ selected: mode === 'months' }} testID="book.lens.months" />
      <Button variant={mode === 'photos' ? 'default' : 'quiet'} size="md" label={photos.book.lens.photos} onPress={() => onChange('photos')} accessibilityState={{ selected: mode === 'photos' }} testID="book.lens.photos" />
    </View>
  );
}

/** The thumbnail a lens card leads with, about 72 pt (design spec 01 section 5.1). */
const THUMB_PT = 72;

export function PhotoChapters({ chapters, pictures, child, onOpen }: { chapters: Chapter[]; pictures: ReadonlyMap<string, StoredPhoto>; child: Child; onOpen: (entryId: string) => void }) {
  return (
    <View className="pb-10" testID="book.photos">
      {chapters.map((ch, i) => (
        <View key={ch.key}>
          <MonthOpener opener={openerOf(ch)} first={i === 0} />
          {ch.data.map((entry) => {
            const p = pictures.get(entry.id);
            if (!p) return null;
            const label = photoA11yLabel(p.text);
            return (
              <BookRow key={entry.id} reduced>
                <LetterCard entry={entry} child={child} onPress={onOpen} photo={{ label, thumb: <PhotoFrame uri={photoUri(p)} label={label} width={THUMB_PT} height={THUMB_PT} testID={`book.photos.thumb.${entry.id}`} /> }} />
              </BookRow>
            );
          })}
        </View>
      ))}
    </View>
  );
}
