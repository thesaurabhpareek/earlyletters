/** Dev lab: renders scene 06 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S06Book } from '@/scenes/S06Book';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S06Book />
    </Lab>
  );
}
