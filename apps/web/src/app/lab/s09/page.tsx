/** Dev lab: renders scene 09 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S09Private } from '@/scenes/S09Private';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S09Private />
    </Lab>
  );
}
