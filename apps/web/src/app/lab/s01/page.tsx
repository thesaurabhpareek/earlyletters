/** Dev lab: renders scene 01 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S01Evening } from '@/scenes/S01Evening';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S01Evening />
    </Lab>
  );
}
