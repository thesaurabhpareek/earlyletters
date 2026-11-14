/**
 * The Book's Photos lens (NS-01-R10 to R12; design spec 5). A "Months / Photos" row that exists only when a kept, open
 * letter has a picture (no empty state, no count, no hint otherwise), and a grid of those pictures, newest first,
 * grouped by month, 3 columns (1 at accessibility sizes). A tile opens its letter. It only reads.
 */
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { photos } from '@/lib/photos/copy';
import { photoUri } from '@/lib/photos/device';
import type { PhotosLens } from '@/lib/photos/lens';
import { MIN_TARGET_PT } from '@/lib/photos/surface';
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

const MONTH_NAMES = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export function PhotosGrid({ lens, onOpen, uriOf = photoUri }: { lens: PhotosLens; onOpen: (entryId: string) => void; uriOf?: typeof photoUri }) {
  const large = useIsAccessibilitySize();
  return (
    <View className="gap-5 px-5 pb-10" testID="book.photos">
      {lens.months.map((month) => (
        <View key={month.key} className="gap-2">
          <Text variant="subhead" asHeading>{MONTH_NAMES(month.key)}</Text>
          <View className="flex-row flex-wrap" style={{ gap: 4 }}>
            {month.tiles.map((t) => (
              <Pressable
                key={t.entryId}
                accessibilityRole="button"
                accessibilityLabel={t.a11yLabel}
                onPress={() => onOpen(t.entryId)}
                style={{ width: large ? '100%' : '32.5%', minHeight: MIN_TARGET_PT, aspectRatio: 1 }}
                testID={`book.photos.tile.${t.entryId}`}>
                <PhotoFrame uri={uriOf({ mediaId: t.mediaId, ext: 'jpg' })} label={t.a11yLabel} aspectRatio={1} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
