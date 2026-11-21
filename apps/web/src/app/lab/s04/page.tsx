/** Dev lab: renders scene 04 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S04Exact } from '@/scenes/S04Exact';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S04Exact />
    </Lab>
  );
}
