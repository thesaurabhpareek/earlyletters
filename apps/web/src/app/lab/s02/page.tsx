/** Dev lab: renders scene 02 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S02Minute } from '@/scenes/S02Minute';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S02Minute />
    </Lab>
  );
}
