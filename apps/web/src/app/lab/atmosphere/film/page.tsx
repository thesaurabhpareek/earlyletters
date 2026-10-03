/** Dev lab (owner: AT): the atmosphere layers inside a real pinned Scene, scroll-driven, for frame-pacing checks. */
import { Lab } from '@/film/Lab';
import { AtmosphereFilm } from './AtmosphereFilm';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <AtmosphereFilm />
    </Lab>
  );
}
