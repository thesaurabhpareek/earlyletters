/** Dev lab: renders scene 05 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S05Voice } from '@/scenes/S05Voice';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S05Voice />
    </Lab>
  );
}
