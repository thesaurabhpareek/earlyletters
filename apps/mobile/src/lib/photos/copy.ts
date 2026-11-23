/** The words for photo with a letter live in packages/content (features/photos.en.ts); this only fills `{app}`. */
import { photosCopy } from '@scribe/content';
import { withBrandName } from '@/lib/copy';

export const photos: typeof photosCopy = withBrandName(photosCopy);
